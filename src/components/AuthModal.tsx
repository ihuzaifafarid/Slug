import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  Loader2, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  Shield,
  KeyRound,
  Terminal,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth, AuthModalMode } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const AuthModal: React.FC = () => {
  const { 
    authModalState, 
    closeAuthModal, 
    login, 
    register, 
    setSessionFromAuth,
    openAdmin 
  } = useAuth();
  const { showToast } = useToast();

  const [mode, setMode] = useState<AuthModalMode>(authModalState.mode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [setupKey, setSetupKey] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showSetupKey, setShowSetupKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resetSentMessage, setResetSentMessage] = useState<string | null>(null);

  // Sync mode from context
  React.useEffect(() => {
    setMode(authModalState.mode);
    setErrorMessage(null);
    setResetSentMessage(null);
    if (authModalState.mode === 'admin-recovery') {
      setEmail('huzaifaahmedary@gmail.com');
    }
  }, [authModalState.mode, authModalState.isOpen]);

  if (!authModalState.isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const result = await login(email, password);
        if (result.success) {
          showToast({ title: 'Welcome back!', snippet: 'Signed in successfully', type: 'success' });
        } else {
          setErrorMessage(result.error || 'Invalid credentials');
        }
      } else if (mode === 'register') {
        const result = await register(email, password, name);
        if (result.success) {
          showToast({ title: 'Account created!', snippet: 'Enjoy 20 free generations every day', type: 'success' });
        } else {
          setErrorMessage(result.error || 'Failed to create account');
        }
      } else if (mode === 'forgot') {
        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (data.resetToken) {
          setResetToken(data.resetToken);
        }
        setResetSentMessage(data.message || 'Password reset link generated.');
        showToast({ title: 'Password Reset', snippet: data.message, type: 'info' });
      } else if (mode === 'reset') {
        if (password.length < 6) {
          setErrorMessage('Password must be at least 6 characters long.');
          setIsLoading(false);
          return;
        }
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: resetToken, newPassword: password }),
        });
        const data = await res.json();
        if (!res.ok) {
          setErrorMessage(data.error || 'Failed to reset password');
        } else {
          if (data.token && data.user) {
            setSessionFromAuth(data.token, data.user, data.subscription, data.usage);
          }
          showToast({ title: 'Password Reset', snippet: 'You are now signed in', type: 'success' });
          closeAuthModal();
        }
      } else if (mode === 'admin-recovery') {
        if (password !== confirmPassword) {
          setErrorMessage('Passwords do not match. Please re-enter.');
          setIsLoading(false);
          return;
        }
        if (password.length < 8) {
          setErrorMessage('Admin password must be at least 8 characters long for security.');
          setIsLoading(false);
          return;
        }

        const res = await fetch('/api/auth/admin-reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim(),
            newPassword: password,
            setupKey: setupKey.trim(),
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setErrorMessage(data.error || 'Failed to update administrator account.');
        } else {
          setSessionFromAuth(data.token, data.user, data.subscription, data.usage);
          showToast({
            title: 'Admin Account Configured!',
            snippet: 'Signed in as Administrator. Opening Admin Console...',
            type: 'success',
            duration: 5000,
          });
          closeAuthModal();
          setTimeout(() => {
            openAdmin();
          }, 350);
        }
      }
    } catch {
      setErrorMessage('A network error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl p-6 sm:p-7 relative transition-colors max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className={`w-10 h-10 mx-auto mb-3 rounded-xl flex items-center justify-center font-bold shadow-xs ${
            mode === 'admin-recovery' 
              ? 'bg-purple-900 text-purple-200' 
              : 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-950'
          }`}>
            {mode === 'admin-recovery' ? (
              <Shield className="w-5 h-5 text-purple-300" />
            ) : (
              <Sparkles className="w-5 h-5 text-indigo-400 dark:text-indigo-600" />
            )}
          </div>
          <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
            {mode === 'login' && 'Sign in to Slugify Pro'}
            {mode === 'register' && 'Create your free account'}
            {mode === 'forgot' && 'Reset your password'}
            {mode === 'reset' && 'Set new password'}
            {mode === 'admin-recovery' && 'Admin & Owner Recovery'}
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            {mode === 'login' && 'Access your daily quotas, cloud history & subscription'}
            {mode === 'register' && 'Start with 20 daily slug generations at $0/month'}
            {mode === 'forgot' && "Enter your email to request password reset instructions"}
            {mode === 'reset' && 'Enter your reset token and choose a new password'}
            {mode === 'admin-recovery' && 'Set or reset the administrator password using your server key'}
          </p>
        </div>

        {/* Tab Toggle for Login / Register */}
        {(mode === 'login' || mode === 'register') && (
          <div className="flex p-1 mb-5 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMessage(null); }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setErrorMessage(null); }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Error Feedback */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Forgot confirmation state */}
        {mode === 'forgot' && resetSentMessage ? (
          <div className="py-4 text-center space-y-4">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500" />
            <div>
              <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Reset Token Ready</h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-xs mx-auto">
                {resetSentMessage}
              </p>
            </div>

            {resetToken && (
              <div className="p-3 bg-neutral-100 dark:bg-neutral-800/80 rounded-xl text-left border border-neutral-200 dark:border-neutral-700">
                <p className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 mb-1">Your Reset Token:</p>
                <p className="font-mono text-xs break-all text-indigo-600 dark:text-indigo-400 selection:bg-indigo-100">{resetToken}</p>
              </div>
            )}

            <button
              type="button"
              onClick={() => setMode('reset')}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Enter New Password Now
            </button>
            <button
              type="button"
              onClick={() => setMode('login')}
              className="block w-full text-center text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200"
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          /* Main Form */
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Your Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-neutral-100 focus:bg-white dark:focus:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            {mode !== 'reset' && (
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  {mode === 'admin-recovery' ? 'Administrator Email' : 'Email Address'}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="huzaifaahmedary@gmail.com"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-neutral-100 focus:bg-white dark:focus:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Server Setup Key (for Admin Recovery) */}
            {mode === 'admin-recovery' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-purple-600" />
                    <span>Server Setup Key</span>
                  </label>
                  <span className="text-[10px] text-neutral-400">data/admin_setup_key.secret</span>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showSetupKey ? 'text' : 'password'}
                    required
                    value={setupKey}
                    onChange={(e) => setSetupKey(e.target.value)}
                    placeholder="adm_key_..."
                    className="w-full pl-9 pr-9 py-2.5 text-xs font-mono bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-neutral-100 focus:bg-white dark:focus:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-purple-600 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSetupKey(!showSetupKey)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 cursor-pointer"
                  >
                    {showSetupKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-neutral-500 mt-1">
                  Found in your server console log, <code className="bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded">data/admin_setup_key.secret</code>, or the <code className="bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded">ADMIN_SETUP_KEY</code> env var.
                </p>
              </div>
            )}

            {/* Reset Token (for regular password reset) */}
            {mode === 'reset' && (
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Reset Token
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                    <KeyRound className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    placeholder="Paste 48-character token"
                    className="w-full pl-9 pr-3 py-2.5 text-xs font-mono bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-neutral-100 focus:bg-white dark:focus:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Password Field */}
            {mode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                    {mode === 'admin-recovery' ? 'New Admin Password (min 8 chars)' : 'Password'}
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-[11px] text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={mode === 'admin-recovery' ? 8 : 6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === 'admin-recovery' ? '••••••••••••' : '••••••••'}
                    className="w-full pl-9 pr-9 py-2.5 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-neutral-100 focus:bg-white dark:focus:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Confirm Password (for Admin Recovery) */}
            {mode === 'admin-recovery' && (
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-neutral-100 focus:bg-white dark:focus:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-purple-600 transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full mt-2 inline-flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold rounded-xl shadow-xs transition-all duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                mode === 'admin-recovery'
                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                  : 'bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-950'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>
                    {mode === 'login' && 'Sign In'}
                    {mode === 'register' && 'Create Account'}
                    {mode === 'forgot' && 'Generate Reset Link'}
                    {mode === 'reset' && 'Update Password'}
                    {mode === 'admin-recovery' && 'Set Admin Password & Sign In'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Dedicated Admin Portal Toggle for Website Owner */}
        {mode === 'login' && (
          <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={() => { setMode('admin-recovery'); setErrorMessage(null); }}
              className="w-full py-2 px-3 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer border border-purple-200/60 dark:border-purple-800/40"
            >
              <Shield className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>Website Owner? Admin Password Setup &amp; Recovery</span>
            </button>
          </div>
        )}

        {/* CLI Hint when on Admin Recovery */}
        {mode === 'admin-recovery' && (
          <div className="mt-4 p-3 bg-neutral-50 dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-800 text-[11px] text-neutral-600 dark:text-neutral-400 space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-neutral-800 dark:text-neutral-200">
              <Terminal className="w-3.5 h-3.5 text-indigo-500" />
              <span>Prefer command-line setup?</span>
            </div>
            <p className="text-neutral-500">Run this in your terminal to set your admin password directly:</p>
            <div className="bg-neutral-900 text-neutral-200 p-2 rounded-lg font-mono text-[10px] select-all overflow-x-auto">
              npm run setup-admin -- password="YourSecurePassword"
            </div>
          </div>
        )}

        {/* Footer info & Return links */}
        <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 text-center text-[11px] text-neutral-400 dark:text-neutral-500">
          {mode === 'forgot' || mode === 'reset' || mode === 'admin-recovery' ? (
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMessage(null); }}
              className="text-neutral-600 dark:text-neutral-300 font-medium hover:underline cursor-pointer"
            >
              Return to standard Sign In
            </button>
          ) : (
            <span>
              By signing up, you agree to our Terms of Service &amp; Privacy Policy.
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
