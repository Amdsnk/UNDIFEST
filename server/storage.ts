import {
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
  type AdminUser,
  type InsertAdminUser,
  type ManualWinnerHistory,
  type InsertManualWinnerHistory,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Admin Users
  getAdminUser(id: string): Promise<AdminUser | undefined>;
  getAdminUserByUsername(username: string): Promise<AdminUser | undefined>;
  getAllAdminUsers(): Promise<AdminUser[]>;
  createAdminUser(user: InsertAdminUser): Promise<AdminUser>;
  updateAdminUser(id: string, user: Partial<InsertAdminUser>): Promise<AdminUser | undefined>;
  deleteAdminUser(id: string): Promise<boolean>;

  // Users
  getUser(id: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getUserByPhoneNumber(phoneNumber: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updateData: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;

  // Events
  getEvent(id: string): Promise<Event | undefined>;
  getAllEvents(): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: string, event: Partial<InsertEvent>): Promise<Event | undefined>;
  incrementEventTickets(eventId: string, count?: number): Promise<void>;
  deleteEvent(id: string): Promise<boolean>;

  // Banners
  getAllBanners(): Promise<Banner[]>;
  createBanner(banner: InsertBanner): Promise<Banner>;
  deleteBanner(id: string): Promise<boolean>;

  // Transactions
  getAllTransactions(): Promise<Transaction[]>;
  getTransactionsByUserId(userId: string): Promise<Transaction[]>;
  getTransaction(id: string): Promise<Transaction | undefined>;
  getTransactionByPaymentId(paymentId: string): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: string, data: Partial<InsertTransaction>): Promise<Transaction | undefined>;
  deleteTransaction(id: string): Promise<boolean>;

  // Winners
  getAllWinners(): Promise<Winner[]>;
  createWinner(winner: InsertWinner): Promise<Winner>;
  deleteWinner(id: string): Promise<boolean>;

  // Videos
  getAllVideos(): Promise<Video[]>;
  getVideoById(id: string): Promise<Video | null>;
  getHomepageVideos(): Promise<Video[]>;
  createVideo(video: InsertVideo): Promise<Video>;
  updateVideo(id: string, video: Partial<InsertVideo>): Promise<Video | null>;
  deleteVideo(id: string): Promise<boolean>;

  // Partners
  getAllPartners(): Promise<Partner[]>;
  createPartner(partner: InsertPartner): Promise<Partner>;
  updatePartner(id: string, partner: Partial<InsertPartner>): Promise<Partner | undefined>;
  deletePartner(id: string): Promise<boolean>;

  // How It Works
  getAllHowItWorks(): Promise<HowItWorks[]>;
  createHowItWorks(item: InsertHowItWorks): Promise<HowItWorks>;
  updateHowItWorks(id: string, item: Partial<InsertHowItWorks>): Promise<HowItWorks | undefined>;
  deleteHowItWorks(id: string): Promise<boolean>;

  // Banks
  getAllBanks(): Promise<Bank[]>;
  createBank(bank: InsertBank): Promise<Bank>;
  updateBank(id: string, bank: Partial<InsertBank>): Promise<Bank | undefined>;
  deleteBank(id: string): Promise<boolean>;

  // App Settings
  getAllSettings(): Promise<AppSetting[]>;
  getSetting(key: string): Promise<AppSetting | undefined>;
  updateSettings(settings: { key: string; value: string }[]): Promise<void>;

  // Footer Settings
  getAllFooterSettings(): Promise<FooterSetting[]>;
  updateFooterSettings(settings: { key: string; value: string }[]): Promise<void>;

  // IP Whitelist
  getAllIpWhitelist(): Promise<IpWhitelist[]>;
  createIpWhitelist(ip: InsertIpWhitelist): Promise<IpWhitelist>;
  deleteIpWhitelist(id: string): Promise<boolean>;

  // Payment Methods
  getAllPaymentMethods(): Promise<PaymentMethod[]>;
  createPaymentMethod(method: InsertPaymentMethod): Promise<PaymentMethod>;
  updatePaymentMethod(id: string, method: Partial<InsertPaymentMethod>): Promise<PaymentMethod | undefined>;
  deletePaymentMethod(id: string): Promise<boolean>;

  // Pages
  getAllPages(): Promise<Page[]>;
  getPageBySlug(slug: string): Promise<Page | undefined>;
  createPage(page: InsertPage): Promise<Page>;
  updatePage(id: string, page: Partial<InsertPage>): Promise<Page | undefined>;
  deletePage(id: string): Promise<boolean>;

  // Manual Winner History
  getAllManualWinnerHistory(): Promise<ManualWinnerHistory[]>;
  createManualWinnerHistory(entry: InsertManualWinnerHistory): Promise<ManualWinnerHistory>;
  bulkCreateManualWinnerHistory(entries: InsertManualWinnerHistory[]): Promise<ManualWinnerHistory[]>;
  updateManualWinnerHistory(id: string, entry: Partial<InsertManualWinnerHistory>): Promise<ManualWinnerHistory | undefined>;
  deleteManualWinnerHistory(id: string): Promise<boolean>;
  deleteAllManualWinnerHistory(): Promise<number>;
}

export class MemStorage implements IStorage {
  private adminUsers: Map<string, AdminUser>;
  private users: Map<string, User>;
  private events: Map<string, Event>;
  private banners: Map<string, Banner>;
  private transactions: Map<string, Transaction>;
  private winners: Map<string, Winner>;
  private videos: Map<string, Video>;
  private partners: Map<string, Partner>;

  constructor() {
    this.adminUsers = new Map();
    this.users = new Map();
    this.events = new Map();
    this.banners = new Map();
    this.transactions = new Map();
    this.winners = new Map();
    this.videos = new Map();
    this.partners = new Map();
  }

  // Admin Users
  async getAdminUser(id: string): Promise<AdminUser | undefined> {
    return this.adminUsers.get(id);
  }

  async getAdminUserByUsername(username: string): Promise<AdminUser | undefined> {
    return Array.from(this.adminUsers.values()).find(
      (user) => user.username === username
    );
  }

  async createAdminUser(insertUser: InsertAdminUser): Promise<AdminUser> {
    const id = randomUUID();
    const user: AdminUser = {
      ...insertUser,
      id,
      createdAt: new Date(),
    };
    this.adminUsers.set(id, user);
    return user;
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async getUserByPhoneNumber(phoneNumber: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.phoneNumber === phoneNumber
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      name: insertUser.name || null,
      city: insertUser.city || null,
      email: insertUser.email || null,
      bankName: insertUser.bankName || null,
      accountNumber: insertUser.accountNumber || null,
      ip: insertUser.ip || null,
      isActive: insertUser.isActive ?? true,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated: User = { ...user, ...updateData };
    this.users.set(id, updated);
    return updated;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  // Events
  async getEvent(id: string): Promise<Event | undefined> {
    return this.events.get(id);
  }

  async getAllEvents(): Promise<Event[]> {
    return Array.from(this.events.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const id = randomUUID();
    const event: Event = {
      ...insertEvent,
      id,
      status: insertEvent.status || "aktif",
      category: insertEvent.category || null,
      cardTemplate: insertEvent.cardTemplate || null,
      ticketsReceived: 0,
      createdAt: new Date(),
    };
    this.events.set(id, event);
    return event;
  }

  async updateEvent(id: string, updateData: Partial<InsertEvent>): Promise<Event | undefined> {
    const event = this.events.get(id);
    if (!event) return undefined;

    const updated = { ...event, ...updateData };
    this.events.set(id, updated);
    return updated;
  }

  async incrementEventTickets(eventId: string, count: number = 1): Promise<void> {
    const event = this.events.get(eventId);
    if (event) {
      this.events.set(eventId, { ...event, ticketsReceived: event.ticketsReceived + count });
    }
  }

  async deleteEvent(id: string): Promise<boolean> {
    return this.events.delete(id);
  }

  // Banners
  async getAllBanners(): Promise<Banner[]> {
    return Array.from(this.banners.values()).sort((a, b) => a.order - b.order);
  }

  async createBanner(insertBanner: InsertBanner): Promise<Banner> {
    const id = randomUUID();
    const banner: Banner = {
      ...insertBanner,
      id,
      order: insertBanner.order || 0,
      createdAt: new Date(),
    };
    this.banners.set(id, banner);
    return banner;
  }

  async deleteBanner(id: string): Promise<boolean> {
    return this.banners.delete(id);
  }

  // Transactions
  async getAllTransactions(): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async getTransactionsByUserId(userId: string): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter((t) => t.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async getTransactionByPaymentId(paymentId: string): Promise<Transaction | undefined> {
    return Array.from(this.transactions.values()).find(t => t.paymentId === paymentId);
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = randomUUID();
    const transaction: Transaction = {
      ...insertTransaction,
      id,
      ticketCount: insertTransaction.ticketCount || 1,
      paymentStatus: insertTransaction.paymentStatus || "pending",
      paymentId: insertTransaction.paymentId || null,
      paymentMethod: insertTransaction.paymentMethod || null,
      paymentChannel: insertTransaction.paymentChannel || null,
      paymentNumber: insertTransaction.paymentNumber || null,
      paymentUrl: insertTransaction.paymentUrl || null,
      paidAt: insertTransaction.paidAt || null,
      waSentAt: insertTransaction.waSentAt || null,
      createdAt: new Date(),
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async updateTransaction(id: string, data: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    const transaction = this.transactions.get(id);
    if (!transaction) return undefined;
    const updated: Transaction = { ...transaction, ...data };
    this.transactions.set(id, updated);
    return updated;
  }

  async deleteTransaction(id: string): Promise<boolean> {
    return this.transactions.delete(id);
  }

  // Winners
  async getAllWinners(): Promise<Winner[]> {
    return Array.from(this.winners.values()).sort(
      (a, b) => b.announcedAt.getTime() - a.announcedAt.getTime()
    );
  }

  async createWinner(insertWinner: InsertWinner): Promise<Winner> {
    const id = randomUUID();
    const winner: Winner = {
      ...insertWinner,
      id,
      announcedAt: new Date(),
    };
    this.winners.set(id, winner);
    return winner;
  }

  async deleteWinner(id: string): Promise<boolean> {
    return this.winners.delete(id);
  }

  // Videos
  async getAllVideos(): Promise<Video[]> {
    return Array.from(this.videos.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async getVideoById(id: string): Promise<Video | null> {
    return this.videos.get(id) || null;
  }

  async getHomepageVideos(): Promise<Video[]> {
    return Array.from(this.videos.values())
      .filter(video => video.showOnHomepage)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
      .slice(0, 4); // Limit to 4 videos
  }

  async createVideo(insertVideo: InsertVideo): Promise<Video> {
    const id = randomUUID();
    const video: Video = {
      ...insertVideo,
      id,
      type: insertVideo.type || "video",
      videoUrl: insertVideo.videoUrl || null,
      videoFile: insertVideo.videoFile || null,
      isLive: insertVideo.isLive || false,
      showOnHomepage: insertVideo.showOnHomepage || false,
      displayOrder: insertVideo.displayOrder || 0,
      createdAt: new Date(),
    };
    this.videos.set(id, video);
    return video;
  }

  async updateVideo(id: string, updateData: Partial<InsertVideo>): Promise<Video | null> {
    const video = this.videos.get(id);
    if (!video) {
      return null;
    }

    const updatedVideo: Video = {
      ...video,
      ...updateData,
    };

    this.videos.set(id, updatedVideo);
    return updatedVideo;
  }

  async deleteVideo(id: string): Promise<boolean> {
    return this.videos.delete(id);
  }

  // Partners
  async getAllPartners(): Promise<Partner[]> {
    return Array.from(this.partners.values()).sort(
      (a, b) => a.order - b.order
    );
  }

  async createPartner(insertPartner: InsertPartner): Promise<Partner> {
    const id = randomUUID();
    const partner: Partner = {
      ...insertPartner,
      id,
      websiteUrl: insertPartner.websiteUrl || null,
      isActive: insertPartner.isActive ?? true,
      createdAt: new Date(),
    };
    this.partners.set(id, partner);
    return partner;
  }

  async updatePartner(id: string, updateData: Partial<InsertPartner>): Promise<Partner | undefined> {
    const partner = this.partners.get(id);
    if (!partner) return undefined;

    const updated: Partner = {
      ...partner,
      ...updateData,
    };
    this.partners.set(id, updated);
    return updated;
  }

  async deletePartner(id: string): Promise<boolean> {
    return this.partners.delete(id);
  }

  // Manual Winner History (MemStorage stubs — DB version in DatabaseStorage)
  async getAllManualWinnerHistory(): Promise<ManualWinnerHistory[]> { return []; }
  async createManualWinnerHistory(entry: InsertManualWinnerHistory): Promise<ManualWinnerHistory> {
    const record = { ...entry, id: randomUUID(), createdAt: new Date() } as ManualWinnerHistory;
    return record;
  }
  async bulkCreateManualWinnerHistory(entries: InsertManualWinnerHistory[]): Promise<ManualWinnerHistory[]> {
    return entries.map(e => ({ ...e, id: randomUUID(), createdAt: new Date() }) as ManualWinnerHistory);
  }
  async updateManualWinnerHistory(_id: string, _entry: Partial<InsertManualWinnerHistory>): Promise<ManualWinnerHistory | undefined> { return undefined; }
  async deleteManualWinnerHistory(_id: string): Promise<boolean> { return false; }
  async deleteAllManualWinnerHistory(): Promise<number> { return 0; }
}

// Use database storage instead of in-memory
import { DatabaseStorage } from "./db-storage";
export const storage = new DatabaseStorage();
