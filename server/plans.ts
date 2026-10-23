import { PlanTier } from './db';

export interface PlanConfig {
  id: PlanTier;
  name: string;
  tagline: string;
  priceMonthly: number;
  dailyGenerationLimit: number;
  maxBatchSize: number;
  features: string[];
  hasBulkGeneration: boolean;
  hasCsvExport: boolean;
  hasSavedHistory: boolean;
  hasApiAccess: boolean;
  hasPrioritySupport: boolean;
  lemonSqueezyVariantId?: string;
  paddlePriceId?: string;
}

export const PLANS: Record<PlanTier, PlanConfig> = {
  free: {
    id: 'free',
    name: 'Free',
    tagline: 'Essential URL slug generation for individuals and blogs',
    priceMonthly: 0,
    dailyGenerationLimit: 20,
    maxBatchSize: 1,
    features: [
      '20 slug generations per day',
      'Single slug generator',
      'Standard separator & casing options',
      'Live URL preview with custom domain',
      'Real-time SEO character count & read time',
      'Local history of 5 recent slugs',
    ],
    hasBulkGeneration: false,
    hasCsvExport: false,
    hasSavedHistory: false,
    hasApiAccess: false,
    hasPrioritySupport: false,
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    tagline: 'Ideal for SEO specialists, bloggers & digital agencies',
    priceMonthly: 5,
    dailyGenerationLimit: 1000,
    maxBatchSize: 100,
    features: [
      '1,000 slug generations per day',
      'Bulk batch generator (up to 100 titles/batch)',
      'Export slugs to CSV for 301 redirects',
      'Persistent cloud slug history (up to 500 items)',
      'Advanced formatting controls (length & unicode)',
      'Full user dashboard & quota monitoring',
      'Email support',
    ],
    hasBulkGeneration: true,
    hasCsvExport: true,
    hasSavedHistory: true,
    hasApiAccess: false,
    hasPrioritySupport: false,
    lemonSqueezyVariantId: process.env.LEMON_SQUEEZY_PRO_VARIANT_ID || process.env.LEMONSQUEEZY_PRO_VARIANT_ID || '',
    paddlePriceId: process.env.PADDLE_PRO_PRICE_ID || '',
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    tagline: 'For high-volume web publishers, e-commerce & developers',
    priceMonthly: 12,
    dailyGenerationLimit: 10000,
    maxBatchSize: 1000,
    features: [
      '10,000 slug generations per day',
      'Massive batch generator (up to 1,000 titles/batch)',
      'REST API access with secure API keys (60 req/min)',
      'CSV import & export for Shopify/WooCommerce catalog migrations',
      'Dedicated user dashboard with API metrics',
      'All Pro features included',
      'Priority 24/7 technical support',
    ],
    hasBulkGeneration: true,
    hasCsvExport: true,
    hasSavedHistory: true,
    hasApiAccess: true,
    hasPrioritySupport: true,
    lemonSqueezyVariantId: process.env.LEMON_SQUEEZY_PREMIUM_VARIANT_ID || process.env.LEMONSQUEEZY_PREMIUM_VARIANT_ID || '',
    paddlePriceId: process.env.PADDLE_PREMIUM_PRICE_ID || '',
  },
};

export function getPlanConfig(plan: PlanTier): PlanConfig {
  return PLANS[plan] || PLANS.free;
}
