'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/store';
import { useRouter } from 'next/navigation';
import { Globe, Mail, Lock, User, Eye, EyeOff, ArrowLeft, ShieldCheck, Check, X } from 'lucide-react';
import Link from 'next/link';

type Mode = 'signin' | 'signup' | 'forgot';

export default function AuthPage() {
  const router = useRouter();
  const { setUser, setProfile } = useAppStore();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
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

  // Redirect if already logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) router.push('/dashboard');
    });
  }, [router]);

  // Password strength validation logic
  useEffect(() => {
    if (mode !== 'signup') return;
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
  }, [password, mode]);

  const getStrengthLabel = (score: number) => {
    if (score <= 2) return { label: 'Weak', color: 'bg-rose-500 text-rose-500' };
    if (score <= 4) return { label: 'Fair', color: 'bg-amber-500 text-amber-500' };
    return { label: 'Strong', color: 'bg-emerald-500 text-emerald-500' };
  };

  const getFriendlyError = (msg: string) => {
    const lower = msg.toLowerCase();
    if (lower.includes('user already registered') || lower.includes('unique constraint')) {
      return 'An account with this email already exists. Please sign in instead.';
    }
    if (lower.includes('invalid login credentials')) {
      return 'Incorrect email or password. Please check your credentials and try again.';
    }
    if (lower.includes('email not confirmed')) {
      return 'Please check your inbox and confirm your email before signing in.';
    }
    if (lower.includes('rate limit')) {
      return 'Too many attempts. Please try again in a few minutes.';
    }
    return msg;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (mode === 'signup') {
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (strength.score < 4) {
        setError('Please choose a stronger password matching the security criteria.');
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === 'signup') {
        try {
          const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { full_name: name },
              emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
          });
          if (error) throw error;
          setSuccess('Account created successfully! Please check your email to confirm your account. (Note: If testing locally without email SMTP, you can disable "Confirm email" in Supabase Auth Settings, or manually confirm the user using the SQL query helper at the bottom of schema.sql.)');
          setEmail('');
          setPassword('');
          setConfirmPassword('');
          setName('');
        } catch (authErr: any) {
          // Fallback to local sandbox signup if Supabase server is unreachable
          if (authErr.message?.includes('failed to fetch') || authErr.message?.includes('Failed to fetch') || authErr.message?.includes('fetch')) {
            console.warn('Supabase offline. Initiating offline signup.');
            const localUsers = JSON.parse(localStorage.getItem('local_users') || '[]');
            if (localUsers.some((u: any) => u.email === email)) {
              throw new Error('An account with this email already exists in local sandbox.');
            }
            const localUser = {
              id: `local-user-${Date.now()}`,
              email,
              password,
              user_metadata: { full_name: name }
            };
            localUsers.push(localUser);
            localStorage.setItem('local_users', JSON.stringify(localUsers));

            // Create profile
            const localProfile = {
              id: localUser.id,
              full_name: name,
              username: email.split('@')[0],
              travel_style: 'explorer',
              created_at: new Date().toISOString()
            };
            const localProfiles = JSON.parse(localStorage.getItem('local_profiles') || '{}');
            localProfiles[localUser.id] = localProfile;
            localStorage.setItem('local_profiles', JSON.stringify(localProfiles));

            // Persist session
            localStorage.setItem('local_session_user', JSON.stringify(localUser));
            localStorage.setItem('local_session_profile', JSON.stringify(localProfile));

            setUser(localUser as any);
            setProfile(localProfile);
            setSuccess('Offline Sandbox Mode: Account created successfully! Logging you in...');
            
            setTimeout(() => {
              router.push('/dashboard');
            }, 1500);
            return;
          }
          throw authErr;
        }
      } else if (mode === 'signin') {
        try {
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
          router.push('/dashboard');
        } catch (authErr: any) {
          // Fallback to local sandbox signin if Supabase server is unreachable
          if (authErr.message?.includes('failed to fetch') || authErr.message?.includes('Failed to fetch') || authErr.message?.includes('fetch')) {
            console.warn('Supabase offline. Initiating offline login check.');
            const localUsers = JSON.parse(localStorage.getItem('local_users') || '[]');
            const foundUser = localUsers.find((u: any) => u.email === email && u.password === password);
            
            if (!foundUser) {
              // Standard fallback demo login
              if (email === 'demo@example.com' && password === 'password') {
                const demoUser = {
                  id: 'local-demo-user',
                  email: 'demo@example.com',
                  user_metadata: { full_name: 'Demo Traveler' }
                };
                const demoProfile = {
                  id: 'local-demo-user',
                  full_name: 'Demo Traveler',
                  username: 'demotraveler',
                  travel_style: 'explorer',
                  created_at: new Date().toISOString()
                };
                localStorage.setItem('local_session_user', JSON.stringify(demoUser));
                localStorage.setItem('local_session_profile', JSON.stringify(demoProfile));
                
                setUser(demoUser as any);
                setProfile(demoProfile);
                setSuccess('Signed in using Demo Sandbox account!');
                setTimeout(() => router.push('/dashboard'), 1000);
                return;
              }
              throw new Error('Invalid credentials. If offline, try email "demo@example.com" with password "password" to log in.');
            }

            // Log in with found user details
            const localProfiles = JSON.parse(localStorage.getItem('local_profiles') || '{}');
            const userProfile = localProfiles[foundUser.id] || {
              id: foundUser.id,
              full_name: foundUser.user_metadata?.full_name || email.split('@')[0],
              username: email.split('@')[0],
              travel_style: 'explorer',
              created_at: new Date().toISOString()
            };

            localStorage.setItem('local_session_user', JSON.stringify(foundUser));
            localStorage.setItem('local_session_profile', JSON.stringify(userProfile));

            setUser(foundUser as any);
            setProfile(userProfile);
            setSuccess('Signed in successfully in Offline Sandbox mode!');
            setTimeout(() => router.push('/dashboard'), 1000);
            return;
          }
          throw authErr;
        }
      } else if (mode === 'forgot') {
        try {
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/reset-password`,
          });
          if (error) throw error;
          setSuccess('Password reset link sent! Check your email for further instructions.');
          setEmail('');
        } catch (authErr: any) {
          if (authErr.message?.includes('failed to fetch') || authErr.message?.includes('Failed to fetch') || authErr.message?.includes('fetch')) {
            throw new Error('Cannot send reset email while database server is offline.');
          }
          throw authErr;
        }
      }
    } catch (err: any) {
      setError(getFriendlyError(err.message || 'Something went wrong. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0B1914] flex items-center justify-center px-6 relative overflow-hidden text-[#F0F7F4] transition-colors duration-300">
      {/* Background effect */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#2C5E3B]/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#C69234]/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-md z-10 my-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4 group">
            <div className="w-10 h-10 rounded-full bg-[#1B432C] border border-[#2C5E3B] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Globe size={18} className="text-[#C69234]" />
            </div>
            <span className="font-bold tracking-widest text-white">—WANDERSPHERE</span>
          </Link>
          <h1 className="font-extrabold text-3xl text-white uppercase tracking-tight">
            {mode === 'signin' ? 'Welcome Back' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
          </h1>
          <p className="text-[#A3C2B2] text-sm mt-2">
            {mode === 'signin' ? 'Sign in to plan your next Indian adventure' : mode === 'signup' ? 'Join our community of Indian explorers' : 'Enter your email to receive a reset link'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#143028] backdrop-blur-xl border border-[#2C5E3B] rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C69234]" />
                <input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-[#0B1914] border border-[#2C5E3B] rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-[#A3C2B2]/40 text-sm focus:outline-none focus:border-[#C69234] transition-all"
                />
              </div>
            )}

            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C69234]" />
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#0B1914] border border-[#2C5E3B] rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-[#A3C2B2]/40 text-sm focus:outline-none focus:border-[#C69234] transition-all"
              />
            </div>

            {mode !== 'forgot' && (
              <>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C69234]" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-[#0B1914] border border-[#2C5E3B] rounded-2xl py-3.5 pl-12 pr-12 text-white placeholder-[#A3C2B2]/40 text-sm focus:outline-none focus:border-[#C69234] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A3C2B2] hover:text-white transition-colors"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {mode === 'signup' && (
                  <>
                    {/* Confirm password */}
                    <div className="relative">
                      <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C69234]" />
                      <input
                        type={showPass ? 'text' : 'password'}
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="w-full bg-[#0B1914] border border-[#2C5E3B] rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-[#A3C2B2]/40 text-sm focus:outline-none focus:border-[#C69234] transition-all"
                      />
                    </div>

                    {/* Password strength visualizer */}
                    {password.length > 0 && (
                      <div className="bg-[#0B1914] rounded-2xl p-4 border border-[#2C5E3B] space-y-2">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-[#A3C2B2]">Security Score:</span>
                          <span className={getStrengthLabel(strength.score).color}>
                            {getStrengthLabel(strength.score).label} ({strength.score}/5)
                          </span>
                        </div>
                        {/* Progress Bar */}
                        <div className="h-1.5 w-full bg-[#1B432C] rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              strength.score <= 2 ? 'bg-rose-500' : strength.score <= 4 ? 'bg-[#C69234]' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${(strength.score / 5) * 100}%` }}
                          />
                        </div>
                        {/* Requirements Checklist */}
                        <div className="grid grid-cols-2 gap-1 text-[11px] mt-2 text-[#A3C2B2]">
                          <div className="flex items-center gap-1.5">
                            {strength.hasMinLength ? <Check size={10} className="text-emerald-400" /> : <X size={10} className="text-[#A3C2B2]/50" />}
                            <span>Min 8 characters</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {strength.hasUpper ? <Check size={10} className="text-emerald-400" /> : <X size={10} className="text-[#A3C2B2]/50" />}
                            <span>Uppercase letter</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {strength.hasLower ? <Check size={10} className="text-emerald-400" /> : <X size={10} className="text-[#A3C2B2]/50" />}
                            <span>Lowercase letter</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {strength.hasNumber ? <Check size={10} className="text-emerald-400" /> : <X size={10} className="text-[#A3C2B2]/50" />}
                            <span>One digit (0-9)</span>
                          </div>
                          <div className="flex items-center col-span-2 gap-1.5">
                            {strength.hasSpecial ? <Check size={10} className="text-emerald-400" /> : <X size={10} className="text-[#A3C2B2]/50" />}
                            <span>Special character (!@#$%^&*)</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {/* Forgot password trigger */}
            {mode === 'signin' && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => { setMode('forgot'); setError(''); setSuccess(''); }}
                  className="text-xs text-[#C69234] hover:underline font-semibold"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            <AnimatePresence mode="wait">
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-rose-300 text-xs bg-rose-950/40 border border-rose-800 rounded-xl px-4 py-3"
                >
                  {error}
                </motion.p>
              )}

              {success && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-emerald-300 text-xs bg-emerald-950/40 border border-emerald-800 rounded-xl px-4 py-3"
                >
                  {success}
                </motion.p>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-[#C69234] text-[#0B1914] font-black uppercase tracking-widest text-xs transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#b07f2a] shadow-lg shadow-[#C69234]/20"
            >
              {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
            </button>
          </form>

          {/* Toggle mode */}
          <p className="text-center text-[#A3C2B2] text-sm mt-6">
            {mode === 'signin' && (
              <>
                Don&apos;t have an account?{' '}
                <button
                  onClick={() => { setMode('signup'); setError(''); setSuccess(''); }}
                  className="text-[#C69234] hover:underline font-semibold"
                >
                  Sign Up
                </button>
              </>
            )}
            {mode === 'signup' && (
              <>
                Already have an account?{' '}
                <button
                  onClick={() => { setMode('signin'); setError(''); setSuccess(''); }}
                  className="text-[#C69234] hover:underline font-semibold"
                >
                  Sign In
                </button>
              </>
            )}
            {mode === 'forgot' && (
              <button
                onClick={() => { setMode('signin'); setError(''); setSuccess(''); }}
                className="text-[#C69234] hover:underline font-semibold"
              >
                Back to Sign In
              </button>
            )}
          </p>
        </div>

        {/* Back home */}
        <div className="text-center mt-6">
          <Link href="/" className="inline-flex items-center gap-2 text-[#A3C2B2] hover:text-white transition-colors text-xs uppercase tracking-widest font-semibold">
            <ArrowLeft size={12} />
            Back to Home
          </Link>
        </div>
      </motion.div>
    </main>
  );
}
