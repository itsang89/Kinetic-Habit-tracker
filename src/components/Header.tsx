'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, RefreshCw } from 'lucide-react';

interface HeaderProps {
  onRefresh?: () => void;
  isRefreshing?: boolean;
  showSync?: boolean;
}

export default function Header({ onRefresh, isRefreshing, showSync }: HeaderProps) {
  const [dateString, setDateString] = useState('');

  useEffect(() => {
    const today = new Date();
    setDateString(today.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }));
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between py-6 px-2"
    >
      <div className="flex items-center gap-4">
        <motion.div
          whileHover={{ rotate: 180, scale: 1.1 }}
          transition={{ duration: 0.5 }}
          className="w-12 h-12 rounded-full border border-[var(--border)] border-t-[var(--highlight)] flex items-center justify-center bg-[var(--bg-elevated)] shadow-[var(--shadow-sm)]"
        >
          <Zap className="w-6 h-6 text-[var(--brand-main)]" fill="currentColor" />
        </motion.div>
        <div>
          <h1 className="text-3xl font-bold text-[var(--theme-text-primary)] tracking-tight">Kinetic</h1>
          <p className="text-sm text-[var(--theme-text-secondary)] uppercase tracking-widest font-medium text-[11px]">{dateString}</p>
        </div>
        {showSync && onRefresh && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-full hover:bg-[var(--theme-foreground)]/10 transition-colors"
            title="Sync"
          >
            <RefreshCw className={`w-5 h-5 text-[var(--theme-text-secondary)] ${isRefreshing ? 'animate-spin' : ''}`} />
          </motion.button>
        )}
      </div>
    </motion.header>
  );
}
