'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

import LoadingSpinner from '@/components/LoadingSpinner';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isGuest, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user && !isGuest) {
      router.push('/login');
    }
  }, [user, isGuest, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--theme-background)]">
        <LoadingSpinner />
      </div>
    );
  }

  return user || isGuest ? <>{children}</> : null;
}
