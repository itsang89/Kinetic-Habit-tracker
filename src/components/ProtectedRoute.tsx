'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--theme-background)]">
        <div className="w-8 h-8 border-2 border-[var(--theme-foreground)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return user ? <>{children}</> : null;
}

