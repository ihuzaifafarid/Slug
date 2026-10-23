import React, { useState, useEffect } from 'react';
import { 
  X, 
  Users, 
  TrendingUp, 
  Globe, 
  DollarSign, 
  Activity, 
  ShieldCheck, 
  Download, 
  RefreshCw, 
  Search, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface MetricsData {
  visitors: {
    daily: number;
    monthly: number;
    pageviewsDaily: number;
    pageviewsWeekly: number;
    pageviewsMonthly: number;
    avgDurationSeconds: number;
  };
  generations: {
    total: number;
    today: number;
  };
  revenue: {
    mrr: number;
    activeSubscriptions: number;
    conversionRate: number;
  };
  users: {
    total: number;
    free: number;
    pro: number;
    premium: number;
  };
  countries: Array<{ country: string; count: number }>;
}

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  plan: 'free' | 'pro' | 'premium';
  subscriptionStatus: string;
  emailVerified: boolean;
  todayUsage: number;
  dailyLimit: number;
  createdAt: string;
}

interface AuditLogItem {
  id: string;
  adminEmail: string;
  action: string;
  targetType: string;
  targetId?: string;
  details: Record<string, any>;
  createdAt: string;
}

export const AdminDashboardModal: React.FC = () => {
  const { isAdminOpen, closeAdmin, token, isAdmin } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'metrics' | 'users' | 'logs'>('metrics');
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = async () => {
    if (!token || !isAdmin) return;
    setIsLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [metricsRes, usersRes, logsRes] = await Promise.all([
        fetch('/api/admin/metrics', { headers }),
        fetch('/api/admin/users', { headers }),
        fetch('/api/admin/audit-logs', { headers }),
      ]);

      if (metricsRes.ok) {
        const m = await metricsRes.json();
        setMetrics(m.metrics);
      }
      if (usersRes.ok) {
        const u = await usersRes.json();
        setUsers(u.users || []);
      }
      if (logsRes.ok) {
        const l = await logsRes.json();
        setAuditLogs(l.logs || []);
      }
    } catch {
      showToast({ title: 'Admin Sync Failed', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdminOpen && isAdmin) {
      fetchData();
    }
  }, [isAdminOpen, isAdmin]);

  if (!isAdminOpen || !isAdmin) return null;

  // Change user's plan
  const handleChangePlan = async (userId: string, plan: 'free' | 'pro' | 'premium') => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan }),
      });
      if (res.ok) {
        showToast({ title: `User plan updated to ${plan}`, type: 'success' });
        fetchData();
      }
    } catch {
      showToast({ title: 'Plan change failed', type: 'error' });
    }
  };

  // Toggle user's role
  const handleToggleRole = async (user: AdminUser) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    try {
      const res = await fetch(`/api/admin/users/${user.id}/role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        showToast({ title: `Role changed to ${newRole}`, type: 'success' });
        fetchData();
      }
    } catch {
      showToast({ title: 'Role change failed', type: 'error' });
    }
  };

  // Export users to CSV
  const handleExportUsersCsv = () => {
    if (users.length === 0) return;
    const headers = 'ID,Name,Email,Role,Plan,Status,Today_Usage,Daily_Limit,Created_At\n';
    const rows = users
      .map(
        (u) =>
          `"${u.id}","${u.name.replace(/"/g, '""')}","${u.email}","${u.role}","${u.plan}","${u.subscriptionStatus}",${u.todayUsage},${u.dailyLimit},"${u.createdAt}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `slugify-users-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast({ title: 'Users exported to CSV', snippet: `${users.length} user records`, type: 'success' });
  };

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.name.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-5xl max-h-[92vh] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-600 text-white font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <span>Slugify Pro — Administrator Console</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  Private Owner Dashboard
                </span>
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Live visitor metrics, geographic distribution, MRR revenue &amp; user access controls.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchData}
              disabled={isLoading}
              className="p-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Refresh admin metrics"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={closeAdmin}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50 flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('metrics')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'metrics'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Platform Analytics &amp; MRR</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'users'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>User Accounts ({users.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'logs'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Audit Logs ({auditLogs.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* TAB 1: METRICS & REVENUE */}
          {activeTab === 'metrics' && (
            <div className="space-y-6">
              {/* Stat Cards 4-grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Revenue & MRR */}
                <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                  <div className="flex items-center justify-between text-neutral-500 text-xs font-semibold uppercase tracking-wider">
                    <span>MRR Revenue</span>
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-2xl font-black text-neutral-900 dark:text-neutral-100 mt-2">
                    ${metrics?.revenue.mrr || 0}
                  </p>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-neutral-500">
                    <span className="font-semibold text-emerald-600">{metrics?.revenue.activeSubscriptions || 0}</span>
                    <span>active subscriptions</span>
                  </div>
                </div>

                {/* Free to Paid Conversion */}
                <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                  <div className="flex items-center justify-between text-neutral-500 text-xs font-semibold uppercase tracking-wider">
                    <span>Conversion Rate</span>
                    <TrendingUp className="w-4 h-4 text-indigo-600" />
                  </div>
                  <p className="text-2xl font-black text-neutral-900 dark:text-neutral-100 mt-2">
                    {metrics?.revenue.conversionRate || 0}%
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    Free visitors to paid subscribers
                  </p>
                </div>

                {/* Total Slug Generations */}
                <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                  <div className="flex items-center justify-between text-neutral-500 text-xs font-semibold uppercase tracking-wider">
                    <span>Slug Generations</span>
                    <Activity className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-2xl font-black text-neutral-900 dark:text-neutral-100 mt-2">
                    {metrics?.generations.total.toLocaleString() || 0}
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    {metrics?.generations.today.toLocaleString() || 0} generated today
                  </p>
                </div>

                {/* Time on Site */}
                <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                  <div className="flex items-center justify-between text-neutral-500 text-xs font-semibold uppercase tracking-wider">
                    <span>Avg Duration</span>
                    <Clock className="w-4 h-4 text-purple-600" />
                  </div>
                  <p className="text-2xl font-black text-neutral-900 dark:text-neutral-100 mt-2">
                    {Math.floor((metrics?.visitors.avgDurationSeconds || 145) / 60)}m {((metrics?.visitors.avgDurationSeconds || 145) % 60)}s
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    Average visitor session duration
                  </p>
                </div>

              </div>

              {/* Visitors & Geographic Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Visitor Breakdown */}
                <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-4">
                  <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                    <Users className="w-4 h-4 text-neutral-500" />
                    <span>Audience &amp; Pageviews</span>
                  </h4>

                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-950">
                      <span className="font-medium text-neutral-600 dark:text-neutral-400">Daily Unique Visitors</span>
                      <span className="font-bold text-neutral-900 dark:text-neutral-100">
                        {metrics?.visitors.daily.toLocaleString() || 1}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-950">
                      <span className="font-medium text-neutral-600 dark:text-neutral-400">Monthly Unique Visitors</span>
                      <span className="font-bold text-neutral-900 dark:text-neutral-100">
                        {metrics?.visitors.monthly.toLocaleString() || 1}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-950">
                      <span className="font-medium text-neutral-600 dark:text-neutral-400">Total Registered Users</span>
                      <span className="font-bold text-neutral-900 dark:text-neutral-100">
                        {metrics?.users.total || 0}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-950">
                      <span className="font-medium text-neutral-600 dark:text-neutral-400">Paid Subscribers (Pro &amp; Premium)</span>
                      <span className="font-bold text-indigo-600">
                        {(metrics?.users.pro || 0) + (metrics?.users.premium || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Country Geographic Distribution */}
                <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-4">
                  <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-neutral-500" />
                    <span>Top Visitor Countries</span>
                  </h4>

                  <div className="space-y-2">
                    {metrics?.countries && metrics.countries.length > 0 ? (
                      metrics.countries.map((c) => {
                        const totalEvents = metrics.countries.reduce((acc, x) => acc + x.count, 0) || 1;
                        const pct = Math.round((c.count / totalEvents) * 100);
                        return (
                          <div key={c.country} className="space-y-1">
                            <div className="flex items-center justify-between text-xs font-medium">
                              <span className="text-neutral-800 dark:text-neutral-200 font-mono">
                                {c.country}
                              </span>
                              <span className="text-neutral-500">
                                {c.count} ({pct}%)
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-purple-600 rounded-full" 
                                style={{ width: `${Math.max(5, pct)}%` }} 
                              />
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-neutral-400">Collecting live geographic traffic...</p>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: USERS MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search users by email or name..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleExportUsersCsv}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 text-xs font-semibold rounded-xl hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Users CSV</span>
                </button>
              </div>

              <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 uppercase font-semibold">
                    <tr>
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Plan</th>
                      <th className="px-4 py-3">Daily Quota</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 bg-white dark:bg-neutral-900">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-950/80 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-neutral-900 dark:text-neutral-100">{u.name}</p>
                          <p className="text-[11px] text-neutral-400 font-mono">{u.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            u.plan === 'premium'
                              ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                              : u.plan === 'pro'
                              ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                          }`}>
                            {u.plan}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono">{u.todayUsage} / {u.dailyLimit}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-semibold ${u.role === 'admin' ? 'text-purple-600' : 'text-neutral-600'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right space-x-2">
                          {/* Plan Switcher */}
                          <select
                            value={u.plan}
                            onChange={(e) => handleChangePlan(u.id, e.target.value as any)}
                            className="text-xs bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded px-2 py-1 cursor-pointer"
                          >
                            <option value="free">Free</option>
                            <option value="pro">Pro</option>
                            <option value="premium">Premium</option>
                          </select>

                          {/* Role Toggle */}
                          <button
                            type="button"
                            onClick={() => handleToggleRole(u)}
                            className="text-[11px] font-medium text-neutral-500 hover:text-purple-600 underline cursor-pointer"
                          >
                            {u.role === 'admin' ? 'Demote' : 'Make Admin'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: AUDIT LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Security &amp; Administrator Audit Trail
              </h4>
              <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl divide-y divide-neutral-100 dark:divide-neutral-800">
                {auditLogs.length === 0 ? (
                  <p className="p-4 text-xs text-neutral-400">No admin audit events yet.</p>
                ) : (
                  auditLogs.map((log) => (
                    <div key={log.id} className="p-3 bg-white dark:bg-neutral-900 text-xs flex items-center justify-between gap-4">
                      <div>
                        <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100 mr-2">
                          {log.action}
                        </span>
                        <span className="text-neutral-500">by {log.adminEmail}</span>
                        {log.details && (
                          <pre className="text-[10px] text-neutral-400 mt-0.5 font-mono">
                            {JSON.stringify(log.details)}
                          </pre>
                        )}
                      </div>
                      <span className="text-[10px] text-neutral-400 shrink-0">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50 flex items-center justify-between text-xs text-neutral-500">
          <span>Role-enforced security · Actions logged to audit table</span>
          <button
            type="button"
            onClick={closeAdmin}
            className="font-medium text-neutral-700 dark:text-neutral-300 hover:underline cursor-pointer"
          >
            Close Console
          </button>
        </div>

      </div>
    </div>
  );
};
