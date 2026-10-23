import crypto from 'crypto';
import { db, PlanTier } from './db';
import { PLANS, getPlanConfig } from './plans';

export interface CheckoutSessionOptions {
  userId: string;
  userEmail: string;
  userName: string;
  plan: PlanTier;
  returnUrl?: string;
}

export interface LemonSqueezyConfigStatus {
  isConfigured: boolean;
  missingKeys: string[];
  hasApiKey: boolean;
  hasStoreId: boolean;
  hasWebhookSecret: boolean;
  hasProVariantId: boolean;
  hasPremiumVariantId: boolean;
  storeId?: string;
}

export class BillingService {
  private get apiKey(): string {
    return (process.env.LEMON_SQUEEZY_API_KEY || process.env.LEMONSQUEEZY_API_KEY || '').trim();
  }

  private get storeId(): string {
    return (process.env.LEMON_SQUEEZY_STORE_ID || process.env.LEMONSQUEEZY_STORE_ID || '').trim();
  }

  private get webhookSecret(): string {
    return (process.env.LEMON_SQUEEZY_WEBHOOK_SECRET || process.env.LEMONSQUEEZY_WEBHOOK_SECRET || '').trim();
  }

  private getProVariantId(): string {
    return (process.env.LEMON_SQUEEZY_PRO_VARIANT_ID || process.env.LEMONSQUEEZY_PRO_VARIANT_ID || '').trim();
  }

  private getPremiumVariantId(): string {
    return (process.env.LEMON_SQUEEZY_PREMIUM_VARIANT_ID || process.env.LEMONSQUEEZY_PREMIUM_VARIANT_ID || '').trim();
  }

  public getVariantId(plan: PlanTier): string {
    if (plan === 'pro') return this.getProVariantId();
    if (plan === 'premium') return this.getPremiumVariantId();
    return '';
  }

  /**
   * Check configuration completeness for a given plan or generally.
   */
  public getConfigStatus(plan?: PlanTier): LemonSqueezyConfigStatus {
    const hasApiKey = Boolean(this.apiKey);
    const hasStoreId = Boolean(this.storeId);
    const hasWebhookSecret = Boolean(this.webhookSecret);
    const hasProVariantId = Boolean(this.getProVariantId());
    const hasPremiumVariantId = Boolean(this.getPremiumVariantId());

    const missingKeys: string[] = [];
    if (!hasApiKey) missingKeys.push('LEMON_SQUEEZY_API_KEY');
    if (!hasStoreId) missingKeys.push('LEMON_SQUEEZY_STORE_ID');
    if (!hasWebhookSecret) missingKeys.push('LEMON_SQUEEZY_WEBHOOK_SECRET');

    if (plan === 'pro' && !hasProVariantId) {
      missingKeys.push('LEMON_SQUEEZY_PRO_VARIANT_ID');
    } else if (plan === 'premium' && !hasPremiumVariantId) {
      missingKeys.push('LEMON_SQUEEZY_PREMIUM_VARIANT_ID');
    } else if (!plan) {
      if (!hasProVariantId) missingKeys.push('LEMON_SQUEEZY_PRO_VARIANT_ID');
      if (!hasPremiumVariantId) missingKeys.push('LEMON_SQUEEZY_PREMIUM_VARIANT_ID');
    }

    return {
      isConfigured: missingKeys.length === 0,
      missingKeys,
      hasApiKey,
      hasStoreId,
      hasWebhookSecret,
      hasProVariantId,
      hasPremiumVariantId,
      storeId: this.storeId || undefined,
    };
  }

  public getPublicStatus() {
    const status = this.getConfigStatus();
    return {
      provider: 'lemon_squeezy',
      configured: status.isConfigured,
      missingKeys: status.missingKeys,
      supportedPlans: ['pro', 'premium'],
      merchantModel: 'Merchant of Record (Global & Pakistan Supported)',
    };
  }

  /**
   * Creates a real Lemon Squeezy checkout session for Pro or Premium.
   * If configuration is missing, fails with a clear structured error.
   * NEVER simulates payments or silently upgrades users.
   */
  public async createCheckoutUrl(options: CheckoutSessionOptions): Promise<{ url: string }> {
    if (options.plan === 'free') {
      throw new Error('Free plan does not require a payment checkout session.');
    }

    const config = this.getConfigStatus(options.plan);
    if (!config.isConfigured) {
      const err: any = new Error(
        `Lemon Squeezy checkout is not configured. Missing environment variables: ${config.missingKeys.join(', ')}`
      );
      err.code = 'PAYMENT_CONFIG_MISSING';
      err.missingKeys = config.missingKeys;
      throw err;
    }

    const variantId = this.getVariantId(options.plan);
    const appUrl = (process.env.APP_URL || 'http://localhost:3000').replace(/\/+$/, '');
    const redirectUrl = options.returnUrl || `${appUrl}/?payment=success&plan=${options.plan}`;

    const requestPayload = {
      data: {
        type: 'checkouts',
        attributes: {
          checkout_data: {
            email: options.userEmail,
            name: options.userName,
            custom: {
              user_id: options.userId,
              plan: options.plan,
            },
          },
          product_options: {
            redirect_url: redirectUrl,
          },
        },
        relationships: {
          store: {
            data: {
              type: 'stores',
              id: String(this.storeId),
            },
          },
          variant: {
            data: {
              type: 'variants',
              id: String(variantId),
            },
          },
        },
      },
    };

    let response: globalThis.Response;
    try {
      response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
        method: 'POST',
        headers: {
          'Accept': 'application/vnd.api+json',
          'Content-Type': 'application/vnd.api+json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestPayload),
      });
    } catch (networkErr: any) {
      console.error('[LemonSqueezy] Network connection failed:', networkErr);
      const err: any = new Error(`Failed to reach Lemon Squeezy API: ${networkErr?.message || networkErr}`);
      err.code = 'PAYMENT_GATEWAY_UNAVAILABLE';
      throw err;
    }

    const responseText = await response.text();
    let result: any = null;
    try {
      result = JSON.parse(responseText);
    } catch {
      // not JSON
    }

    if (!response.ok) {
      console.error('[LemonSqueezy] API Error status:', response.status, responseText);
      const detail = result?.errors?.[0]?.detail || result?.message || `HTTP ${response.status}: ${responseText.slice(0, 200)}`;
      const err: any = new Error(`Lemon Squeezy error: ${detail}`);
      err.code = 'LEMON_SQUEEZY_API_ERROR';
      err.status = response.status;
      err.detail = detail;
      throw err;
    }

    const checkoutUrl = result?.data?.attributes?.url;
    if (!checkoutUrl) {
      console.error('[LemonSqueezy] No checkout URL returned in attributes:', result);
      const err: any = new Error('Lemon Squeezy API did not return a valid checkout URL.');
      err.code = 'INVALID_CHECKOUT_RESPONSE';
      throw err;
    }

    return { url: checkoutUrl };
  }

  /**
   * Verify HMAC SHA-256 signature on incoming Lemon Squeezy webhook
   */
  public verifyWebhookSignature(rawBody: string | Buffer, signatureHeader: string | undefined): boolean {
    if (!signatureHeader || !this.webhookSecret) {
      return false;
    }
    try {
      const bodyStr = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf-8');
      const hmac = crypto.createHmac('sha256', this.webhookSecret);
      const digest = Buffer.from(hmac.update(bodyStr).digest('hex'), 'utf8');
      const signature = Buffer.from(signatureHeader, 'utf8');

      if (digest.length !== signature.length) {
        return false;
      }
      return crypto.timingSafeEqual(digest, signature);
    } catch (err) {
      console.error('[Webhook] Signature comparison failed:', err);
      return false;
    }
  }

  /**
   * Process Lemon Squeezy Webhook events idempotently.
   * Only verified webhooks can update user subscriptions.
   */
  public handleWebhookEvent(event: any): { processed: boolean; reason?: string; userUpdated?: string; plan?: PlanTier } {
    const eventName = event?.meta?.event_name;
    const eventId = String(
      event?.meta?.custom_data?.event_id || 
      event?.data?.id || 
      `evt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
    );

    if (db.hasProcessedWebhook(eventId)) {
      return { processed: false, reason: 'Duplicate event ID already processed' };
    }

    const customData = event?.meta?.custom_data || {};
    let userId = customData.user_id;
    let targetPlan: PlanTier = (customData.plan === 'pro' || customData.plan === 'premium') ? customData.plan : 'pro';

    const attributes = event?.data?.attributes || {};
    const customerId = String(attributes.customer_id || '');
    const subscriptionId = String(event?.data?.id || attributes.order_id || '');
    const renewsAt = attributes.renews_at || attributes.ends_at;

    // Fallback: If variant matches Pro or Premium
    const variantId = String(attributes.variant_id || attributes.first_order_item?.variant_id || '');
    if (variantId) {
      if (variantId === this.getPremiumVariantId()) {
        targetPlan = 'premium';
      } else if (variantId === this.getProVariantId()) {
        targetPlan = 'pro';
      }
    }

    // Fallback: If userId was not passed in custom_data, lookup by customer email
    if (!userId && attributes.user_email) {
      const existingUser = db.findUserByEmail(String(attributes.user_email).toLowerCase().trim());
      if (existingUser) {
        userId = existingUser.id;
      }
    }

    if (!userId) {
      console.warn(`[Webhook] Could not identify target user for event ${eventName}. User email: ${attributes.user_email}`);
      db.markWebhookProcessed(eventId, 'lemon_squeezy', eventName, event);
      return { processed: false, reason: 'Target user could not be resolved from event data' };
    }

    const targetUser = db.findUserById(userId);
    if (!targetUser) {
      console.warn(`[Webhook] User ID ${userId} not found in database.`);
      db.markWebhookProcessed(eventId, 'lemon_squeezy', eventName, event);
      return { processed: false, reason: `User ${userId} not found in database` };
    }

    switch (eventName) {
      case 'order_created': {
        // If order was successful and paid
        if (attributes.status === 'paid') {
          db.setSubscription(targetUser.id, targetPlan, 'lemon_squeezy', {
            customerId,
            subscriptionId,
            currentPeriodEnd: renewsAt || new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
            status: 'active',
          });
          db.logAudit({
            adminUserId: 'system_webhook',
            adminEmail: 'webhook@lemonsqueezy.com',
            action: `ORDER_CREATED_UPGRADE_${targetPlan.toUpperCase()}`,
            targetType: 'subscription',
            targetId: subscriptionId,
            details: { userId: targetUser.id, userEmail: targetUser.email, plan: targetPlan, customerId },
          });
        }
        break;
      }

      case 'subscription_created':
      case 'subscription_resumed':
      case 'subscription_payment_success': {
        db.setSubscription(targetUser.id, targetPlan, 'lemon_squeezy', {
          customerId,
          subscriptionId,
          currentPeriodEnd: renewsAt || new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
          status: 'active',
        });
        db.logAudit({
          adminUserId: 'system_webhook',
          adminEmail: 'webhook@lemonsqueezy.com',
          action: `SUBSCRIPTION_${eventName.toUpperCase()}_${targetPlan.toUpperCase()}`,
          targetType: 'subscription',
          targetId: subscriptionId,
          details: { userId: targetUser.id, userEmail: targetUser.email, plan: targetPlan, customerId },
        });
        break;
      }

      case 'subscription_updated': {
        const status = attributes.status === 'active' ? 'active' : 'cancelled';
        db.setSubscription(targetUser.id, targetPlan, 'lemon_squeezy', {
          customerId,
          subscriptionId,
          currentPeriodEnd: renewsAt,
          status,
        });
        db.logAudit({
          adminUserId: 'system_webhook',
          adminEmail: 'webhook@lemonsqueezy.com',
          action: `SUBSCRIPTION_UPDATED`,
          targetType: 'subscription',
          targetId: subscriptionId,
          details: { userId: targetUser.id, status, plan: targetPlan },
        });
        break;
      }

      case 'subscription_cancelled':
      case 'subscription_expired': {
        // Revert back to free tier
        db.setSubscription(targetUser.id, 'free', 'lemon_squeezy', {
          status: 'cancelled',
          subscriptionId,
        });
        db.logAudit({
          adminUserId: 'system_webhook',
          adminEmail: 'webhook@lemonsqueezy.com',
          action: `SUBSCRIPTION_${eventName.toUpperCase()}_REVERT_FREE`,
          targetType: 'subscription',
          targetId: subscriptionId,
          details: { userId: targetUser.id, formerPlan: targetPlan },
        });
        break;
      }

      default:
        console.log(`[Webhook] Unhandled Lemon Squeezy event: ${eventName}`);
        break;
    }

    db.markWebhookProcessed(eventId, 'lemon_squeezy', eventName, event);
    return { processed: true, userUpdated: targetUser.id, plan: targetPlan };
  }
}

export const billingService = new BillingService();
