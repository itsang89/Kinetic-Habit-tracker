'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { useKineticStore } from '@/store/useKineticStore';

type AuthContextType = {
  user: User | null;
  isGuest: boolean;
  loading: boolean;
  continueAsGuest: () => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isGuest: false,
  loading: true,
  continueAsGuest: () => {},
  signOut: async () => {},
});

const GUEST_MODE_KEY = 'kinetic_guest_mode';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isGuest, setIsGuest] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(GUEST_MODE_KEY) === 'true';
  });
  const [loading, setLoading] = useState(() => Boolean(supabase));
  const { initializeStore } = useKineticStore();

  useEffect(() => {
    // Skip if supabase is not available (build time)
    if (!supabase) {
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      const session = data.session;
      setUser(session?.user ?? null);
      if (session?.user) {
        localStorage.removeItem(GUEST_MODE_KEY);
        setIsGuest(false);
      }
      setLoading(false);
      if (session?.user) {
        initializeStore();
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          localStorage.removeItem(GUEST_MODE_KEY);
          setIsGuest(false);
          initializeStore();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [initializeStore]);

  const continueAsGuest = () => {
    localStorage.setItem(GUEST_MODE_KEY, 'true');
    setIsGuest(true);
  };

  const signOut = async () => {
    localStorage.removeItem(GUEST_MODE_KEY);
    setIsGuest(false);

    if (supabase) {
      await supabase.auth.signOut();
    }
  };

  return (
    <AuthContext.Provider value={{ user, isGuest, loading, continueAsGuest, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
