import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { seedDatabase, seedManualWinnerHistory } from "./db-seed";
import { runMigrations } from "./db-migrate";
import { storage } from "./storage";

const app = express();

// Trust reverse proxy (Railway, Cloudflare) so req.ip and X-Forwarded-For work correctly
app.set('trust proxy', 1);

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

  // Seed manual winner history dummy data (independent — runs even if main seed skipped)
  seedManualWinnerHistory().catch((error) => {
    console.error("Failed to seed manual winner history:", error);
  });

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
