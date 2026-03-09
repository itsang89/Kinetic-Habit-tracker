'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { LogIn, UserPlus, Mail, Lock, ArrowRight, Sparkles, Chrome } from 'lucide-react';
import { getRedirectResult } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

import LoadingSpinner from '@/components/LoadingSpinner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [validationError, setValidationError] = useState<string | null>(null);
  const router = useRouter();
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, sendPasswordReset } = useAuth();

  useEffect(() => {
    getRedirectResult(auth).then((result) => {
      if (result?.user) router.push('/');
    }).catch(() => {});
  }, [router]);

  const validateForm = (): string | null => {
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      return 'Email is required';
    }
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    
    // Validate password (only for login and signup, not reset)
    if (mode !== 'reset') {
      if (!password) {
        return 'Password is required';
      }
      if (mode === 'signup') {
        if (password.length < 8) {
          return 'Password must be at least 8 characters';
        }
        if (password.length > 128) {
          return 'Password must be 128 characters or less';
        }
        // Check for at least one letter and one number
        if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
          return 'Password must contain at least one letter and one number';
        }
      }
    }
    
    return null;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setValidationError(null);

    const validationErr = validateForm();
    if (validationErr) {
      setValidationError(validationErr);
      setLoading(false);
      return;
    }

    try {
      if (mode === 'login') {
        await signInWithEmail(email, password);
      } else if (mode === 'signup') {
        await signUpWithEmail(email, password);
      } else if (mode === 'reset') {
        await sendPasswordReset(email);
        setError('Password reset email sent! Check your inbox.');
        setLoading(false);
        return;
      }
      router.push('/');
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'An error occurred during authentication');
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle();
      router.push('/');
    } catch (err: any) {
      console.error('Google auth error:', err);
      setError(err.message || 'An error occurred during Google sign-in');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)] p-4 selection:bg-[var(--brand-main)] selection:text-[var(--bg-base)]">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[400px] bg-[var(--brand-main)]/[0.10] rounded-full blur-3xl -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[var(--brand-300)]/[0.08] rounded-full blur-3xl translate-y-1/3 translate-x-1/3" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass depth-hover p-8 rounded-[2.5rem] w-full max-w-md relative z-10"
      >
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 rounded-3xl bg-[var(--brand-main)] flex items-center justify-center mb-6 shadow-[var(--shadow-md)]">
            <Sparkles className="w-8 h-8 text-[var(--bg-base)]" />
          </div>
          <h1 className="text-3xl font-bold text-[var(--theme-text-primary)] mb-2">
            {mode === 'login' ? 'Welcome Back' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
          </h1>
          <p className="text-sm text-[var(--theme-text-secondary)]">
            {mode === 'login' ? 'Sign in to sync your habits across devices' : mode === 'signup' ? 'Start your journey with Kinetic today' : 'Enter your email to receive a reset link'}
          </p>
        </div>
        
        <form onSubmit={handleAuth} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--theme-text-muted)]" />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="surface-sunken w-full pl-12 pr-4 py-4 rounded-2xl text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-muted)] focus:border-[var(--brand-main)] transition-all"
              required
            />
          </div>
          
          {mode !== 'reset' && (
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--theme-text-muted)]" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="surface-sunken w-full pl-12 pr-4 py-4 rounded-2xl text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-muted)] focus:border-[var(--brand-main)] transition-all"
                required
              />
            </div>
          )}
          
          {mode === 'login' && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => {
                  setMode('reset');
                  setError('');
                  setValidationError(null);
                }}
                className="text-xs text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors"
              >
                Forgot password?
              </button>
            </div>
          )}
          
          {validationError && (
            <motion.p 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="text-[var(--color-error)] text-xs font-medium px-1"
            >
              {validationError}
            </motion.p>
          )}
          {error && (
            <motion.p 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="text-[var(--color-error)] text-xs font-medium px-1"
            >
              {error}
            </motion.p>
          )}
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-[var(--brand-main)] text-[var(--bg-base)] font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 hover:bg-[var(--brand-hover)] transition-all disabled:opacity-50 mt-6"
          >
            {loading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                {mode === 'login' ? <LogIn className="w-4 h-4" /> : mode === 'signup' ? <UserPlus className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Join Kinetic' : 'Send Reset Link'}
              </>
            )}
          </motion.button>
        </form>

        {mode !== 'reset' && (
          <div className="mt-4">
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-[var(--theme-border)]"></div>
              <span className="flex-shrink mx-4 text-xs text-[var(--theme-text-muted)] uppercase tracking-widest font-medium">Or continue with</span>
              <div className="flex-grow border-t border-[var(--theme-border)]"></div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-3 mt-4 rounded-2xl border border-[var(--theme-border)] text-[var(--theme-text-primary)] font-medium text-sm flex items-center justify-center gap-2 hover:bg-[var(--theme-foreground)]/5 transition-colors disabled:opacity-50"
            >
              <Chrome className="w-4 h-4" />
              Google Account
            </motion.button>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-[var(--theme-border)] text-center">
          {mode === 'reset' ? (
            <button
              onClick={() => {
                setMode('login');
                setError('');
                setValidationError(null);
              }}
              className="text-sm text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors inline-flex items-center gap-2 font-medium"
            >
              Back to Sign In
              <ArrowRight className="w-3 h-3" />
            </button>
          ) : (
            <button
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login');
                setError('');
                setValidationError(null);
              }}
              className="text-sm text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors inline-flex items-center gap-2 font-medium"
            >
              {mode === 'login' ? "New here? Create an account" : 'Already have an account? Sign in'}
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
