'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { LogIn, UserPlus, Mail, Lock, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!supabase) {
      setError('Authentication service is not available');
      setLoading(false);
      return;
    }

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          }
        });
        if (error) throw error;
        alert('Check your email for the confirmation link!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--theme-background)] p-4">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[400px] bg-[var(--theme-foreground)]/[0.03] rounded-full blur-3xl -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[var(--theme-foreground)]/[0.02] rounded-full blur-3xl translate-y-1/3 translate-x-1/3" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-8 rounded-[2.5rem] w-full max-w-md relative z-10"
      >
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 rounded-3xl bg-[var(--theme-foreground)] flex items-center justify-center mb-6 shadow-lg shadow-[var(--theme-glow)]">
            <Sparkles className="w-8 h-8 text-[var(--theme-background)]" />
          </div>
          <h1 className="text-3xl font-bold text-[var(--theme-text-primary)] mb-2">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-sm text-[var(--theme-text-secondary)]">
            {mode === 'login' ? 'Sync your momentum across devices' : 'Start your kinetic journey today'}
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
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-[var(--theme-foreground)]/5 border border-[var(--theme-border)] text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-muted)] focus:outline-none focus:border-[var(--theme-foreground)]/30 transition-all"
              required
            />
          </div>
          
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--theme-text-muted)]" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-[var(--theme-foreground)]/5 border border-[var(--theme-border)] text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-muted)] focus:outline-none focus:border-[var(--theme-foreground)]/30 transition-all"
              required
            />
          </div>
          
          {error && (
            <motion.p 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="text-red-400 text-xs font-medium px-1"
            >
              {error}
            </motion.p>
          )}
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-[var(--theme-foreground)] text-[var(--theme-background)] font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50 mt-6"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-[var(--theme-background)] border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {mode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                {mode === 'login' ? 'Sign In' : 'Join Kinetic'}
              </>
            )}
          </motion.button>
        </form>

        <div className="mt-8 pt-6 border-t border-[var(--theme-border)] text-center">
          <button
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            className="text-sm text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors inline-flex items-center gap-2 font-medium"
          >
            {mode === 'login' ? "New here? Create an account" : 'Already have an account? Sign in'}
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}

