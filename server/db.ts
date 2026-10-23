import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: 'user' | 'admin';
  emailVerified: boolean;
  verificationToken?: string;
  resetToken?: string;
  resetTokenExpires?: number;
  createdAt: string;
  updatedAt: string;
}

export type PlanTier = 'free' | 'pro' | 'premium';

export interface Subscription {
  id: string;
  userId: string;
  plan: PlanTier;
  status: 'active' | 'cancelled' | 'past_due' | 'trialing';
  provider: 'lemon_squeezy' | 'paddle' | 'manual';
  customerId?: string;
  subscriptionId?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DailyUsageRecord {
  id: string;
  identifier: string; // userId or anonymous IP
  dateUtc: string;     // YYYY-MM-DD
  count: number;
  limit: number;
  resetsAtUtc: string; // ISO string of 00:00:00 UTC next day
  updatedAt: string;
}

export interface SlugHistoryItem {
  id: string;
  userId: string;
  title: string;
  slug: string;
  mode: 'single' | 'batch';
  wordCount: number;
  charCount: number;
  options: {
    separator: '-' | '_';
    lowercase: boolean;
    removeSpecialChars: boolean;
  };
  createdAt: string;
}

export interface ApiKeyRecord {
  id: string;
  userId: string;
  name: string;
  keyPrefix: string;  // e.g. "sk_live_abc12"
  keyHash: string;    // SHA-256 hash of full key
  rateLimitPerMin: number;
  lastUsedAt?: string;
  createdAt: string;
  status: 'active' | 'revoked';
}

export interface AnalyticsEvent {
  id: string;
  eventType: 'pageview' | 'slug_generated' | 'slug_copied' | 'url_copied' | 'csv_exported' | 'upgrade_clicked' | 'ai_chat';
  path: string;
  visitorId: string;
  userId?: string;
  country?: string;
  durationSeconds?: number;
  meta?: Record<string, any>;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  adminUserId: string;
  adminEmail: string;
  action: string;
  targetType: 'user' | 'subscription' | 'quota' | 'system';
  targetId?: string;
  details: Record<string, any>;
  createdAt: string;
}

export interface WebhookEvent {
  id: string;
  eventId: string;
  provider: string;
  eventName: string;
  processedAt: string;
  payload: any;
}

interface DatabaseSchema {
  users: User[];
  subscriptions: Subscription[];
  dailyUsage: DailyUsageRecord[];
  slugHistory: SlugHistoryItem[];
  apiKeys: ApiKeyRecord[];
  analyticsEvents: AnalyticsEvent[];
  auditLogs: AuditLog[];
  webhookEvents: WebhookEvent[];
}

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'slugify_pro.db.json');
const DB_TEMP = path.join(DB_DIR, 'slugify_pro.db.json.tmp');

class Database {
  private data: DatabaseSchema;
  private isWriting = false;

  constructor() {
    this.ensureDirectory();
    this.data = this.loadData();
    this.seedDefaultAdmin();
  }

  private ensureDirectory() {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
  }

  private loadData(): DatabaseSchema {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          users: parsed.users || [],
          subscriptions: parsed.subscriptions || [],
          dailyUsage: parsed.dailyUsage || [],
          slugHistory: parsed.slugHistory || [],
          apiKeys: parsed.apiKeys || [],
          analyticsEvents: parsed.analyticsEvents || [],
          auditLogs: parsed.auditLogs || [],
          webhookEvents: parsed.webhookEvents || [],
        };
      } catch (err) {
        console.error('Failed to parse database file, initializing fresh schema', err);
      }
    }

    return {
      users: [],
      subscriptions: [],
      dailyUsage: [],
      slugHistory: [],
      apiKeys: [],
      analyticsEvents: [],
      auditLogs: [],
      webhookEvents: [],
    };
  }

  private persist() {
    if (this.isWriting) return;
    this.isWriting = true;
    try {
      this.ensureDirectory();
      const content = JSON.stringify(this.data, null, 2);
      fs.writeFileSync(DB_TEMP, content, 'utf-8');
      fs.renameSync(DB_TEMP, DB_FILE);
    } catch (err) {
      console.error('Atomic write to database failed:', err);
    } finally {
      this.isWriting = false;
    }
  }

  private seedDefaultAdmin() {
    const adminEmail = (process.env.ADMIN_EMAIL || 'huzaifaahmedary@gmail.com').trim().toLowerCase();
    let existing = this.data.users.find(u => u.email.toLowerCase() === adminEmail);
    const envResetPassword = process.env.ADMIN_RESET_PASSWORD || process.env.ADMIN_PASSWORD;

    if (!existing) {
      const adminId = 'usr_admin_' + crypto.randomBytes(6).toString('hex');
      const salt = bcrypt.genSaltSync(10);
      const initialPass = envResetPassword || process.env.ADMIN_INITIAL_PASSWORD || 'Admin@Slugify2026';
      const passwordHash = bcrypt.hashSync(initialPass, salt);
      
      const adminUser: User = {
        id: adminId,
        email: adminEmail,
        passwordHash,
        name: 'Administrator',
        role: 'admin',
        emailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.data.users.push(adminUser);

      // Create lifetime Premium subscription for admin
      this.data.subscriptions.push({
        id: 'sub_admin_' + crypto.randomBytes(6).toString('hex'),
        userId: adminId,
        plan: 'premium',
        status: 'active',
        provider: 'manual',
        customerId: 'admin_sys',
        subscriptionId: 'sub_lifetime_admin',
        currentPeriodEnd: new Date(Date.now() + 100 * 365 * 24 * 3600 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      this.persist();
      console.log(`[DB] Seeded initial admin account: ${adminEmail} (Role: admin, Plan: premium)`);
    } else {
      let changed = false;
      if (existing.role !== 'admin') {
        existing.role = 'admin';
        changed = true;
      }
      if (!existing.emailVerified) {
        existing.emailVerified = true;
        changed = true;
      }

      // If owner provided ADMIN_RESET_PASSWORD or ADMIN_PASSWORD via environment, apply it immediately
      if (envResetPassword) {
        const isAlreadyMatch = bcrypt.compareSync(envResetPassword, existing.passwordHash);
        if (!isAlreadyMatch) {
          const salt = bcrypt.genSaltSync(10);
          existing.passwordHash = bcrypt.hashSync(envResetPassword, salt);
          existing.updatedAt = new Date().toISOString();
          changed = true;
          console.log(`[DB] Admin password updated from environment variable for ${adminEmail}`);
        }
      }

      // Ensure lifetime Premium subscription exists
      const existingSub = this.data.subscriptions.find(s => s.userId === existing!.id);
      if (!existingSub) {
        this.data.subscriptions.push({
          id: 'sub_admin_' + crypto.randomBytes(6).toString('hex'),
          userId: existing.id,
          plan: 'premium',
          status: 'active',
          provider: 'manual',
          customerId: 'admin_sys',
          subscriptionId: 'sub_lifetime_admin',
          currentPeriodEnd: new Date(Date.now() + 100 * 365 * 24 * 3600 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        changed = true;
      } else if (existingSub.plan !== 'premium' || existingSub.status !== 'active') {
        existingSub.plan = 'premium';
        existingSub.status = 'active';
        changed = true;
      }

      if (changed) {
        this.persist();
      }
    }
  }

  /**
   * Reset or create the administrator account with securely hashed password
   */
  public resetAdminPassword(email: string, plainPassword: string): User {
    if (!plainPassword || typeof plainPassword !== 'string' || plainPassword.length < 8) {
      throw new Error('Admin password must be at least 8 characters long for security.');
    }
    const cleanEmail = email.trim().toLowerCase();
    let user = this.findUserByEmail(cleanEmail);
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(plainPassword, salt);
    const now = new Date().toISOString();

    if (!user) {
      const adminId = 'usr_admin_' + crypto.randomBytes(6).toString('hex');
      user = {
        id: adminId,
        email: cleanEmail,
        passwordHash,
        name: 'Administrator',
        role: 'admin',
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
      };
      this.data.users.push(user);
    } else {
      user.passwordHash = passwordHash;
      user.role = 'admin';
      user.emailVerified = true;
      user.resetToken = undefined;
      user.resetTokenExpires = undefined;
      user.updatedAt = now;
    }

    // Ensure lifetime Premium subscription
    this.setSubscription(user.id, 'premium', 'manual', {
      customerId: 'admin_sys',
      subscriptionId: 'sub_lifetime_admin',
      currentPeriodEnd: new Date(Date.now() + 100 * 365 * 24 * 3600 * 1000).toISOString(),
    });

    this.persist();
    return user;
  }

  /**
   * Secure Admin Setup / Recovery Key for web-based first-time recovery
   */
  public getAdminSetupKey(): string {
    if (process.env.ADMIN_SETUP_KEY && process.env.ADMIN_SETUP_KEY.trim()) {
      return process.env.ADMIN_SETUP_KEY.trim();
    }
    const keyFile = path.join(DB_DIR, 'admin_setup_key.secret');
    if (fs.existsSync(keyFile)) {
      try {
        const key = fs.readFileSync(keyFile, 'utf-8').trim();
        if (key.length >= 16) return key;
      } catch {}
    }
    const generated = 'adm_key_' + crypto.randomBytes(16).toString('hex');
    try {
      fs.writeFileSync(keyFile, generated, { encoding: 'utf-8', mode: 0o600 });
      console.log(`[Admin Security] Generated server setup key in data/admin_setup_key.secret: ${generated}`);
    } catch {}
    return generated;
  }

  /**
   * Verify an admin setup key using timing-safe comparison
   */
  public verifyAdminSetupKey(candidateKey: string): boolean {
    if (!candidateKey || typeof candidateKey !== 'string') return false;
    const actualKey = this.getAdminSetupKey();
    const candidateBuf = Buffer.from(candidateKey.trim());
    const actualBuf = Buffer.from(actualKey.trim());
    if (candidateBuf.length !== actualBuf.length) return false;
    return crypto.timingSafeEqual(candidateBuf, actualBuf);
  }

  // --- Users Operations ---
  public findUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public findUserByEmail(email: string): User | undefined {
    const clean = email.trim().toLowerCase();
    return this.data.users.find(u => u.email.toLowerCase() === clean);
  }

  public createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): User {
    const id = 'usr_' + crypto.randomBytes(8).toString('hex');
    const now = new Date().toISOString();
    const newUser: User = {
      ...userData,
      id,
      email: userData.email.trim().toLowerCase(),
      createdAt: now,
      updatedAt: now,
    };
    this.data.users.push(newUser);

    // Automatically create Free subscription record
    this.data.subscriptions.push({
      id: 'sub_' + crypto.randomBytes(8).toString('hex'),
      userId: id,
      plan: 'free',
      status: 'active',
      provider: 'manual',
      createdAt: now,
      updatedAt: now,
    });

    this.persist();
    return newUser;
  }

  public updateUser(id: string, updates: Partial<User>): User | undefined {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) return undefined;
    this.data.users[idx] = {
      ...this.data.users[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.persist();
    return this.data.users[idx];
  }

  public getAllUsers(): User[] {
    return [...this.data.users];
  }

  // --- Subscriptions Operations ---
  public getSubscriptionByUserId(userId: string): Subscription | undefined {
    return this.data.subscriptions.find(s => s.userId === userId && s.status === 'active') ||
           this.data.subscriptions.find(s => s.userId === userId);
  }

  public setSubscription(userId: string, plan: PlanTier, provider: 'lemon_squeezy' | 'paddle' | 'manual', subDetails?: Partial<Subscription>): Subscription {
    const now = new Date().toISOString();
    let sub = this.data.subscriptions.find(s => s.userId === userId);
    if (sub) {
      sub.plan = plan;
      sub.status = 'active';
      sub.provider = provider;
      if (subDetails?.customerId) sub.customerId = subDetails.customerId;
      if (subDetails?.subscriptionId) sub.subscriptionId = subDetails.subscriptionId;
      if (subDetails?.currentPeriodEnd) sub.currentPeriodEnd = subDetails.currentPeriodEnd;
      sub.updatedAt = now;
    } else {
      sub = {
        id: 'sub_' + crypto.randomBytes(8).toString('hex'),
        userId,
        plan,
        status: 'active',
        provider,
        customerId: subDetails?.customerId,
        subscriptionId: subDetails?.subscriptionId,
        currentPeriodEnd: subDetails?.currentPeriodEnd,
        createdAt: now,
        updatedAt: now,
      };
      this.data.subscriptions.push(sub);
    }
    this.persist();
    return sub;
  }

  public getAllSubscriptions(): Subscription[] {
    return [...this.data.subscriptions];
  }

  // --- Daily Quotas & Atomic Reservation ---
  public static getTodayUtcString(): string {
    const d = new Date();
    return d.toISOString().slice(0, 10); // YYYY-MM-DD
  }

  public static getNextMidnightUtcString(): string {
    const d = new Date();
    d.setUTCHours(24, 0, 0, 0);
    return d.toISOString();
  }

  public getDailyUsage(identifier: string, limit: number): DailyUsageRecord {
    const today = Database.getTodayUtcString();
    let record = this.data.dailyUsage.find(
      u => u.identifier === identifier && u.dateUtc === today
    );

    if (!record) {
      record = {
        id: 'use_' + crypto.randomBytes(6).toString('hex'),
        identifier,
        dateUtc: today,
        count: 0,
        limit,
        resetsAtUtc: Database.getNextMidnightUtcString(),
        updatedAt: new Date().toISOString(),
      };
      this.data.dailyUsage.push(record);
      this.persist();
    } else if (record.limit !== limit) {
      record.limit = limit;
      this.persist();
    }

    return record;
  }

  /**
   * Atomically reserve quota units for generation.
   * If (currentCount + amount <= limit), increments count and returns { success: true, remaining }
   * Otherwise, returns { success: false, remaining, resetAt } without modifying count.
   */
  public reserveQuota(identifier: string, amount: number, limit: number): {
    success: boolean;
    count: number;
    limit: number;
    remaining: number;
    resetsAtUtc: string;
  } {
    const today = Database.getTodayUtcString();
    let record = this.data.dailyUsage.find(
      u => u.identifier === identifier && u.dateUtc === today
    );

    const resetsAt = Database.getNextMidnightUtcString();

    if (!record) {
      record = {
        id: 'use_' + crypto.randomBytes(6).toString('hex'),
        identifier,
        dateUtc: today,
        count: 0,
        limit,
        resetsAtUtc: resetsAt,
        updatedAt: new Date().toISOString(),
      };
      this.data.dailyUsage.push(record);
    }

    record.limit = limit;

    const available = limit - record.count;
    if (available < amount) {
      return {
        success: false,
        count: record.count,
        limit: record.limit,
        remaining: Math.max(0, available),
        resetsAtUtc: record.resetsAtUtc,
      };
    }

    record.count += amount;
    record.updatedAt = new Date().toISOString();
    this.persist();

    return {
      success: true,
      count: record.count,
      limit: record.limit,
      remaining: Math.max(0, record.limit - record.count),
      resetsAtUtc: record.resetsAtUtc,
    };
  }

  // --- Saved Slug History ---
  public addSlugHistory(item: Omit<SlugHistoryItem, 'id' | 'createdAt'>): SlugHistoryItem {
    const newItem: SlugHistoryItem = {
      ...item,
      id: 'slg_' + crypto.randomBytes(8).toString('hex'),
      createdAt: new Date().toISOString(),
    };
    this.data.slugHistory.unshift(newItem);
    // Keep max 500 items per user to manage storage
    const userItems = this.data.slugHistory.filter(s => s.userId === item.userId);
    if (userItems.length > 500) {
      const oldestId = userItems[userItems.length - 1].id;
      this.data.slugHistory = this.data.slugHistory.filter(s => s.id !== oldestId);
    }
    this.persist();
    return newItem;
  }

  public getSlugHistory(userId: string, limit = 50): SlugHistoryItem[] {
    return this.data.slugHistory
      .filter(s => s.userId === userId)
      .slice(0, limit);
  }

  public deleteSlugHistoryItem(id: string, userId: string): boolean {
    const initialLen = this.data.slugHistory.length;
    this.data.slugHistory = this.data.slugHistory.filter(s => !(s.id === id && s.userId === userId));
    const deleted = this.data.slugHistory.length < initialLen;
    if (deleted) this.persist();
    return deleted;
  }

  public clearSlugHistory(userId: string): number {
    const initialLen = this.data.slugHistory.length;
    this.data.slugHistory = this.data.slugHistory.filter(s => s.userId !== userId);
    const count = initialLen - this.data.slugHistory.length;
    if (count > 0) this.persist();
    return count;
  }

  // --- API Keys Management ---
  public createApiKey(userId: string, name: string): { key: string; record: ApiKeyRecord } {
    const rawSecret = crypto.randomBytes(24).toString('hex');
    const fullKey = `sk_live_${rawSecret}`;
    const keyPrefix = fullKey.slice(0, 13) + '...';
    const keyHash = crypto.createHash('sha256').update(fullKey).digest('hex');

    const record: ApiKeyRecord = {
      id: 'key_' + crypto.randomBytes(6).toString('hex'),
      userId,
      name: name || 'Production Key',
      keyPrefix,
      keyHash,
      rateLimitPerMin: 60,
      createdAt: new Date().toISOString(),
      status: 'active',
    };

    this.data.apiKeys.push(record);
    this.persist();

    return { key: fullKey, record };
  }

  public findApiKeyByHash(keyHash: string): ApiKeyRecord | undefined {
    return this.data.apiKeys.find(k => k.keyHash === keyHash && k.status === 'active');
  }

  public getApiKeysByUserId(userId: string): ApiKeyRecord[] {
    return this.data.apiKeys.filter(k => k.userId === userId);
  }

  public revokeApiKey(keyId: string, userId: string): boolean {
    const key = this.data.apiKeys.find(k => k.id === keyId && k.userId === userId);
    if (!key) return false;
    key.status = 'revoked';
    this.persist();
    return true;
  }

  public touchApiKeyUsage(keyId: string) {
    const key = this.data.apiKeys.find(k => k.id === keyId);
    if (key) {
      key.lastUsedAt = new Date().toISOString();
      this.persist();
    }
  }

  // --- Analytics Tracking ---
  public trackEvent(event: Omit<AnalyticsEvent, 'id' | 'createdAt'>): AnalyticsEvent {
    const newEvent: AnalyticsEvent = {
      ...event,
      id: 'evt_' + crypto.randomBytes(6).toString('hex'),
      createdAt: new Date().toISOString(),
    };
    this.data.analyticsEvents.push(newEvent);
    // Keep last 10,000 analytics events to prevent infinite growth
    if (this.data.analyticsEvents.length > 10000) {
      this.data.analyticsEvents = this.data.analyticsEvents.slice(-8000);
    }
    this.persist();
    return newEvent;
  }

  public getAnalyticsEvents(since?: string): AnalyticsEvent[] {
    if (!since) return this.data.analyticsEvents;
    const sinceTime = new Date(since).getTime();
    return this.data.analyticsEvents.filter(e => new Date(e.createdAt).getTime() >= sinceTime);
  }

  // --- Audit Logs ---
  public logAudit(log: Omit<AuditLog, 'id' | 'createdAt'>): AuditLog {
    const newLog: AuditLog = {
      ...log,
      id: 'aud_' + crypto.randomBytes(6).toString('hex'),
      createdAt: new Date().toISOString(),
    };
    this.data.auditLogs.unshift(newLog);
    if (this.data.auditLogs.length > 2000) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 1500);
    }
    this.persist();
    return newLog;
  }

  public getAuditLogs(limit = 100): AuditLog[] {
    return this.data.auditLogs.slice(0, limit);
  }

  // --- Webhook Idempotency ---
  public hasProcessedWebhook(eventId: string): boolean {
    return this.data.webhookEvents.some(w => w.eventId === eventId);
  }

  public markWebhookProcessed(eventId: string, provider: string, eventName: string, payload: any) {
    this.data.webhookEvents.push({
      id: 'wh_' + crypto.randomBytes(6).toString('hex'),
      eventId,
      provider,
      eventName,
      processedAt: new Date().toISOString(),
      payload,
    });
    this.persist();
  }
}

export const db = new Database();
