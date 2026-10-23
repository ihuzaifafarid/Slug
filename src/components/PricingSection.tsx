import React, { useState } from 'react';
import { Check, Sparkles, Zap, Shield, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth, PlanTier } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface PricingTier {
  id: PlanTier;
  name: string;
  tagline: string;
  priceMonthly: number;
  popular?: boolean;
  dailyQuota: string;
  batchLimit: string;
  features: string[];
  ctaLabel: string;
}

const TIERS: PricingTier[] = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'Essential URL slug generator for creators, writers & personal blogs.',
    priceMonthly: 0,
    dailyQuota: '20 generations / day',
    batchLimit: '1 slug at a time',
    features: [
      '20 slug generations per day',
      'Single slug generator',
      'Hyphen & underscore separators',
      'Live URL preview with custom domain',
      'Real-time SEO character counter & read time',
      'Local history of 5 recent slugs',
      'AI-powered slug suggestions',
    ],
    ctaLabel: 'Current Plan',
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'Built for SEO consultants, marketing teams & active publishers.',
    priceMonthly: 5,
    popular: true,
    dailyQuota: '1,000 generations / day',
    batchLimit: 'Up to 100 slugs / batch',
    features: [
      '1,000 slug generations per day',
      'Bulk batch generator (up to 100 titles/batch)',
      'Export slugs to CSV for 301 redirects',
      'Cloud generation history (up to 500 items)',
      'Advanced length limits & Unicode settings',
      'Dedicated user dashboard & quota monitor',
      'Fast standard email support',
    ],
    ctaLabel: 'Upgrade to Pro',
  },
  {
    id: 'premium',
    name: 'Premium',
    tagline: 'For high-volume e-commerce catalogs, agencies & developers.',
    priceMonthly: 12,
    dailyQuota: '10,000 generations / day',
    batchLimit: 'Up to 1,000 slugs / batch',
    features: [
      '10,000 slug generations per day',
      'Massive batch generator (up to 1,000 titles/batch)',
      'REST API access with Bearer sk_live_ keys',
      'Catalog migration CSV import & export',
      'All Pro features included',
      'Rate limit: 60 API requests/minute',
      'Priority 24/7 technical support',
    ],
    ctaLabel: 'Upgrade to Premium',
  },
];

export const PricingSection: React.FC = () => {
  const { user, subscription, upgradeToPlan, openAuthModal } = useAuth();
  const { showToast } = useToast();
  const [loadingPlan, setLoadingPlan] = useState<PlanTier | null>(null);

  const currentPlan = subscription?.plan || 'free';

  const handleSelectPlan = async (tier: PricingTier) => {
    if (!user) {
      openAuthModal('register');
      return;
    }

    if (tier.id === currentPlan) {
      showToast({ title: 'Active Plan', snippet: `You are already subscribed to ${tier.name}`, type: 'info' });
      return;
    }

    setLoadingPlan(tier.id);
    try {
      const res = await upgradeToPlan(tier.id);
      if (res.success && res.checkoutUrl) {
        showToast({
          title: 'Opening Lemon Squeezy',
          snippet: `Redirecting to checkout for ${tier.name}...`,
          type: 'info',
        });
      } else if (res.configMissing) {
        showToast({
          title: 'Payment Gateway Setup Required',
          snippet: 'Please configure Lemon Squeezy credentials to activate live checkouts.',
          type: 'info',
        });
      } else if (res.error) {
        showToast({
          title: 'Checkout Failed',
          snippet: res.error,
          type: 'error',
        });
      }
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <section id="pricing" className="py-20 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-3 border border-indigo-200 dark:border-indigo-800">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Monetization &amp; Plans</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 dark:text-neutral-100 tracking-tight">
            Transparent pricing for every SEO scale
          </h2>
          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 mt-3">
            Start completely free with 20 daily generations. Upgrade anytime for bulk processing, CSV exports, cloud history, and developer API access.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {TIERS.map((tier) => {
            const isCurrent = user && currentPlan === tier.id;
            const isUpgrading = loadingPlan === tier.id;

            return (
              <div
                key={tier.id}
                className={`relative rounded-2xl p-7 flex flex-col justify-between transition-all duration-200 ${
                  tier.popular
                    ? 'bg-white dark:bg-neutral-900 border-2 border-indigo-600 dark:border-indigo-500 shadow-xl shadow-indigo-500/5'
                    : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs hover:border-neutral-300 dark:hover:border-neutral-700'
                }`}
              >
                {/* Popular Badge */}
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-indigo-600 text-white text-[11px] font-bold rounded-full uppercase tracking-wider shadow-xs">
                    Most Popular
                  </div>
                )}

                <div>
                  {/* Card Title & Tagline */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                      {tier.name}
                    </h3>
                    {isCurrent && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        Current Plan
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 min-h-[32px]">
                    {tier.tagline}
                  </p>

                  {/* Price */}
                  <div className="mt-5 pb-5 border-b border-neutral-100 dark:border-neutral-800">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold text-neutral-900 dark:text-neutral-100">
                        ${tier.priceMonthly}
                      </span>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                        / month
                      </span>
                    </div>
                    <div className="mt-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" />
                      <span>{tier.dailyQuota}</span>
                    </div>
                  </div>

                  {/* Feature List */}
                  <ul className="mt-6 space-y-3 text-xs text-neutral-700 dark:text-neutral-300">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Call to Action Button */}
                <div className="mt-8 pt-5 border-t border-neutral-100 dark:border-neutral-800">
                  <button
                    type="button"
                    disabled={isCurrent || isUpgrading}
                    onClick={() => handleSelectPlan(tier)}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer ${
                      isCurrent
                        ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 cursor-default'
                        : tier.popular
                        ? 'bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-950 shadow-sm active:scale-[0.98]'
                        : 'bg-white hover:bg-neutral-100 dark:bg-neutral-800 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 active:scale-[0.98]'
                    }`}
                  >
                    {isUpgrading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Opening Checkout...</span>
                      </>
                    ) : isCurrent ? (
                      <span>Active Plan</span>
                    ) : (
                      <>
                        <span>{tier.ctaLabel}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>

                  <p className="text-[11px] text-center text-neutral-400 dark:text-neutral-500 mt-2">
                    {tier.priceMonthly === 0 ? 'No credit card needed' : 'Cancel or switch anytime · Lemon Squeezy MoR'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Security & Guarantee Note */}
        <div className="mt-12 p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-600 dark:text-neutral-400">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              Secure billing with Merchant of Record compliance, global payment support (including Pakistan), and instant server-side quota activation.
            </span>
          </div>
          <a href="#faq" className="font-semibold text-neutral-900 dark:text-neutral-100 hover:underline shrink-0">
            Have questions? View FAQ →
          </a>
        </div>

      </div>
    </section>
  );
};
