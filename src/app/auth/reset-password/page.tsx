'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Globe, Lock, Eye, EyeOff, ShieldCheck, Check, X } from 'lucide-react';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Password strength states
  const [strength, setStrength] = useState({
    score: 0,
    hasMinLength: false,
    hasUpper: false,
    hasLower: false,
    hasNumber: false,
    hasSpecial: false,
  });

  useEffect(() => {
    const hasMinLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    let score = 0;
    if (hasMinLength) score += 1;
    if (hasUpper) score += 1;
    if (hasLower) score += 1;
    if (hasNumber) score += 1;
    if (hasSpecial) score += 1;

    setStrength({
      score,
      hasMinLength,
      hasUpper,
      hasLower,
      hasNumber,
      hasSpecial,
    });
  }, [password]);

  const getStrengthLabel = (score: number) => {
    if (score <= 2) return { label: 'Weak', color: 'bg-rose-500 text-rose-500' };
    if (score <= 4) return { label: 'Fair', color: 'bg-amber-500 text-amber-500' };
    return { label: 'Strong', color: 'bg-emerald-500 text-emerald-500' };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (strength.score < 4) {
      setError('Please choose a stronger password.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess('Your password has been successfully reset! Redirecting to sign in page...');
      setTimeout(() => {
        router.push('/auth');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update password. Please make sure the reset link is valid.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-[100svh] flex flex-col justify-center items-center px-6 overflow-hidden transition-colors duration-500" style={{ color: 'var(--ws-text)' }}>
      {/* Background radial ocean atmosphere overlay */}
      <div 
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(circle at 50% 40%, rgba(76, 201, 232, 0.12), transparent 55%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-md z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4 group">
            <div className="w-10 h-10 rounded-full ws-glass-strong border flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
              <Globe size={18} style={{ color: 'var(--ws-accent)' }} />
            </div>
            <span className="font-extrabold tracking-widest text-lg uppercase" style={{ color: 'var(--ws-text)' }}>— WANDERSPHERE</span>
          </Link>
          <h1 className="font-extrabold text-3xl uppercase tracking-tight" style={{ color: 'var(--ws-text)' }}>
            Reset Your Password
          </h1>
          <p className="text-sm mt-2 font-medium" style={{ color: 'var(--ws-text-secondary)' }}>
            Please enter and confirm your new password below.
          </p>
        </div>

        {/* Ocean Glass Card */}
        <div 
          className="ws-glass-strong rounded-3xl p-8 shadow-2xl border"
          style={{
            borderColor: 'rgba(76, 201, 232, 0.25)',
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--ws-accent)' }} />
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full ws-glass border rounded-2xl py-3.5 pl-12 pr-12 text-sm outline-none transition-all focus:border-[var(--ws-accent)]"
                style={{ color: 'var(--ws-text)' }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors hover:opacity-100 opacity-60"
                style={{ color: 'var(--ws-text-secondary)' }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--ws-accent)' }} />
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full ws-glass border rounded-2xl py-3.5 pl-12 pr-4 text-sm outline-none transition-all focus:border-[var(--ws-accent)]"
                style={{ color: 'var(--ws-text)' }}
              />
            </div>

            {/* Password strength visualizer */}
            {password.length > 0 && (
              <div className="ws-glass rounded-2xl p-4 border space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span style={{ color: 'var(--ws-text-secondary)' }}>Security Score:</span>
                  <span className={getStrengthLabel(strength.score).color}>
                    {getStrengthLabel(strength.score).label} ({strength.score}/5)
                  </span>
                </div>
                {/* Progress Bar */}
                <div className="h-1.5 w-full ws-glass-soft rounded-full overflow-hidden border">
                  <div
                    className={`h-full transition-all duration-300 ${
                      strength.score <= 2 ? 'bg-rose-500' : strength.score <= 4 ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}
                    style={{ width: `${(strength.score / 5) * 100}%` }}
                  />
                </div>
                {/* Requirements Checklist */}
                <div className="grid grid-cols-2 gap-1 text-[11px] mt-2 font-medium" style={{ color: 'var(--ws-text-secondary)' }}>
                  <div className="flex items-center gap-1.5">
                    {strength.hasMinLength ? <Check size={10} className="text-emerald-400" /> : <X size={10} className="opacity-40" />}
                    <span>Min 8 characters</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {strength.hasUpper ? <Check size={10} className="text-emerald-400" /> : <X size={10} className="opacity-40" />}
                    <span>Uppercase letter</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {strength.hasLower ? <Check size={10} className="text-emerald-400" /> : <X size={10} className="opacity-40" />}
                    <span>Lowercase letter</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {strength.hasNumber ? <Check size={10} className="text-emerald-400" /> : <X size={10} className="opacity-40" />}
                    <span>One digit (0-9)</span>
                  </div>
                  <div className="flex items-center col-span-2 gap-1.5">
                    {strength.hasSpecial ? <Check size={10} className="text-emerald-400" /> : <X size={10} className="opacity-40" />}
                    <span>Special character (!@#$%^&*)</span>
                  </div>
                </div>
              </div>
            )}

            <AnimatePresence mode="wait">
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-rose-300 text-xs bg-rose-950/40 border border-rose-800 rounded-xl px-4 py-3 font-semibold"
                >
                  {error}
                </motion.p>
              )}

              {success && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-emerald-300 text-xs bg-emerald-950/40 border border-emerald-800 rounded-xl px-4 py-3 font-semibold"
                >
                  {success}
                </motion.p>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl ws-ocean-btn-primary font-black uppercase tracking-widest text-xs transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? 'Please wait...' : 'Reset Password'}
            </button>
          </form>
        </div>
      </motion.div>
    </main>
  );
}
