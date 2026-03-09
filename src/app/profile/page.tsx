'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, User, Bell, Sun, Moon, Download, Upload, FileJson, FileSpreadsheet, Shield, HelpCircle, Info, ChevronRight, Trash2, ArrowLeft, Edit3, X, Droplet, Book, Brain, Dumbbell, Heart, Coffee, Pencil, Code, Music, Leaf, Target, Zap, Star, RefreshCw } from 'lucide-react';
import { useKineticStore, HabitIcon, Habit, HabitLog, MoodLog, SkipLog } from '@/store/useKineticStore';
import { getLocalDateKey } from '@/lib/dateUtils';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

import { HABIT_ICON_MAP, HABIT_ICON_OPTIONS } from '@/lib/habitIcons';
import BottomNav from '@/components/BottomNav';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';

import { useMounted } from '@/hooks/useMounted';

export default function ProfilePage() {
  const store = useKineticStore();
  const { 
    theme, setTheme, getExportData, clearAllData, getJoinDate, 
    habits, habitLogs, moodLogs, userName, userIcon, updateUserProfile,
    addHabit, logHabitCompletion, logMood, logSkip, setWeeklyContractTarget,
    fetchFromCloud
  } = store;
  const { user, signOut, deleteAccount } = useAuth();
  const router = useRouter();
  const mounted = useMounted();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isClearingData, setIsClearingData] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editName, setEditName] = useState(userName);
  const [editIcon, setEditIcon] = useState(userIcon);
  const [joinDate, setJoinDate] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] = useState(false);
  const [deleteAccountPassword, setDeleteAccountPassword] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (mounted) {
      setJoinDate(getJoinDate());
    }
  }, [getJoinDate, mounted]);

  useEffect(() => {
    if (userName) setEditName(userName);
    if (userIcon) setEditIcon(userIcon);
  }, [userName, userIcon]);

  const handleSaveProfile = () => {
    updateUserProfile(editName, editIcon);
    setShowEditProfile(false);
  };

  const UserIconComponent = HABIT_ICON_MAP[userIcon] || Star;

  const exportAsJSON = () => {
    const data = getExportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kinetic-backup-${getLocalDateKey()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importData = async (file: File) => {
    setImportError(null);
    setImportSuccess(false);
    
    try {
      const text = await file.text();
      
      if (file.name.endsWith('.json')) {
        const data = JSON.parse(text) as {
          habits: Habit[];
          habitLogs: HabitLog[];
          moodLogs: MoodLog[];
          skipLogs?: SkipLog[];
          weeklyContractTarget?: number | null;
        };
        
        // Validate data structure
        if (!data.habits || !Array.isArray(data.habits)) {
          throw new Error('Invalid JSON format: missing or invalid habits array');
        }
        if (!data.habitLogs || !Array.isArray(data.habitLogs)) {
          throw new Error('Invalid JSON format: missing or invalid habitLogs array');
        }
        if (!data.moodLogs || !Array.isArray(data.moodLogs)) {
          throw new Error('Invalid JSON format: missing or invalid moodLogs array');
        }
        
        // Clear existing data
        await clearAllData();
        
        // Import habits
        for (const habit of data.habits) {
          await addHabit({
            name: habit.name || 'Imported Habit',
            unit: habit.unit || 'times',
            target: habit.target || 1,
            schedule: habit.schedule || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
            category: habit.category || 'other',
            icon: habit.icon || 'star',
            type: habit.type || 'simple',
          });
        }
        
        // Wait a moment for state to update, then match habits by name
        // Since habits are added one by one, we need to get the updated list
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Re-fetch habits from the store after import
        const habitIdMap = new Map<string, string>();
        const currentHabitsAfterImport = store.habits;
        
        // Match old habits to new habits by name and schedule (simple approach)
        data.habits.forEach((oldHabit) => {
          const matchingHabit = currentHabitsAfterImport.find(
            h => h.name === oldHabit.name && 
                 JSON.stringify([...h.schedule].sort()) === JSON.stringify([...(oldHabit.schedule || [])].sort())
          );
          if (matchingHabit) {
            habitIdMap.set(oldHabit.id, matchingHabit.id);
          }
        });
        
        // Import habit logs using the ID mapping
        for (const log of data.habitLogs) {
          const newHabitId = habitIdMap.get(log.habitId);
          if (newHabitId) {
            const dateKey = log.completedAt ? getLocalDateKey(new Date(log.completedAt)) : null;
            if (dateKey) {
              await logHabitCompletion(newHabitId, log.value || 1, dateKey);
            }
          }
        }
        
        // Import mood logs
        for (const mood of data.moodLogs) {
          const dateKey = mood.loggedAt ? getLocalDateKey(new Date(mood.loggedAt)) : null;
          if (dateKey && mood.score >= 1 && mood.score <= 10) {
            await logMood(mood.score, dateKey);
          }
        }

        // Import skip logs
        if (Array.isArray(data.skipLogs)) {
          for (const skip of data.skipLogs) {
            if (skip.habitId && skip.dateKey) {
              const newHabitId = habitIdMap.get(skip.habitId);
              if (newHabitId) {
                await logSkip(newHabitId, skip.dateKey);
              }
            }
          }
        }

        if (typeof data.weeklyContractTarget === 'number') {
          setWeeklyContractTarget(data.weeklyContractTarget);
        } else if (data.weeklyContractTarget === null) {
          setWeeklyContractTarget(null);
        }
        
        setImportSuccess(true);
        setTimeout(() => setImportSuccess(false), 3000);
      } else {
        throw new Error('Unsupported file format. Please import a JSON file.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to import data';
      setImportError(message);
      setTimeout(() => setImportError(null), 5000);
    }
  };

  const handleImportClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        importData(file);
      }
    };
    input.click();
  };

  const exportAsCSV = () => {
    const data = getExportData();
    
    // Create CSV for habits
    let csv = 'Type,ID,Name,Streak,Best Streak,Category,Created At\n';
    data.habits.forEach(h => {
      csv += `Habit,${h.id},"${h.name}",${h.streak},${h.bestStreak},${h.category},${h.createdAt}\n`;
    });
    
    csv += '\nType,Habit ID,Completed At,Value\n';
    data.habitLogs.forEach(l => {
      csv += `Log,${l.habitId},${l.completedAt},${l.value}\n`;
    });
    
    csv += '\nType,Score,Logged At\n';
    data.moodLogs.forEach(m => {
      csv += `Mood,${m.score},${m.loggedAt}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kinetic-data-${getLocalDateKey()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleLogout = async () => {
    setIsClearingData(true);
    await clearAllData();
    setIsClearingData(false);
    setShowLogoutConfirm(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setShowSignOutConfirm(false);
      router.push('/login');
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  if (!mounted) return null;

  return (
    <ProtectedRoute>
      <div className="min-h-screen pb-28 selection:bg-[var(--brand-main)] selection:text-[var(--bg-base)]">
        {/* Background decoration */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[600px] bg-[var(--brand-main)]/[0.10] rounded-full blur-3xl -translate-y-1/2" />
        </div>

        <div className="relative z-10 max-w-lg mx-auto px-4 pb-12 pt-4">
          {/* Header */}
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 py-6"
          >
            <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-[var(--theme-foreground)]/10 transition-colors">
              <ArrowLeft className="w-5 h-5 text-[var(--theme-text-secondary)]" />
            </Link>
            <h1 className="text-2xl font-bold text-[var(--theme-text-primary)]">Profile</h1>
          </motion.header>

          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass depth-hover p-8 mb-6"
          >
            <div className="flex flex-col items-center text-center">
              {/* Avatar */}
              <motion.div 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowEditProfile(true)}
                className="w-24 h-24 rounded-full bg-[var(--theme-foreground)] flex items-center justify-center mb-4 shadow-lg cursor-pointer group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-[var(--bg-base)]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Edit3 className="w-6 h-6 text-[var(--theme-text-primary)]" />
                </div>
                <UserIconComponent className="w-12 h-12 text-[var(--theme-background)]" />
              </motion.div>
              
              <h2 
                onClick={() => setShowEditProfile(true)}
                className="text-2xl font-bold text-[var(--theme-text-primary)] mb-1 cursor-pointer hover:text-[var(--theme-foreground)] transition-colors"
              >
                {user?.displayName || userName}
              </h2>
              <p className="text-sm text-[var(--theme-text-secondary)] mb-1">
                {user ? user.email : 'Local profile'}
              </p>
              <p className="text-[10px] text-[var(--theme-text-muted)] uppercase tracking-wider mb-4">Member since {joinDate}</p>
              
              {/* Quick Stats */}
              <div className="flex gap-8 mt-6 pt-6 border-t border-[var(--theme-border)] w-full justify-center">
                <div className="text-center">
                  <p className="text-2xl font-bold text-[var(--theme-text-primary)]">{habits.filter((h) => !h.deletedAt).length}</p>
                  <p className="text-xs text-[var(--theme-text-secondary)] uppercase tracking-wider">Habits</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-[var(--theme-text-primary)]">{habitLogs.filter((l) => !l.deletedAt).length}</p>
                  <p className="text-xs text-[var(--theme-text-secondary)] uppercase tracking-wider">Completions</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-[var(--theme-text-primary)]">{moodLogs.filter((l) => !l.deletedAt).length}</p>
                  <p className="text-xs text-[var(--theme-text-secondary)] uppercase tracking-wider">Mood Logs</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Preferences Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <h3 className="text-xs font-bold text-[var(--theme-text-secondary)] uppercase tracking-widest mb-3 px-1">
              Preferences
            </h3>
            <div className="glass overflow-hidden">
              {/* Notifications */}
              <div className="flex items-center justify-between p-4 border-b border-[var(--theme-border)]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[var(--theme-foreground)]/10 flex items-center justify-center">
                    <Bell className="w-4 h-4 text-[var(--theme-text-primary)]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--theme-text-primary)]">Notifications</p>
                    <p className="text-xs text-[var(--theme-text-secondary)]">Coming soon</p>
                  </div>
                </div>
                <div className="w-12 h-7 bg-[var(--theme-foreground)]/10 rounded-full opacity-50 cursor-not-allowed" />
              </div>

              {/* Theme */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[var(--theme-foreground)]/10 flex items-center justify-center">
                    {theme === 'dark' ? (
                      <Moon className="w-4 h-4 text-[var(--theme-text-primary)]" />
                    ) : (
                      <Sun className="w-4 h-4 text-[var(--theme-text-primary)]" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--theme-text-primary)]">Theme</p>
                    <p className="text-xs text-[var(--theme-text-secondary)]">{theme === 'dark' ? 'Dark mode' : 'Light mode'}</p>
                  </div>
                </div>
                <div className="flex gap-1 p-1 bg-[var(--theme-foreground)]/5 rounded-xl">
                  <button
                    onClick={() => setTheme('light')}
                    className={`p-2 rounded-lg transition-all ${
                      theme === 'light' 
                        ? 'bg-[var(--theme-foreground)] text-[var(--theme-background)]' 
                        : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                    }`}
                  >
                    <Sun className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`p-2 rounded-lg transition-all ${
                      theme === 'dark' 
                        ? 'bg-[var(--theme-foreground)] text-[var(--theme-background)]' 
                        : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                    }`}
                  >
                    <Moon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Data Control Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6"
          >
            <h3 className="text-xs font-bold text-[var(--theme-text-secondary)] uppercase tracking-widest mb-3 px-1">
              Data Control
            </h3>
            <div className="glass overflow-hidden">
              {/* Export JSON */}
              <button
                onClick={exportAsJSON}
                className="w-full flex items-center justify-between p-4 border-b border-[var(--theme-border)] hover:bg-[var(--theme-foreground)]/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[var(--theme-foreground)]/10 flex items-center justify-center">
                    <FileJson className="w-4 h-4 text-[var(--theme-text-primary)]" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-[var(--theme-text-primary)]">Export as JSON</p>
                    <p className="text-xs text-[var(--theme-text-secondary)]">Full backup for re-importing</p>
                  </div>
                </div>
                <Download className="w-4 h-4 text-[var(--theme-text-secondary)]" />
              </button>

              {/* Export CSV */}
              <button
                onClick={exportAsCSV}
                className="w-full flex items-center justify-between p-4 border-b border-[var(--theme-border)] hover:bg-[var(--theme-foreground)]/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[var(--theme-foreground)]/10 flex items-center justify-center">
                    <FileSpreadsheet className="w-4 h-4 text-[var(--theme-text-primary)]" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-[var(--theme-text-primary)]">Export as CSV</p>
                    <p className="text-xs text-[var(--theme-text-secondary)]">Spreadsheet compatible</p>
                  </div>
                </div>
                <Download className="w-4 h-4 text-[var(--theme-text-secondary)]" />
              </button>

              {/* Sync now */}
              {user && (
                <button
                  onClick={async () => {
                    setIsSyncing(true);
                    await fetchFromCloud();
                    setIsSyncing(false);
                  }}
                  disabled={isSyncing}
                  className="w-full flex items-center justify-between p-4 border-b border-[var(--theme-border)] hover:bg-[var(--theme-foreground)]/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[var(--theme-foreground)]/10 flex items-center justify-center">
                      <RefreshCw className={`w-4 h-4 text-[var(--theme-text-primary)] ${isSyncing ? 'animate-spin' : ''}`} />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-[var(--theme-text-primary)]">Sync now</p>
                      <p className="text-xs text-[var(--theme-text-secondary)]">Refresh from cloud</p>
                    </div>
                  </div>
                </button>
              )}

              {/* Privacy */}
              <button
                onClick={() => alert('Privacy Policy\n\nAll your data is stored locally in your browser.\n\nWe do not share your data with third parties. Your habits, logs, and mood entries stay on this device unless you export them.')}
                className="w-full flex items-center justify-between p-4 hover:bg-[var(--theme-foreground)]/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[var(--theme-foreground)]/10 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-[var(--theme-text-primary)]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--theme-text-primary)]">Privacy</p>
                    <p className="text-xs text-[var(--theme-text-secondary)]">All data stored locally</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--theme-text-secondary)]" />
              </button>
            </div>
          </motion.div>

          {/* Support & About Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <h3 className="text-xs font-bold text-[var(--theme-text-secondary)] uppercase tracking-widest mb-3 px-1">
              Support & About
            </h3>
            <div className="glass overflow-hidden">
              {/* Help */}
              <button className="w-full flex items-center justify-between p-4 border-b border-[var(--theme-border)] hover:bg-[var(--theme-foreground)]/5 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[var(--theme-foreground)]/10 flex items-center justify-center">
                    <HelpCircle className="w-4 h-4 text-[var(--theme-text-primary)]" />
                  </div>
                  <p className="text-sm font-medium text-[var(--theme-text-primary)]">Help & FAQ</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--theme-text-secondary)]" />
              </button>

              {/* About */}
              <button className="w-full flex items-center justify-between p-4 hover:bg-[var(--theme-foreground)]/5 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[var(--theme-foreground)]/10 flex items-center justify-center">
                    <Info className="w-4 h-4 text-[var(--theme-text-primary)]" />
                  </div>
                  <p className="text-sm font-medium text-[var(--theme-text-primary)]">About Kinetic</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--theme-text-secondary)]" />
              </button>
            </div>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center"
          >
            <p className="text-xs text-[var(--theme-text-muted)] mb-6">Version 1.0.0</p>
            
            <div className="flex flex-col gap-4 max-w-[200px] mx-auto">
              {user && (
                <button
                  onClick={() => setShowSignOutConfirm(true)}
                  className="flex items-center justify-center gap-2 text-[var(--theme-text-primary)] hover:opacity-80 transition-opacity"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-medium">Sign Out</span>
                </button>
              )}

              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="flex items-center justify-center gap-2 text-[var(--color-error)] hover:brightness-110 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span className="text-sm font-medium">Clear Local Data</span>
              </button>

              {user && (
                <button
                  onClick={() => setShowDeleteAccountConfirm(true)}
                  className="flex items-center justify-center gap-2 text-[var(--color-error)]/80 hover:text-[var(--color-error)] transition-colors text-sm"
                >
                  Delete Account
                </button>
              )}
            </div>
          </motion.div>
        </div>

        {/* Sign Out Confirmation Modal */}
        <AnimatePresence>
          {showSignOutConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-base)]/70 backdrop-blur-sm"
              onClick={() => setShowSignOutConfirm(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="glass p-6 max-w-sm w-full"
                onClick={e => e.stopPropagation()}
              >
                <h3 className="text-lg font-bold text-[var(--theme-text-primary)] mb-2">Sign Out?</h3>
                <p className="text-sm text-[var(--theme-text-secondary)] mb-6">
                  Are you sure you want to sign out of your account? Your local data will remain until you clear it or log back in.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowSignOutConfirm(false)}
                    className="flex-1 py-3 rounded-xl border border-[var(--theme-border)] text-[var(--theme-text-primary)] font-medium hover:bg-[var(--theme-foreground)]/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="flex-1 py-3 rounded-xl bg-[var(--theme-foreground)] text-[var(--theme-background)] font-medium hover:opacity-90 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Logout Confirmation Modal */}
        <AnimatePresence>
          {showLogoutConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-base)]/70 backdrop-blur-sm"
              onClick={() => setShowLogoutConfirm(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="glass p-6 max-w-sm w-full"
                onClick={e => e.stopPropagation()}
              >
                <h3 className="text-lg font-bold text-[var(--theme-text-primary)] mb-2">Clear All Data?</h3>
                <p className="text-sm text-[var(--theme-text-secondary)] mb-6">
                  This will permanently delete all your habits, logs, and mood entries from local storage. This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowLogoutConfirm(false)}
                    className="flex-1 py-3 rounded-xl border border-[var(--theme-border)] text-[var(--theme-text-primary)] font-medium hover:bg-[var(--theme-foreground)]/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLogout}
                    disabled={isClearingData}
                    className="flex-1 py-3 rounded-xl bg-[var(--color-error)] text-[var(--bg-base)] font-medium hover:brightness-95 transition-colors disabled:opacity-70"
                  >
                    {isClearingData ? 'Clearing...' : 'Delete All'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Account Modal */}
        <AnimatePresence>
          {showDeleteAccountConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-base)]/70 backdrop-blur-sm"
              onClick={() => setShowDeleteAccountConfirm(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="glass p-6 max-w-sm w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-bold text-[var(--color-error)] mb-2">Delete Account?</h3>
                <p className="text-sm text-[var(--theme-text-secondary)] mb-4">
                  This will permanently delete your account and all associated data. This action cannot be undone.
                </p>
                {user?.providerData[0]?.providerId === 'password' && (
                  <input
                    type="password"
                    placeholder="Enter your password"
                    value={deleteAccountPassword}
                    onChange={(e) => setDeleteAccountPassword(e.target.value)}
                    className="w-full bg-[var(--theme-foreground)]/5 border border-[var(--theme-border)] rounded-xl px-4 py-3 text-[var(--theme-text-primary)] mb-4 focus:outline-none focus:border-[var(--theme-foreground)]/30"
                  />
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => { setShowDeleteAccountConfirm(false); setDeleteAccountPassword(''); }}
                    className="flex-1 py-3 rounded-xl border border-[var(--theme-border)] text-[var(--theme-text-primary)] font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      setIsDeletingAccount(true);
                      try {
                        await deleteAccount(user?.providerData[0]?.providerId === 'password' ? deleteAccountPassword : undefined);
                        router.push('/login');
                      } catch (err) {
                        setImportError(err instanceof Error ? err.message : 'Failed to delete account');
                      } finally {
                        setIsDeletingAccount(false);
                      }
                    }}
                    disabled={isDeletingAccount || (user?.providerData[0]?.providerId === 'password' && !deleteAccountPassword)}
                    className="flex-1 py-3 rounded-xl bg-[var(--color-error)] text-white font-medium disabled:opacity-50"
                  >
                    {isDeletingAccount ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Edit Profile Modal */}
        <AnimatePresence>
          {showEditProfile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-base)]/80 backdrop-blur-sm"
              onClick={() => setShowEditProfile(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="glass p-6 max-w-sm w-full"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-[var(--theme-text-primary)]">Edit Profile</h2>
                  <button
                    onClick={() => setShowEditProfile(false)}
                    className="p-2 rounded-full hover:bg-[var(--theme-foreground)]/10 transition-colors"
                  >
                    <X className="w-5 h-5 text-[var(--theme-text-secondary)]" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-xs font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider block mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Your Name"
                      className="w-full bg-[var(--theme-foreground)]/5 border border-[var(--theme-border)] rounded-xl px-4 py-3 text-[var(--theme-text-primary)] focus:outline-none focus:border-[var(--theme-foreground)]/30 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider block mb-2">
                      Choose Icon
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {HABIT_ICON_OPTIONS.map((option) => {
                        const IconComp = option.component;
                        return (
                          <button
                            key={option.icon}
                            onClick={() => setEditIcon(option.icon)}
                            className={`
                              p-3 rounded-xl transition-all
                              ${editIcon === option.icon 
                                ? 'bg-[var(--theme-foreground)] text-[var(--theme-background)]' 
                                : 'bg-[var(--theme-foreground)]/5 text-[var(--theme-text-secondary)] hover:bg-[var(--theme-foreground)]/10'
                              }
                            `}
                          >
                            <IconComp className="w-5 h-5 mx-auto" />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    onClick={handleSaveProfile}
                    disabled={!editName.trim()}
                    className="w-full py-4 rounded-2xl bg-[var(--theme-foreground)] text-[var(--theme-background)] font-bold text-sm uppercase tracking-wide hover:opacity-90 disabled:opacity-50 transition-all"
                  >
                    Save Changes
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <BottomNav />
      </div>
    </ProtectedRoute>
  );
}
