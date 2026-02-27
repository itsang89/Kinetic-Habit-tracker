'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

export default function Header() {
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
      </div>
    </motion.header>
  );
}
