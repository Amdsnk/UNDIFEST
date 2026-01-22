import type { Express } from "express";
import express, { type Request, type Response, type NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertEventSchema, insertBannerSchema, insertTransactionSchema, insertVideoSchema, insertPartnerSchema, insertHowItWorksSchema, insertBankSchema, insertIpWhitelistSchema, insertPaymentMethodSchema, insertPageSchema } from "@shared/schema";
import { comparePassword, generateToken, generateUserToken, requireAdmin, requireUser, requireRole, requireWrite, verifyUserToken } from "./auth";
import { createPayment, createDirectPayment, isIPaymuConfigured, getIPaymuConfig } from "./ipaymu";
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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve uploaded files
  app.use("/uploads", express.static(uploadDir));

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

  // Events API
  app.get("/api/events", async (req, res) => {
    try {
      const events = await storage.getAllEvents();
      // Public access: only show active events
      const publicEvents = events.filter(e => e.status === "aktif");
      res.json(publicEvents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  // Admin-only endpoint for all events
  app.get("/api/admin/events", requireAdmin, async (req, res) => {
    try {
      const events = await storage.getAllEvents();
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch events" });
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
    { name: "bannerUndian", maxCount: 1 }
  ]), async (req, res) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      // Convert uploaded files to base64 for permanent storage
      let bannerHomepageUrl = "";
      let bannerUndianUrl = "";

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
        imageUrl: bannerHomepageUrl || "https://via.placeholder.com/800x400",
        prize: `Hadiah Rp ${parseInt(req.body.hadiah || "1000000").toLocaleString("id-ID")}`,
        announcementDate: new Date(req.body.endDate),
        status: "aktif" as const,
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
    { name: "bannerUndian", maxCount: 1 }
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

  // Transactions API (admin - all transactions)
  app.get("/api/transactions", requireAdmin, async (req, res) => {
    try {
      const transactions = await storage.getAllTransactions();
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
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

      const updated = await storage.updateTransaction(id, {
        paymentStatus,
        paidAt: paymentStatus === "paid" ? new Date() : transaction.paidAt
      });

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

  // Create transaction (purchase event ticket) - with iPaymu payment
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

  app.post("/api/transactions", optionalAuth, async (req, res) => {
    try {
      // Get user info if authenticated, otherwise use guest info
      let userId: number | null = null;
      let phoneNumber = "Guest";
      let userName = "Guest Customer";
      let userEmail = "guest@undifest.com";

      if ((req as any).user) {
        userId = (req as any).user.userId;
        phoneNumber = (req as any).user.phoneNumber;

        // Get user info for payment
        const user = await storage.getUser(userId);
        if (user) {
          userName = user.name || "Customer";
          userEmail = user.email || `${phoneNumber}@undifest.com`;
        }
      }

      const { eventId, amount, eventName } = req.body;

      if (!eventId || !amount || !eventName) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Verify event exists and is active
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      if (event.status !== "aktif") {
        return res.status(400).json({ error: "Event is not active" });
      }

      // Create transaction with pending status (userId can be null for guests)
      const transaction = await storage.createTransaction({
        userId: userId || undefined,
        eventId,
        amount,
        phoneNumber,
        eventName,
        paymentStatus: "pending",
      });

      // Check if iPaymu is configured
      if (!isIPaymuConfigured()) {
        console.log("[Payment] iPaymu not configured, transaction created without payment");
        return res.status(201).json({
          ...transaction,
          message: "Transaction created (payment gateway not configured)",
        });
      }

      // Create payment request to iPaymu
      const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;

      try {
        const paymentResult = await createPayment({
          name: userName,
          phone: phoneNumber,
          email: userEmail,
          amount: amount,
          notifyUrl: `${baseUrl}/api/payments/callback`,
          returnUrl: `${baseUrl}/payment/success?trx=${transaction.id}`,
          cancelUrl: `${baseUrl}/payment/cancel?trx=${transaction.id}`,
          referenceId: transaction.id,
          product: eventName,
          qty: 1,
          price: amount,
          description: `Tiket ${eventName}`,
        });

        console.log("[Payment] iPaymu response:", paymentResult);

        if (paymentResult.Status === 200 && paymentResult.Data) {
          // Update transaction with payment info
          await storage.updateTransaction(transaction.id, {
            paymentId: paymentResult.Data.TransactionId.toString(),
            paymentUrl: paymentResult.Data.Url,
          });

          return res.status(201).json({
            ...transaction,
            paymentId: paymentResult.Data.TransactionId.toString(),
            paymentUrl: paymentResult.Data.Url,
          });
        } else {
          console.error("[Payment] iPaymu error:", paymentResult.Message);
          // Transaction created but payment failed - return transaction anyway
          return res.status(201).json({
            ...transaction,
            paymentError: paymentResult.Message || "Payment gateway error",
          });
        }
      } catch (paymentError) {
        console.error("[Payment] iPaymu exception:", paymentError);
        // Transaction created but payment failed
        return res.status(201).json({
          ...transaction,
          paymentError: "Failed to connect to payment gateway",
        });
      }
    } catch (error) {
      console.error("[Transaction] Error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create transaction" });
    }
  });

  // Direct Payment API endpoint
  app.post("/api/transactions/direct", optionalAuth, async (req, res) => {
    try {
      // Get user info if authenticated, otherwise create guest user
      let userId: string;
      let phoneNumber = "081234567890"; // Default guest phone number (valid format for iPaymu)
      let userName = "Guest Customer";
      let userEmail = "guest@undifest.com";

      if ((req as any).user) {
        userId = (req as any).user.userId;
        phoneNumber = (req as any).user.phoneNumber;

        // Get user info for payment
        const user = await storage.getUser(userId);
        if (user) {
          userName = user.name || "Customer";
          userEmail = user.email || `${phoneNumber}@undifest.com`;
        }
      } else {
        // Create or get guest user for this transaction
        // Use a valid phone number format for iPaymu API
        const guestPhoneNumber = "081234567890";
        let guestUser = await storage.getUserByPhoneNumber(guestPhoneNumber);
        if (!guestUser) {
          guestUser = await storage.createUser({
            phoneNumber: guestPhoneNumber,
            name: "Guest Customer",
            email: "guest@undifest.com"
          });
        }
        userId = guestUser.id;
        phoneNumber = guestPhoneNumber;
      }

      const { eventId, amount, eventName, paymentMethod, paymentChannel, buyerName, buyerPhone, buyerEmail } = req.body;

      // Use buyer data if provided (for lottery purposes)
      if (buyerName) {
        userName = buyerName;
      }
      if (buyerPhone) {
        phoneNumber = buyerPhone;
      }
      if (buyerEmail) {
        userEmail = buyerEmail;
      }

      if (!eventId || !amount || !eventName || !paymentMethod || !paymentChannel) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Validate payment method
      if (!['va', 'qris', 'cstore', 'directdebit'].includes(paymentMethod)) {
        return res.status(400).json({ error: "Invalid payment method" });
      }

      // Verify event exists and is active
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      if (event.status !== "aktif") {
        return res.status(400).json({ error: "Event is not active" });
      }

      // Create transaction with pending status and buyer data
      const transaction = await storage.createTransaction({
        userId,
        eventId,
        amount,
        phoneNumber,
        eventName,
        buyerName: buyerName || null,
        buyerEmail: buyerEmail || null,
        paymentStatus: "pending",
        paymentMethod,
        paymentChannel,
      });

      // Check if iPaymu is configured
      if (!isIPaymuConfigured()) {
        console.log("[Direct Payment] iPaymu not configured, transaction created without payment");
        return res.status(201).json({
          ...transaction,
          message: "Transaction created (payment gateway not configured)",
        });
      }

      // Create direct payment request to iPaymu
      const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;

      try {
        const paymentResult = await createDirectPayment({
          name: userName,
          phone: phoneNumber,
          email: userEmail,
          amount: amount,
          notifyUrl: `${baseUrl}/api/payments/callback`,
          returnUrl: `${baseUrl}/payment/success?trx=${transaction.id}`,
          cancelUrl: `${baseUrl}/payment/cancel?trx=${transaction.id}`,
          referenceId: transaction.id,
          product: eventName,
          qty: 1,
          price: amount,
          description: `Tiket ${eventName}`,
          paymentMethod: paymentMethod,
          paymentChannel: paymentChannel,
        });

        console.log("[Direct Payment] iPaymu response:", paymentResult);

        if (paymentResult.Status === 200 && paymentResult.Data) {
          // Update transaction with payment info
          await storage.updateTransaction(transaction.id, {
            paymentId: paymentResult.Data.TransactionId.toString(),
            paymentNumber: paymentResult.Data.PaymentNo,
          });

          return res.status(201).json({
            ...transaction,
            paymentId: paymentResult.Data.TransactionId.toString(),
            paymentNo: paymentResult.Data.PaymentNo,
            paymentName: paymentResult.Data.PaymentName,
            total: paymentResult.Data.Total,
            fee: paymentResult.Data.Fee,
            expired: paymentResult.Data.Expired,
            qrImage: paymentResult.Data.QrImage,
            via: paymentResult.Data.Via,
            channel: paymentResult.Data.Channel,
          });
        } else {
          console.error("[Direct Payment] iPaymu error:", paymentResult.Message);
          // Transaction created but payment failed - return transaction anyway
          return res.status(201).json({
            ...transaction,
            paymentError: paymentResult.Message || "Payment gateway error",
          });
        }
      } catch (paymentError) {
        console.error("[Direct Payment] iPaymu exception:", paymentError);
        // Transaction created but payment failed
        return res.status(201).json({
          ...transaction,
          paymentError: "Failed to connect to payment gateway",
        });
      }
    } catch (error) {
      console.error("[Direct Payment] Error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create direct payment" });
    }
  });

  // Payment callback from iPaymu
  app.post("/api/payments/callback", async (req, res) => {
    try {
      console.log("[Payment Callback] Received:", req.body);

      const { trx_id, status, reference_id, status_code, via, channel, payment_no, payment_channel } = req.body;

      if (!reference_id) {
        console.error("[Payment Callback] Missing reference_id");
        return res.status(400).json({ error: "Missing reference_id" });
      }

      // Find transaction by reference_id (our transaction ID)
      const transaction = await storage.getTransaction(reference_id);
      if (!transaction) {
        console.error("[Payment Callback] Transaction not found:", reference_id);
        return res.status(404).json({ error: "Transaction not found" });
      }

      // Update transaction based on payment status
      // iPaymu status: 1 = pending, 2 = berhasil, 3 = expired, 4 = gagal
      let paymentStatus = "pending";
      if (status_code === 2 || status === "berhasil") {
        paymentStatus = "paid";
      } else if (status_code === 3 || status === "expired") {
        paymentStatus = "expired";
      } else if (status_code === 4 || status === "gagal") {
        paymentStatus = "failed";
      }

      // Extract payment channel and payment number from callback
      // iPaymu sends: via (payment method), channel (bank name), payment_no (VA number)
      const paymentChannel = payment_channel || channel || via || null;
      const paymentNumber = payment_no || null;

      await storage.updateTransaction(transaction.id, {
        paymentStatus,
        paymentId: trx_id?.toString(),
        paymentMethod: via || transaction.paymentMethod,
        paymentChannel: paymentChannel,
        paymentNumber: paymentNumber,
        paidAt: paymentStatus === "paid" ? new Date() : undefined,
      });

      console.log("[Payment Callback] Transaction updated:", transaction.id, "Status:", paymentStatus, "Channel:", paymentChannel, "Number:", paymentNumber);

      res.json({ success: true });
    } catch (error) {
      console.error("[Payment Callback] Error:", error);
      res.status(500).json({ error: "Callback processing failed" });
    }
  });

  // Check payment status
  app.get("/api/payments/status/:transactionId", requireUser, async (req, res) => {
    try {
      const { transactionId } = req.params;
      const userId = (req as any).user.userId;

      const transaction = await storage.getTransaction(transactionId);
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      // Verify user owns this transaction
      if (transaction.userId !== userId) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      res.json({
        id: transaction.id,
        paymentStatus: transaction.paymentStatus,
        paymentUrl: transaction.paymentUrl,
        paidAt: transaction.paidAt,
      });
    } catch (error) {
      console.error("[Payment Status] Error:", error);
      res.status(500).json({ error: "Failed to get payment status" });
    }
  });

  // Get iPaymu config status (admin only)
  app.get("/api/admin/payment-config", requireAdmin, async (req, res) => {
    res.json(getIPaymuConfig());
  });

  // Videos API (public for live page display)
  app.get("/api/videos", async (req, res) => {
    try {
      const videos = await storage.getAllVideos();
      res.json(videos);
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

  // Partners API (public for display on user-facing pages)
  app.get("/api/partners", async (req, res) => {
    try {
      const partners = await storage.getAllPartners();
      // Only show active partners
      const activePartners = partners.filter(p => p.isActive);
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
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update settings" });
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

  // Function to send OTP via WhatsApp using Fonnte API
  async function sendWhatsAppOTP(phoneNumber: string, otp: string): Promise<boolean> {
    const FONNTE_TOKEN = process.env.FONNTE_API_TOKEN;

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

      const response = await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: {
          'Authorization': FONNTE_TOKEN,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target: formattedPhone,
          message: message,
          countryCode: '62',
        }),
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

      const isDevelopment = process.env.NODE_ENV === "development";
      const hasFonnteToken = !!process.env.FONNTE_API_TOKEN;

      // In production with Fonnte configured: Send OTP via WhatsApp
      if (!isDevelopment && hasFonnteToken) {
        const sent = await sendWhatsAppOTP(phoneNumber, otp);
        if (!sent) {
          console.error(`[OTP] Failed to send WhatsApp OTP to ${phoneNumber}`);
          // Still allow login but log the error
        }
        console.log(`[OTP] Production mode - OTP sent via WhatsApp to ${phoneNumber}`);
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
      let user = await storage.getUserByPhoneNumber(phoneNumber);
      if (!user) {
        user = await storage.createUser({ phoneNumber });
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
      const winnersWithDetails = winners.map(winner => ({
        ...winner,
        transaction: transactions.find(t => t.id === winner.transactionId),
        user: users.find(u => u.id === winner.userId),
        event: events.find(e => e.id === winner.eventId),
      }));

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
