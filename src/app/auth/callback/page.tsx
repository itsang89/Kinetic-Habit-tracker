'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const handleAuthCallback = async () => {
      if (!supabase) {
        setStatus('error');
        setMessage('Authentication service is not available');
        return;
      }

      try {
        // Handle the auth callback
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }

        if (data.session) {
          setStatus('success');
          setMessage('Email confirmed! Redirecting...');
          
          // Wait a moment to show success message, then redirect
          setTimeout(() => {
            router.push('/');
          }, 2000);
        } else {
          setStatus('error');
          setMessage('No session found. Please try signing in again.');
          setTimeout(() => {
            router.push('/login');
          }, 3000);
        }
      } catch (err) {
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'An error occurred during verification');
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--theme-background)] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass p-8 rounded-2xl max-w-md w-full text-center"
      >
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 text-[var(--theme-text-primary)] animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-[var(--theme-text-primary)] mb-2">
              Verifying Email
            </h1>
            <p className="text-[var(--theme-text-secondary)]">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-[var(--theme-text-primary)] mb-2">
              Email Confirmed!
            </h1>
            <p className="text-[var(--theme-text-secondary)]">{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-[var(--theme-text-primary)] mb-2">
              Verification Failed
            </h1>
            <p className="text-[var(--theme-text-secondary)] mb-4">{message}</p>
            <button
              onClick={() => router.push('/login')}
              className="px-6 py-3 rounded-xl bg-[var(--theme-foreground)] text-[var(--theme-background)] font-semibold hover:opacity-90 transition-opacity"
            >
              Go to Login
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}


