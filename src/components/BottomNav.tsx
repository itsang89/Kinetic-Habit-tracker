'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Home, TrendingUp, ListTodo, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useKineticStore } from '@/store/useKineticStore';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/habits', label: 'Habits', icon: ListTodo },
  { href: '/trends', label: 'Trends', icon: TrendingUp },
  { href: '/profile', label: 'Profile', icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();
  const modalCount = useKineticStore(state => state.modalCount);

  return (
    <AnimatePresence>
      {modalCount === 0 && (
        <motion.nav
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-2"
        >
          <div className="max-w-md mx-auto">
            <div className="glass bg-[var(--theme-background)]/80 backdrop-blur-xl border border-[var(--theme-border)] rounded-2xl px-2 py-2 flex items-center justify-around">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="relative flex-1"
                  >
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`
                        flex flex-col items-center gap-1 py-3 px-3 rounded-xl transition-all duration-300
                        ${isActive 
                          ? 'bg-[var(--theme-foreground)] text-[var(--theme-background)]' 
                          : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-foreground)]/5'
                        }
                      `}
                    >
                      <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-[var(--theme-background)]' : ''}`}>
                        {item.label}
                      </span>
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
}

