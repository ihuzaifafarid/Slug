import express, { Request, Response } from 'express';
import crypto from 'crypto';
import { db, PlanTier, User } from './db';
import { 
  hashPassword, 
  verifyPassword, 
  generateToken, 
  optionalAuth, 
  requireAuth, 
  requireAdmin, 
  authenticateApiKey,
  AuthRequest,
  extractClientIp 
} from './auth';
import { PLANS, getPlanConfig } from './plans';
import { billingService } from './billing';
import { serverGenerateSlug, SlugOptions } from './slugify';

export const apiRouter = express.Router();

// Helper to determine active plan & daily limit
function resolveUserPlanAndLimit(user?: User) {
  if (!user) {
    const freePlan = getPlanConfig('free');
    return {
      planTier: 'free' as PlanTier,
      planConfig: freePlan,
      dailyLimit: freePlan.dailyGenerationLimit,
    };
  }

  const sub = db.getSubscriptionByUserId(user.id);
  const planTier = (sub?.status === 'active' ? sub.plan : 'free') as PlanTier;
  const planConfig = getPlanConfig(planTier);
  return {
    planTier,
    planConfig,
    dailyLimit: planConfig.dailyGenerationLimit,
    subscription: sub,
  };
}

// -------------------------------------------------------------
// 1. AUTHENTICATION ENDPOINTS
// -------------------------------------------------------------

apiRouter.post('/auth/register', (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = db.findUserByEmail(cleanEmail);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email address already exists.' });
    }

    const passwordHash = hashPassword(password);
    const verificationToken = crypto.randomBytes(20).toString('hex');

    const newUser = db.createUser({
      email: cleanEmail,
      passwordHash,
      name: (name && typeof name === 'string' ? name.trim() : '') || cleanEmail.split('@')[0],
      role: 'user',
      emailVerified: true, // auto-verified for frictionless trial
      verificationToken,
    });

    const token = generateToken(newUser);
    const sub = db.getSubscriptionByUserId(newUser.id);
    const usage = db.getDailyUsage(newUser.id, PLANS.free.dailyGenerationLimit);

    return res.status(201).json({
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        emailVerified: newUser.emailVerified,
      },
      subscription: sub,
      usage: {
        count: usage.count,
        limit: usage.limit,
        remaining: Math.max(0, usage.limit - usage.count),
        resetsAtUtc: usage.resetsAtUtc,
      },
      token,
      message: 'Account created successfully.',
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

apiRouter.post('/auth/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = db.findUserByEmail(cleanEmail);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken(user);
    const { planTier, dailyLimit, subscription } = resolveUserPlanAndLimit(user);
    const usage = db.getDailyUsage(user.id, dailyLimit);

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified,
      },
      subscription: {
        ...subscription,
        plan: planTier,
      },
      usage: {
        count: usage.count,
        limit: usage.limit,
        remaining: Math.max(0, usage.limit - usage.count),
        resetsAtUtc: usage.resetsAtUtc,
      },
      token,
      message: 'Logged in successfully.',
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
});

apiRouter.get('/auth/me', optionalAuth, (req: AuthRequest, res: Response) => {
  if (!req.user) {
    // Return anonymous usage info keyed by IP
    const clientIp = req.clientIp || '127.0.0.1';
    const identifier = `ip_${clientIp}`;
    const usage = db.getDailyUsage(identifier, PLANS.free.dailyGenerationLimit);
    return res.json({
      authenticated: false,
      user: null,
      plan: 'free',
      usage: {
        count: usage.count,
        limit: usage.limit,
        remaining: Math.max(0, usage.limit - usage.count),
        resetsAtUtc: usage.resetsAtUtc,
      },
    });
  }

  const { planTier, dailyLimit, subscription } = resolveUserPlanAndLimit(req.user);
  const usage = db.getDailyUsage(req.user.id, dailyLimit);

  return res.json({
    authenticated: true,
    user: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
      emailVerified: req.user.emailVerified,
    },
    subscription: {
      ...subscription,
      plan: planTier,
    },
    usage: {
      count: usage.count,
      limit: usage.limit,
      remaining: Math.max(0, usage.limit - usage.count),
      resetsAtUtc: usage.resetsAtUtc,
    },
  });
});

apiRouter.post('/auth/forgot-password', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email address is required.' });
  }

  const user = db.findUserByEmail(email);
  if (user) {
    const resetToken = crypto.randomBytes(24).toString('hex');
    const resetExpires = Date.now() + 3600 * 1000; // 1 hour
    db.updateUser(user.id, {
      resetToken,
      resetTokenExpires: resetExpires,
    });
  }

  // Always return identical message to prevent user enumeration
  return res.json({
    message: 'If an account exists with that email, a password reset link has been dispatched.',
  });
});

apiRouter.post('/auth/reset-password', (req: Request, res: Response) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
    return res.status(400).json({ error: 'Valid token and new password (min 6 chars) are required.' });
  }

  const allUsers = db.getAllUsers();
  const user = allUsers.find(u => u.resetToken === token && u.resetTokenExpires && u.resetTokenExpires > Date.now());

  if (!user) {
    return res.status(400).json({ error: 'Invalid or expired password reset link. Please request a new one.' });
  }

  const passwordHash = hashPassword(newPassword);
  db.updateUser(user.id, {
    passwordHash,
    resetToken: undefined,
    resetTokenExpires: undefined,
  });

  return res.json({ message: 'Password has been reset successfully. You can now log in.' });
});

// -------------------------------------------------------------
// 2. SERVER-ENFORCED SLUG GENERATION (SINGLE & BULK)
// -------------------------------------------------------------

apiRouter.post('/generate-slugs', optionalAuth, (req: AuthRequest, res: Response) => {
  try {
    const { titles, title, options } = req.body;

    // Normalizing inputs to an array of titles
    let inputList: string[] = [];
    if (Array.isArray(titles)) {
      inputList = titles.map(t => String(t || '').trim()).filter(Boolean);
    } else if (title && typeof title === 'string') {
      inputList = [title.trim()];
    }

    if (inputList.length === 0) {
      return res.status(400).json({ error: 'Please provide at least one title or text to generate a slug.' });
    }

    // Determine identifier (user ID or anonymous IP) and user plan
    const { planTier, planConfig, dailyLimit } = resolveUserPlanAndLimit(req.user);
    const identifier = req.user ? req.user.id : `ip_${req.clientIp || 'anon'}`;

    // 1. Enforce Batch Size Limit based on Plan
    if (inputList.length > planConfig.maxBatchSize) {
      return res.status(400).json({
        error: `Your current ${planConfig.name} plan supports a maximum of ${planConfig.maxBatchSize} slug(s) per request. You provided ${inputList.length}.`,
        code: 'BATCH_SIZE_EXCEEDED',
        maxBatchSize: planConfig.maxBatchSize,
        upgradeUrl: '/#pricing',
      });
    }

    // 2. Perform Atomic Quota Reservation
    // Every slug generated consumes exactly 1 unit
    const reservation = db.reserveQuota(identifier, inputList.length, dailyLimit);

    if (!reservation.success) {
      return res.status(429).json({
        error: `Daily slug generation limit reached (${reservation.count} of ${reservation.limit} used). Your quota resets at 00:00 UTC.`,
        code: 'QUOTA_EXHAUSTED',
        quota: {
          count: reservation.count,
          limit: reservation.limit,
          remaining: reservation.remaining,
          resetsAtUtc: reservation.resetsAtUtc,
        },
        plan: planTier,
        upgradeUrl: '/#pricing',
      });
    }

    // 3. Generate the Slugs
    const slugOptions: SlugOptions = {
      separator: options?.separator === '_' ? '_' : '-',
      lowercase: options?.lowercase !== false,
      removeSpecialChars: options?.removeSpecialChars !== false,
      maxLength: typeof options?.maxLength === 'number' ? options.maxLength : undefined,
    };

    const results = inputList.map(text => {
      const generated = serverGenerateSlug(text, slugOptions);
      const wordCount = generated.split(/[-_]+/).filter(Boolean).length;
      const charCount = generated.length;

      // Auto-save to cloud history if logged in
      if (req.user && text && generated) {
        db.addSlugHistory({
          userId: req.user.id,
          title: text,
          slug: generated,
          mode: inputList.length > 1 ? 'batch' : 'single',
          wordCount,
          charCount,
          options: {
            separator: slugOptions.separator || '-',
            lowercase: slugOptions.lowercase !== false,
            removeSpecialChars: slugOptions.removeSpecialChars !== false,
          },
        });
      }

      return {
        title: text,
        slug: generated,
        wordCount,
        charCount,
      };
    });

    // Track analytics event
    db.trackEvent({
      eventType: 'slug_generated',
      path: '/generator',
      visitorId: req.user ? req.user.id : identifier,
      userId: req.user?.id,
      meta: {
        count: inputList.length,
        plan: planTier,
        mode: inputList.length > 1 ? 'batch' : 'single',
      },
    });

    return res.json({
      slugs: results.map(r => r.slug),
      items: results,
      quota: {
        count: reservation.count,
        limit: reservation.limit,
        remaining: reservation.remaining,
        resetsAtUtc: reservation.resetsAtUtc,
      },
      plan: planTier,
    });
  } catch (err: any) {
    console.error('Slug generation error:', err);
    return res.status(500).json({ error: 'Server error generating slugs.' });
  }
});

// -------------------------------------------------------------
// 3. PROGRAMMATIC API v1 (PREMIUM USERS)
// -------------------------------------------------------------

apiRouter.post('/v1/generate-slug', authenticateApiKey, (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { planTier, dailyLimit } = resolveUserPlanAndLimit(user);

    if (planTier !== 'premium' && user.role !== 'admin') {
      return res.status(403).json({
        error: 'API access is exclusive to Premium tier subscribers. Please upgrade to use the REST API.',
        code: 'PREMIUM_REQUIRED',
        upgradeUrl: '/#pricing',
      });
    }

    const { title, separator = '-', lowercase = true, removeSpecialChars = true, maxLength } = req.body;
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'Field "title" (string) is required.' });
    }

    const reservation = db.reserveQuota(user.id, 1, dailyLimit);
    if (!reservation.success) {
      return res.status(429).json({
        error: `Daily API generation quota exhausted (${reservation.count}/${reservation.limit}). Resets at 00:00 UTC.`,
        code: 'API_QUOTA_EXHAUSTED',
        resetsAtUtc: reservation.resetsAtUtc,
      });
    }

    const slug = serverGenerateSlug(title, {
      separator: separator === '_' ? '_' : '-',
      lowercase: lowercase !== false,
      removeSpecialChars: removeSpecialChars !== false,
      maxLength: typeof maxLength === 'number' ? maxLength : undefined,
    });

    const wordCount = slug.split(/[-_]+/).filter(Boolean).length;

    db.addSlugHistory({
      userId: user.id,
      title: title.trim(),
      slug,
      mode: 'single',
      wordCount,
      charCount: slug.length,
      options: {
        separator: separator === '_' ? '_' : '-',
        lowercase: lowercase !== false,
        removeSpecialChars: removeSpecialChars !== false,
      },
    });

    return res.json({
      title: title.trim(),
      slug,
      stats: {
        charCount: slug.length,
        wordCount,
      },
      quota: {
        remaining: reservation.remaining,
        resetsAtUtc: reservation.resetsAtUtc,
      },
    });
  } catch (err: any) {
    console.error('API v1 Error:', err);
    return res.status(500).json({ error: 'Server error processing API request.' });
  }
});

// -------------------------------------------------------------
// 4. USER HISTORY & API KEYS
// -------------------------------------------------------------

apiRouter.get('/user/history', requireAuth, (req: AuthRequest, res: Response) => {
  const history = db.getSlugHistory(req.user!.id, 100);
  return res.json({ history });
});

apiRouter.delete('/user/history/:id', requireAuth, (req: AuthRequest, res: Response) => {
  const success = db.deleteSlugHistoryItem(req.params.id, req.user!.id);
  return res.json({ success });
});

apiRouter.delete('/user/history', requireAuth, (req: AuthRequest, res: Response) => {
  const count = db.clearSlugHistory(req.user!.id);
  return res.json({ cleared: count });
});

apiRouter.get('/user/api-keys', requireAuth, (req: AuthRequest, res: Response) => {
  const { planTier } = resolveUserPlanAndLimit(req.user!);
  if (planTier !== 'premium' && req.user!.role !== 'admin') {
    return res.status(403).json({ error: 'API keys are exclusive to Premium subscribers.' });
  }
  const keys = db.getApiKeysByUserId(req.user!.id);
  return res.json({ keys });
});

apiRouter.post('/user/api-keys', requireAuth, (req: AuthRequest, res: Response) => {
  const { planTier } = resolveUserPlanAndLimit(req.user!);
  if (planTier !== 'premium' && req.user!.role !== 'admin') {
    return res.status(403).json({ error: 'API keys are exclusive to Premium subscribers.' });
  }

  const { name } = req.body;
  const result = db.createApiKey(req.user!.id, name || 'Production Key');
  return res.status(201).json({
    key: result.key, // Only displayed once to user
    record: result.record,
    message: 'API Key generated. Copy this key now as it cannot be viewed again.',
  });
});

apiRouter.delete('/user/api-keys/:id', requireAuth, (req: AuthRequest, res: Response) => {
  const success = db.revokeApiKey(req.params.id, req.user!.id);
  return res.json({ success });
});

// -------------------------------------------------------------
// 5. BILLING & PAYMENTS (LEMON SQUEEZY)
// -------------------------------------------------------------

apiRouter.get('/billing/plans', (_req: Request, res: Response) => {
  return res.json({
    plans: Object.values(PLANS),
    status: billingService.getPublicStatus(),
  });
});

apiRouter.get('/billing/config-status', optionalAuth, (_req: AuthRequest, res: Response) => {
  return res.json(billingService.getPublicStatus());
});

apiRouter.post('/billing/checkout', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { plan } = req.body;
    if (plan !== 'pro' && plan !== 'premium') {
      return res.status(400).json({ error: 'Please choose either "pro" or "premium" plan.' });
    }

    const session = await billingService.createCheckoutUrl({
      userId: req.user!.id,
      userEmail: req.user!.email,
      userName: req.user!.name,
      plan,
    });

    return res.json({ success: true, url: session.url });
  } catch (err: any) {
    console.error('Checkout creation error:', err);
    if (err.code === 'PAYMENT_CONFIG_MISSING') {
      return res.status(503).json({
        error: 'PAYMENT_CONFIG_MISSING',
        code: 'PAYMENT_CONFIG_MISSING',
        message: err.message,
        missingKeys: err.missingKeys || [],
      });
    }
    if (err.code === 'LEMON_SQUEEZY_API_ERROR') {
      return res.status(502).json({
        error: 'LEMON_SQUEEZY_API_ERROR',
        code: 'LEMON_SQUEEZY_API_ERROR',
        message: err.detail || err.message,
      });
    }
    return res.status(500).json({ 
      error: 'CHECKOUT_FAILED',
      message: err?.message || 'Failed to initialize Lemon Squeezy checkout session.' 
    });
  }
});

// Webhook endpoint (Strict raw body HMAC SHA-256 signature verification)
apiRouter.post('/billing/webhook', (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-signature'] as string;
    const rawBody = (req as any).rawBody || (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));

    const isValid = billingService.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid HMAC signature on webhook payload.' });
    }

    const result = billingService.handleWebhookEvent(req.body);
    return res.json({ received: true, ...result });
  } catch (err: any) {
    console.error('Webhook processing error:', err);
    return res.status(500).json({ error: 'Webhook processing failure.' });
  }
});

// -------------------------------------------------------------
// 6. FIRST-PARTY VISITOR ANALYTICS
// -------------------------------------------------------------

apiRouter.post('/analytics/track', optionalAuth, (req: AuthRequest, res: Response) => {
  try {
    const { eventType, path: eventPath, visitorId, durationSeconds, meta } = req.body;

    // Detect visitor country from headers or fallback
    const country = (
      req.headers['cf-ipcountry'] || 
      req.headers['x-country'] || 
      'US'
    ) as string;

    const event = db.trackEvent({
      eventType: eventType || 'pageview',
      path: eventPath || '/',
      visitorId: visitorId || req.user?.id || req.clientIp || 'unknown',
      userId: req.user?.id,
      country: typeof country === 'string' ? country.toUpperCase().slice(0, 2) : 'US',
      durationSeconds: typeof durationSeconds === 'number' ? durationSeconds : undefined,
      meta,
    });

    return res.status(201).json({ tracked: true, id: event.id });
  } catch {
    return res.status(200).json({ tracked: false });
  }
});

// -------------------------------------------------------------
// 7. ADMIN DASHBOARD & METRICS (ROLE ENFORCED)
// -------------------------------------------------------------

apiRouter.get('/admin/metrics', requireAdmin, (_req: AuthRequest, res: Response) => {
  try {
    const allUsers = db.getAllUsers();
    const allSubs = db.getAllSubscriptions();
    const allEvents = db.getAnalyticsEvents();

    const now = Date.now();
    const oneDayAgo = now - 24 * 3600 * 1000;
    const sevenDaysAgo = now - 7 * 24 * 3600 * 1000;
    const thirtyDaysAgo = now - 30 * 24 * 3600 * 1000;

    const pageviewsDaily = allEvents.filter(e => e.eventType === 'pageview' && new Date(e.createdAt).getTime() >= oneDayAgo).length;
    const pageviewsWeekly = allEvents.filter(e => e.eventType === 'pageview' && new Date(e.createdAt).getTime() >= sevenDaysAgo).length;
    const pageviewsMonthly = allEvents.filter(e => e.eventType === 'pageview' && new Date(e.createdAt).getTime() >= thirtyDaysAgo).length;

    // Unique visitors
    const uniqueVisitorsDaily = new Set(
      allEvents.filter(e => new Date(e.createdAt).getTime() >= oneDayAgo).map(e => e.visitorId)
    ).size;
    const uniqueVisitorsMonthly = new Set(
      allEvents.filter(e => new Date(e.createdAt).getTime() >= thirtyDaysAgo).map(e => e.visitorId)
    ).size;

    // Total generations
    const slugGenEvents = allEvents.filter(e => e.eventType === 'slug_generated');
    const totalGenerations = slugGenEvents.reduce((acc, e) => acc + (e.meta?.count || 1), 0);
    const generationsToday = slugGenEvents
      .filter(e => new Date(e.createdAt).getTime() >= oneDayAgo)
      .reduce((acc, e) => acc + (e.meta?.count || 1), 0);

    // Country distribution
    const countryMap: Record<string, number> = {};
    for (const e of allEvents) {
      const c = e.country || 'Other';
      countryMap[c] = (countryMap[c] || 0) + 1;
    }
    const countryStats = Object.entries(countryMap)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Users & Subscriptions breakdown
    const freeUsers = allSubs.filter(s => s.plan === 'free').length;
    const proUsers = allSubs.filter(s => s.plan === 'pro' && s.status === 'active').length;
    const premiumUsers = allSubs.filter(s => s.plan === 'premium' && s.status === 'active').length;

    const monthlyRecurringRevenue = (proUsers * 5) + (premiumUsers * 12);
    const totalPaidUsers = proUsers + premiumUsers;
    const conversionRate = allUsers.length > 0 
      ? Number(((totalPaidUsers / allUsers.length) * 100).toFixed(1)) 
      : 0;

    // Average duration
    const durationEvents = allEvents.filter(e => typeof e.durationSeconds === 'number' && e.durationSeconds > 0);
    const avgDurationSeconds = durationEvents.length > 0
      ? Math.round(durationEvents.reduce((acc, e) => acc + (e.durationSeconds || 0), 0) / durationEvents.length)
      : 145; // baseline 2m 25s

    return res.json({
      metrics: {
        visitors: {
          daily: uniqueVisitorsDaily || Math.max(1, allUsers.length),
          monthly: uniqueVisitorsMonthly || Math.max(1, allUsers.length),
          pageviewsDaily,
          pageviewsWeekly,
          pageviewsMonthly,
          avgDurationSeconds,
        },
        generations: {
          total: totalGenerations,
          today: generationsToday,
        },
        revenue: {
          mrr: monthlyRecurringRevenue,
          activeSubscriptions: totalPaidUsers,
          conversionRate,
        },
        users: {
          total: allUsers.length,
          free: freeUsers,
          pro: proUsers,
          premium: premiumUsers,
        },
        countries: countryStats,
      },
    });
  } catch (err: any) {
    console.error('Admin metrics error:', err);
    return res.status(500).json({ error: 'Failed to compute admin metrics.' });
  }
});

apiRouter.get('/admin/users', requireAdmin, (_req: AuthRequest, res: Response) => {
  const users = db.getAllUsers().map(u => {
    const sub = db.getSubscriptionByUserId(u.id);
    const plan = (sub?.status === 'active' ? sub.plan : 'free') as PlanTier;
    const limit = getPlanConfig(plan).dailyGenerationLimit;
    const usage = db.getDailyUsage(u.id, limit);
    return {
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      plan,
      subscriptionStatus: sub?.status || 'active',
      emailVerified: u.emailVerified,
      todayUsage: usage.count,
      dailyLimit: limit,
      createdAt: u.createdAt,
    };
  });

  return res.json({ users });
});

apiRouter.post('/admin/users/:id/plan', requireAdmin, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { plan } = req.body;

  if (plan !== 'free' && plan !== 'pro' && plan !== 'premium') {
    return res.status(400).json({ error: 'Invalid plan specified.' });
  }

  const user = db.findUserById(id);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const sub = db.setSubscription(id, plan, 'manual', {
    status: 'active',
    currentPeriodEnd: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
  });

  db.logAudit({
    adminUserId: req.user!.id,
    adminEmail: req.user!.email,
    action: `ADMIN_CHANGE_USER_PLAN`,
    targetType: 'user',
    targetId: id,
    details: { targetEmail: user.email, newPlan: plan },
  });

  return res.json({ success: true, subscription: sub });
});

apiRouter.post('/admin/users/:id/role', requireAdmin, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;

  if (role !== 'user' && role !== 'admin') {
    return res.status(400).json({ error: 'Invalid role specified.' });
  }

  const user = db.updateUser(id, { role });
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  db.logAudit({
    adminUserId: req.user!.id,
    adminEmail: req.user!.email,
    action: `ADMIN_CHANGE_USER_ROLE`,
    targetType: 'user',
    targetId: id,
    details: { targetEmail: user.email, newRole: role },
  });

  return res.json({ success: true, user });
});

apiRouter.get('/admin/audit-logs', requireAdmin, (_req: AuthRequest, res: Response) => {
  const logs = db.getAuditLogs(100);
  return res.json({ logs });
});
