import {
  adminUsers,
  users,
  events,
  banners,
  transactions,
  winners,
  videos,
  partners,
  howItWorks,
  banks,
  appSettings,
  footerSettings,
  ipWhitelist,
  paymentMethods,
  pages,
  termsConditions,
  type AdminUser,
  type InsertAdminUser,
  type User,
  type InsertUser,
  type Event,
  type InsertEvent,
  type Banner,
  type InsertBanner,
  type Transaction,
  type InsertTransaction,
  type Winner,
  type InsertWinner,
  type Video,
  type InsertVideo,
  type Partner,
  type InsertPartner,
  type HowItWorks,
  type InsertHowItWorks,
  type Bank,
  type InsertBank,
  type AppSetting,
  type InsertAppSetting,
  type FooterSetting,
  type InsertFooterSetting,
  type IpWhitelist,
  type InsertIpWhitelist,
  type PaymentMethod,
  type InsertPaymentMethod,
  type Page,
  type InsertPage,
  type TermsCondition,
  type InsertTermsCondition,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import type { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // Admin Users
  async getAdminUser(id: string): Promise<AdminUser | undefined> {
    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.id, id));
    return user || undefined;
  }

  async getAdminUserByUsername(username: string): Promise<AdminUser | undefined> {
    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.username, username));
    return user || undefined;
  }

  async getAllAdminUsers(): Promise<AdminUser[]> {
    return await db.select().from(adminUsers).orderBy(desc(adminUsers.createdAt));
  }

  async createAdminUser(insertUser: InsertAdminUser): Promise<AdminUser> {
    const [user] = await db.insert(adminUsers).values(insertUser).returning();
    return user;
  }

  async updateAdminUser(id: string, updateData: Partial<InsertAdminUser>): Promise<AdminUser | undefined> {
    const [user] = await db.update(adminUsers)
      .set(updateData)
      .where(eq(adminUsers.id, id))
      .returning();
    return user || undefined;
  }

  async deleteAdminUser(id: string): Promise<boolean> {
    const result = await db.delete(adminUsers).where(eq(adminUsers.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getUserByPhoneNumber(phoneNumber: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phoneNumber, phoneNumber));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async deleteUser(id: string): Promise<boolean> {
    // Delete related records first (foreign key constraints)
    // 1. Delete winners for this user
    await db.delete(winners).where(eq(winners.userId, id));
    // 2. Delete transactions for this user
    await db.delete(transactions).where(eq(transactions.userId, id));
    // 3. Now delete the user
    const result = await db.delete(users).where(eq(users.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Events
  async getEvent(id: string): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event || undefined;
  }

  async getAllEvents(): Promise<Event[]> {
    return await db.select().from(events).orderBy(desc(events.createdAt));
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const [event] = await db.insert(events).values({
      ...insertEvent,
      status: insertEvent.status || "aktif",
      category: insertEvent.category || null,
    }).returning();
    return event;
  }

  async updateEvent(id: string, updateData: Partial<InsertEvent>): Promise<Event | undefined> {
    const [event] = await db.update(events).set(updateData).where(eq(events.id, id)).returning();
    return event || undefined;
  }

  async deleteEvent(id: string): Promise<boolean> {
    try {
      const result = await db.delete(events).where(eq(events.id, id));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error: any) {
      if (error.code === '23503') {
        throw new Error("Cannot delete event with existing transactions or winners");
      }
      throw error;
    }
  }

  // Banners
  async getAllBanners(): Promise<Banner[]> {
    return await db.select().from(banners).orderBy(banners.order);
  }

  async createBanner(insertBanner: InsertBanner): Promise<Banner> {
    const [banner] = await db.insert(banners).values({
      ...insertBanner,
      order: insertBanner.order || 0,
    }).returning();
    return banner;
  }

  async deleteBanner(id: string): Promise<boolean> {
    const result = await db.delete(banners).where(eq(banners.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Transactions
  async getAllTransactions(): Promise<Transaction[]> {
    return await db.select().from(transactions).orderBy(desc(transactions.createdAt));
  }

  async getTransactionsByUserId(userId: string): Promise<Transaction[]> {
    return await db.select().from(transactions).where(eq(transactions.userId, userId)).orderBy(desc(transactions.createdAt));
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
    return transaction || undefined;
  }

  async getTransactionByPaymentId(paymentId: string): Promise<Transaction | undefined> {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.paymentId, paymentId));
    return transaction || undefined;
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db.insert(transactions).values(insertTransaction).returning();
    return transaction;
  }

  async updateTransaction(id: string, data: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    const [transaction] = await db.update(transactions)
      .set(data)
      .where(eq(transactions.id, id))
      .returning();
    return transaction || undefined;
  }

  async deleteTransaction(id: string): Promise<boolean> {
    // First delete related winners
    await db.delete(winners).where(eq(winners.transactionId, id));
    // Then delete the transaction
    const result = await db.delete(transactions).where(eq(transactions.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Winners
  async getAllWinners(): Promise<Winner[]> {
    return await db.select().from(winners).orderBy(desc(winners.announcedAt));
  }

  async createWinner(insertWinner: InsertWinner): Promise<Winner> {
    const [winner] = await db.insert(winners).values(insertWinner).returning();
    return winner;
  }

  async deleteWinner(id: string): Promise<boolean> {
    const result = await db.delete(winners).where(eq(winners.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Videos
  async getAllVideos(): Promise<Video[]> {
    return await db.select().from(videos).orderBy(desc(videos.createdAt));
  }

  async createVideo(insertVideo: InsertVideo): Promise<Video> {
    const [video] = await db.insert(videos).values({
      ...insertVideo,
      type: insertVideo.type || "video",
      videoUrl: insertVideo.videoUrl || null,
      videoFile: insertVideo.videoFile || null,
      thumbnailUrl: insertVideo.thumbnailUrl || null,
      isLive: insertVideo.isLive || false,
      showOnHomepage: insertVideo.showOnHomepage || false,
      displayOrder: insertVideo.displayOrder || 0,
    }).returning();
    return video;
  }

  async updateVideo(id: string, updateData: Partial<InsertVideo>): Promise<Video | null> {
    const [video] = await db
      .update(videos)
      .set(updateData)
      .where(eq(videos.id, id))
      .returning();
    return video || null;
  }

  async deleteVideo(id: string): Promise<boolean> {
    const result = await db.delete(videos).where(eq(videos.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getHomepageVideos(): Promise<Video[]> {
    return await db
      .select()
      .from(videos)
      .where(eq(videos.showOnHomepage, true))
      .orderBy(videos.displayOrder)
      .limit(4);
  }

  // Partners
  async getAllPartners(): Promise<Partner[]> {
    return await db.select().from(partners).orderBy(partners.order);
  }

  async createPartner(insertPartner: InsertPartner): Promise<Partner> {
    const [partner] = await db.insert(partners).values({
      ...insertPartner,
      websiteUrl: insertPartner.websiteUrl || null,
      isActive: insertPartner.isActive ?? true,
    }).returning();
    return partner;
  }

  async updatePartner(id: string, updateData: Partial<InsertPartner>): Promise<Partner | undefined> {
    const [partner] = await db.update(partners).set(updateData).where(eq(partners.id, id)).returning();
    return partner || undefined;
  }

  async deletePartner(id: string): Promise<boolean> {
    const result = await db.delete(partners).where(eq(partners.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // How It Works
  async getAllHowItWorks(): Promise<HowItWorks[]> {
    return await db.select().from(howItWorks).orderBy(howItWorks.step);
  }

  async createHowItWorks(insertItem: InsertHowItWorks): Promise<HowItWorks> {
    const [item] = await db.insert(howItWorks).values({
      ...insertItem,
      iconUrl: insertItem.iconUrl || null,
      isActive: insertItem.isActive ?? true,
    }).returning();
    return item;
  }

  async updateHowItWorks(id: string, updateData: Partial<InsertHowItWorks>): Promise<HowItWorks | undefined> {
    const [item] = await db.update(howItWorks).set(updateData).where(eq(howItWorks.id, id)).returning();
    return item || undefined;
  }

  async deleteHowItWorks(id: string): Promise<boolean> {
    const result = await db.delete(howItWorks).where(eq(howItWorks.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Banks
  async getAllBanks(): Promise<Bank[]> {
    return await db.select().from(banks);
  }

  async createBank(insertBank: InsertBank): Promise<Bank> {
    const [bank] = await db.insert(banks).values({
      ...insertBank,
      logoUrl: insertBank.logoUrl || null,
      isActive: insertBank.isActive ?? true,
    }).returning();
    return bank;
  }

  async updateBank(id: string, updateData: Partial<InsertBank>): Promise<Bank | undefined> {
    const [bank] = await db.update(banks).set(updateData).where(eq(banks.id, id)).returning();
    return bank || undefined;
  }

  async deleteBank(id: string): Promise<boolean> {
    const result = await db.delete(banks).where(eq(banks.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // App Settings
  async getAllSettings(): Promise<AppSetting[]> {
    return await db.select().from(appSettings);
  }

  async getSetting(key: string): Promise<AppSetting | undefined> {
    const [setting] = await db.select().from(appSettings).where(eq(appSettings.key, key));
    return setting || undefined;
  }

  async updateSettings(settings: { key: string; value: string }[]): Promise<void> {
    for (const setting of settings) {
      const existing = await this.getSetting(setting.key);
      if (existing) {
        await db.update(appSettings).set({ value: setting.value, updatedAt: new Date() }).where(eq(appSettings.key, setting.key));
      } else {
        await db.insert(appSettings).values({ key: setting.key, value: setting.value });
      }
    }
  }

  // Footer Settings
  async getAllFooterSettings(): Promise<FooterSetting[]> {
    return await db.select().from(footerSettings);
  }

  async updateFooterSettings(settings: { key: string; value: string }[]): Promise<void> {
    for (const setting of settings) {
      const [existing] = await db.select().from(footerSettings).where(eq(footerSettings.key, setting.key));
      if (existing) {
        await db.update(footerSettings).set({ value: setting.value, updatedAt: new Date() }).where(eq(footerSettings.key, setting.key));
      } else {
        await db.insert(footerSettings).values({ key: setting.key, value: setting.value });
      }
    }
  }

  // IP Whitelist
  async getAllIpWhitelist(): Promise<IpWhitelist[]> {
    return await db.select().from(ipWhitelist).orderBy(desc(ipWhitelist.createdAt));
  }

  async createIpWhitelist(insertIp: InsertIpWhitelist): Promise<IpWhitelist> {
    const [ip] = await db.insert(ipWhitelist).values({
      ...insertIp,
      description: insertIp.description || null,
      isActive: insertIp.isActive ?? true,
    }).returning();
    return ip;
  }

  async deleteIpWhitelist(id: string): Promise<boolean> {
    const result = await db.delete(ipWhitelist).where(eq(ipWhitelist.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Payment Methods
  async getAllPaymentMethods(): Promise<PaymentMethod[]> {
    return await db.select().from(paymentMethods);
  }

  async createPaymentMethod(insertMethod: InsertPaymentMethod): Promise<PaymentMethod> {
    const [method] = await db.insert(paymentMethods).values({
      ...insertMethod,
      logoUrl: insertMethod.logoUrl || null,
      instructions: insertMethod.instructions || null,
      isActive: insertMethod.isActive ?? true,
    }).returning();
    return method;
  }

  async updatePaymentMethod(id: string, updateData: Partial<InsertPaymentMethod>): Promise<PaymentMethod | undefined> {
    const [method] = await db.update(paymentMethods).set(updateData).where(eq(paymentMethods.id, id)).returning();
    return method || undefined;
  }

  async deletePaymentMethod(id: string): Promise<boolean> {
    const result = await db.delete(paymentMethods).where(eq(paymentMethods.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Pages
  async getAllPages(): Promise<Page[]> {
    return await db.select().from(pages).orderBy(desc(pages.updatedAt));
  }

  async getPageBySlug(slug: string): Promise<Page | undefined> {
    const [page] = await db.select().from(pages).where(eq(pages.slug, slug));
    return page || undefined;
  }

  async createPage(insertPage: InsertPage): Promise<Page> {
    const [page] = await db.insert(pages).values({
      ...insertPage,
      isPublished: insertPage.isPublished ?? true,
    }).returning();
    return page;
  }

  async updatePage(id: string, updateData: Partial<InsertPage>): Promise<Page | undefined> {
    const [page] = await db.update(pages).set({ ...updateData, updatedAt: new Date() }).where(eq(pages.id, id)).returning();
    return page || undefined;
  }

  async deletePage(id: string): Promise<boolean> {
    const result = await db.delete(pages).where(eq(pages.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Terms & Conditions
  async getTermsConditionsByEventId(eventId: string): Promise<TermsCondition[]> {
    return await db
      .select()
      .from(termsConditions)
      .where(eq(termsConditions.eventId, eventId))
      .orderBy(termsConditions.order);
  }

  async getActiveTermsConditionsByEventId(eventId: string): Promise<TermsCondition[]> {
    return await db
      .select()
      .from(termsConditions)
      .where(eq(termsConditions.eventId, eventId))
      .where(eq(termsConditions.isActive, true))
      .orderBy(termsConditions.order);
  }

  async createTermsCondition(insertTermsCondition: InsertTermsCondition): Promise<TermsCondition> {
    const [termsCondition] = await db.insert(termsConditions).values({
      ...insertTermsCondition,
      order: insertTermsCondition.order || 0,
      isActive: insertTermsCondition.isActive ?? true,
    }).returning();
    return termsCondition;
  }

  async updateTermsCondition(id: string, updateData: Partial<InsertTermsCondition>): Promise<TermsCondition | null> {
    const [termsCondition] = await db
      .update(termsConditions)
      .set(updateData)
      .where(eq(termsConditions.id, id))
      .returning();
    return termsCondition || null;
  }

  async deleteTermsCondition(id: string): Promise<boolean> {
    const result = await db.delete(termsConditions).where(eq(termsConditions.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }
}
