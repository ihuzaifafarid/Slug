import React, { createContext, useContext, useState, useEffect } from 'react';

export type PlanTier = 'free' | 'pro' | 'premium';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  emailVerified: boolean;
}

export interface UserSubscription {
  id: string;
  userId: string;
  plan: PlanTier;
  status: 'active' | 'cancelled' | 'past_due';
  provider: string;
  currentPeriodEnd?: string;
}

export interface DailyQuota {
  count: number;
  limit: number;
  remaining: number;
  resetsAtUtc: string;
}

export type AuthModalMode = 'login' | 'register' | 'forgot' | 'reset' | 'admin-recovery';

interface AuthContextType {
  user: UserProfile | null;
  subscription: UserSubscription | null;
  quota: DailyQuota;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateQuota: (newQuota: DailyQuota) => void;
  setSessionFromAuth: (token: string, user: UserProfile, subscription: UserSubscription, usage?: DailyQuota) => void;
  openAuthModal: (mode?: AuthModalMode) => void;
  closeAuthModal: () => void;
  authModalState: { isOpen: boolean; mode: AuthModalMode };
  openDashboard: () => void;
  closeDashboard: () => void;
  isDashboardOpen: boolean;
  openAdmin: () => void;
  closeAdmin: () => void;
  isAdminOpen: boolean;
  upgradeToPlan: (plan: PlanTier) => Promise<{ 
    checkoutUrl?: string; 
    success: boolean; 
    configMissing?: boolean; 
    missingKeys?: string[]; 
    message?: string; 
    error?: string; 
  }>;
  openPaymentConfigModal: (plan: PlanTier, missingKeys: string[], errorMessage?: string) => void;
  closePaymentConfigModal: () => void;
  paymentConfigModalState: { isOpen: boolean; plan: PlanTier; missingKeys: string[]; errorMessage?: string };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'slugify_token_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [quota, setQuota] = useState<DailyQuota>({
    count: 0,
    limit: 20,
    remaining: 20,
    resetsAtUtc: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [authModalState, setAuthModalState] = useState<{ isOpen: boolean; mode: AuthModalMode }>({
    isOpen: false,
    mode: 'login',
  });
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [paymentConfigModalState, setPaymentConfigModalState] = useState<{
    isOpen: boolean;
    plan: PlanTier;
    missingKeys: string[];
    errorMessage?: string;
  }>({
    isOpen: false,
    plan: 'pro',
    missingKeys: [],
  });

  const setSessionFromAuth = (newToken: string, newUser: UserProfile, newSubscription: UserSubscription, newQuota?: DailyQuota) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    setUser(newUser);
    setSubscription(newSubscription);
    if (newQuota) setQuota(newQuota);
    closeAuthModal();
  };

  const openAuthModal = (mode: AuthModalMode = 'login') => {
    setAuthModalState({ isOpen: true, mode });
  };
  const closeAuthModal = () => {
    setAuthModalState((prev) => ({ ...prev, isOpen: false }));
  };

  const openDashboard = () => setIsDashboardOpen(true);
  const closeDashboard = () => setIsDashboardOpen(false);

  const openAdmin = () => setIsAdminOpen(true);
  const closeAdmin = () => setIsAdminOpen(false);

  const openPaymentConfigModal = (plan: PlanTier, missingKeys: string[], errorMessage?: string) => {
    setPaymentConfigModalState({ isOpen: true, plan, missingKeys, errorMessage });
  };
  const closePaymentConfigModal = () => {
    setPaymentConfigModalState((prev) => ({ ...prev, isOpen: false }));
  };

  const updateQuota = (newQuota: DailyQuota) => {
    setQuota(newQuota);
  };

  // Fetch current user details or anonymous quota from /api/auth/me
  const refreshUser = async () => {
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const headers: Record<string, string> = {};
      if (storedToken) {
        headers['Authorization'] = `Bearer ${storedToken}`;
      }

      const res = await fetch('/api/auth/me', { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
          setSubscription(data.subscription || { plan: 'free', status: 'active', id: 'default', userId: data.user.id, provider: 'manual' });
        } else {
          setUser(null);
          setSubscription(null);
        }
        if (data.usage) {
          setQuota(data.usage);
        }
      } else if (res.status === 401) {
        // Token invalid or expired
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
        setSubscription(null);
      }
    } catch (err) {
      console.error('Failed to load user profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, [token]);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to sign in.' };
      }

      localStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      setUser(data.user);
      setSubscription(data.subscription);
      if (data.usage) setQuota(data.usage);
      closeAuthModal();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error during sign in.' };
    }
  };

  const register = async (email: string, password: string, name?: string) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to create account.' };
      }

      localStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      setUser(data.user);
      setSubscription(data.subscription);
      if (data.usage) setQuota(data.usage);
      closeAuthModal();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error during registration.' };
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setSubscription(null);
    setIsDashboardOpen(false);
    setIsAdminOpen(false);
    refreshUser();
  };

  const upgradeToPlan = async (plan: PlanTier): Promise<{
    checkoutUrl?: string;
    success: boolean;
    configMissing?: boolean;
    missingKeys?: string[];
    message?: string;
    error?: string;
  }> => {
    if (!user || !token) {
      openAuthModal('register');
      return { success: false, message: 'Please create an account or sign in to upgrade.' };
    }

    try {
      // Request real Lemon Squeezy checkout session from backend
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ plan }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.url) {
        // Real checkout URL received: redirect user directly to Lemon Squeezy checkout
        window.location.href = data.url;
        return { success: true, checkoutUrl: data.url, message: 'Redirecting to Lemon Squeezy checkout...' };
      }

      // If Lemon Squeezy configuration or variant IDs are missing on server
      if (res.status === 503 || data.code === 'PAYMENT_CONFIG_MISSING') {
        const missing = data.missingKeys || [
          'LEMON_SQUEEZY_API_KEY',
          'LEMON_SQUEEZY_STORE_ID',
          plan === 'premium' ? 'LEMON_SQUEEZY_PREMIUM_VARIANT_ID' : 'LEMON_SQUEEZY_PRO_VARIANT_ID'
        ];
        openPaymentConfigModal(plan, missing, data.message);
        return {
          success: false,
          configMissing: true,
          missingKeys: missing,
          message: data.message || 'Lemon Squeezy payment configuration is incomplete.',
        };
      }

      // If Lemon Squeezy API returned an error or unhandled status
      const errorMsg = data.message || data.error || 'Unable to connect to Lemon Squeezy checkout.';
      openPaymentConfigModal(plan, [], errorMsg);
      return { success: false, error: errorMsg, message: errorMsg };
    } catch (err: any) {
      const errorMsg = err?.message || 'Network error connecting to payment gateway.';
      openPaymentConfigModal(plan, [], errorMsg);
      return { success: false, error: errorMsg, message: errorMsg };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        subscription,
        quota,
        token,
        isLoading,
        isAuthenticated: Boolean(user),
        isAdmin: user?.role === 'admin',
        login,
        register,
        logout,
        refreshUser,
        updateQuota,
        setSessionFromAuth,
        openAuthModal,
        closeAuthModal,
        authModalState,
        openDashboard,
        closeDashboard,
        isDashboardOpen,
        openAdmin,
        closeAdmin,
        isAdminOpen,
        upgradeToPlan,
        openPaymentConfigModal,
        closePaymentConfigModal,
        paymentConfigModalState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
