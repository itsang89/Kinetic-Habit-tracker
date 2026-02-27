'use client';

import * as React from 'react';
import { useEffect } from 'react';
import { useKineticStore } from '@/store/useKineticStore';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, initializeStore } = useKineticStore();

  useEffect(() => {
    // Apply theme to document element
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    // Apply daily decay and momentum logic on app open
    initializeStore();
  }, [initializeStore]);

  return <>{children}</>;
}

