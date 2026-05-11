import type { Express } from "express";
import express, { type Request, type Response, type NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertEventSchema, insertBannerSchema, insertTransactionSchema, insertVideoSchema, updateVideoSchema, insertPartnerSchema, insertHowItWorksSchema, insertBankSchema, insertIpWhitelistSchema, insertPaymentMethodSchema, insertPageSchema, insertTermsConditionSchema } from "@shared/schema";
import { comparePassword, generateToken, generateUserToken, requireAdmin, requireUser, requireRole, requireWrite, verifyUserToken } from "./auth";
import { createSnapTransaction, createPaymentLink, checkMidtransTransactionStatus, checkMidtransStatusWithFallback, isMidtransConfigured, getMidtransConfig, verifyMidtransSignature } from "./midtrans";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage_multer = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, uploadDir);
  },
  filename: function (_req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage_multer,
  limits: { fileSize: 30 * 1024 * 1024 }, // 30MB limit for videos and PDFs (to fit in database as base64)
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|mov|avi|mkv|webm|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = /image\/(jpeg|jpg|png|gif|webp)|video\/(mp4|quicktime|x-msvideo|x-matroska|webm)|application\/pdf/.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only image, video, and PDF files are allowed!"));
    }
  },
});

// Helper: extract real client IP (handles proxies / Railway / Cloudflare)
function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const first = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(",")[0];
    return first.trim();
  }
  return req.ip || req.socket?.remoteAddress || "";
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve uploaded files with caching (videos/images - 7 days cache)
  app.use("/uploads", express.static(uploadDir, {
    maxAge: '7d',
    etag: true,
    lastModified: true,
  }));

  // Check Server Outbound IP - untuk whitelist di Midtrans
  app.get("/api/server-ip", async (_req: Request, res: Response) => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json() as { ip: string };

      return res.json({
        success: true,
        outboundIP: data.ip,
        message: "Gunakan IP ini untuk whitelist di Midtrans dashboard"
      });
    } catch (error) {
      console.error('[SERVER IP] Error getting outbound IP:', error);
      return res.status(500).json({
        success: false,
        error: "Failed to get server IP"
      });
    }
  });

  // Admin Authentication
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: "Username and password required" });
      }

      const admin = await storage.getAdminUserByUsername(username);
      if (!admin) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      if (!admin.isActive) {
        return res.status(401).json({ error: "Account is inactive" });
      }

      const isPasswordValid = await comparePassword(password, admin.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = generateToken({ adminId: admin.id, username: admin.username, role: admin.role });
      res.json({
        token,
        admin: {
          id: admin.id,
          username: admin.username,
          name: admin.name,
          role: admin.role
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Helper: strip heavy base64 fields from event list to reduce payload size
  const stripEventBulk = (e: any) => ({
    ...e,
    bannerHomepage: e.bannerHomepage ? `__has_banner__` : null,
    bannerUndian: e.bannerUndian ? `__has_banner__` : null,
    ebookFile: e.ebookFile ? `__has_ebook__` : null,
  });

  // Events API
  app.get("/api/events", async (req, res) => {
    try {
      const events = await storage.getAllEvents();
      // Public access: only show active events — strip heavy base64 fields for list
      const publicEvents = events.filter(e => e.status === "aktif").map(stripEventBulk);
      res.setHeader('Cache-Control', 'public, max-age=30');
      res.json(publicEvents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  // Admin-only endpoint for all events
  app.get("/api/admin/events", requireAdmin, async (req, res) => {
    try {
      const events = await storage.getAllEvents();
      // Strip heavy base64 from list — full data available via /api/admin/events/:id
      res.json(events.map(stripEventBulk));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  // Admin-only endpoint to get a single event (any status, includes full banner data for edit)
  app.get("/api/admin/events/:id", requireAdmin, async (req, res) => {
    try {
      const event = await storage.getEvent(req.params.id);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch event" });
    }
  });

  app.get("/api/events/:id", async (req, res) => {
    try {
      const event = await storage.getEvent(req.params.id);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      // Public access: only return if event is active
      if (event.status !== "aktif") {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch event" });
    }
  });

  app.post("/api/events", requireAdmin, requireWrite, upload.fields([
    { name: "bannerHomepage", maxCount: 1 },
    { name: "bannerUndian", maxCount: 1 },
    { name: "ebookFile", maxCount: 1 }
  ]), async (req, res) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      // Convert uploaded files to base64 for permanent storage
      let bannerHomepageUrl = "";
      let bannerUndianUrl = "";
      let ebookFileData = "";

      if (files?.bannerHomepage?.[0]) {
        const file = files.bannerHomepage[0];
        const fileBuffer = fs.readFileSync(file.path);
        bannerHomepageUrl = `data:${file.mimetype};base64,${fileBuffer.toString('base64')}`;
        fs.unlinkSync(file.path); // Delete temp file
      }
      if (files?.bannerUndian?.[0]) {
        const file = files.bannerUndian[0];
        const fileBuffer = fs.readFileSync(file.path);
        bannerUndianUrl = `data:${file.mimetype};base64,${fileBuffer.toString('base64')}`;
        fs.unlinkSync(file.path); // Delete temp file
      }
      if (files?.ebookFile?.[0]) {
        const file = files.ebookFile[0];
        const fileBuffer = fs.readFileSync(file.path);
        ebookFileData = `data:${file.mimetype};base64,${fileBuffer.toString('base64')}`;
        fs.unlinkSync(file.path); // Delete temp file
      }

      const data = {
        name: req.body.name,
        price: parseInt(req.body.price),
        ticketCount: parseInt(req.body.ticketCount || "1000"),
        hadiah: parseInt(req.body.hadiah || "1000000"),
        category: req.body.category || "other",
        description: req.body.description,
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate),
        isRefundable: req.body.isRefundable === "true",
        bannerHomepage: bannerHomepageUrl,
        bannerUndian: bannerUndianUrl,
        ebookFile: ebookFileData || undefined,
        ebookTitle: req.body.ebookTitle || undefined,
        imageUrl: bannerHomepageUrl || "https://via.placeholder.com/800x400",
        prize: `Hadiah Rp ${parseInt(req.body.hadiah || "1000000").toLocaleString("id-ID")}`,
        announcementDate: new Date(req.body.endDate),
        status: "aktif" as const,
        scheduleType: req.body.scheduleType || "none",
        scheduleTime: req.body.scheduleTime || null,
        scheduleDay: (req.body.scheduleDay !== undefined && req.body.scheduleDay !== "") ? parseInt(req.body.scheduleDay) : null,
      };

      const validated = insertEventSchema.parse(data);
      const event = await storage.createEvent(validated);
      res.status(201).json(event);
    } catch (error) {
      console.error("Create event error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create event" });
    }
  });

  app.put("/api/events/:id", requireAdmin, requireWrite, upload.fields([
    { name: "bannerHomepage", maxCount: 1 },
    { name: "bannerUndian", maxCount: 1 },
    { name: "ebookFile", maxCount: 1 }
  ]), async (req, res) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      const data: any = {
        ...req.body,
        ...(req.body.price && { price: parseInt(req.body.price) }),
        ...(req.body.ticketCount && { ticketCount: parseInt(req.body.ticketCount) }),
        ...(req.body.hadiah && { hadiah: parseInt(req.body.hadiah) }),
        ...(req.body.startDate && { startDate: new Date(req.body.startDate) }),
        ...(req.body.endDate && { endDate: new Date(req.body.endDate) }),
        ...(req.body.announcementDate && { announcementDate: new Date(req.body.announcementDate) }),
        ...(req.body.isRefundable !== undefined && { isRefundable: req.body.isRefundable === "true" }),
        ...(req.body.scheduleDay !== undefined && req.body.scheduleDay !== "" && { scheduleDay: parseInt(req.body.scheduleDay) }),
      };

      // Convert uploaded files to base64 for permanent storage
      if (files?.bannerHomepage?.[0]) {
        const file = files.bannerHomepage[0];
        const fileBuffer = fs.readFileSync(file.path);
        data.bannerHomepage = `data:${file.mimetype};base64,${fileBuffer.toString('base64')}`;
        data.imageUrl = data.bannerHomepage;
        fs.unlinkSync(file.path); // Delete temp file
      }
      if (files?.bannerUndian?.[0]) {
        const file = files.bannerUndian[0];
        const fileBuffer = fs.readFileSync(file.path);
        data.bannerUndian = `data:${file.mimetype};base64,${fileBuffer.toString('base64')}`;
        fs.unlinkSync(file.path); // Delete temp file
      }
      if (files?.ebookFile?.[0]) {
        const file = files.ebookFile[0];
        const fileBuffer = fs.readFileSync(file.path);
        data.ebookFile = `data:${file.mimetype};base64,${fileBuffer.toString('base64')}`;
        fs.unlinkSync(file.path); // Delete temp file
      }

      // Clean up URL fields from the data object
      delete data.bannerHomepageUrl;
      delete data.bannerUndianUrl;

      // Update prize text if hadiah is updated
      if (data.hadiah) {
        data.prize = `Hadiah Rp ${data.hadiah.toLocaleString("id-ID")}`;
      }

      const event = await storage.updateEvent(req.params.id, data);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      console.error("Update event error:", error);
      res.status(500).json({ error: "Failed to update event" });
    }
  });

  // Secure E-book download endpoint - requires valid paid transaction
  app.get("/api/ebook/download/:transactionId", async (req, res) => {
    try {
      const { transactionId } = req.params;

      // Get transaction details
      const transaction = await storage.getTransaction(transactionId);
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      // Verify payment status
      if (transaction.paymentStatus !== "paid") {
        return res.status(403).json({
          error: "Access denied",
          message: "E-book can only be downloaded after successful payment"
        });
      }

      // Get event details to retrieve E-book
      const event = await storage.getEvent(transaction.eventId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      if (!event.ebookFile) {
        return res.status(404).json({ error: "E-book not available for this event" });
      }

      // Return E-book data
      res.json({
        success: true,
        ebookFile: event.ebookFile,
        ebookTitle: event.ebookTitle || event.name,
        eventName: event.name,
      });
    } catch (error) {
      console.error("E-book download error:", error);
      res.status(500).json({ error: "Failed to download E-book" });
    }
  });

  // Public: lookup paid orders by phone number (for guest re-download)
  app.get("/api/orders/lookup", async (req, res) => {
    try {
      const phone = (req.query.phone as string || "").trim();
      if (!phone || phone.length < 8) {
        return res.status(400).json({ error: "Nomor telepon tidak valid" });
      }

      // Normalize phone: strip spaces/dashes/+, convert 62xx → 0xx
      const normalizePhone = (p: string) => {
        let n = p.replace(/[\s\-\+]/g, "");
        if (n.startsWith("62")) n = "0" + n.slice(2);
        return n;
      };
      const normalizedInput = normalizePhone(phone);

      const allTransactions = await storage.getAllTransactions();

      // Match by normalized phone (any status first, then we'll resolve)
      const phoneMatched = allTransactions.filter(
        (t) => normalizePhone(t.phoneNumber) === normalizedInput
      );

      // For pending transactions, check Midtrans directly and update status
      await Promise.all(
        phoneMatched
          .filter((t) => t.paymentStatus === "pending" && t.paymentId)
          .map(async (t) => {
            try {
              const midtransStatus = await checkMidtransTransactionStatus(t.id);
              if (!midtransStatus) return;
              const { transactionStatus, fraudStatus } = midtransStatus;
              if (transactionStatus === "settlement" || (transactionStatus === "capture" && fraudStatus === "accept")) {
                await storage.updateTransaction(t.id, { paymentStatus: "paid", paidAt: new Date() });
                t.paymentStatus = "paid"; // reflect in-memory for filter below
                await storage.incrementEventTickets(t.eventId).catch(() => {});
              } else if (["deny", "cancel", "failure"].includes(transactionStatus)) {
                await storage.updateTransaction(t.id, { paymentStatus: "failed" });
                t.paymentStatus = "failed";
              } else if (transactionStatus === "expire") {
                await storage.updateTransaction(t.id, { paymentStatus: "expired" });
                t.paymentStatus = "expired";
              } else if (transactionStatus === "not_found") {
                const hoursSinceCreation = (Date.now() - new Date(t.createdAt).getTime()) / (1000 * 60 * 60);
                if (hoursSinceCreation > 24) {
                  await storage.updateTransaction(t.id, { paymentStatus: "expired" });
                  t.paymentStatus = "expired";
                }
              }
            } catch {
              // non-fatal: just skip this transaction's Midtrans check
            }
          })
      );

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const paid = phoneMatched.filter(
        (t) => t.paymentStatus === "paid" && new Date(t.createdAt) >= thirtyDaysAgo
      );

      // Return safe subset — no internal IDs exposed beyond what's needed
      const result = await Promise.all(
        paid.map(async (t) => {
          const event = await storage.getEvent(t.eventId);
          return {
            transactionId: t.id,
            eventName: t.eventName,
            ticketCount: t.ticketCount,
            amount: t.amount,
            paidAt: t.paidAt,
            hasEbook: !!(event?.ebookFile),
          };
        })
      );

      res.json(result);
    } catch (error) {
      console.error("[Orders Lookup] Error:", error);
      res.status(500).json({ error: "Gagal mencari pesanan" });
    }
  });

  app.delete("/api/events/:id", requireAdmin, requireWrite, async (req, res) => {
    try {
      const deleted = await storage.deleteEvent(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      const message = error.message || "Failed to delete event";
      res.status(500).json({ error: message });
    }
  });

  // Banners API (public for carousel display)
  app.get("/api/banners", async (req, res) => {
    try {
      const banners = await storage.getAllBanners();
      res.setHeader('Cache-Control', 'public, max-age=60');
      res.json(banners);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch banners" });
    }
  });

  app.post("/api/banners", requireAdmin, async (req, res) => {
    try {
      const data = {
        imageUrl: req.body.imageUrl,
        order: parseInt(req.body.order || "0"),
      };

      const validated = insertBannerSchema.parse(data);
      const banner = await storage.createBanner(validated);
      res.status(201).json(banner);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create banner" });
    }
  });

  // Banner upload with file - store as base64 in database
  app.post("/api/banners/upload", requireAdmin, upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      // Read file and convert to base64
      const filePath = req.file.path;
      const fileBuffer = fs.readFileSync(filePath);
      const base64Image = `data:${req.file.mimetype};base64,${fileBuffer.toString('base64')}`;

      // Delete the temporary file
      fs.unlinkSync(filePath);

      const data = {
        imageUrl: base64Image,
        order: parseInt(req.body.order || "0"),
      };

      const validated = insertBannerSchema.parse(data);
      const banner = await storage.createBanner(validated);
      res.status(201).json(banner);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Banner upload error:", error);
      res.status(500).json({ error: "Failed to upload banner" });
    }
  });

  app.delete("/api/banners/:id", requireAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteBanner(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Banner not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete banner" });
    }
  });

  // Transactions API (admin - all transactions, auto-sync pending with Midtrans)
  app.get("/api/transactions", requireAdmin, async (req, res) => {
    try {
      const transactions = await storage.getAllTransactions();

      // Auto-sync all pending transactions with Midtrans in real-time.
      // Only update if Midtrans gives a definitive status (paid/failed/expired).
      // NEVER auto-expire based on 'not_found' — Midtrans API can return not_found
      // temporarily even for settled payments (API glitch, wrong env, race condition).
      const pendingTransactions = transactions.filter(
        (t) => t.paymentStatus === "pending"
      );

      if (pendingTransactions.length > 0) {
        await Promise.all(
          pendingTransactions.map(async (t) => {
            try {
              const midtransStatus = await checkMidtransStatusWithFallback(t.id, t.paymentId);
              if (!midtransStatus) return;
              const { transactionStatus, fraudStatus } = midtransStatus;
              if (
                transactionStatus === "settlement" ||
                (transactionStatus === "capture" && fraudStatus === "accept")
              ) {
                await storage.updateTransaction(t.id, { paymentStatus: "paid", paidAt: new Date() });
                t.paymentStatus = "paid";
                await storage.incrementEventTickets(t.eventId).catch(() => {});
              } else if (["deny", "cancel", "failure"].includes(transactionStatus)) {
                await storage.updateTransaction(t.id, { paymentStatus: "failed" });
                t.paymentStatus = "failed";
              } else if (transactionStatus === "expire") {
                // Only expire if Midtrans EXPLICITLY says expire — never based on not_found
                await storage.updateTransaction(t.id, { paymentStatus: "expired" });
                t.paymentStatus = "expired";
              }
              // not_found → do nothing, leave as pending
            } catch {
              // non-fatal: skip if Midtrans check fails for this transaction
            }
          })
        );
      }

      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  // Sync all pending transactions with Midtrans status (admin only)
  app.post("/api/admin/transactions/sync-pending", requireAdmin, async (req, res) => {
    try {
      const transactions = await storage.getAllTransactions();
      // Check all pending — including those without paymentId (try by transaction.id)
      const pending = transactions.filter((t) => t.paymentStatus === "pending");

      let updated = 0;
      const results: { id: string; from: string; to: string }[] = [];

      await Promise.all(
        pending.map(async (t) => {
          try {
            // Use fallback: try paymentId if transaction.id returns not_found
            const midtransStatus = await checkMidtransStatusWithFallback(t.id, t.paymentId);
            if (!midtransStatus) return; // null = connection error, skip

            const { transactionStatus, fraudStatus } = midtransStatus;
            if (
              transactionStatus === "settlement" ||
              (transactionStatus === "capture" && fraudStatus === "accept")
            ) {
              await storage.updateTransaction(t.id, { paymentStatus: "paid", paidAt: new Date() });
              await storage.incrementEventTickets(t.eventId).catch(() => {});
              results.push({ id: t.id, from: "pending", to: "paid" });
              updated++;
            } else if (["deny", "cancel", "failure"].includes(transactionStatus)) {
              await storage.updateTransaction(t.id, { paymentStatus: "failed" });
              results.push({ id: t.id, from: "pending", to: "failed" });
              updated++;
            } else if (transactionStatus === "expire") {
              // Only expire on explicit Midtrans 'expire' — never on 'not_found'
              await storage.updateTransaction(t.id, { paymentStatus: "expired" });
              results.push({ id: t.id, from: "pending", to: "expired" });
              updated++;
            }
            // not_found → leave as pending, do not auto-expire
          } catch (e) {
            console.error("[Sync Pending] Error checking transaction:", t.id, e);
          }
        })
      );

      console.log(`[Sync Pending] Checked ${pending.length} transactions, updated ${updated}`);
      res.json({ checked: pending.length, updated, results });
    } catch (error) {
      console.error("[Sync Pending] Error:", error);
      res.status(500).json({ error: "Failed to sync pending transactions" });
    }
  });

  // Delete transaction (admin only - superadmin role)
  app.delete("/api/transactions/:id", requireAdmin, requireRole("superadmin"), async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteTransaction(id);
      if (deleted) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Transaction not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to delete transaction" });
    }
  });

  // Update bank info on a transaction (public — transactionId is proof of ownership)
  app.patch("/api/transactions/:id/bank-info", async (req, res) => {
    try {
      const { id } = req.params;
      const { buyerBankName, buyerAccountNumber } = req.body;

      if (!buyerBankName || !buyerAccountNumber) {
        return res.status(400).json({ error: "Nama bank dan nomor rekening harus diisi" });
      }

      const transaction = await storage.getTransaction(id);
      if (!transaction) {
        return res.status(404).json({ error: "Transaksi tidak ditemukan" });
      }

      await storage.updateTransaction(id, {
        buyerBankName: String(buyerBankName).trim(),
        buyerAccountNumber: String(buyerAccountNumber).trim(),
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Gagal menyimpan data rekening" });
    }
  });

  // Update transaction payment status (admin only)
  app.patch("/api/transactions/:id/status", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { paymentStatus } = req.body;

      if (!["pending", "paid", "failed", "expired"].includes(paymentStatus)) {
        return res.status(400).json({ error: "Invalid payment status" });
      }

      const transaction = await storage.getTransaction(id);
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      const wasNotPaid = transaction.paymentStatus !== "paid";

      const updated = await storage.updateTransaction(id, {
        paymentStatus,
        paidAt: paymentStatus === "paid" ? new Date() : transaction.paidAt
      });

      // Increment event tickets only if transitioning to paid for the first time
      if (paymentStatus === "paid" && wasNotPaid) {
        await storage.incrementEventTickets(transaction.eventId).catch(e =>
          console.error("[Admin Status] Failed to increment tickets:", e)
        );

        // Send WhatsApp notification via Fonnte
        if (transaction.phoneNumber) {
          const baseUrl = process.env.APP_URL || "https://undifest.com";
          const downloadLink = `${baseUrl}/payment/success?trx=${transaction.id}`;
          const nomorUndian = `UND-${transaction.id.slice(0, 8).toUpperCase()}`;
          const event = await storage.getEvent(transaction.eventId).catch(() => null);
          const hasEbook = !!(event?.ebookFile);
          const waMessage = hasEbook
            ? `✅ *Pembayaran Berhasil!*\n\nHalo! Pembayaran untuk *${transaction.eventName}* telah dikonfirmasi.\n\n🎟️ *Nomor Undian Anda:* ${nomorUndian}\n\n📥 *Download E-book:*\n${downloadLink}\n\n_Simpan nomor undian sebagai bukti keikutsertaan. Link di atas juga bisa digunakan untuk download ulang e-book kapan saja._\n\nTerima kasih sudah berpartisipasi di UNDIFEST! 🎉`
            : `✅ *Pembayaran Berhasil!*\n\nHalo! Pembayaran untuk *${transaction.eventName}* telah dikonfirmasi.\n\n🎟️ *Nomor Undian Anda:* ${nomorUndian}\n\n🔗 Lihat detail transaksi:\n${downloadLink}\n\n_Simpan nomor undian sebagai bukti keikutsertaan._\n\nTerima kasih sudah berpartisipasi di UNDIFEST! 🎉`;
          sendWhatsAppMessage(transaction.phoneNumber, waMessage).catch(e =>
            console.error("[Admin Status] Failed to send WA notification:", e)
          );
          console.log("[Admin Status] WA notification sent to:", transaction.phoneNumber);
        }
      }

      res.json(updated);
    } catch (error) {
      console.error("Failed to update transaction status:", error);
      res.status(500).json({ error: "Failed to update transaction status" });
    }
  });

  // User transactions (user-specific)
  app.get("/api/user/transactions", requireUser, async (req, res) => {
    try {
      const userId = (req as any).user.userId;
      const allTransactions = await storage.getAllTransactions();
      const userTransactions = allTransactions.filter(t => t.userId === userId);
      res.json(userTransactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  // Optional auth middleware for guest checkout
  const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const payload = verifyUserToken(token);
      if (payload) {
        (req as any).user = payload;
      }
    }
    next();
  };

  // Check payment status - Allow both authenticated and guest users
  app.get("/api/payments/status/:transactionId", optionalAuth, async (req, res) => {
    try {
      const { transactionId } = req.params;
      const userId = (req as any).user?.userId;

      const transaction = await storage.getTransaction(transactionId);
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      // If user is authenticated, verify ownership
      if (transaction.userId && userId !== transaction.userId) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      let currentStatus = transaction.paymentStatus;
      // midtransRawStatus: status asli dari Midtrans, untuk info di admin panel
      // "not_checked" = tidak ada paymentId, tidak dicek
      // "api_error"   = Midtrans tidak bisa dihubungi
      // "not_found"   = order tidak ada di Midtrans (belum/tidak jadi dibayar)
      // lainnya       = status langsung dari Midtrans (pending, settlement, dll)
      let midtransRawStatus: string = "not_checked";

      // If still pending, check Midtrans API directly (handles webhook delay).
      // Use fallback: try paymentId if transaction.id returns not_found.
      // NEVER auto-expire based on not_found — only expire on explicit Midtrans 'expire'.
      if (currentStatus === "pending") {
        try {
          const midtransStatus = await checkMidtransStatusWithFallback(transactionId, transaction.paymentId);
          if (!midtransStatus) {
            midtransRawStatus = "api_error";
          } else {
            const { transactionStatus, fraudStatus } = midtransStatus;
            midtransRawStatus = transactionStatus;

            if (transactionStatus === "settlement" || (transactionStatus === "capture" && fraudStatus === "accept")) {
              currentStatus = "paid";
              await storage.updateTransaction(transactionId, { paymentStatus: "paid", paidAt: new Date() });
              await storage.incrementEventTickets(transaction.eventId).catch(e =>
                console.error("[Payment Status] Failed to increment tickets:", e)
              );
              if (transaction.phoneNumber) {
                const baseUrl = process.env.APP_URL || "https://undifest.com";
                const downloadLink = `${baseUrl}/payment/success?trx=${transaction.id}`;
                const nomorUndian = `UND-${transaction.id.slice(0, 8).toUpperCase()}`;
                const ev = await storage.getEvent(transaction.eventId).catch(() => null);
                const hasEbook = !!(ev?.ebookFile);
                const waMsg = hasEbook
                  ? `✅ *Pembayaran Berhasil!*\n\nHalo! Pembayaran untuk *${transaction.eventName}* telah dikonfirmasi.\n\n🎟️ *Nomor Undian Anda:* ${nomorUndian}\n\n📥 *Download E-book:*\n${downloadLink}\n\n_Simpan nomor undian sebagai bukti keikutsertaan. Link di atas juga bisa digunakan untuk download ulang e-book kapan saja._\n\nTerima kasih sudah berpartisipasi di UNDIFEST! 🎉`
                  : `✅ *Pembayaran Berhasil!*\n\nHalo! Pembayaran untuk *${transaction.eventName}* telah dikonfirmasi.\n\n🎟️ *Nomor Undian Anda:* ${nomorUndian}\n\n🔗 Lihat detail transaksi:\n${downloadLink}\n\n_Simpan nomor undian sebagai bukti keikutsertaan._\n\nTerima kasih sudah berpartisipasi di UNDIFEST! 🎉`;
                sendWhatsAppMessage(transaction.phoneNumber, waMsg).catch(() => {});
              }
              console.log("[Payment Status] Updated to paid via direct Midtrans check:", transactionId);
            } else if (["deny", "cancel", "failure"].includes(transactionStatus)) {
              currentStatus = "failed";
              await storage.updateTransaction(transactionId, { paymentStatus: "failed" });
            } else if (transactionStatus === "expire") {
              // Only expire if Midtrans EXPLICITLY returns 'expire'
              currentStatus = "expired";
              await storage.updateTransaction(transactionId, { paymentStatus: "expired" });
            }
            // not_found → leave as pending, do not auto-expire
          }
        } catch (midtransErr) {
          midtransRawStatus = "api_error";
          console.error("[Payment Status] Midtrans check failed (non-fatal):", midtransErr);
        }
      }

      // Get event details
      const event = await storage.getEvent(transaction.eventId);

      res.json({
        id: transaction.id,
        paymentStatus: currentStatus,
        midtransRawStatus,
        paymentUrl: transaction.paymentUrl,
        paidAt: transaction.paidAt,
        createdAt: transaction.createdAt,
        amount: transaction.amount,
        ticketCount: transaction.ticketCount,
        eventName: event?.name || transaction.eventName || "",
        hasEbook: !!(event?.ebookFile),
      });
    } catch (error) {
      console.error("[Payment Status] Error:", error);
      res.status(500).json({ error: "Failed to get payment status" });
    }
  });

  // Confirm payment from Midtrans redirect (no Midtrans API check needed)
  // Called by PaymentSuccessPage when status_code=200 is in the URL
  // Midtrans only redirects with status_code=200 on successful payment — trust it directly
  app.post("/api/payments/confirm-paid/:transactionId", async (req, res) => {
    try {
      const { transactionId } = req.params;

      const transaction = await storage.getTransaction(transactionId);
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      // Mark as paid if still pending (idempotent - safe to call multiple times)
      if (transaction.paymentStatus === "pending") {
        await storage.updateTransaction(transactionId, {
          paymentStatus: "paid",
          paidAt: new Date(),
        });
        transaction.paymentStatus = "paid";
        await storage.incrementEventTickets(transaction.eventId).catch(() => {});

        // WhatsApp notification
        if (transaction.phoneNumber) {
          const baseUrl = process.env.APP_URL || "https://undifest.com";
          const downloadLink = `${baseUrl}/payment/success?trx=${transaction.id}`;
          const nomorUndian = `UND-${transaction.id.slice(0, 8).toUpperCase()}`;
          const ev = await storage.getEvent(transaction.eventId).catch(() => null);
          const hasEbook = !!(ev?.ebookFile);
          const waMsg = hasEbook
            ? `✅ *Pembayaran Berhasil!*\n\nHalo! Pembayaran untuk *${transaction.eventName}* telah dikonfirmasi.\n\n🎟️ *Nomor Undian Anda:* ${nomorUndian}\n\n📥 *Download E-book:*\n${downloadLink}\n\n_Simpan nomor undian sebagai bukti keikutsertaan. Link di atas juga bisa digunakan untuk download ulang e-book kapan saja._\n\nTerima kasih sudah berpartisipasi di UNDIFEST! 🎉`
            : `✅ *Pembayaran Berhasil!*\n\nHalo! Pembayaran untuk *${transaction.eventName}* telah dikonfirmasi.\n\n🎟️ *Nomor Undian Anda:* ${nomorUndian}\n\n🔗 Lihat detail transaksi:\n${downloadLink}\n\n_Simpan nomor undian sebagai bukti keikutsertaan._\n\nTerima kasih sudah berpartisipasi di UNDIFEST! 🎉`;
          sendWhatsAppMessage(transaction.phoneNumber, waMsg).catch(() => {});
        }

        console.log("[Confirm Paid] Transaction marked as paid from redirect:", transactionId);
      }

      const event = await storage.getEvent(transaction.eventId);

      res.json({
        paymentStatus: "paid",
        eventName: event?.name || transaction.eventName || "",
        amount: transaction.amount,
        ticketCount: transaction.ticketCount,
        createdAt: transaction.createdAt,
        hasEbook: !!(event?.ebookFile),
      });
    } catch (error) {
      console.error("[Confirm Paid] Error:", error);
      res.status(500).json({ error: "Failed to confirm payment" });
    }
  });


  // Get Midtrans config status (admin only)
  app.get("/api/admin/midtrans-config", requireAdmin, async (req, res) => {
    res.json(getMidtransConfig());
  });

  // Force run DB migration to add missing columns (admin only)
  app.post("/api/admin/run-migration", requireAdmin, async (req, res) => {
    try {
      const { pool } = await import("./db");
      const results: string[] = [];

      const migrations = [
        `ALTER TABLE transactions ADD COLUMN IF NOT EXISTS buyer_name VARCHAR(200)`,
        `ALTER TABLE transactions ADD COLUMN IF NOT EXISTS buyer_email VARCHAR(200)`,
        `ALTER TABLE transactions ADD COLUMN IF NOT EXISTS buyer_bank_name VARCHAR(100)`,
        `ALTER TABLE transactions ADD COLUMN IF NOT EXISTS buyer_account_number VARCHAR(50)`,
        `ALTER TABLE transactions ADD COLUMN IF NOT EXISTS buyer_ip VARCHAR(45)`,
      ];

      for (const migration of migrations) {
        try {
          await pool.query(migration);
          results.push(`✅ ${migration}`);
        } catch (err: any) {
          results.push(`⚠️ ${migration}: ${err.message}`);
        }
      }

      res.json({ success: true, results });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Dedicated endpoint: get ALL paid participants for a specific event (server-side join)
  // This is the authoritative source - no client-side filtering, nothing can fall through.
  app.get("/api/admin/events/:eventId/participants", requireAdmin, async (req, res) => {
    try {
      const { eventId } = req.params;

      // 1. Get ALL transactions for this event and sync pending ones first
      const allTransactions = await storage.getAllTransactions();
      const eventTransactions = allTransactions.filter(t => t.eventId === eventId);

      // 2. Auto-sync any pending transactions with Midtrans
      const pendingWithId = eventTransactions.filter(t => t.paymentStatus === "pending" && t.paymentId);
      await Promise.all(pendingWithId.map(async (t) => {
        try {
          const midtransStatus = await checkMidtransTransactionStatus(t.id);
          if (!midtransStatus) return;
          const { transactionStatus, fraudStatus } = midtransStatus;
          if (transactionStatus === "settlement" || (transactionStatus === "capture" && fraudStatus === "accept")) {
            await storage.updateTransaction(t.id, { paymentStatus: "paid", paidAt: new Date() });
            t.paymentStatus = "paid";
          } else if (["deny", "cancel", "failure"].includes(transactionStatus)) {
            await storage.updateTransaction(t.id, { paymentStatus: "failed" }); t.paymentStatus = "failed";
          } else if (transactionStatus === "expire") {
            await storage.updateTransaction(t.id, { paymentStatus: "expired" }); t.paymentStatus = "expired";
          }
        } catch { /* skip */ }
      }));

      // 3. Get only paid transactions for this event
      const paidTransactions = eventTransactions.filter(t => t.paymentStatus === "paid");

      // 4. Get all users and build lookup maps
      const allUsers = await storage.getAllUsers();
      const userById = new Map(allUsers.map(u => [u.id, u]));
      const normalizePhone = (p: string) => {
        if (!p) return "";
        const d = p.replace(/\D/g, "");
        if (d.startsWith("62")) return "0" + d.slice(2);
        return d.startsWith("0") ? d : d;
      };
      const userByPhone = new Map(allUsers.map(u => [normalizePhone(u.phoneNumber), u]));

      // 5. Return one row per paid transaction (no aggregation/deduplication)
      // Registered = transaction properly linked to a valid user account (has userId)
      // Guest = no valid userId, regardless of phone match
      const registeredParticipantRows: { user: (typeof allUsers)[0]; transaction: (typeof paidTransactions)[0] }[] = [];
      const guestTransactionsList: typeof paidTransactions = [];

      paidTransactions.forEach(t => {
        if (t.userId && userById.has(t.userId)) {
          // Properly linked to a valid user account — one row per transaction
          registeredParticipantRows.push({ user: userById.get(t.userId)!, transaction: t });
        } else {
          // No valid userId = guest transaction
          guestTransactionsList.push(t);
        }
      });

      // 6. Return each guest transaction as a separate row (no deduplication)
      // This ensures every purchase is recorded even if same phone/name is used multiple times.
      const guestParticipantRows = guestTransactionsList.map(t => ({
        transaction: t,
        totalTickets: t.ticketCount,
        totalAmount: t.amount,
      }));

      res.json({
        registeredParticipants: registeredParticipantRows,
        guestParticipants: guestParticipantRows,
        paidTransactions,
        totalPaid: paidTransactions.length,
      });
    } catch (error: any) {
      console.error("participants endpoint error:", error);
      res.status(500).json({ error: "Failed to fetch participants" });
    }
  });

  // Force sync a specific pending transaction with Midtrans (admin only)
  app.post("/api/admin/transactions/:id/sync", requireAdmin, async (req, res) => {
    try {
      const transaction = await storage.getTransaction(req.params.id);
      if (!transaction) return res.status(404).json({ error: "Transaction not found" });

      // Try checking by transaction.id first (order_id sent to Midtrans)
      let midtransStatus = await checkMidtransTransactionStatus(transaction.id);

      // Fallback: if not found and paymentId differs from transaction.id, try paymentId
      // (handles edge cases where order_id and paymentId might differ)
      if (
        midtransStatus?.transactionStatus === "not_found" &&
        transaction.paymentId &&
        transaction.paymentId !== transaction.id
      ) {
        const fallback = await checkMidtransTransactionStatus(transaction.paymentId);
        if (fallback && fallback.transactionStatus !== "not_found") {
          midtransStatus = fallback;
          console.log(`[Admin Sync] Found via paymentId fallback for tx: ${transaction.id}`);
        }
      }

      if (!midtransStatus) {
        return res.json({ success: false, message: "Could not reach Midtrans", status: transaction.paymentStatus });
      }

      const { transactionStatus, fraudStatus } = midtransStatus;
      let newStatus = transaction.paymentStatus;

      if (transactionStatus === "settlement" || (transactionStatus === "capture" && fraudStatus === "accept")) {
        await storage.updateTransaction(transaction.id, { paymentStatus: "paid", paidAt: new Date() });
        await storage.incrementEventTickets(transaction.eventId).catch(() => {});
        newStatus = "paid";
      } else if (["deny", "cancel", "failure"].includes(transactionStatus)) {
        await storage.updateTransaction(transaction.id, { paymentStatus: "failed" });
        newStatus = "failed";
      } else if (transactionStatus === "expire") {
        await storage.updateTransaction(transaction.id, { paymentStatus: "expired" });
        newStatus = "expired";
      }

      res.json({ success: true, midtransStatus: transactionStatus, newStatus });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Midtrans Payment Endpoints
  // Create Midtrans Virtual Account payment
  app.post("/api/transactions/midtrans/va", optionalAuth, async (req, res) => {
    try {
      // Get user info if authenticated
      let userId: string | undefined;
      let phoneNumber = "081234567890";
      let userName = "Guest Customer";
      let userEmail = "guest@undifest.com";

      if ((req as any).user) {
        userId = (req as any).user.userId;
        phoneNumber = (req as any).user.phoneNumber;

        const user = await storage.getUser(userId);
        if (user) {
          userName = user.name || "Customer";
          userEmail = user.email || `${phoneNumber}@undifest.com`;
        }
      }

      const { eventId, amount, eventName, paymentChannel, buyerName, buyerPhone, buyerEmail, buyerBankName, buyerAccountNumber } = req.body;

      // Use buyer data if provided
      if (buyerName) userName = buyerName;
      if (buyerPhone) phoneNumber = buyerPhone;
      if (buyerEmail) userEmail = buyerEmail;

      if (!eventId || !amount || !eventName || !paymentChannel) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Validate allowed payment channels (active on Midtrans dashboard)
      const allowedChannels = ['BNI', 'MANDIRI', 'BRI', 'PERMATA', 'CIMB'];
      if (!allowedChannels.includes(paymentChannel.toUpperCase())) {
        return res.status(400).json({
          error: `Payment channel tidak valid. Pilih salah satu: ${allowedChannels.join(', ')}`
        });
      }

      // Verify event exists and is active
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      if (event.status !== "aktif") {
        return res.status(400).json({ error: "Event is not active" });
      }

      // Create transaction
      const transaction = await storage.createTransaction({
        userId: userId || undefined,
        eventId,
        amount,
        phoneNumber,
        eventName,
        buyerName: buyerName || null,
        buyerEmail: buyerEmail || null,
        buyerBankName: buyerBankName || null,
        buyerAccountNumber: buyerAccountNumber || null,
        paymentStatus: "pending",
        paymentMethod: "va",
        paymentChannel: paymentChannel.toUpperCase(),
        buyerIp: getClientIp(req) || null,
      });

      // SIMULATION MODE
      const useSimulation = process.env.MIDTRANS_SIMULATION_MODE === 'true';

      if (useSimulation) {
        console.log("[Midtrans VA] ✅ Using simulation mode");

        const bankPrefixes: Record<string, string> = {
          'BNI': '8829172',
          'BRI': '139250',
          'MANDIRI': '70012',
          'PERMATA': '896599',
          'CIMB': '18999',
        };

        const prefix = bankPrefixes[paymentChannel.toUpperCase()] || '88888';
        const randomSuffix = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
        const mockVANumber = prefix + randomSuffix;

        const expiryDate = new Date();
        expiryDate.setHours(expiryDate.getHours() + 24);

        await storage.updateTransaction(transaction.id, { paymentNumber: mockVANumber });

        console.log(`[Midtrans VA] ✅ Mock VA: ${mockVANumber} for ${paymentChannel}`);

        return res.status(201).json({
          ...transaction,
          paymentNo: mockVANumber,
          paymentName: `${paymentChannel.toUpperCase()} Virtual Account`,
          total: amount,
          fee: 0,
          expired: expiryDate.toISOString(),
          via: "VIRTUAL_ACCOUNT",
          channel: paymentChannel.toUpperCase(),
          simulationMode: true,
        });
      }

      // PRODUCTION MODE: Use Midtrans Snap (hosted payment page)
      console.log("[Midtrans VA] Production mode - calling Midtrans Snap API");
      try {
        const enabledPaymentsMap: Record<string, string[]> = {
          'BNI': ['bni_va'],
          'BRI': ['bri_va'],
          'MANDIRI': ['mandiri_va'],
          'PERMATA': ['permata_va'],
          'CIMB': ['cimb_va'],
        };
        const enabledPayments = enabledPaymentsMap[paymentChannel.toUpperCase()] || ['bni_va', 'bri_va', 'mandiri_va', 'permata_va', 'cimb_va'];
        const baseUrl = process.env.APP_URL || "https://undifest.com";

        const snapResult = await createSnapTransaction({
          orderId: transaction.id,
          grossAmount: amount,
          customerName: userName,
          customerEmail: userEmail,
          customerPhone: phoneNumber,
          itemName: `Tiket ${eventName}`,
          enabledPayments,
          finishUrl: `${baseUrl}/payment/success?trx=${transaction.id}`,
          errorUrl: `${baseUrl}/payment/cancel?trx=${transaction.id}`,
          pendingUrl: `${baseUrl}/payment/success?trx=${transaction.id}`,
        });

        console.log("[Midtrans VA] Snap token created:", snapResult.token);

        await storage.updateTransaction(transaction.id, {
          paymentId: snapResult.token,
          paymentUrl: snapResult.redirectUrl,
        });

        return res.status(201).json({
          ...transaction,
          snapToken: snapResult.token,
          redirectUrl: snapResult.redirectUrl,
          channel: paymentChannel.toUpperCase(),
        });
      } catch (paymentError: any) {
        console.error("[Midtrans VA] Exception:", paymentError);
        return res.status(201).json({
          ...transaction,
          paymentError: paymentError.message || "Failed to connect to Midtrans payment gateway",
        });
      }
    } catch (error) {
      console.error("[Midtrans VA] Error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create Midtrans VA payment" });
    }
  });

  // Create Midtrans QRIS payment
  app.post("/api/transactions/midtrans/qris", optionalAuth, async (req, res) => {
    try {
      let userId: string | undefined;
      let phoneNumber = "081234567890";
      let userName = "Guest Customer";
      let userEmail = "guest@undifest.com";

      if ((req as any).user) {
        userId = (req as any).user.userId;
        phoneNumber = (req as any).user.phoneNumber;

        const user = await storage.getUser(userId);
        if (user) {
          userName = user.name || "Customer";
          userEmail = user.email || `${phoneNumber}@undifest.com`;
        }
      }

      const { eventId, amount, eventName, buyerName, buyerPhone, buyerEmail, buyerBankName, buyerAccountNumber } = req.body;

      if (buyerName) userName = buyerName;
      if (buyerPhone) phoneNumber = buyerPhone;
      if (buyerEmail) userEmail = buyerEmail;

      if (!eventId || !amount || !eventName) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      if (event.status !== "aktif") {
        return res.status(400).json({ error: "Event is not active" });
      }

      const { paymentChannel: reqChannel } = req.body;
      const isGopay = reqChannel === 'GOPAY';

      const transaction = await storage.createTransaction({
        userId: userId || undefined,
        eventId,
        amount,
        phoneNumber,
        eventName,
        buyerName: buyerName || null,
        buyerEmail: buyerEmail || null,
        buyerBankName: buyerBankName || null,
        buyerAccountNumber: buyerAccountNumber || null,
        paymentStatus: "pending",
        paymentMethod: isGopay ? "gopay" : "qris",
        paymentChannel: isGopay ? "GOPAY" : "QRIS",
        buyerIp: getClientIp(req) || null,
      });

      // SIMULATION MODE
      const useSimulation = process.env.MIDTRANS_SIMULATION_MODE === 'true';

      if (useSimulation) {
        console.log("[Midtrans QRIS] ✅ Using simulation mode");

        const mockQRContent = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
        const expiryDate = new Date();
        expiryDate.setHours(expiryDate.getHours() + 24);

        return res.status(201).json({
          ...transaction,
          qrImage: mockQRContent,
          total: amount,
          fee: 0,
          expired: expiryDate.toISOString(),
          via: "QRIS",
          channel: "QRIS",
          simulationMode: true,
        });
      }

      // PRODUCTION MODE
      if (isGopay) {
        // GoPay: gunakan Snap Transaction dengan enabled_payments=['gopay']
        // Snap langsung ke QR GoPay tanpa form customer
        console.log("[Midtrans QRIS] Production mode - GoPay via Snap (no customer form)");
        try {
          const baseUrl = process.env.APP_URL || "https://undifest.com";
          const snapResult = await createSnapTransaction({
            orderId: transaction.id,
            grossAmount: amount,
            customerName: userName,
            customerEmail: userEmail,
            customerPhone: phoneNumber,
            itemName: `Tiket ${eventName}`,
            enabledPayments: ['gopay'],
            finishUrl: `${baseUrl}/payment/success?trx=${transaction.id}`,
            errorUrl: `${baseUrl}/payment/cancel?trx=${transaction.id}`,
            pendingUrl: `${baseUrl}/payment/success?trx=${transaction.id}`,
          });
          console.log("[Midtrans QRIS] GoPay Snap token:", snapResult.token, "url:", snapResult.redirectUrl);
          await storage.updateTransaction(transaction.id, {
            paymentId: snapResult.token,
            paymentUrl: snapResult.redirectUrl,
          });
          return res.status(201).json({
            ...transaction,
            snapToken: snapResult.token,
            redirectUrl: snapResult.redirectUrl,
            channel: "GOPAY",
          });
        } catch (paymentError: any) {
          console.error("[Midtrans QRIS] GoPay Snap exception:", paymentError);
          return res.status(201).json({
            ...transaction,
            paymentError: paymentError.message || "Failed to connect to Midtrans payment gateway",
          });
        }
      } else {
        // QRIS: gunakan dynamic payment link tanpa filter enabled_payments
        // agar semua metode aktif tampil (termasuk QRIS) dan transaksi ter-track via order ID
        console.log("[Midtrans QRIS] Production mode - QRIS via dynamic payment link (no payment filter)");
        try {
          const baseUrl = process.env.APP_URL || "https://undifest.com";
          const linkResult = await createPaymentLink({
            orderId: transaction.id,
            grossAmount: amount,
            customerName: userName,
            customerEmail: userEmail,
            customerPhone: phoneNumber,
            itemName: `Tiket ${eventName}`,
            // Tidak ada enabledPayments — tampilkan semua metode aktif di akun Midtrans
            // Redirect ke /payment/success agar user langsung melihat halaman download setelah bayar
            finishUrl: `${baseUrl}/payment/success?trx=${transaction.id}`,
            errorUrl: `${baseUrl}/payment/cancel?trx=${transaction.id}`,
            pendingUrl: `${baseUrl}/payment/success?trx=${transaction.id}`,
          });
          console.log("[Midtrans QRIS] Dynamic payment link:", linkResult.paymentUrl);
          await storage.updateTransaction(transaction.id, {
            paymentId: transaction.id,
            paymentUrl: linkResult.paymentUrl,
          });
          return res.status(201).json({
            ...transaction,
            redirectUrl: linkResult.paymentUrl,
            channel: "QRIS",
          });
        } catch (paymentError: any) {
          console.error("[Midtrans QRIS] Dynamic payment link exception:", paymentError);
          return res.status(201).json({
            ...transaction,
            paymentError: paymentError.message || "Failed to connect to Midtrans payment gateway",
          });
        }
      }
    } catch (error) {
      console.error("[Midtrans QRIS] Error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create Midtrans QRIS payment" });
    }
  });

  // Midtrans Notification callback (webhook)
  app.post("/api/payments/midtrans/notification", async (req, res) => {
    try {
      console.log("[Midtrans Notification] Received:", req.body);

      const {
        order_id,
        status_code,
        gross_amount,
        signature_key,
        transaction_status,
        fraud_status,
      } = req.body;

      if (!order_id) {
        console.error("[Midtrans Notification] Missing order_id");
        return res.status(400).json({ error: "Missing order_id" });
      }

      // Verify signature
      if (signature_key && !verifyMidtransSignature(order_id, status_code, gross_amount, signature_key)) {
        console.error("[Midtrans Notification] Invalid signature for order:", order_id);
        return res.status(403).json({ error: "Invalid signature" });
      }

      // Find transaction
      const dbTransaction = await storage.getTransaction(order_id);
      if (!dbTransaction) {
        console.error("[Midtrans Notification] Transaction not found:", order_id);
        return res.status(404).json({ error: "Transaction not found" });
      }

      // Map Midtrans status to our status
      let paymentStatus = "pending";
      if (transaction_status === "settlement" || (transaction_status === "capture" && fraud_status === "accept")) {
        paymentStatus = "paid";
      } else if (transaction_status === "deny" || transaction_status === "cancel" || transaction_status === "failure") {
        paymentStatus = "failed";
      } else if (transaction_status === "expire") {
        paymentStatus = "expired";
      }

      const wasNotPaid = dbTransaction.paymentStatus !== "paid";

      await storage.updateTransaction(dbTransaction.id, {
        paymentStatus,
        paidAt: paymentStatus === "paid" ? new Date() : undefined,
      });

      // Increment event ticket count only once per transaction
      if (paymentStatus === "paid" && wasNotPaid) {
        try {
          await storage.incrementEventTickets(dbTransaction.eventId);
          console.log("[Midtrans Notification] Event tickets incremented for event:", dbTransaction.eventId);
        } catch (ticketErr) {
          console.error("[Midtrans Notification] Failed to increment event tickets:", ticketErr);
        }

        // Send WhatsApp notification with download link + nomor undian (1 pesan gabungan)
        if (dbTransaction.phoneNumber) {
          const baseUrl = process.env.APP_URL || "https://undifest.com";
          const downloadLink = `${baseUrl}/payment/success?trx=${dbTransaction.id}`;
          const nomorUndian = `UND-${dbTransaction.id.slice(0, 8).toUpperCase()}`;
          const event = await storage.getEvent(dbTransaction.eventId).catch(() => null);
          const hasEbook = !!(event?.ebookFile);
          const waMessage = hasEbook
            ? `✅ *Pembayaran Berhasil!*\n\nHalo! Pembayaran untuk *${dbTransaction.eventName}* telah dikonfirmasi.\n\n🎟️ *Nomor Undian Anda:* ${nomorUndian}\n\n📥 *Download E-book:*\n${downloadLink}\n\n_Simpan nomor undian sebagai bukti keikutsertaan. Link di atas juga bisa digunakan untuk download ulang e-book kapan saja._\n\nTerima kasih sudah berpartisipasi di UNDIFEST! 🎉`
            : `✅ *Pembayaran Berhasil!*\n\nHalo! Pembayaran untuk *${dbTransaction.eventName}* telah dikonfirmasi.\n\n🎟️ *Nomor Undian Anda:* ${nomorUndian}\n\n🔗 Lihat detail transaksi:\n${downloadLink}\n\n_Simpan nomor undian sebagai bukti keikutsertaan._\n\nTerima kasih sudah berpartisipasi di UNDIFEST! 🎉`;
          sendWhatsAppMessage(dbTransaction.phoneNumber, waMessage).catch(e =>
            console.error("[Midtrans Notification] Failed to send WA notification:", e)
          );
        }
      }

      console.log("[Midtrans Notification] Transaction updated:", dbTransaction.id, "Status:", paymentStatus);

      res.json({ success: true });
    } catch (error) {
      console.error("[Midtrans Notification] Error:", error);
      res.status(500).json({ error: "Notification processing failed" });
    }
  });

  // SIMULATION: Manual payment verification for testing
  app.post("/api/transactions/:id/simulate-payment", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body; // "paid", "failed", or "expired"

      // Only allow in simulation mode
      if (process.env.MIDTRANS_SIMULATION_MODE !== 'true') {
        return res.status(403).json({
          error: "This endpoint is only available in simulation mode"
        });
      }

      const transaction = await storage.getTransaction(id);
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      const paymentStatus = status || "paid";
      await storage.updateTransaction(id, {
        paymentStatus,
        paidAt: paymentStatus === "paid" ? new Date() : undefined,
      });

      console.log(`[SIMULATION] Transaction ${id} marked as ${paymentStatus}`);

      res.json({
        success: true,
        message: `Transaction marked as ${paymentStatus}`,
        transaction: await storage.getTransaction(id)
      });
    } catch (error) {
      console.error("[SIMULATION] Error:", error);
      res.status(500).json({ error: "Failed to simulate payment" });
    }
  });

  // Videos API (public for live page display)
  app.get("/api/videos", async (req, res) => {
    try {
      const videos = await storage.getAllVideos();
      // Strip base64 data from list responses - replace with stream URL for backward compat
      // This prevents returning hundreds of MB of base64 data on every request
      const sanitized = videos.map(v => ({
        ...v,
        videoFile: v.videoFile?.startsWith('data:')
          ? `/api/videos/${v.id}/stream`
          : v.videoFile,
      }));
      res.setHeader('Cache-Control', 'public, max-age=30');
      res.json(sanitized);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch videos" });
    }
  });

  app.post("/api/videos", requireAdmin, async (req, res) => {
    try {
      const data = {
        ...req.body,
        isLive: req.body.isLive === "true" || req.body.isLive === true,
      };

      const validated = insertVideoSchema.parse(data);
      const video = await storage.createVideo(validated);
      res.json(video);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create video" });
    }
  });

  app.delete("/api/videos/:id", requireAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteVideo(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Video not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete video" });
    }
  });

  // Get homepage videos (public)
  app.get("/api/videos/homepage", async (req, res) => {
    try {
      const videos = await storage.getHomepageVideos();
      // Strip base64 from homepage video list - replace with stream URL
      const sanitized = videos.map(v => ({
        ...v,
        videoFile: v.videoFile?.startsWith('data:')
          ? `/api/videos/${v.id}/stream`
          : v.videoFile,
      }));
      res.setHeader('Cache-Control', 'public, max-age=30');
      res.json(sanitized);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch homepage videos" });
    }
  });

  // Update video
  app.put("/api/videos/:id", requireAdmin, async (req, res) => {
    try {
      const data = {
        ...req.body,
        isLive: req.body.isLive === "true" || req.body.isLive === true,
        showOnHomepage: req.body.showOnHomepage === "true" || req.body.showOnHomepage === true,
      };

      const validated = updateVideoSchema.parse(data);
      const video = await storage.updateVideo(req.params.id, validated);

      if (!video) {
        return res.status(404).json({ error: "Video not found" });
      }

      res.json(video);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update video" });
    }
  });

  // Upload video file - store as static file for fast streaming (NOT base64)
  app.post("/api/videos/upload", requireAdmin, upload.single('video'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No video file uploaded" });
      }

      // Check file size (max 30MB)
      const maxSize = 30 * 1024 * 1024; // 30MB
      if (req.file.size > maxSize) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
          error: "Video terlalu besar. Maksimal 30MB untuk upload lokal. Gunakan YouTube/Vimeo URL untuk video lebih besar."
        });
      }

      console.log(`📹 Video uploaded: ${req.file.originalname} (${(req.file.size / 1024 / 1024).toFixed(2)}MB) → /uploads/${req.file.filename}`);

      // Return the static file URL path (NOT base64!) for fast serving
      res.json({ videoFile: `/uploads/${req.file.filename}` });
    } catch (error) {
      console.error("❌ Video upload error:", error);
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to upload video"
      });
    }
  });

  // Stream base64 video from DB (backward compatibility for old uploads)
  app.get("/api/videos/:id/stream", async (req, res) => {
    try {
      const video = await storage.getVideoById(req.params.id);
      if (!video || !video.videoFile) {
        return res.status(404).json({ error: "Video not found" });
      }
      // If it's a file URL (new uploads), redirect to it
      if (!video.videoFile.startsWith('data:')) {
        return res.redirect(video.videoFile);
      }
      // Legacy base64: stream it as video/mp4
      const matches = video.videoFile.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) return res.status(400).json({ error: "Invalid video data" });
      const mimeType = matches[1];
      const buffer = Buffer.from(matches[2], 'base64');
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Length', buffer.length);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.send(buffer);
    } catch (error) {
      res.status(500).json({ error: "Failed to stream video" });
    }
  });

  // Partners API (public for display on user-facing pages)
  app.get("/api/partners", async (req, res) => {
    try {
      const partners = await storage.getAllPartners();
      // Only show active partners
      const activePartners = partners.filter(p => p.isActive);
      res.setHeader('Cache-Control', 'public, max-age=60');
      res.json(activePartners);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch partners" });
    }
  });

  // Admin-only endpoint for all partners
  app.get("/api/admin/partners", requireAdmin, async (req, res) => {
    try {
      const partners = await storage.getAllPartners();
      res.json(partners);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch partners" });
    }
  });

  app.post("/api/partners", requireAdmin, upload.single("logo"), async (req, res) => {
    try {
      let logoUrl = req.body.logoUrl || "https://via.placeholder.com/200x100?text=Partner+Logo";

      // Convert file to base64 for persistent storage
      if (req.file) {
        const filePath = req.file.path;
        const fileBuffer = fs.readFileSync(filePath);
        logoUrl = `data:${req.file.mimetype};base64,${fileBuffer.toString('base64')}`;
        // Delete temporary file
        fs.unlinkSync(filePath);
      }

      const data = {
        name: req.body.name,
        logoUrl,
        websiteUrl: req.body.websiteUrl || null,
        order: parseInt(req.body.order || "0"),
        isActive: req.body.isActive === "true" || req.body.isActive === true,
      };

      const validated = insertPartnerSchema.parse(data);
      const partner = await storage.createPartner(validated);
      res.status(201).json(partner);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Partner create error:", error);
      res.status(500).json({ error: "Failed to create partner" });
    }
  });

  app.put("/api/partners/:id", requireAdmin, upload.single("logo"), async (req, res) => {
    try {
      const updateData: any = {
        name: req.body.name,
        websiteUrl: req.body.websiteUrl || null,
        order: parseInt(req.body.order || "0"),
        isActive: req.body.isActive === "true" || req.body.isActive === true,
      };

      // Convert file to base64 for persistent storage
      if (req.file) {
        const filePath = req.file.path;
        const fileBuffer = fs.readFileSync(filePath);
        updateData.logoUrl = `data:${req.file.mimetype};base64,${fileBuffer.toString('base64')}`;
        // Delete temporary file
        fs.unlinkSync(filePath);
      } else if (req.body.logoUrl) {
        updateData.logoUrl = req.body.logoUrl;
      }

      const partner = await storage.updatePartner(req.params.id, updateData);
      if (!partner) {
        return res.status(404).json({ error: "Partner not found" });
      }
      res.json(partner);
    } catch (error) {
      console.error("Partner update error:", error);
      res.status(500).json({ error: "Failed to update partner" });
    }
  });

  app.delete("/api/partners/:id", requireAdmin, async (req, res) => {
    try {
      const deleted = await storage.deletePartner(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Partner not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete partner" });
    }
  });

  // Terms & Conditions API
  app.get("/api/events/:eventId/terms", async (req, res) => {
    try {
      const terms = await storage.getActiveTermsConditionsByEventId(req.params.eventId);
      res.json(terms);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch terms and conditions" });
    }
  });

  app.get("/api/admin/events/:eventId/terms", requireAdmin, async (req, res) => {
    try {
      const terms = await storage.getTermsConditionsByEventId(req.params.eventId);
      res.json(terms);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch terms and conditions" });
    }
  });

  app.post("/api/events/:eventId/terms", requireAdmin, async (req, res) => {
    try {
      const data = {
        eventId: req.params.eventId,
        title: req.body.title,
        description: req.body.description,
        order: parseInt(req.body.order || "0"),
        isActive: req.body.isActive === "true" || req.body.isActive === true,
      };

      const validated = insertTermsConditionSchema.parse(data);
      const termsCondition = await storage.createTermsCondition(validated);
      res.status(201).json(termsCondition);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create terms and conditions" });
    }
  });

  app.put("/api/terms/:id", requireAdmin, async (req, res) => {
    try {
      const updateData: any = {
        title: req.body.title,
        description: req.body.description,
        order: parseInt(req.body.order || "0"),
        isActive: req.body.isActive === "true" || req.body.isActive === true,
      };

      const termsCondition = await storage.updateTermsCondition(req.params.id, updateData);
      if (!termsCondition) {
        return res.status(404).json({ error: "Terms and conditions not found" });
      }
      res.json(termsCondition);
    } catch (error) {
      res.status(500).json({ error: "Failed to update terms and conditions" });
    }
  });

  app.delete("/api/terms/:id", requireAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteTermsCondition(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Terms and conditions not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete terms and conditions" });
    }
  });

  // How It Works API
  app.get("/api/how-it-works", async (req, res) => {
    try {
      const items = await storage.getAllHowItWorks();
      const activeItems = items.filter(item => item.isActive);
      res.json(activeItems);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch how it works" });
    }
  });

  app.get("/api/admin/how-it-works", requireAdmin, async (req, res) => {
    try {
      const items = await storage.getAllHowItWorks();
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch how it works" });
    }
  });

  app.post("/api/how-it-works", requireAdmin, upload.single("icon"), async (req, res) => {
    try {
      let iconUrl = req.body.iconUrl || null;

      // Convert file to base64 for persistent storage
      if (req.file) {
        const filePath = req.file.path;
        const fileBuffer = fs.readFileSync(filePath);
        iconUrl = `data:${req.file.mimetype};base64,${fileBuffer.toString('base64')}`;
        fs.unlinkSync(filePath);
      }

      const data = {
        step: parseInt(req.body.step),
        title: req.body.title,
        description: req.body.description,
        iconUrl,
        isActive: req.body.isActive === "true" || req.body.isActive === true,
      };

      const validated = insertHowItWorksSchema.parse(data);
      const item = await storage.createHowItWorks(validated);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create how it works item" });
    }
  });

  app.put("/api/how-it-works/:id", requireAdmin, upload.single("icon"), async (req, res) => {
    try {
      const updateData: any = {
        step: parseInt(req.body.step),
        title: req.body.title,
        description: req.body.description,
        isActive: req.body.isActive === "true" || req.body.isActive === true,
      };

      // Convert file to base64 for persistent storage
      if (req.file) {
        const filePath = req.file.path;
        const fileBuffer = fs.readFileSync(filePath);
        updateData.iconUrl = `data:${req.file.mimetype};base64,${fileBuffer.toString('base64')}`;
        fs.unlinkSync(filePath);
      } else if (req.body.iconUrl) {
        updateData.iconUrl = req.body.iconUrl;
      }

      const item = await storage.updateHowItWorks(req.params.id, updateData);
      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to update how it works item" });
    }
  });

  app.delete("/api/how-it-works/:id", requireAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteHowItWorks(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Item not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete how it works item" });
    }
  });

  // Banks API
  app.get("/api/banks", async (req, res) => {
    try {
      const banks = await storage.getAllBanks();
      const activeBanks = banks.filter(b => b.isActive);
      res.json(activeBanks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch banks" });
    }
  });

  app.get("/api/admin/banks", requireAdmin, async (req, res) => {
    try {
      const banks = await storage.getAllBanks();
      res.json(banks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch banks" });
    }
  });

  app.post("/api/banks", requireAdmin, upload.single("logo"), async (req, res) => {
    try {
      let logoUrl = req.body.logoUrl || null;

      // Convert file to base64 for persistent storage
      if (req.file) {
        const filePath = req.file.path;
        const fileBuffer = fs.readFileSync(filePath);
        logoUrl = `data:${req.file.mimetype};base64,${fileBuffer.toString('base64')}`;
        fs.unlinkSync(filePath);
      }

      const data = {
        bankName: req.body.bankName,
        accountNumber: req.body.accountNumber,
        accountName: req.body.accountName,
        logoUrl,
        isActive: req.body.isActive === "true" || req.body.isActive === true,
      };

      const validated = insertBankSchema.parse(data);
      const bank = await storage.createBank(validated);
      res.status(201).json(bank);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create bank" });
    }
  });

  app.put("/api/banks/:id", requireAdmin, upload.single("logo"), async (req, res) => {
    try {
      const updateData: any = {
        bankName: req.body.bankName,
        accountNumber: req.body.accountNumber,
        accountName: req.body.accountName,
        isActive: req.body.isActive === "true" || req.body.isActive === true,
      };

      // Convert file to base64 for persistent storage
      if (req.file) {
        const filePath = req.file.path;
        const fileBuffer = fs.readFileSync(filePath);
        updateData.logoUrl = `data:${req.file.mimetype};base64,${fileBuffer.toString('base64')}`;
        fs.unlinkSync(filePath);
      } else if (req.body.logoUrl) {
        updateData.logoUrl = req.body.logoUrl;
      }

      const bank = await storage.updateBank(req.params.id, updateData);
      if (!bank) {
        return res.status(404).json({ error: "Bank not found" });
      }
      res.json(bank);
    } catch (error) {
      res.status(500).json({ error: "Failed to update bank" });
    }
  });

  app.delete("/api/banks/:id", requireAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteBank(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Bank not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete bank" });
    }
  });

  // Settings API
  app.get("/api/admin/settings", requireAdmin, async (req, res) => {
    try {
      const settings = await storage.getAllSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.put("/api/settings", requireAdmin, async (req, res) => {
    try {
      const { settings } = req.body;
      await storage.updateSettings(settings);
      // Optional: sync specific settings to external services
      const updatedKeys = new Set<string>(
        Array.isArray(settings) ? settings.map((s: any) => String(s?.key)) : []
      );

      let fonnteSync: { attempted: boolean; success?: boolean; detail?: any } | undefined;
      if (updatedKeys.has("fonnte_device")) {
        const accountToken = process.env.FONNTE_ACCOUNT_TOKEN;
        const deviceSetting = await storage.getSetting("fonnte_device");
        const rawDevice = deviceSetting?.value?.trim();
        const device = rawDevice?.replace(/\D/g, "");
        const candidates = new Set<string>();
        if (device) {
          candidates.add(device);
          if (device.startsWith("0")) candidates.add(`62${device.substring(1)}`);
          if (device.startsWith("62")) candidates.add(`0${device.substring(2)}`);
        }
        fonnteSync = { attempted: true };

        if (!accountToken) {
          fonnteSync.success = false;
          fonnteSync.detail = "FONNTE_ACCOUNT_TOKEN not configured";
        } else if (!device) {
          fonnteSync.success = false;
          fonnteSync.detail = "fonnte_device is empty";
        } else {
          try {
            const getDevicesResp = await fetch("https://api.fonnte.com/get-devices", {
              method: "POST",
              headers: {
                Authorization: accountToken,
              },
            });
            const getDevicesData = await getDevicesResp.json().catch(() => ({}));
            const allDevices = Array.isArray(getDevicesData)
              ? getDevicesData
              : Array.isArray((getDevicesData as any)?.devices)
                ? (getDevicesData as any).devices
                : Array.isArray((getDevicesData as any)?.data)
                  ? (getDevicesData as any).data
                  : [];
            let matchedDevice = allDevices.find((d: any) =>
              candidates.has(String(d?.device || "").replace(/\D/g, ""))
            );

            if (!matchedDevice) {
              const payload = new URLSearchParams();
              payload.set("name", "UNDIFEST");
              payload.set("device", device);
              const addResp = await fetch("https://api.fonnte.com/add-device", {
                method: "POST",
                headers: {
                  Authorization: accountToken,
                  "Content-Type": "application/x-www-form-urlencoded",
                },
                body: payload.toString(),
              });
              const addData = await addResp.json().catch(() => ({}));
              if (!(addResp.ok && !!(addData as any)?.status)) {
                fonnteSync.success = false;
                fonnteSync.detail = {
                  httpStatus: addResp.status,
                  ...addData,
                };
                return res.json({ success: true, fonnteSync });
              }
            }

            const refreshResp = await fetch("https://api.fonnte.com/get-devices", {
              method: "POST",
              headers: {
                Authorization: accountToken,
              },
            });
            const refreshData = await refreshResp.json().catch(() => ({}));
            const refreshedDevices = Array.isArray(refreshData)
              ? refreshData
              : Array.isArray((refreshData as any)?.devices)
                ? (refreshData as any).devices
                : Array.isArray((refreshData as any)?.data)
                  ? (refreshData as any).data
                  : [];
            matchedDevice = refreshedDevices.find((d: any) =>
              candidates.has(String(d?.device || "").replace(/\D/g, ""))
            );

            if (matchedDevice?.token) {
              await storage.updateSettings([
                { key: "fonnte_device_token", value: String(matchedDevice.token) },
              ]);
            }

            fonnteSync.success = !!matchedDevice;
            fonnteSync.detail = {
              action: matchedDevice ? "device_ready" : "device_not_found_after_sync",
              device: matchedDevice?.device || device,
            };
          } catch (err: any) {
            fonnteSync.success = false;
            fonnteSync.detail = err?.message || String(err);
          }
        }
      }

      res.json({ success: true, fonnteSync });
    } catch (error) {
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  app.post("/api/admin/fonnte/connect-qr", requireAdmin, async (_req, res) => {
    try {
      const accountToken = process.env.FONNTE_ACCOUNT_TOKEN;
      if (!accountToken) {
        return res.status(400).json({
          success: false,
          error: "FONNTE_ACCOUNT_TOKEN belum di-set di backend.",
        });
      }

      const targetRaw = (await storage.getSetting("fonnte_device").catch(() => undefined))?.value?.trim() || "";
      const targetNormalized = targetRaw.replace(/\D/g, "");
      if (!targetNormalized) {
        return res.status(400).json({
          success: false,
          error: "Nomor Fonnte Device belum diisi di Settings.",
        });
      }

      const toCandidates = (n: string) => {
        const set = new Set<string>();
        if (!n) return set;
        set.add(n);
        if (n.startsWith("0")) set.add(`62${n.substring(1)}`);
        if (n.startsWith("62")) set.add(`0${n.substring(2)}`);
        return set;
      };
      const targetCandidates = toCandidates(targetNormalized);

      const getDevicesResp = await fetch("https://api.fonnte.com/get-devices", {
        method: "POST",
        headers: { Authorization: accountToken },
      });
      const getDevicesData = await getDevicesResp.json().catch(() => ({}));
      const devices = Array.isArray(getDevicesData)
        ? getDevicesData
        : Array.isArray((getDevicesData as any)?.devices)
          ? (getDevicesData as any).devices
          : Array.isArray((getDevicesData as any)?.data)
            ? (getDevicesData as any).data
            : [];

      const targetDevice = devices.find((d: any) =>
        targetCandidates.has(String(d?.device || "").replace(/\D/g, ""))
      );
      if (!targetDevice?.token) {
        return res.status(400).json({
          success: false,
          error: "Device target belum ditemukan di Fonnte. Simpan ulang Fonnte Device dulu agar dibuat otomatis.",
        });
      }

      await storage.updateSettings([
        { key: "fonnte_device_token", value: String(targetDevice.token) },
      ]);

      const requestQr = async () => {
        const qrResp = await fetch("https://api.fonnte.com/qr", {
          method: "POST",
          headers: {
            Authorization: String(targetDevice.token),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ type: "qr" }),
        });
        const qrData = await qrResp.json().catch(() => ({}));
        return { qrResp, qrData };
      };

      let { qrResp, qrData } = await requestQr();
      if (qrResp.ok && qrData?.status && qrData?.url) {
        return res.json({
          success: true,
          qrBase64: qrData.url,
          message: "Scan QR ini dengan WhatsApp untuk connect device target.",
        });
      }

      const reason = String(qrData?.reason || qrData?.detail || "").toLowerCase();

      if (reason.includes("already connect") || reason.includes("free device already connected")) {
        const connectedDevices = devices.filter((d: any) => {
          const status = String(d?.status || d?.connection || "").toLowerCase();
          return status === "connect" || status === "connected";
        });

        for (const d of connectedDevices) {
          const deviceNum = String(d?.device || "").replace(/\D/g, "");
          if (targetCandidates.has(deviceNum)) continue;
          if (!d?.token) continue;
          await fetch("https://api.fonnte.com/disconnect", {
            method: "POST",
            headers: { Authorization: String(d.token) },
          }).catch(() => null);
        }

        ({ qrResp, qrData } = await requestQr());
        if (qrResp.ok && qrData?.status && qrData?.url) {
          return res.json({
            success: true,
            qrBase64: qrData.url,
            message: "Device lama berhasil diputus, scan QR untuk connect nomor target.",
          });
        }
      }

      return res.status(400).json({
        success: false,
        error: qrData?.reason || qrData?.detail || "Gagal mendapatkan QR connect dari Fonnte",
        detail: qrData,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error?.message || "Failed to request Fonnte QR",
      });
    }
  });

  // Footer Settings API
  app.get("/api/admin/footer", requireAdmin, async (req, res) => {
    try {
      const settings = await storage.getAllFooterSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch footer settings" });
    }
  });

  app.put("/api/footer", requireAdmin, async (req, res) => {
    try {
      const { settings } = req.body;
      await storage.updateFooterSettings(settings);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update footer settings" });
    }
  });

  // IP Whitelist API
  app.get("/api/admin/ip-whitelist", requireAdmin, async (req, res) => {
    try {
      const ips = await storage.getAllIpWhitelist();
      res.json(ips);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch IP whitelist" });
    }
  });

  app.post("/api/ip-whitelist", requireAdmin, async (req, res) => {
    try {
      const data = {
        ipAddress: req.body.ipAddress,
        description: req.body.description || null,
        isActive: req.body.isActive ?? true,
      };
      const ip = await storage.createIpWhitelist(data);
      res.status(201).json(ip);
    } catch (error) {
      res.status(500).json({ error: "Failed to create IP whitelist" });
    }
  });

  app.delete("/api/ip-whitelist/:id", requireAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteIpWhitelist(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "IP not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete IP whitelist" });
    }
  });

  // Payment Methods API
  app.get("/api/payment-methods", async (req, res) => {
    try {
      const methods = await storage.getAllPaymentMethods();
      const activeMethods = methods.filter(m => m.isActive);
      res.json(activeMethods);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch payment methods" });
    }
  });

  app.get("/api/admin/payment-methods", requireAdmin, async (req, res) => {
    try {
      const methods = await storage.getAllPaymentMethods();
      res.json(methods);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch payment methods" });
    }
  });

  app.post("/api/payment-methods", requireAdmin, upload.single("logo"), async (req, res) => {
    try {
      let logoUrl = req.body.logoUrl || null;

      // Convert file to base64 for persistent storage
      if (req.file) {
        const filePath = req.file.path;
        const fileBuffer = fs.readFileSync(filePath);
        logoUrl = `data:${req.file.mimetype};base64,${fileBuffer.toString('base64')}`;
        fs.unlinkSync(filePath);
      }

      const data = {
        name: req.body.name,
        type: req.body.type,
        logoUrl,
        instructions: req.body.instructions || null,
        isActive: req.body.isActive === "true" || req.body.isActive === true,
      };

      const method = await storage.createPaymentMethod(data);
      res.status(201).json(method);
    } catch (error) {
      res.status(500).json({ error: "Failed to create payment method" });
    }
  });

  app.put("/api/payment-methods/:id", requireAdmin, upload.single("logo"), async (req, res) => {
    try {
      const updateData: any = {
        name: req.body.name,
        type: req.body.type,
        instructions: req.body.instructions,
        isActive: req.body.isActive === "true" || req.body.isActive === true,
      };

      // Convert file to base64 for persistent storage
      if (req.file) {
        const filePath = req.file.path;
        const fileBuffer = fs.readFileSync(filePath);
        updateData.logoUrl = `data:${req.file.mimetype};base64,${fileBuffer.toString('base64')}`;
        fs.unlinkSync(filePath);
      } else if (req.body.logoUrl) {
        updateData.logoUrl = req.body.logoUrl;
      }

      const method = await storage.updatePaymentMethod(req.params.id, updateData);
      if (!method) {
        return res.status(404).json({ error: "Payment method not found" });
      }
      res.json(method);
    } catch (error) {
      res.status(500).json({ error: "Failed to update payment method" });
    }
  });

  app.delete("/api/payment-methods/:id", requireAdmin, async (req, res) => {
    try {
      const deleted = await storage.deletePaymentMethod(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Payment method not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete payment method" });
    }
  });

  // Pages API
  app.get("/api/pages", async (req, res) => {
    try {
      const allPages = await storage.getAllPages();
      const publishedPages = allPages.filter(p => p.isPublished);
      res.json(publishedPages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pages" });
    }
  });

  app.get("/api/pages/:slug", async (req, res) => {
    try {
      const page = await storage.getPageBySlug(req.params.slug);
      if (!page || !page.isPublished) {
        return res.status(404).json({ error: "Page not found" });
      }
      res.json(page);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch page" });
    }
  });

  app.get("/api/admin/pages", requireAdmin, async (req, res) => {
    try {
      const allPages = await storage.getAllPages();
      res.json(allPages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pages" });
    }
  });

  app.post("/api/pages", requireAdmin, async (req, res) => {
    try {
      const data = {
        slug: req.body.slug,
        title: req.body.title,
        content: req.body.content,
        isPublished: req.body.isPublished ?? true,
      };

      const page = await storage.createPage(data);
      res.status(201).json(page);
    } catch (error) {
      res.status(500).json({ error: "Failed to create page" });
    }
  });

  app.put("/api/pages/:id", requireAdmin, async (req, res) => {
    try {
      const updateData = {
        slug: req.body.slug,
        title: req.body.title,
        content: req.body.content,
        isPublished: req.body.isPublished,
      };

      const page = await storage.updatePage(req.params.id, updateData);
      if (!page) {
        return res.status(404).json({ error: "Page not found" });
      }
      res.json(page);
    } catch (error) {
      res.status(500).json({ error: "Failed to update page" });
    }
  });

  app.delete("/api/pages/:id", requireAdmin, async (req, res) => {
    try {
      const deleted = await storage.deletePage(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Page not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete page" });
    }
  });

  // Users API
  app.get("/api/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // In-memory OTP storage for MVP (use Redis in production)
  // Store OTP -> {phoneNumber, expiresAt} to prevent phone number spoofing
  const otpStorage = new Map<string, { phoneNumber: string; expiresAt: number }>();

  // Generic WhatsApp message sender via Fonnte API
  async function resolveFonnteDevice(): Promise<string | undefined> {
    if (process.env.FONNTE_DEVICE) return process.env.FONNTE_DEVICE;
    try {
      const s = await storage.getSetting("fonnte_device");
      const v = s?.value?.trim();
      return v || undefined;
    } catch {
      return undefined;
    }
  }

  async function resolveFonnteSendToken(): Promise<string | undefined> {
    try {
      const s = await storage.getSetting("fonnte_device_token");
      const v = s?.value?.trim();
      if (v) return v;
    } catch {
      // ignore and fallback to env token
    }
    return process.env.FONNTE_API_TOKEN;
  }

  async function sendWhatsAppMessage(phoneNumber: string, message: string): Promise<boolean> {
    const FONNTE_TOKEN = await resolveFonnteSendToken();
    if (!FONNTE_TOKEN) {
      console.error("[WA] GAGAL: fonnte_device_token tidak ditemukan di settings dan FONNTE_API_TOKEN env tidak di-set");
      return false;
    }
    try {
      let formattedPhone = phoneNumber.replace(/\D/g, '');
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '62' + formattedPhone.substring(1);
      } else if (!formattedPhone.startsWith('62')) {
        formattedPhone = '62' + formattedPhone;
      }
      const fonnteDevice = await resolveFonnteDevice();
      const payload: Record<string, string> = { target: formattedPhone, message, countryCode: '62' };
      if (fonnteDevice) payload.device = fonnteDevice;
      console.log(`[WA] Mengirim ke ${formattedPhone}, device: ${fonnteDevice || '(default)'}, token: ${FONNTE_TOKEN.slice(0, 6)}...`);
      const response = await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: { 'Authorization': FONNTE_TOKEN, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (result.status === true) {
        console.log(`[WA] ✅ Terkirim ke ${formattedPhone}`);
      } else {
        console.error(`[WA] ❌ Gagal ke ${formattedPhone}: HTTP ${response.status} – ${JSON.stringify(result)}`);
      }
      return result.status === true;
    } catch (error) {
      console.error(`[WA] ❌ Error fetch Fonnte ke ${phoneNumber}:`, error);
      return false;
    }
  }

  // Test kirim WhatsApp (admin only)
  app.post("/api/admin/fonnte/test-send", requireAdmin, async (req, res) => {
    try {
      const { phoneNumber } = req.body;
      if (!phoneNumber) {
        return res.status(400).json({ success: false, error: "phoneNumber wajib diisi" });
      }
      const FONNTE_TOKEN = await resolveFonnteSendToken();
      if (!FONNTE_TOKEN) {
        return res.status(400).json({
          success: false,
          error: "Token Fonnte belum dikonfigurasi. Pastikan fonnte_device_token sudah tersimpan di Settings, atau set environment variable FONNTE_API_TOKEN.",
        });
      }
      let formattedPhone = phoneNumber.replace(/\D/g, '');
      if (formattedPhone.startsWith('0')) formattedPhone = '62' + formattedPhone.substring(1);
      else if (!formattedPhone.startsWith('62')) formattedPhone = '62' + formattedPhone;

      const fonnteDevice = await resolveFonnteDevice();
      const payload: Record<string, string> = {
        target: formattedPhone,
        message: `✅ *Test WhatsApp Undifest*\n\nIni adalah pesan percobaan dari sistem Undifest.\nJika Anda menerima pesan ini, berarti konfigurasi Fonnte sudah benar! 🎉\n\nWaktu: ${new Date().toLocaleString('id-ID')}`,
        countryCode: '62',
      };
      if (fonnteDevice) payload.device = fonnteDevice;

      console.log(`[WA Test] Mengirim ke ${formattedPhone}, device: ${fonnteDevice || '(default)'}`);
      const response = await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: { 'Authorization': FONNTE_TOKEN, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      console.log(`[WA Test] Response Fonnte:`, JSON.stringify(result));

      if (result.status === true) {
        return res.json({ success: true, message: `Pesan test berhasil dikirim ke ${formattedPhone}` });
      } else {
        return res.json({
          success: false,
          error: `Fonnte menolak pengiriman: ${result.reason || result.detail || result.message || JSON.stringify(result)}`,
          detail: result,
        });
      }
    } catch (error: any) {
      console.error("[WA Test] Error:", error);
      return res.status(500).json({ success: false, error: error?.message || "Internal error" });
    }
  });

  // Function to send OTP via WhatsApp using Fonnte API
  async function sendWhatsAppOTP(phoneNumber: string, otp: string): Promise<boolean> {
    const FONNTE_TOKEN = await resolveFonnteSendToken();

    if (!FONNTE_TOKEN) {
      console.error("[OTP] FONNTE_API_TOKEN not configured");
      return false;
    }

    try {
      // Format phone number for WhatsApp (remove leading 0, add 62 for Indonesia)
      let formattedPhone = phoneNumber.replace(/\D/g, '');
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '62' + formattedPhone.substring(1);
      } else if (!formattedPhone.startsWith('62')) {
        formattedPhone = '62' + formattedPhone;
      }

      const message = `*UNDIFEST* - Kode OTP Anda adalah: *${otp}*\n\nKode ini berlaku selama 5 menit.\nJangan bagikan kode ini kepada siapapun.`;

      const fonnteDevice = await resolveFonnteDevice();
      const otpPayload: Record<string, string> = { target: formattedPhone, message, countryCode: '62' };
      if (fonnteDevice) otpPayload.device = fonnteDevice;
      const response = await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: {
          'Authorization': FONNTE_TOKEN,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(otpPayload),
      });

      const result = await response.json();
      console.log(`[OTP] WhatsApp sent to ${formattedPhone}:`, result.status ? 'Success' : 'Failed');
      return result.status === true;
    } catch (error) {
      console.error("[OTP] Failed to send WhatsApp:", error);
      return false;
    }
  }

  app.post("/api/users/send-otp", async (req, res) => {
    try {
      const { phoneNumber } = req.body;
      if (!phoneNumber) {
        return res.status(400).json({ error: "Phone number is required" });
      }

      // Generate a random 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

      otpStorage.set(otp, { phoneNumber, expiresAt });

      // Auto-cleanup expired OTPs
      setTimeout(() => {
        otpStorage.delete(otp);
      }, 5 * 60 * 1000);

      const hasFonnteToken = !!(await resolveFonnteSendToken());

      // Send OTP via WhatsApp whenever Fonnte is configured
      if (hasFonnteToken) {
        const sent = await sendWhatsAppOTP(phoneNumber, otp);
        if (!sent) {
          console.error(`[OTP] Failed to send WhatsApp OTP to ${phoneNumber}`);
        }
        console.log(`[OTP] OTP sent via WhatsApp to ${phoneNumber}`);
        return res.json({
          success: true,
          message: "Kode OTP telah dikirim ke WhatsApp Anda"
        });
      }

      // Development mode OR no Fonnte token: Return OTP in response for testing
      console.log(`[DEMO MODE] OTP for ${phoneNumber}: ${otp} (expires in 5 minutes)`);

      const response: any = {
        success: true,
        message: "OTP sent successfully",
        otp: otp, // Include OTP for demo/testing
        _demoWarning: "OTP included in response for demo purposes only"
      };

      res.json(response);
    } catch (error) {
      console.error("[OTP] Error:", error);
      res.status(500).json({ error: "Failed to send OTP" });
    }
  });

  app.post("/api/users/verify-otp", async (req, res) => {
    try {
      const { phoneNumber, otp } = req.body;
      if (!phoneNumber || !otp) {
        return res.status(400).json({ error: "Phone number and OTP are required" });
      }

      // Check if OTP exists and is not expired
      const otpData = otpStorage.get(otp);
      if (!otpData) {
        return res.status(400).json({ error: "Invalid or expired OTP" });
      }

      // Verify OTP hasn't expired
      if (Date.now() > otpData.expiresAt) {
        otpStorage.delete(otp);
        return res.status(400).json({ error: "OTP has expired" });
      }

      // SECURITY: Verify the phone number matches the one that requested the OTP
      if (otpData.phoneNumber !== phoneNumber) {
        return res.status(400).json({ error: "Invalid OTP for this phone number" });
      }

      // OTP is valid, create or get user
      const clientIp = getClientIp(req);
      let user = await storage.getUserByPhoneNumber(phoneNumber);
      if (!user) {
        user = await storage.createUser({ phoneNumber, ip: clientIp || undefined });
      } else {
        // Update IP on every login so we always have the latest
        if (clientIp) {
          user = await storage.updateUser(user.id, { ip: clientIp }) || user;
        }
      }

      // Clear the used OTP immediately to prevent reuse
      otpStorage.delete(otp);

      // Generate JWT token for user
      const token = generateUserToken({
        userId: user.id,
        phoneNumber: user.phoneNumber,
      });

      res.json({ success: true, user, token });
    } catch (error) {
      res.status(500).json({ error: "Failed to verify OTP" });
    }
  });

  // Verify OTP and return orders for guest user (no login/account creation)
  app.post("/api/orders/verify-otp-and-lookup", async (req, res) => {
    try {
      const { phoneNumber, otp } = req.body;
      if (!phoneNumber || !otp) {
        return res.status(400).json({ error: "Nomor telepon dan OTP wajib diisi" });
      }

      // Check OTP exists
      const otpData = otpStorage.get(otp);
      if (!otpData) {
        return res.status(400).json({ error: "Kode OTP tidak valid atau sudah kadaluarsa" });
      }

      // Check expiry
      if (Date.now() > otpData.expiresAt) {
        otpStorage.delete(otp);
        return res.status(400).json({ error: "Kode OTP sudah kadaluarsa" });
      }

      // Normalize and compare phone numbers
      const normalizePhone = (p: string) => {
        let n = p.replace(/[\s\-\+\(\)]/g, "");
        if (n.startsWith("62")) n = "0" + n.slice(2);
        return n;
      };
      if (normalizePhone(otpData.phoneNumber) !== normalizePhone(phoneNumber)) {
        return res.status(400).json({ error: "OTP tidak sesuai dengan nomor telepon ini" });
      }

      // OTP valid - delete immediately to prevent reuse
      otpStorage.delete(otp);

      // Lookup all transactions for this phone
      const allTransactions = await storage.getAllTransactions();
      const phoneMatched = allTransactions.filter(
        (t) => normalizePhone(t.phoneNumber) === normalizePhone(phoneNumber)
      );

      // For pending transactions, check Midtrans directly and update status in real-time
      // This ensures that if the user just paid and the webhook hasn't arrived yet,
      // we still detect the payment and return the correct status.
      await Promise.all(
        phoneMatched
          .filter((t) => t.paymentStatus === "pending" && t.paymentId)
          .map(async (t) => {
            try {
              const midtransStatus = await checkMidtransTransactionStatus(t.id);
              if (!midtransStatus) return;
              const { transactionStatus, fraudStatus } = midtransStatus;
              if (transactionStatus === "settlement" || (transactionStatus === "capture" && fraudStatus === "accept")) {
                await storage.updateTransaction(t.id, { paymentStatus: "paid", paidAt: new Date() });
                t.paymentStatus = "paid";
                await storage.incrementEventTickets(t.eventId).catch(() => {});
              } else if (["deny", "cancel", "failure"].includes(transactionStatus)) {
                await storage.updateTransaction(t.id, { paymentStatus: "failed" });
                t.paymentStatus = "failed";
              } else if (transactionStatus === "expire") {
                await storage.updateTransaction(t.id, { paymentStatus: "expired" });
                t.paymentStatus = "expired";
              } else if (transactionStatus === "not_found") {
                const hoursSinceCreation = (Date.now() - new Date(t.createdAt).getTime()) / (1000 * 60 * 60);
                if (hoursSinceCreation > 24) {
                  await storage.updateTransaction(t.id, { paymentStatus: "expired" });
                  t.paymentStatus = "expired";
                }
              }
            } catch {
              // non-fatal: just skip this transaction's Midtrans check
            }
          })
      );

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const paidTransactions = phoneMatched.filter(
        (t) => t.paymentStatus === "paid" && new Date(t.createdAt) >= thirtyDaysAgo
      );

      const orders = await Promise.all(
        paidTransactions.map(async (t) => {
          const event = await storage.getEvent(t.eventId).catch(() => null);
          return {
            transactionId: t.id,
            eventName: t.eventName,
            ticketCount: t.ticketCount,
            amount: t.amount,
            paidAt: t.paidAt,
            hasEbook: !!(event?.ebookFile),
          };
        })
      );

      res.json(orders);
    } catch (error) {
      console.error("[Orders OTP Lookup] Error:", error);
      res.status(500).json({ error: "Gagal memuat pesanan" });
    }
  });

  // Update user profile
  app.put("/api/users/profile", requireUser, async (req, res) => {
    try {
      const userId = (req as any).user.userId;
      console.log("[Profile Update] userId:", userId);
      console.log("[Profile Update] body:", req.body);

      const { name, email, city, accountNumber, bankName } = req.body;

      // Validation
      if (!name || !email || !city || !accountNumber || !bankName) {
        console.log("[Profile Update] Missing fields:", { name, email, city, accountNumber, bankName });
        return res.status(400).json({ error: "All fields are required" });
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }

      // Account number must be numeric
      if (!/^\d+$/.test(accountNumber)) {
        return res.status(400).json({ error: "Account number must be numeric" });
      }

      // Check if user exists first
      const existingUser = await storage.getUser(userId);
      console.log("[Profile Update] Existing user:", existingUser);

      if (!existingUser) {
        return res.status(404).json({ error: "User not found" });
      }

      const updatedUser = await storage.updateUser(userId, {
        name,
        email,
        city,
        accountNumber,
        bankName,
      });

      console.log("[Profile Update] Updated user:", updatedUser);

      if (!updatedUser) {
        return res.status(404).json({ error: "Failed to update user" });
      }

      res.json({ success: true, user: updatedUser });
    } catch (error) {
      console.error("[Profile Update] Error:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Delete own account (user)
  app.delete("/api/users/account", requireUser, async (req, res) => {
    try {
      const userId = (req as any).user.userId;
      const deleted = await storage.deleteUser(userId);
      if (!deleted) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("[Delete Account] Error:", error);
      res.status(500).json({ error: "Failed to delete account" });
    }
  });

  // Delete user by admin
  app.delete("/api/users/:id", requireAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteUser(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("[Admin Delete User] Error:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // Winners API (public for display on user-facing pages)
  app.get("/api/winners", async (req, res) => {
    try {
      const winners = await storage.getAllWinners();
      const transactions = await storage.getAllTransactions();
      const users = await storage.getAllUsers();
      const events = await storage.getAllEvents();

      // Join winner data with transaction, user, and event details
      // For guest winners (userId is null), fall back to transaction buyerName/phoneNumber
      const winnersWithDetails = winners.map(winner => {
        const transaction = transactions.find(t => t.id === winner.transactionId);
        const user = users.find(u => u.id === winner.userId);
        return {
          ...winner,
          transaction,
          user,
          event: events.find(e => e.id === winner.eventId),
          // Resolved display fields — used by frontend to show name & phone for both account and guest winners
          displayName: user?.name || transaction?.buyerName || "-",
          displayPhone: user?.phoneNumber || transaction?.phoneNumber || "-",
        };
      });

      res.json(winnersWithDetails);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch winners" });
    }
  });

  // Server-side random winner drawing (Superadmin and QS Custom only)
  app.post("/api/winners/draw", requireAdmin, requireRole("superadmin", "qs_custom"), async (req, res) => {
    try {
      const { eventId } = z.object({ eventId: z.string() }).parse(req.body);

      // Get all transactions for this event
      const allTransactions = await storage.getAllTransactions();
      const eventTransactions = allTransactions.filter(t => t.eventId === eventId);

      if (eventTransactions.length === 0) {
        return res.status(400).json({ error: "No transactions found for this event" });
      }

      // Get existing winners for this event
      const allWinners = await storage.getAllWinners();
      const eventWinners = allWinners.filter(w => w.eventId === eventId);
      const winnerTransactionIds = new Set(eventWinners.map(w => w.transactionId));

      // Filter out transactions that already won
      const eligibleTransactions = eventTransactions.filter(
        t => !winnerTransactionIds.has(t.id)
      );

      if (eligibleTransactions.length === 0) {
        return res.status(400).json({ error: "No eligible participants remaining" });
      }

      // Secure random selection using crypto
      const crypto = await import('crypto');
      const randomIndex = crypto.randomInt(0, eligibleTransactions.length);
      const selectedTransaction = eligibleTransactions[randomIndex];

      // Create winner record
      const winner = await storage.createWinner({
        transactionId: selectedTransaction.id,
        eventId: selectedTransaction.eventId,
        userId: selectedTransaction.userId,
      });

      res.json({ winner, transaction: selectedTransaction });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to draw winner" });
    }
  });

  // Bulk winner generation with filters (Superadmin and QS Custom only)
  app.post("/api/winners/bulk-generate", requireAdmin, requireRole("superadmin", "qs_custom"), async (req, res) => {
    try {
      const { eventId, count = 10, filters = {} } = req.body;

      if (!eventId) {
        return res.status(400).json({ error: "Event ID is required" });
      }

      // Get all transactions for this event
      const allTransactions = await storage.getAllTransactions();
      const allUsers = await storage.getAllUsers();
      const allWinners = await storage.getAllWinners();

      const eventTransactions = allTransactions.filter(t => t.eventId === eventId);

      if (eventTransactions.length === 0) {
        return res.status(400).json({ error: "No transactions found for this event" });
      }

      // Get existing winners for this event
      const eventWinners = allWinners.filter(w => w.eventId === eventId);
      const winnerUserIds = new Set(eventWinners.map(w => w.userId));

      // Filter out users who already won
      let eligibleTransactions = eventTransactions.filter(
        t => !winnerUserIds.has(t.userId)
      );

      // Apply filters
      if (filters.keyword) {
        const keyword = filters.keyword.toLowerCase();
        eligibleTransactions = eligibleTransactions.filter(t => {
          const user = allUsers.find(u => u.id === t.userId);
          return user?.name?.toLowerCase().includes(keyword) ||
                 user?.phoneNumber?.includes(keyword);
        });
      }

      if (filters.city) {
        eligibleTransactions = eligibleTransactions.filter(t => {
          const user = allUsers.find(u => u.id === t.userId);
          return user?.city?.toLowerCase() === filters.city.toLowerCase();
        });
      }

      // Group by userId to count tickets and repetitions
      const userStats = new Map<string, {
        userId: string;
        totalTickets: number;
        repetitions: number;
        transactions: typeof eligibleTransactions;
      }>();

      eligibleTransactions.forEach(t => {
        if (!userStats.has(t.userId)) {
          userStats.set(t.userId, {
            userId: t.userId,
            totalTickets: 0,
            repetitions: 0,
            transactions: [],
          });
        }
        const stats = userStats.get(t.userId)!;
        stats.totalTickets += t.ticketCount;
        stats.repetitions += 1;
        stats.transactions.push(t);
      });

      // Convert to array and apply priority sorting
      let candidates = Array.from(userStats.values());

      // Sort by priority: totalTickets (desc), repetitions (desc)
      if (filters.prioritizeTickets) {
        candidates.sort((a, b) => {
          if (b.totalTickets !== a.totalTickets) {
            return b.totalTickets - a.totalTickets;
          }
          return b.repetitions - a.repetitions;
        });
      }

      // Limit to requested count
      const selectedCount = Math.min(count, candidates.length);
      const selectedCandidates = candidates.slice(0, selectedCount);

      if (selectedCandidates.length === 0) {
        return res.status(400).json({ error: "No eligible participants found with given filters" });
      }

      // Create winner records
      const winners = [];
      for (const candidate of selectedCandidates) {
        // Pick the first transaction for this user
        const transaction = candidate.transactions[0];

        const winner = await storage.createWinner({
          transactionId: transaction.id,
          eventId: transaction.eventId,
          userId: transaction.userId,
        });

        winners.push({
          winner,
          transaction,
          user: allUsers.find(u => u.id === transaction.userId),
        });
      }

      res.json({
        success: true,
        count: winners.length,
        winners
      });
    } catch (error) {
      console.error("Bulk generate error:", error);
      res.status(500).json({ error: "Failed to bulk generate winners" });
    }
  });

  // Manual winner nomination (Superadmin and QS Custom only)
  app.post("/api/winners/nominate", requireAdmin, requireRole("superadmin", "qs_custom"), async (req, res) => {
    try {
      const { userId, eventId } = z.object({
        userId: z.string(),
        eventId: z.string()
      }).parse(req.body);

      // Check if user already a winner for this event
      const allWinners = await storage.getAllWinners();
      const existingWinner = allWinners.find(w => w.userId === userId && w.eventId === eventId);

      if (existingWinner) {
        return res.status(400).json({ error: "User is already a winner for this event" });
      }

      // Get user's transaction for this event
      const allTransactions = await storage.getAllTransactions();
      const userTransaction = allTransactions.find(t => t.userId === userId && t.eventId === eventId);

      if (!userTransaction) {
        return res.status(400).json({ error: "User has no transaction for this event" });
      }

      // Create winner record
      const winner = await storage.createWinner({
        transactionId: userTransaction.id,
        eventId: eventId,
        userId: userId,
      });

      res.json({ winner, transaction: userTransaction });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to nominate winner" });
    }
  });

  // Guest winner nomination by transactionId (Superadmin and QS Custom only)
  app.post("/api/winners/nominate-guest", requireAdmin, requireRole("superadmin", "qs_custom"), async (req, res) => {
    try {
      const { transactionId, eventId } = z.object({
        transactionId: z.string(),
        eventId: z.string()
      }).parse(req.body);

      // Check if transaction already nominated
      const allWinners = await storage.getAllWinners();
      const existingWinner = allWinners.find(w => w.transactionId === transactionId && w.eventId === eventId);

      if (existingWinner) {
        return res.status(400).json({ error: "Guest is already a winner for this event" });
      }

      // Verify transaction exists and belongs to this event
      const allTransactions = await storage.getAllTransactions();
      const transaction = allTransactions.find(t => t.id === transactionId && t.eventId === eventId);

      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found for this event" });
      }

      // Create winner record without userId (guest)
      const winner = await storage.createWinner({
        transactionId: transactionId,
        eventId: eventId,
        userId: null,
      });

      res.json({ winner, transaction });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to nominate guest winner" });
    }
  });

  // Cancel guest winner nomination by transactionId (Superadmin and QS Custom only)
  app.delete("/api/winners/transaction/:transactionId/:eventId", requireAdmin, requireRole("superadmin", "qs_custom"), async (req, res) => {
    try {
      const { transactionId, eventId } = req.params;

      const allWinners = await storage.getAllWinners();
      const winner = allWinners.find(w => w.transactionId === transactionId && w.eventId === eventId);

      if (!winner) {
        return res.status(404).json({ error: "Winner not found" });
      }

      const deleted = await storage.deleteWinner(winner.id);

      if (!deleted) {
        return res.status(500).json({ error: "Failed to delete winner" });
      }

      res.json({ success: true, message: "Guest winner nomination cancelled" });
    } catch (error) {
      res.status(500).json({ error: "Failed to cancel guest winner nomination" });
    }
  });

  // Cancel winner nomination (Superadmin and QS Custom only)
  app.delete("/api/winners/:userId/:eventId", requireAdmin, requireRole("superadmin", "qs_custom"), async (req, res) => {
    try {
      const { userId, eventId } = req.params;

      // Find the winner record
      const allWinners = await storage.getAllWinners();
      const winner = allWinners.find(w => w.userId === userId && w.eventId === eventId);

      if (!winner) {
        return res.status(404).json({ error: "Winner not found" });
      }

      // Delete the winner record
      const deleted = await storage.deleteWinner(winner.id);

      if (!deleted) {
        return res.status(500).json({ error: "Failed to delete winner" });
      }

      res.json({ success: true, message: "Winner nomination cancelled" });
    } catch (error) {
      res.status(500).json({ error: "Failed to cancel winner nomination" });
    }
  });

  // ── Manual Winner History API ──────────────────────────────────────────────
  // Public: anyone can read the manual history (shown on /history page)
  app.get("/api/manual-winner-history", async (_req, res) => {
    try {
      const history = await storage.getAllManualWinnerHistory();
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch manual winner history" });
    }
  });

  // Admin: create a new manual entry
  app.post("/api/manual-winner-history", requireAdmin, async (req, res) => {
    try {
      const entry = {
        winDate: new Date(req.body.winDate),
        phoneNumber: req.body.phoneNumber,
        displayName: req.body.displayName || null,
        amount: String(req.body.amount),
        eventName: req.body.eventName,
        displayOrder: parseInt(req.body.displayOrder ?? "0"),
      };
      const record = await storage.createManualWinnerHistory(entry);
      res.json(record);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to create entry" });
    }
  });

  // Admin: update a manual entry
  app.put("/api/manual-winner-history/:id", requireAdmin, async (req, res) => {
    try {
      const updateData: any = {};
      if (req.body.winDate) updateData.winDate = new Date(req.body.winDate);
      if (req.body.phoneNumber) updateData.phoneNumber = req.body.phoneNumber;
      if (req.body.displayName !== undefined) updateData.displayName = req.body.displayName || null;
      if (req.body.amount !== undefined) updateData.amount = String(req.body.amount);
      if (req.body.eventName) updateData.eventName = req.body.eventName;
      if (req.body.displayOrder !== undefined) updateData.displayOrder = parseInt(req.body.displayOrder);
      const record = await storage.updateManualWinnerHistory(req.params.id, updateData);
      if (!record) return res.status(404).json({ error: "Entry not found" });
      res.json(record);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to update entry" });
    }
  });

  // Admin: bulk create manual entries (from Excel/TXT upload)
  app.post("/api/manual-winner-history/bulk", requireAdmin, async (req, res) => {
    try {
      const rows: any[] = req.body.entries;
      if (!Array.isArray(rows) || rows.length === 0) {
        return res.status(400).json({ error: "Tidak ada data untuk disimpan" });
      }

      const entries = rows.map((r: any, idx: number) => ({
        winDate: new Date(r.winDate),
        phoneNumber: String(r.phoneNumber || "").trim(),
        displayName: r.displayName ? String(r.displayName).trim() : null,
        amount: String(r.amount || "").trim(),
        eventName: String(r.eventName || "").trim(),
        displayOrder: idx,
      }));

      // Basic validation
      const invalid = entries.filter(e => !e.phoneNumber || !e.amount || !e.eventName || isNaN(e.winDate.getTime()));
      if (invalid.length > 0) {
        return res.status(400).json({ error: `${invalid.length} baris tidak valid (telepon/hadiah/event/tanggal kosong)` });
      }

      const records = await storage.bulkCreateManualWinnerHistory(entries);
      res.json({ success: true, inserted: records.length });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Gagal menyimpan data bulk" });
    }
  });

  // Admin: delete ALL manual entries (reset)
  app.delete("/api/manual-winner-history", requireAdmin, async (_req, res) => {
    try {
      const count = await storage.deleteAllManualWinnerHistory();
      res.json({ success: true, deleted: count });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete all entries" });
    }
  });

  // Admin: delete a manual entry
  app.delete("/api/manual-winner-history/:id", requireAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteManualWinnerHistory(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Entry not found" });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete entry" });
    }
  });

  // App Settings API
  app.get("/api/app-settings", async (req, res) => {
    try {
      const settings = await storage.getAllSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch app settings" });
    }
  });

  app.post("/api/app-settings", requireAdmin, async (req, res) => {
    try {
      const { key, value } = req.body;

      if (!key || value === undefined) {
        return res.status(400).json({ error: "Key and value are required" });
      }

      // Update settings using the existing method
      await storage.updateSettings([{ key, value }]);

      // Fetch the updated setting
      const setting = await storage.getSetting(key);
      res.json(setting);
    } catch (error) {
      res.status(500).json({ error: "Failed to save app setting" });
    }
  });

  // Upload logo endpoint
  app.post("/api/upload-logo", requireAdmin, upload.single("logo"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const logoUrl = `/uploads/${req.file.filename}`;
      res.json({ logoUrl });
    } catch (error) {
      res.status(500).json({ error: "Failed to upload logo" });
    }
  });

  // Admin Management API (Only Superadmin)
  app.get("/api/admin/admins", requireAdmin, requireRole("superadmin"), async (req, res) => {
    try {
      const admins = await storage.getAllAdminUsers();
      // Don't send passwords to client
      const sanitized = admins.map(({ password, ...admin }) => admin);
      res.json(sanitized);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch admins" });
    }
  });

  app.post("/api/admin/admins", requireAdmin, requireRole("superadmin"), async (req, res) => {
    try {
      const { username, password, name, role, allowedIps, isActive } = req.body;

      console.log("Creating admin with data:", { username, name, role, allowedIps, isActive });

      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }

      // Check if username already exists
      const existingAdmin = await storage.getAdminUserByUsername(username);
      if (existingAdmin) {
        return res.status(400).json({ error: "Username already exists" });
      }

      const hashedPassword = await import('bcryptjs').then(bcrypt => bcrypt.hash(password, 10));

      const admin = await storage.createAdminUser({
        username,
        password: hashedPassword,
        name: name || null,
        role: role || "viewer",
        allowedIps: allowedIps || null,
        isActive: isActive !== undefined ? isActive : true,
      });

      const { password: _, ...sanitized } = admin;
      res.status(201).json(sanitized);
    } catch (error: any) {
      console.error("Failed to create admin:", error);
      res.status(500).json({ error: error.message || "Failed to create admin" });
    }
  });

  app.put("/api/admin/admins/:id", requireAdmin, requireRole("superadmin"), async (req, res) => {
    try {
      const { username, password, name, role, allowedIps, isActive } = req.body;

      console.log("Updating admin:", req.params.id, { username, name, role, allowedIps, isActive });

      // Check if username already exists (if changing username)
      if (username) {
        const existingAdmin = await storage.getAdminUserByUsername(username);
        if (existingAdmin && existingAdmin.id !== req.params.id) {
          return res.status(400).json({ error: "Username already exists" });
        }
      }

      const updateData: any = {
        username,
        name: name || null,
        role: role || "viewer",
        allowedIps: allowedIps || null,
        isActive: isActive !== undefined ? isActive : true,
      };

      if (password) {
        const hashedPassword = await import('bcryptjs').then(bcrypt => bcrypt.hash(password, 10));
        updateData.password = hashedPassword;
      }

      const admin = await storage.updateAdminUser(req.params.id, updateData);

      if (!admin) {
        return res.status(404).json({ error: "Admin not found" });
      }

      const { password: _, ...sanitized } = admin;
      res.json(sanitized);
    } catch (error: any) {
      console.error("Failed to update admin:", error);
      res.status(500).json({ error: error.message || "Failed to update admin" });
    }
  });

  app.delete("/api/admin/admins/:id", requireAdmin, requireRole("superadmin"), async (req, res) => {
    try {
      const deleted = await storage.deleteAdminUser(req.params.id);

      if (!deleted) {
        return res.status(404).json({ error: "Admin not found" });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete admin" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
