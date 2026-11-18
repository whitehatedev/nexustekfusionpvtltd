import React, { useEffect, useState } from 'react';
import { Lock, ShieldCheck, ArrowRight, KeyRound, AlertCircle } from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';

const COMPANY_LOGO = '/assets/aistudio/image_1a5ac752.png';

export const AdminLoginPage: React.FC = () => {
  const { isSignedIn, isAdmin, dbUser, signInWithAdminCredentials, signInWithGoogle, navigate, apiFetch } = usePlatform();
  const [mode, setMode] = useState<'login' | 'forgot' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [setupStatus, setSetupStatus] = useState<{ configured: boolean; initialAdminEmail?: string | null } | null>(null);

  useEffect(() => {
    if (isSignedIn && isAdmin) {
      navigate('/admin/dashboard');
    }
  }, [isSignedIn, isAdmin, navigate]);

  useEffect(() => {
    apiFetch<{ configured: boolean; initialAdminEmail?: string | null }>('/api/auth/admin-setup-status')
      .then((res) => setSetupStatus(res))
      .catch(() => {});
  }, [apiFetch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');
    setBusy(true);
    try {
      await signInWithAdminCredentials(email.trim(), password);
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Invalid administrator credentials.');
    } finally {
      setBusy(false);
    }
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');
    setBusy(true);
    try {
      const res = await apiFetch<{ message?: string }>('/api/auth/admin-forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() }),
      });
      setInfoMsg(res.message || 'If the admin email exists, a reset token has been dispatched.');
      setMode('reset');
    } catch (err: any) {
      setError(err?.message || 'Failed to initiate password reset.');
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');
    setBusy(true);
    try {
      await apiFetch('/api/auth/admin-reset-password', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim(),
          token: resetToken.trim(),
          newPassword,
        }),
      });
      setInfoMsg('Admin password updated. Sign in below with your new password.');
      setPassword('');
      setResetToken('');
      setNewPassword('');
      setMode('login');
    } catch (err: any) {
      setError(err?.message || 'Invalid or expired reset token.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[82vh] bg-[#0B1B3B] flex items-center justify-center px-4 py-14">
      <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 px-8 py-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 p-1.5 flex items-center justify-center shrink-0">
            <img src={COMPANY_LOGO} alt="NexusTekFusion Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="text-[11px] font-mono font-semibold text-blue-700 uppercase tracking-wider">
              Control Platform
            </div>
            <h1 className="font-display text-xl font-bold text-[#0B1B3B]">NexusTekFusion Admin Login</h1>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {isSignedIn && !isAdmin && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900 space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" /> Account Role Restricted
              </div>
              <p>
                Signed in as <span className="font-mono">{dbUser?.email}</span> ({dbUser?.role}). Sign in with an authorized staff or super admin account below.
              </p>
            </div>
          )}

          {setupStatus && !setupStatus.configured && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3.5 text-xs text-blue-950 space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-blue-700 shrink-0" /> Environment Setup Notice
              </div>
              <p>
                Configure <code className="font-mono">INITIAL_ADMIN_EMAIL</code> and{' '}
                <code className="font-mono">INITIAL_ADMIN_PASSWORD</code> in server environment variables, or sign in with Google if your Super Admin email is authorized.
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-800">
              {error}
            </div>
          )}

          {infoMsg && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-900">
              {infoMsg}
            </div>
          )}

          {mode === 'login' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Administrator Email</label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="admin@nexustekfusion.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:border-blue-700 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setInfoMsg('');
                      setMode('forgot');
                    }}
                    className="text-[11px] font-semibold text-blue-700 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:border-blue-700 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full py-3 bg-[#0B1B3B] hover:bg-[#132954] text-white text-sm font-semibold rounded-lg inline-flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Lock className="w-4 h-4" />
                {busy ? 'Verifying Credentials...' : 'Sign In to Admin Dashboard'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {mode === 'forgot' && (
            <form onSubmit={handleRequestReset} className="space-y-4">
              <div className="text-xs text-slate-600">
                Enter your administrator email address. A one-time password reset token will be generated and emailed (when configured).
              </div>
              <input
                type="email"
                required
                placeholder="admin@nexustekfusion.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={busy}
                  className="flex-1 py-2.5 bg-[#0B1B3B] text-white text-xs font-semibold rounded-lg disabled:opacity-50"
                >
                  {busy ? 'Requesting...' : 'Send Reset Token'}
                </button>
                <button
                  type="button"
                  onClick={() => setMode('reset')}
                  className="px-3 py-2.5 border border-slate-300 text-xs font-semibold rounded-lg"
                >
                  Have Token?
                </button>
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="px-3 py-2.5 border border-slate-300 text-xs font-semibold rounded-lg"
                >
                  Back
                </button>
              </div>
            </form>
          )}

          {mode === 'reset' && (
            <form onSubmit={handleConfirmReset} className="space-y-3">
              <input
                type="email"
                required
                placeholder="Administrator Email *"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
              />
              <input
                required
                placeholder="6-digit / Hex Reset Token *"
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-mono"
              />
              <input
                type="password"
                required
                minLength={8}
                placeholder="New Password (min 8 chars) *"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={busy}
                  className="flex-1 py-2.5 bg-blue-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50"
                >
                  {busy ? 'Resetting...' : 'Reset Admin Password'}
                </button>
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="px-3 py-2.5 border border-slate-300 text-xs font-semibold rounded-lg"
                >
                  Back
                </button>
              </div>
            </form>
          )}

          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase">
              <span className="bg-white px-2 text-slate-400 font-medium">Or</span>
            </div>
          </div>

          <button
            type="button"
            onClick={signInWithGoogle}
            className="w-full py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-lg inline-flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 text-blue-700" />
            Continue with Authorized Google Account
          </button>

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-xs text-slate-500 hover:text-slate-900"
            >
              ← Return to Public Website
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
