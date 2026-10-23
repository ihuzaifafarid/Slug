import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Zap, 
  Clock, 
  History, 
  Key, 
  CreditCard, 
  Download, 
  Trash2, 
  Copy, 
  Check, 
  ExternalLink, 
  Plus, 
  ShieldAlert, 
  Loader2,
  Code2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface HistoryRecord {
  id: string;
  title: string;
  slug: string;
  mode: 'single' | 'batch';
  wordCount: number;
  charCount: number;
  createdAt: string;
}

interface ApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  rateLimitPerMin: number;
  lastUsedAt?: string;
  createdAt: string;
  status: 'active' | 'revoked';
}

export const UserDashboardModal: React.FC = () => {
  const { user, subscription, quota, isDashboardOpen, closeDashboard, token, refreshUser, upgradeToPlan } = useAuth();
  const { showToast, showCopySlugToast } = useToast();

  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'api' | 'billing'>('overview');
  const [historyItems, setHistoryItems] = useState<HistoryRecord[]>([]);
  const [historySearch, setHistorySearch] = useState('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // API Keys state
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdRawKey, setCreatedRawKey] = useState<string | null>(null);
  const [isCreatingKey, setIsCreatingKey] = useState(false);
  const [isUpgradingPlan, setIsUpgradingPlan] = useState<string | null>(null);

  const handleUpgradeClick = async (plan: 'pro' | 'premium') => {
    setIsUpgradingPlan(plan);
    try {
      await upgradeToPlan(plan);
    } finally {
      setIsUpgradingPlan(null);
    }
  };

  // Calculate UTC reset hours remaining
  const getHoursUntilReset = () => {
    const now = new Date();
    const hours = 23 - now.getUTCHours();
    const mins = 59 - now.getUTCMinutes();
    return `${hours}h ${mins}m`;
  };

  const currentPlan = subscription?.plan || 'free';
  const isProOrPremium = currentPlan === 'pro' || currentPlan === 'premium' || user?.role === 'admin';
  const isPremium = currentPlan === 'premium' || user?.role === 'admin';

  // Fetch Cloud History
  const fetchHistory = async () => {
    if (!token) return;
    setIsLoadingHistory(true);
    try {
      const res = await fetch('/api/user/history', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setHistoryItems(data.history || []);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Fetch API Keys
  const fetchApiKeys = async () => {
    if (!token || !isPremium) return;
    try {
      const res = await fetch('/api/user/api-keys', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setApiKeys(data.keys || []);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (isDashboardOpen) {
      refreshUser();
      fetchHistory();
      if (isPremium) fetchApiKeys();
    }
  }, [isDashboardOpen, activeTab, isPremium]);

  if (!isDashboardOpen || !user) return null;

  // Usage percentage
  const usagePct = Math.min(100, Math.round((quota.count / Math.max(1, quota.limit)) * 100));

  // Copy helper
  const handleCopy = async (text: string, title: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast({ title, snippet: text, type: 'success' });
    } catch {
      // fallback
    }
  };

  // Delete history item
  const handleDeleteHistory = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/user/history/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setHistoryItems((prev) => prev.filter((item) => item.id !== id));
        showToast({ title: 'Removed slug from history', type: 'info' });
      }
    } catch {
      // ignore
    }
  };

  // Export history CSV
  const handleExportCsv = () => {
    if (historyItems.length === 0) {
      showToast({ title: 'No history items to export', type: 'info' });
      return;
    }
    const headers = 'Title,Slug,Word_Count,Char_Count,Date_UTC\n';
    const rows = historyItems
      .map(
        (item) =>
          `"${item.title.replace(/"/g, '""')}","${item.slug}",${item.wordCount},${item.charCount},"${item.createdAt}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `slug-history-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast({ title: 'Exported history to CSV', snippet: `${historyItems.length} records exported`, type: 'success' });
  };

  // Create API Key
  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !isPremium) return;
    setIsCreatingKey(true);
    try {
      const res = await fetch('/api/user/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newKeyName || 'Production Key' }),
      });
      if (res.ok) {
        const data = await res.json();
        setCreatedRawKey(data.key);
        setNewKeyName('');
        fetchApiKeys();
        showToast({ title: 'API Key created', snippet: 'Store it safely now', type: 'success' });
      }
    } catch {
      showToast({ title: 'Failed to create key', type: 'error' });
    } finally {
      setIsCreatingKey(false);
    }
  };

  // Revoke API Key
  const handleRevokeApiKey = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/user/api-keys/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchApiKeys();
        showToast({ title: 'API Key revoked', type: 'info' });
      }
    } catch {
      // ignore
    }
  };

  const filteredHistory = historyItems.filter(
    (h) =>
      h.title.toLowerCase().includes(historySearch.toLowerCase()) ||
      h.slug.toLowerCase().includes(historySearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 flex items-center justify-center font-bold text-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                  {user.name}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {currentPlan}
                </span>
                {user.role === 'admin' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                {user.email}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeDashboard}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50 flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Usage &amp; Quotas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'history'
                ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Cloud History ({historyItems.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('api')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'api'
                ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Developer API</span>
            {!isPremium && (
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                PRO+
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('billing')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'billing'
                ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Subscription</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* TAB 1: OVERVIEW & USAGE */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Daily Quota Card */}
              <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div>
                    <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                      <span>Daily Slug Generation Quota</span>
                      <span className="text-xs font-normal text-neutral-500">
                        (Server Enforced)
                      </span>
                    </h4>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      Counts every single slug and batch line atomically in real-time.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-neutral-600 dark:text-neutral-400">
                    <Clock className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Resets in {getHoursUntilReset()} (00:00 UTC)</span>
                  </div>
                </div>

                {/* Progress Meter */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                      {quota.count.toLocaleString()} of {quota.limit.toLocaleString()} used today
                    </span>
                    <span className="text-neutral-500 dark:text-neutral-400">
                      {quota.remaining.toLocaleString()} remaining
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 rounded-full ${
                        usagePct >= 90 ? 'bg-rose-500' : usagePct >= 70 ? 'bg-amber-500' : 'bg-neutral-900 dark:bg-white'
                      }`}
                      style={{ width: `${usagePct}%` }}
                    />
                  </div>
                </div>

                {/* Upgrade prompt if free */}
                {currentPlan === 'free' && (
                  <div className="mt-4 pt-4 border-t border-neutral-200/60 dark:border-neutral-800/60 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">
                      Need to generate hundreds or thousands of slugs at once?
                    </p>
                    <button
                      type="button"
                      disabled={isUpgradingPlan === 'pro'}
                      onClick={() => handleUpgradeClick('pro')}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 disabled:opacity-60"
                    >
                      {isUpgradingPlan === 'pro' ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Opening Checkout...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5" />
                          <span>Upgrade to Pro (1,000 / day)</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Plan Features Card */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                  <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
                    Current Plan
                  </span>
                  <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mt-1 capitalize">
                    {currentPlan} Tier
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    {currentPlan === 'free' ? '$0/month' : currentPlan === 'pro' ? '$5/month' : '$12/month'}
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                  <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
                    Batch Generation
                  </span>
                  <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mt-1">
                    {currentPlan === 'free' ? 'Single only' : currentPlan === 'pro' ? '100 / batch' : '1,000 / batch'}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    {currentPlan === 'free' ? 'Upgrade for bulk' : 'CSV bulk export ready'}
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                  <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
                    API Access
                  </span>
                  <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mt-1">
                    {isPremium ? 'Enabled' : 'Disabled'}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    {isPremium ? '60 requests / min' : 'Premium plan required'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CLOUD SLUG HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <input
                  type="text"
                  placeholder="Search saved slugs..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="px-3.5 py-2 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white max-w-xs"
                />

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportCsv}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 text-xs font-semibold rounded-xl hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              {isLoadingHistory ? (
                <div className="py-12 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-neutral-400" />
                  <p className="text-xs text-neutral-500 mt-2">Loading cloud history...</p>
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="py-12 text-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl">
                  <History className="w-8 h-8 mx-auto text-neutral-300 dark:text-neutral-700 mb-2" />
                  <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                    No saved slugs in cloud history
                  </p>
                  <p className="text-xs text-neutral-400 max-w-sm mx-auto mt-1">
                    Slugs you generate while logged in will automatically sync to your account.
                  </p>
                </div>
              ) : (
                <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden divide-y divide-neutral-100 dark:divide-neutral-800">
                  {filteredHistory.map((item) => (
                    <div key={item.id} className="p-3.5 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-950 transition-colors flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-neutral-900 dark:text-neutral-100 truncate">
                          {item.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <code className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 truncate">
                            /{item.slug}
                          </code>
                          <span className="text-[10px] text-neutral-400">·</span>
                          <span className="text-[10px] text-neutral-400 font-mono">
                            {item.charCount} ch · {item.wordCount} words
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(item.slug);
                            showCopySlugToast(item.slug);
                          }}
                          className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:hover:text-white rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                          title="Copy slug"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteHistory(item.id)}
                          className="p-1.5 text-neutral-400 hover:text-rose-600 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                          title="Delete from history"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DEVELOPER API */}
          {activeTab === 'api' && (
            <div className="space-y-6">
              {!isPremium ? (
                <div className="p-6 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-center space-y-3">
                  <Key className="w-8 h-8 mx-auto text-indigo-600 dark:text-indigo-400" />
                  <h4 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                    Developer API Access is a Premium Feature
                  </h4>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 max-w-md mx-auto">
                    Programmatically generate thousands of SEO slugs directly from your CMS, CI/CD pipeline, Shopify store, or backend services with Bearer authentication.
                  </p>
                  <button
                    type="button"
                    disabled={isUpgradingPlan === 'premium'}
                    onClick={() => handleUpgradeClick('premium')}
                    className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer disabled:opacity-60"
                  >
                    {isUpgradingPlan === 'premium' ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Opening Checkout...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5" />
                        <span>Upgrade to Premium ($12/mo)</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Create New Key Box */}
                  <form onSubmit={handleCreateApiKey} className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                    <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mb-1">
                      Generate New Secret API Key
                    </h4>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
                      Keys grant full programmatic access to slug generation up to 10,000 units/day.
                    </p>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Key name, e.g. Production Shopify Sync"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        className="flex-1 px-3.5 py-2 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white"
                      />
                      <button
                        type="submit"
                        disabled={isCreatingKey}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 text-xs font-semibold rounded-xl hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Generate Key</span>
                      </button>
                    </div>

                    {createdRawKey && (
                      <div className="mt-4 p-3.5 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded-xl space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-amber-800 dark:text-amber-300">
                          <span>Save your API key now:</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(createdRawKey, 'API Key copied!')}
                            className="inline-flex items-center gap-1 text-xs font-semibold underline cursor-pointer"
                          >
                            <Copy className="w-3 h-3" />
                            <span>Copy Key</span>
                          </button>
                        </div>
                        <code className="block p-2 bg-white dark:bg-neutral-900 rounded font-mono text-xs font-bold text-neutral-900 dark:text-neutral-100 break-all select-all">
                          {createdRawKey}
                        </code>
                        <p className="text-[11px] text-amber-700 dark:text-amber-400">
                          For security, this secret key will never be displayed again.
                        </p>
                      </div>
                    )}
                  </form>

                  {/* Existing Keys Table */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                      Active API Keys
                    </h4>
                    {apiKeys.length === 0 ? (
                      <p className="text-xs text-neutral-400">No API keys generated yet.</p>
                    ) : (
                      <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl divide-y divide-neutral-100 dark:divide-neutral-800">
                        {apiKeys.map((key) => (
                          <div key={key.id} className="p-3.5 bg-white dark:bg-neutral-900 flex items-center justify-between gap-4">
                            <div>
                              <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                                {key.name}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <code className="text-xs font-mono text-neutral-500">
                                  {key.keyPrefix}
                                </code>
                                <span className="text-[10px] text-neutral-400">·</span>
                                <span className="text-[10px] text-emerald-600 font-semibold uppercase">
                                  {key.status}
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRevokeApiKey(key.id)}
                              className="text-xs text-rose-600 hover:text-rose-700 font-medium cursor-pointer"
                            >
                              Revoke
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Interactive Code Example */}
                  <div className="p-4 rounded-xl bg-neutral-900 text-neutral-100 space-y-2 text-xs font-mono">
                    <div className="flex items-center justify-between text-neutral-400">
                      <span className="flex items-center gap-1.5 font-sans font-semibold">
                        <Code2 className="w-3.5 h-3.5" />
                        <span>cURL Integration Example</span>
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            `curl -X POST https://sluggenerator.ai.studio/api/v1/generate-slug \\\n  -H "Authorization: Bearer sk_live_your_key" \\\n  -H "Content-Type: application/json" \\\n  -d '{"title": "The Best Running Shoes in 2026", "separator": "-"}'`,
                            'cURL snippet copied'
                          )
                        }
                        className="text-neutral-400 hover:text-white cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <pre className="overflow-x-auto p-2 bg-black/40 rounded text-[11px] leading-relaxed">
{`curl -X POST https://sluggenerator.ai.studio/api/v1/generate-slug \\
  -H "Authorization: Bearer sk_live_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{"title": "The Best Running Shoes in 2026", "separator": "-"}'`}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: BILLING & SUBSCRIPTIONS */}
          {activeTab === 'billing' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                      Subscription Plan
                    </h4>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Billed monthly via Lemon Squeezy Merchant of Record.
                    </p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    Active
                  </span>
                </div>

                <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                  <div>
                    <p className="text-base font-bold text-neutral-900 dark:text-neutral-100 capitalize">
                      {currentPlan} Plan
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {currentPlan === 'free' ? '20 generations per day' : currentPlan === 'pro' ? '1,000 generations per day ($5/mo)' : '10,000 generations per day + API ($12/mo)'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {currentPlan !== 'premium' && (
                      <button
                        type="button"
                        disabled={Boolean(isUpgradingPlan)}
                        onClick={() => handleUpgradeClick(currentPlan === 'free' ? 'pro' : 'premium')}
                        className="px-3 py-1.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 text-xs font-semibold rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
                      >
                        {isUpgradingPlan ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Opening Checkout...</span>
                          </>
                        ) : (
                          <span>Upgrade Tier</span>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                <div className="text-xs text-neutral-500 space-y-1">
                  <p>• Payments are processed securely via Lemon Squeezy (tax compliance &amp; worldwide payouts supported).</p>
                  <p>• You can cancel or change your plan at any time with immediate effect.</p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50 flex items-center justify-between text-xs text-neutral-500">
          <span>Slugify Pro SaaS Engine</span>
          <button
            type="button"
            onClick={closeDashboard}
            className="font-medium text-neutral-700 dark:text-neutral-300 hover:underline cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
