import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { seedDatabase, seedManualWinnerHistory } from "./db-seed";
import { runMigrations } from "./db-migrate";
import { storage } from "./storage";
import { checkMidtransTransactionStatus, isMidtransConfigured } from "./midtrans";

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
  // Runs every 5 minutes to sync ALL pending transactions with Midtrans.
  // This is a safety net for when the Midtrans webhook is delayed or missed.
  async function runPaymentSyncScheduler() {
    if (!isMidtransConfigured()) return;
    try {
      const allTransactions = await storage.getAllTransactions();
      // Include ALL pending transactions — even those without paymentId
      // Some Midtrans orders may exist under transaction.id even if paymentId wasn't stored
      const pending = allTransactions.filter(
        (t) => t.paymentStatus === "pending"
      );
      if (pending.length === 0) return;

      log(`[PaymentSync] Checking ${pending.length} pending transaction(s)...`);

      for (const t of pending) {
        try {
          let midtransStatus = await checkMidtransTransactionStatus(t.id);
          if (!midtransStatus) continue;

          // Fallback: if not found by transaction.id, try stored paymentId
          // (handles VA payments where paymentId = Snap token, which may resolve differently)
          if (
            midtransStatus.transactionStatus === "not_found" &&
            t.paymentId &&
            t.paymentId !== t.id
          ) {
            const fallback = await checkMidtransTransactionStatus(t.paymentId);
            if (fallback && fallback.transactionStatus !== "not_found") {
              midtransStatus = fallback;
              log(`[PaymentSync] Found via paymentId fallback for tx: ${t.id}`);
            }
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
            if (t.phoneNumber && process.env.FONNTE_API_TOKEN) {
              const baseUrl = process.env.APP_URL || "https://undifest.com";
              const downloadLink = `${baseUrl}/payment/success?trx=${t.id}`;
              const nomorUndian = `UND-${t.id.slice(0, 8).toUpperCase()}`;
              const ev = await storage.getEvent(t.eventId).catch(() => null);
              const hasEbook = !!(ev?.ebookFile);
              const waMsg = hasEbook
                ? `✅ *Pembayaran Berhasil!*\n\nHalo! Pembayaran untuk *${t.eventName}* telah dikonfirmasi.\n\n🎟️ *Nomor Undian Anda:* ${nomorUndian}\n\n📥 *Download E-book:*\n${downloadLink}\n\n_Simpan nomor undian sebagai bukti keikutsertaan. Link di atas juga bisa digunakan untuk download ulang e-book kapan saja._\n\nTerima kasih sudah berpartisipasi di UNDIFEST! 🎉`
                : `✅ *Pembayaran Berhasil!*\n\nHalo! Pembayaran untuk *${t.eventName}* telah dikonfirmasi.\n\n🎟️ *Nomor Undian Anda:* ${nomorUndian}\n\n🔗 Lihat detail transaksi:\n${downloadLink}\n\n_Simpan nomor undian sebagai bukti keikutsertaan._\n\nTerima kasih sudah berpartisipasi di UNDIFEST! 🎉`;
              fetch("https://api.fonnte.com/send", {
                method: "POST",
                headers: {
                  Authorization: process.env.FONNTE_API_TOKEN,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ target: t.phoneNumber, message: waMsg }),
              }).catch(() => {});
            }
          } else if (["deny", "cancel", "failure"].includes(transactionStatus)) {
            await storage.updateTransaction(t.id, { paymentStatus: "failed" });
            log(`[PaymentSync] ❌ ${t.id} → failed`);
          } else if (transactionStatus === "expire") {
            await storage.updateTransaction(t.id, { paymentStatus: "expired" });
            log(`[PaymentSync] ⏰ ${t.id} → expired`);
          } else if (transactionStatus === "not_found") {
            const hoursSince =
              (Date.now() - new Date(t.createdAt).getTime()) / (1000 * 60 * 60);
            if (hoursSince > 24) {
              await storage.updateTransaction(t.id, { paymentStatus: "expired" });
              log(`[PaymentSync] ⏰ ${t.id} → expired (not in Midtrans, >24h)`);
            }
          }
        } catch {
          // non-fatal: skip this transaction
        }
      }
    } catch (err) {
      console.error("[PaymentSync] Scheduler error:", err);
    }
  }
  setInterval(runPaymentSyncScheduler, 5 * 60 * 1000); // every 5 minutes
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
