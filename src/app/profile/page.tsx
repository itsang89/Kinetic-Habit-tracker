'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Bell, 
  Sun, 
  Moon, 
  Download, 
  FileJson, 
  FileSpreadsheet,
  Shield, 
  HelpCircle, 
  Info, 
  ChevronRight,
  LogOut,
  ArrowLeft,
  Edit3,
  X,
  Droplet,
  Book,
  Brain,
  Dumbbell,
  Heart,
  Coffee,
  Pencil,
  Code,
  Music,
  Leaf,
  Target,
  Zap,
  Star
} from 'lucide-react';
import { useKineticStore, HabitIcon } from '@/store/useKineticStore';

const iconMap: Record<HabitIcon, React.ElementType> = {
  droplet: Droplet,
  book: Book,
  brain: Brain,
  dumbbell: Dumbbell,
  heart: Heart,
  sun: Sun,
  moon: Moon,
  coffee: Coffee,
  pencil: Pencil,
  code: Code,
  music: Music,
  leaf: Leaf,
  target: Target,
  zap: Zap,
  star: Star,
};

const iconOptions: HabitIcon[] = [
  'droplet', 'book', 'brain', 'dumbbell', 'heart', 
  'sun', 'moon', 'coffee', 'pencil', 'code', 
  'music', 'leaf', 'target', 'zap', 'star'
];
import BottomNav from '@/components/BottomNav';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { Cloud, CloudOff, RefreshCcw } from 'lucide-react';

export default function ProfilePage() {
  const { 
    theme, setTheme, getExportData, clearAllData, getJoinDate, 
    habits, habitLogs, moodLogs, userName, userIcon, updateUserProfile,
    lastSyncedAt, isSyncing, syncToCloud
  } = useKineticStore();
  
  const { user, signOut } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editName, setEditName] = useState(userName);
  const [editIcon, setEditIcon] = useState(userIcon);
  const [joinDate, setJoinDate] = useState('');

  useEffect(() => {
    setMounted(true);
    setJoinDate(getJoinDate());
  }, [getJoinDate]);

  useEffect(() => {
    if (userName) setEditName(userName);
    if (userIcon) setEditIcon(userIcon);
  }, [userName, userIcon]);

  const handleSaveProfile = () => {
    updateUserProfile(editName, editIcon);
    setShowEditProfile(false);
  };

  const UserIconComponent = iconMap[userIcon] || Star;

  const exportAsJSON = () => {
    const data = getExportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kinetic-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
    a.download = `kinetic-data-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleLogout = async () => {
    await signOut();
    clearAllData();
    setShowLogoutConfirm(false);
  };

  if (!mounted) return null;

  return (
    <ProtectedRoute>
      <div className="min-h-screen pb-28 selection:bg-[var(--theme-foreground)] selection:text-[var(--theme-background)]">
        {/* Background decoration */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[600px] bg-[var(--theme-foreground)]/[0.03] rounded-full blur-3xl -translate-y-1/2" />
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
            className="glass p-8 mb-6"
          >
            <div className="flex flex-col items-center text-center">
              {/* Avatar */}
              <motion.div 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowEditProfile(true)}
                className="w-24 h-24 rounded-full bg-[var(--theme-foreground)] flex items-center justify-center mb-4 shadow-lg cursor-pointer group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Edit3 className="w-6 h-6 text-white" />
                </div>
                <UserIconComponent className="w-12 h-12 text-[var(--theme-background)]" />
              </motion.div>
              
              <h2 
                onClick={() => setShowEditProfile(true)}
                className="text-2xl font-bold text-[var(--theme-text-primary)] mb-1 cursor-pointer hover:text-[var(--theme-foreground)] transition-colors"
              >
                {userName}
              </h2>
              <p className="text-sm text-[var(--theme-text-secondary)] mb-1">{user?.email}</p>
              <p className="text-[10px] text-[var(--theme-text-muted)] uppercase tracking-wider mb-4">Member since {joinDate}</p>

              {/* Sync Status */}
              <div className="flex items-center gap-4 mb-6">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${lastSyncedAt ? 'bg-green-500/10 text-green-400' : 'bg-orange-500/10 text-orange-400'}`}>
                  {lastSyncedAt ? <Cloud className="w-3 h-3" /> : <CloudOff className="w-3 h-3" />}
                  {lastSyncedAt ? 'Cloud Synced' : 'Local Only'}
                </div>
                <button 
                  onClick={() => syncToCloud()}
                  disabled={isSyncing}
                  className="p-2 rounded-full hover:bg-[var(--theme-foreground)]/10 transition-colors disabled:opacity-50"
                  title="Sync now"
                >
                  <RefreshCcw className={`w-3.5 h-3.5 text-[var(--theme-text-secondary)] ${isSyncing ? 'animate-spin' : ''}`} />
                </button>
              </div>
              
              {/* Quick Stats */}
              <div className="flex gap-8 mt-6 pt-6 border-t border-[var(--theme-border)] w-full justify-center">
                <div className="text-center">
                  <p className="text-2xl font-bold text-[var(--theme-text-primary)]">{habits.length}</p>
                  <p className="text-xs text-[var(--theme-text-secondary)] uppercase tracking-wider">Habits</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-[var(--theme-text-primary)]">{habitLogs.length}</p>
                  <p className="text-xs text-[var(--theme-text-secondary)] uppercase tracking-wider">Completions</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-[var(--theme-text-primary)]">{moodLogs.length}</p>
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

              {/* Privacy */}
              <div className="flex items-center justify-between p-4">
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
              </div>
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
            
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center justify-center gap-2 mx-auto text-red-500 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Log Out</span>
            </button>
          </motion.div>
        </div>

        {/* Logout Confirmation Modal */}
        <AnimatePresence>
          {showLogoutConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
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
                  This will permanently delete all your habits, logs, and mood entries. This action cannot be undone.
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
                    className="flex-1 py-3 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors"
                  >
                    Delete All
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
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
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
                      {iconOptions.map((icon) => {
                        const IconComp = iconMap[icon];
                        return (
                          <button
                            key={icon}
                            onClick={() => setEditIcon(icon)}
                            className={`
                              p-3 rounded-xl transition-all
                              ${editIcon === icon 
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

