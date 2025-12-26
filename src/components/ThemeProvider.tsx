'use client';

import { useEffect } from 'react';
import { useKineticStore } from '@/store/useKineticStore';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useKineticStore();

  useEffect(() => {
    // Apply theme to document element
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return <>{children}</>;
}

