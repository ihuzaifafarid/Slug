import React, { useState } from 'react';
import { X, CreditCard, ShieldAlert, Copy, Check, ExternalLink, HelpCircle, Key, Store, Webhook } from 'lucide-react';
import { PlanTier } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface PaymentSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: PlanTier;
  missingKeys: string[];
  errorMessage?: string;
}

export const PaymentSetupModal: React.FC<PaymentSetupModalProps> = ({
  isOpen,
  onClose,
  plan,
  missingKeys,
  errorMessage,
}) => {
  const { showToast } = useToast();
  const [copiedEnv, setCopiedEnv] = useState(false);

  if (!isOpen) return null;

  const targetPlanName = plan === 'premium' ? 'Premium ($12/mo)' : 'Pro ($5/mo)';

  const envSnippet = `# Lemon Squeezy Production Configuration
LEMON_SQUEEZY_API_KEY="your_api_key_here"
LEMON_SQUEEZY_STORE_ID="your_numeric_store_id"
LEMON_SQUEEZY_WEBHOOK_SECRET="your_webhook_secret_here"
LEMON_SQUEEZY_PRO_VARIANT_ID="your_pro_variant_id"
LEMON_SQUEEZY_PREMIUM_VARIANT_ID="your_premium_variant_id"`;

  const handleCopyEnv = async () => {
    try {
      await navigator.clipboard.writeText(envSnippet);
      setCopiedEnv(true);
      showToast({
        title: 'Environment template copied',
        snippet: 'Paste into your server .env file',
        type: 'success',
      });
      setTimeout(() => setCopiedEnv(false), 2500);
    } catch {
      // fallback
    }
  };

  const keyDetails: Record<string, { label: string; desc: string }> = {
    LEMON_SQUEEZY_API_KEY: {
      label: 'API Key',
      desc: 'Generate in Lemon Squeezy Dashboard → Settings → API Keys',
    },
    LEMON_SQUEEZY_STORE_ID: {
      label: 'Store ID',
      desc: 'Found in Lemon Squeezy Dashboard → Settings → Stores',
    },
    LEMON_SQUEEZY_WEBHOOK_SECRET: {
      label: 'Webhook Secret',
      desc: 'Set up in Lemon Squeezy Dashboard → Settings → Webhooks',
    },
    LEMON_SQUEEZY_PRO_VARIANT_ID: {
      label: 'Pro Variant ID',
      desc: 'Product variant ID for the $5/month Pro subscription tier',
    },
    LEMON_SQUEEZY_PREMIUM_VARIANT_ID: {
      label: 'Premium Variant ID',
      desc: 'Product variant ID for the $12/month Premium subscription tier',
    },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                Payment Gateway Setup Required
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Lemon Squeezy checkout for {targetPlanName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Status Message */}
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/80 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
              <span className="font-bold block mb-1">Account remains on Free Plan</span>
              {errorMessage || `To open the real Lemon Squeezy checkout session for ${targetPlanName}, the server requires your Lemon Squeezy store and variant credentials.`}
              <p className="mt-1 text-[11px] text-amber-800 dark:text-amber-300">
                Per security policy, accounts are never simulated or upgraded until a valid webhook event is received from Lemon Squeezy.
              </p>
            </div>
          </div>

          {/* Missing Keys Section */}
          {missingKeys && missingKeys.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-2">
                Missing Server Configuration ({missingKeys.length})
              </h4>
              <div className="space-y-2">
                {missingKeys.map((key) => {
                  const info = keyDetails[key] || { label: key, desc: 'Required environment variable' };
                  return (
                    <div 
                      key={key}
                      className="p-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <code className="font-mono font-bold text-rose-600 dark:text-rose-400 text-[11px]">
                            {key}
                          </code>
                          <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                            Required
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                          {info.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4-Step Quick Setup Guide */}
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-3">
            <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>How to Configure Lemon Squeezy</span>
            </h4>
            <ol className="text-xs text-neutral-600 dark:text-neutral-400 space-y-2 list-decimal list-inside leading-relaxed">
              <li>
                <strong className="text-neutral-800 dark:text-neutral-200">Create a Store:</strong> Log into Lemon Squeezy and create your store (supports merchants worldwide, including Pakistan via Merchant of Record).
              </li>
              <li>
                <strong className="text-neutral-800 dark:text-neutral-200">Create Products:</strong> Add a <em>Pro</em> ($5/mo) and <em>Premium</em> ($12/mo) subscription product. Copy their numeric Variant IDs.
              </li>
              <li>
                <strong className="text-neutral-800 dark:text-neutral-200">Generate API Key:</strong> In <em>Settings → API Keys</em>, create a key and copy it to <code className="font-mono text-neutral-800 dark:text-neutral-200">LEMON_SQUEEZY_API_KEY</code>.
              </li>
              <li>
                <strong className="text-neutral-800 dark:text-neutral-200">Set Webhook:</strong> In <em>Settings → Webhooks</em>, add an endpoint for <code className="font-mono text-neutral-800 dark:text-neutral-200">/api/billing/webhook</code> subscribing to <code className="font-mono text-neutral-800 dark:text-neutral-200">subscription_created</code>, <code className="font-mono text-neutral-800 dark:text-neutral-200">subscription_payment_success</code>, etc.
              </li>
            </ol>
          </div>

          {/* Environment Template Copy Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              <span>Environment Variables Template (.env)</span>
              <button
                type="button"
                onClick={handleCopyEnv}
                className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                {copiedEnv ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Config</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3 bg-neutral-900 text-neutral-100 rounded-xl font-mono text-[11px] overflow-x-auto leading-relaxed border border-neutral-800 select-all">
              {envSnippet}
            </pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50 flex items-center justify-between">
          <span className="text-[11px] text-neutral-500">
            Free users stay Free until verified payment
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 text-xs font-semibold rounded-xl hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors cursor-pointer"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
