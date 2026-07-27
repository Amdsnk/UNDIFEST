import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Admin Users
export const adminUsers = pgTable("admin_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  role: varchar("role", { length: 50 }).notNull().default("viewer"), // superadmin, qs_custom, viewer
  allowedIps: text("allowed_ips"), // JSON array of allowed IP addresses
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Events
export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  imageUrl: text("image_url").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(),
  ticketCount: integer("ticket_count").notNull(),
  ticketsReceived: integer("tickets_received").notNull().default(0),
  prize: text("prize").notNull(),
  hadiah: integer("hadiah").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  announcementDate: timestamp("announcement_date").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("aktif"),
  category: varchar("category", { length: 50 }).default("other"),
  cardTemplate: varchar("card_template", { length: 20 }), // Optional: 'burgerKing' | 'yamahaNmax'
  bannerHomepage: text("banner_homepage"),
  bannerUndian: text("banner_undian"),
  isRefundable: boolean("is_refundable").notNull().default(false),
  ebookFile: text("ebook_file"), // Path to uploaded E-book file
  ebookTitle: text("ebook_title"), // Title of the E-book
  // Dual undian fields
  hasMultipleUndian: boolean("has_multiple_undian").notNull().default(false),
  undianALabel: text("undian_a_label").default("Undian A"),
  undianBLabel: text("undian_b_label").default("Undian B"),
  undianAImage: text("undian_a_image"),
  undianBImage: text("undian_b_image"),
  undianAPaymentImage: text("undian_a_payment_image"),
  undianBPaymentImage: text("undian_b_payment_image"),
  allowCustomAmount: boolean("allow_custom_amount").notNull().default(false),
  // Recurring schedule fields
  scheduleType: varchar("schedule_type", { length: 20 }).default("none"), // none | daily | weekly | monthly
  scheduleTime: varchar("schedule_time", { length: 5 }), // HH:MM e.g. "19:00"
  scheduleDay: integer("schedule_day"), // 0-6 for weekly (Sun=0), 1-31 for monthly
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Banners
export const banners = pgTable("banners", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  imageUrl: text("image_url").notNull(),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Users (customers)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name"),
  phoneNumber: varchar("phone_number", { length: 20 }).notNull().unique(),
  city: text("city"),
  email: text("email"),
  bankName: text("bank_name"),
  accountNumber: text("account_number"),
  ip: varchar("ip", { length: 45 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Transactions
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id), // Made optional for guest checkout
  eventId: varchar("event_id").notNull().references(() => events.id),
  amount: integer("amount").notNull(),
  ticketCount: integer("ticket_count").notNull().default(1),
  phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
  eventName: text("event_name").notNull(),
  // Buyer information for lottery
  buyerName: varchar("buyer_name", { length: 255 }),
  buyerEmail: varchar("buyer_email", { length: 255 }),
  buyerBankName: varchar("buyer_bank_name", { length: 100 }),
  buyerAccountNumber: varchar("buyer_account_number", { length: 50 }),
  buyerIp: varchar("buyer_ip", { length: 45 }), // IP address at the time of transaction
  // Payment fields
  paymentStatus: varchar("payment_status", { length: 20 }).notNull().default("pending"), // pending, paid, failed, expired
  paymentId: varchar("payment_id", { length: 100 }), // iPaymu transaction ID
  paymentMethod: varchar("payment_method", { length: 50 }), // va_bca, qris, etc
  paymentChannel: varchar("payment_channel", { length: 50 }), // Bank BCA, Bank Mandiri, QRIS, OVO, dll
  paymentNumber: varchar("payment_number", { length: 100 }), // VA Number atau nomor rekening tujuan
  paymentUrl: text("payment_url"), // iPaymu payment URL
  paidAt: timestamp("paid_at"),
  waSentAt: timestamp("wa_sent_at"),
  undianType: varchar("undian_type", { length: 10 }), // "A" | "B" | null
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Winners
export const winners = pgTable("winners", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transactionId: varchar("transaction_id").notNull().references(() => transactions.id),
  eventId: varchar("event_id").notNull().references(() => events.id),
  userId: varchar("user_id").references(() => users.id),
  announcedAt: timestamp("announced_at").notNull().defaultNow(),
});

// Manual Winner History — admin-managed entries shown on the public /history page
export const manualWinnerHistory = pgTable("manual_winner_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  winDate: timestamp("win_date").notNull(),
  phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
  displayName: varchar("display_name", { length: 255 }),
  amount: varchar("amount", { length: 500 }).notNull(),
  eventName: text("event_name").notNull(),
  hasil: varchar("hasil", { length: 255 }),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Terms & Conditions
export const termsConditions = pgTable("terms_conditions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  order: integer("order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Videos
export const videos = pgTable("videos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  thumbnailUrl: text("thumbnail_url"), // Optional - auto-generated from video
  videoUrl: text("video_url"),
  videoFile: text("video_file"), // Path to uploaded video file
  type: varchar("type", { length: 20 }).notNull().default("video"),
  isLive: boolean("is_live").notNull().default(false),
  showOnHomepage: boolean("show_on_homepage").notNull().default(false), // Show on homepage
  displayOrder: integer("display_order").default(0), // Order for homepage display
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Partners
export const partners = pgTable("partners", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  logoUrl: text("logo_url").notNull(),
  websiteUrl: text("website_url"),
  order: integer("order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// How It Works
export const howItWorks = pgTable("how_it_works", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  step: integer("step").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  iconUrl: text("icon_url"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Footer Settings
export const footerSettings = pgTable("footer_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// App Settings
export const appSettings = pgTable("app_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// IP Whitelist
export const ipWhitelist = pgTable("ip_whitelist", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ipAddress: text("ip_address").notNull().unique(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Banks
export const banks = pgTable("banks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bankName: text("bank_name").notNull(),
  accountNumber: text("account_number").notNull(),
  accountName: text("account_name").notNull(),
  logoUrl: text("logo_url"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Payment Methods
export const paymentMethods = pgTable("payment_methods", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // bank_transfer, e-wallet, qris
  logoUrl: text("logo_url"),
  instructions: text("instructions"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Pages (for Privacy Policy, About Us, etc)
export const pages = pgTable("pages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  isPublished: boolean("is_published").notNull().default(true),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Relations
export const eventsRelations = relations(events, ({ many }) => ({
  transactions: many(transactions),
  winners: many(winners),
}));

export const usersRelations = relations(users, ({ many }) => ({
  transactions: many(transactions),
  winners: many(winners),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
  event: one(events, {
    fields: [transactions.eventId],
    references: [events.id],
  }),
  winner: one(winners, {
    fields: [transactions.id],
    references: [winners.transactionId],
  }),
}));

export const winnersRelations = relations(winners, ({ one }) => ({
  transaction: one(transactions, {
    fields: [winners.transactionId],
    references: [transactions.id],
  }),
  event: one(events, {
    fields: [winners.eventId],
    references: [events.id],
  }),
  user: one(users, {
    fields: [winners.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({
  id: true,
  createdAt: true,
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
  ticketsReceived: true,
}).extend({
  imageUrl: z.string().min(1, "Image URL is required"),
});

export const insertBannerSchema = createInsertSchema(banners).omit({
  id: true,
  createdAt: true,
}).extend({
  imageUrl: z.string().min(1, "Image URL is required"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export const insertWinnerSchema = createInsertSchema(winners).omit({
  id: true,
  announcedAt: true,
});

export const insertManualWinnerHistorySchema = createInsertSchema(manualWinnerHistory).omit({
  id: true,
  createdAt: true,
});

export const insertVideoSchema = createInsertSchema(videos).omit({
  id: true,
  createdAt: true,
});

export const updateVideoSchema = createInsertSchema(videos).omit({
  id: true,
  createdAt: true,
}).partial();

export const insertPartnerSchema = createInsertSchema(partners).omit({
  id: true,
  createdAt: true,
});

export const insertHowItWorksSchema = createInsertSchema(howItWorks).omit({
  id: true,
  createdAt: true,
});

export const insertFooterSettingSchema = createInsertSchema(footerSettings).omit({
  id: true,
  updatedAt: true,
});

export const insertAppSettingSchema = createInsertSchema(appSettings).omit({
  id: true,
  updatedAt: true,
});

export const insertIpWhitelistSchema = createInsertSchema(ipWhitelist).omit({
  id: true,
  createdAt: true,
});

export const insertBankSchema = createInsertSchema(banks).omit({
  id: true,
  createdAt: true,
});

export const insertPaymentMethodSchema = createInsertSchema(paymentMethods).omit({
  id: true,
  createdAt: true,
});

export const insertPageSchema = createInsertSchema(pages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTermsConditionSchema = createInsertSchema(termsConditions).omit({
  id: true,
  createdAt: true,
});

// Types
export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

export type Banner = typeof banners.$inferSelect;
export type InsertBanner = z.infer<typeof insertBannerSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type Winner = typeof winners.$inferSelect;
export type InsertWinner = z.infer<typeof insertWinnerSchema>;

export type Video = typeof videos.$inferSelect;
export type InsertVideo = z.infer<typeof insertVideoSchema>;

export type Partner = typeof partners.$inferSelect;
export type InsertPartner = z.infer<typeof insertPartnerSchema>;

export type HowItWorks = typeof howItWorks.$inferSelect;
export type InsertHowItWorks = z.infer<typeof insertHowItWorksSchema>;

export type FooterSetting = typeof footerSettings.$inferSelect;
export type InsertFooterSetting = z.infer<typeof insertFooterSettingSchema>;

export type AppSetting = typeof appSettings.$inferSelect;
export type InsertAppSetting = z.infer<typeof insertAppSettingSchema>;

export type IpWhitelist = typeof ipWhitelist.$inferSelect;
export type InsertIpWhitelist = z.infer<typeof insertIpWhitelistSchema>;

export type Bank = typeof banks.$inferSelect;
export type InsertBank = z.infer<typeof insertBankSchema>;

export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type InsertPaymentMethod = z.infer<typeof insertPaymentMethodSchema>;

export type Page = typeof pages.$inferSelect;
export type InsertPage = z.infer<typeof insertPageSchema>;

export type TermsCondition = typeof termsConditions.$inferSelect;
export type InsertTermsCondition = z.infer<typeof insertTermsConditionSchema>;

export type ManualWinnerHistory = typeof manualWinnerHistory.$inferSelect;
export type InsertManualWinnerHistory = z.infer<typeof insertManualWinnerHistorySchema>;
