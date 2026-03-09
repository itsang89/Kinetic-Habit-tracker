'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { getRedirectResult } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Completing sign in...');

  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          setStatus('success');
          setMessage('Sign in successful!');
          setTimeout(() => router.push('/'), 500);
        } else {
          setStatus('error');
          setMessage('No redirect result. Redirecting to login...');
          setTimeout(() => router.push('/login'), 1500);
        }
      })
      .catch((err) => {
        console.error('Redirect auth error:', err);
        setStatus('error');
        setMessage(err.message || 'Sign in failed. Redirecting to login...');
        setTimeout(() => router.push('/login'), 2000);
      });
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--theme-background)] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass depth-hover p-8 rounded-2xl max-w-md w-full text-center"
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
            <CheckCircle className="w-12 h-12 text-[var(--color-success)] mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-[var(--theme-text-primary)] mb-2">
              Complete
            </h1>
            <p className="text-[var(--theme-text-secondary)]">{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-12 h-12 text-[var(--color-error)] mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-[var(--theme-text-primary)] mb-2">
              Callback Disabled
            </h1>
            <p className="text-[var(--theme-text-secondary)] mb-4">{message}</p>
            <button
              onClick={() => router.push('/login')}
              className="px-6 py-3 rounded-xl bg-[var(--brand-main)] text-[var(--bg-base)] font-semibold hover:bg-[var(--brand-hover)] transition-colors"
            >
              Go to Login
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}
