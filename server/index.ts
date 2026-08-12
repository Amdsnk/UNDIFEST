import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { seedDatabase, seedManualWinnerHistory } from "./db-seed";
import { runMigrations } from "./db-migrate";
import { storage } from "./storage";
import { checkMidtransStatusWithFallback, isMidtransConfigured } from "./midtrans";
import { buildPaymentSuccessMessage } from "./payment-message";

const app = express();

// Trust reverse proxy (Railway, Cloudflare) so req.ip and X-Forwarded-For work correctly
app.set('trust proxy', 1);

// Gzip compression - reduces JSON response size by 60-80%
app.use(compression());

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  limit: '45mb', // Support base64 video uploads up to 30MB (30MB video → ~40MB base64)
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false, limit: '45mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Run migrations first in production
  if (app.get("env") === "production") {
    try {
      console.log("🔄 Running database migrations...");
      await runMigrations();
      console.log("✅ Migrations completed successfully");
    } catch (error) {
      console.error("❌ Failed to run migrations:", error);
      console.log("⚠️  App will continue, but database may not be up to date");
    }
  }

  // Seed database on startup (non-blocking)
  seedDatabase().catch((error) => {
    console.error("Failed to seed database:", error);
    console.log("App will continue running without seed data...");
  });

  // NOTE: Manual winner history is managed exclusively by admin — no auto-seeding.

  // ── Recurring Event Scheduler ────────────────────────────────────────────
  // Checks every 10 minutes for finished recurring events and auto-creates the next occurrence
  async function runRecurringScheduler() {
    try {
      const allEvents = await storage.getAllEvents();
      const now = new Date();
      for (const event of allEvents) {
        if (!event.scheduleType || event.scheduleType === "none") continue;
        if (event.status !== "selesai") continue;

        const duration = new Date(event.endDate).getTime() - new Date(event.startDate).getTime();
        let nextStart: Date | null = null;

        if (event.scheduleType === "daily" && event.scheduleTime) {
          const [h, m] = event.scheduleTime.split(":").map(Number);
          nextStart = new Date(now);
          nextStart.setHours(h, m, 0, 0);
          if (nextStart <= now) nextStart.setDate(nextStart.getDate() + 1);
        } else if (event.scheduleType === "weekly" && event.scheduleTime && event.scheduleDay != null) {
          const [h, m] = event.scheduleTime.split(":").map(Number);
          nextStart = new Date(now);
          nextStart.setHours(h, m, 0, 0);
          const daysUntil = (event.scheduleDay - now.getDay() + 7) % 7 || 7;
          nextStart.setDate(now.getDate() + daysUntil);
        } else if (event.scheduleType === "monthly" && event.scheduleTime && event.scheduleDay != null) {
          const [h, m] = event.scheduleTime.split(":").map(Number);
          nextStart = new Date(now.getFullYear(), now.getMonth(), event.scheduleDay, h, m, 0, 0);
          if (nextStart <= now) nextStart.setMonth(nextStart.getMonth() + 1);
        }

        if (!nextStart) continue;
        const nextEnd = new Date(nextStart.getTime() + duration);

        // Only create if next occurrence doesn't already exist (check by name + startDate proximity)
        const alreadyExists = allEvents.some(e =>
          e.name === event.name &&
          e.id !== event.id &&
          Math.abs(new Date(e.startDate).getTime() - nextStart!.getTime()) < 60 * 60 * 1000
        );
        if (alreadyExists) continue;

        const newEvent = await storage.createEvent({
          name: event.name,
          description: event.description,
          price: event.price,
          ticketCount: event.ticketCount,
          hadiah: event.hadiah,
          prize: event.prize,
          category: event.category || "other",
          imageUrl: event.imageUrl,
          bannerHomepage: event.bannerHomepage || undefined,
          bannerUndian: event.bannerUndian || undefined,
          isRefundable: event.isRefundable,
          startDate: nextStart,
          endDate: nextEnd,
          announcementDate: nextEnd,
          status: "aktif",
          scheduleType: event.scheduleType,
          scheduleTime: event.scheduleTime || undefined,
          scheduleDay: event.scheduleDay ?? undefined,
          ebookFile: event.ebookFile || undefined,
          ebookTitle: event.ebookTitle || undefined,
        });
        log(`🔁 Recurring event created: "${newEvent.name}" starting ${nextStart.toISOString()}`);
      }
    } catch (err) {
      console.error("Recurring scheduler error:", err);
    }
  }
  setInterval(runRecurringScheduler, 10 * 60 * 1000); // every 10 minutes
  runRecurringScheduler(); // run immediately on startup

  // ── Midtrans Payment Auto-Sync ──────────────────────────────────────────
  // Runs every 1 minute to sync pending transactions with Midtrans.
  // Only checks transactions that have been pending for at least 2 minutes
  // to give webhooks time to arrive first. Sequential with small delays
  // to avoid Midtrans rate limiting.
  async function runPaymentSyncScheduler() {
    if (!isMidtransConfigured()) return;
    try {
      const allTransactions = await storage.getAllTransactions();
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
      // Only check pending transactions older than 2 minutes (webhook window)
      const pending = allTransactions.filter(
        (t) => t.paymentStatus === "pending" && new Date(t.createdAt) < twoMinutesAgo
      );
      if (pending.length === 0) return;

      log(`[PaymentSync] Checking ${pending.length} pending transaction(s)...`);

      for (const t of pending) {
        try {
          // Small delay between requests to avoid Midtrans rate limiting
          await new Promise(r => setTimeout(r, 300));
          // Use unified helper: tries transaction.id first, then paymentId as fallback
          const midtransStatus = await checkMidtransStatusWithFallback(t.id, t.paymentId);
          if (!midtransStatus) {
            log(`[PaymentSync] ⚠️ ${t.id.slice(0, 8)} — koneksi ke Midtrans gagal, skip`);
            continue;
          }

          const { transactionStatus, fraudStatus } = midtransStatus;

          if (
            transactionStatus === "settlement" ||
            (transactionStatus === "capture" && fraudStatus === "accept")
          ) {
            await storage.updateTransaction(t.id, {
              paymentStatus: "paid",
              paidAt: new Date(),
            });
            await storage.incrementEventTickets(t.eventId).catch(() => {});
            log(`[PaymentSync] ✅ ${t.id} → paid`);

            // Send WhatsApp notification via Fonnte
            const fonnteToken =
              (await storage.getSetting("fonnte_device_token").catch(() => undefined))?.value?.trim() ||
              process.env.FONNTE_API_TOKEN;
            if (t.phoneNumber && fonnteToken) {
              const baseUrl = process.env.APP_URL || "https://undifest.com";
              const downloadLink = `${baseUrl}/payment/success?trx=${t.id}`;
              const nomorUndian = `UND-${t.id.slice(0, 8).toUpperCase()}`;
              const ev = await storage.getEvent(t.eventId).catch(() => null);
              const hasEbook = !!(ev?.ebookFile);
              const waMsg = buildPaymentSuccessMessage({
                eventName: t.eventName,
                eventPrice: ev?.price,
                nomorUndian,
                downloadLink,
                hasEbook,
                undianType: t.undianType,
              });
              // Format phone number: strip non-digits, convert 08xx → 628xx
              let formattedPhone = t.phoneNumber.replace(/\D/g, '');
              if (formattedPhone.startsWith('0')) {
                formattedPhone = '62' + formattedPhone.substring(1);
              } else if (!formattedPhone.startsWith('62')) {
                formattedPhone = '62' + formattedPhone;
              }
              const fonnteDevice =
                process.env.FONNTE_DEVICE ||
                (await storage.getSetting("fonnte_device").catch(() => undefined))?.value?.trim() ||
                undefined;
              const payload: Record<string, string> = { target: formattedPhone, message: waMsg, countryCode: '62' };
              if (fonnteDevice) payload.device = fonnteDevice;
              fetch("https://api.fonnte.com/send", {
                method: "POST",
                headers: {
                  Authorization: fonnteToken,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
              }).then(async (r) => {
                const result = await r.json().catch(() => ({}));
                log(`[PaymentSync WA] → ${formattedPhone}: ${result.status ? 'terkirim ✅' : `gagal ❌ – ${JSON.stringify(result)}`}`);
                if (result.status === true) {
                  await storage.updateTransaction(t.id, { waSentAt: new Date() }).catch(() => {});
                }
              }).catch((err) => {
                log(`[PaymentSync WA] fetch error → ${formattedPhone}: ${err?.message}`);
              });
            }
          } else if (["deny", "cancel", "failure"].includes(transactionStatus)) {
            await storage.updateTransaction(t.id, { paymentStatus: "failed" });
            log(`[PaymentSync] ❌ ${t.id} → failed`);
          } else if (transactionStatus === "expire") {
            // Only expire on explicit Midtrans 'expire' — never on 'not_found'
            await storage.updateTransaction(t.id, { paymentStatus: "expired" });
            log(`[PaymentSync] ⏰ ${t.id} → expired`);
          }
          // not_found → leave as pending, do not auto-expire
        } catch {
          // non-fatal: skip this transaction
        }
      }
    } catch (err) {
      console.error("[PaymentSync] Scheduler error:", err);
    }
  }
  setInterval(runPaymentSyncScheduler, 60 * 1000); // every 1 minute
  runPaymentSyncScheduler(); // run immediately on startup

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
