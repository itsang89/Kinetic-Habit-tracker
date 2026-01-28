'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Search, SortAsc, Plus, Trash2, Archive, FolderOpen, 
  ChevronDown, X, ArchiveRestore
} from 'lucide-react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import HabitManagerCard from '@/components/habits/HabitManagerCard';
import EditHabitModal from '@/components/habits/EditHabitModal';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useKineticStore, Habit, HabitCategory } from '@/store/useKineticStore';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useMounted } from '@/hooks/useMounted';

type FilterType = 'all' | 'active' | 'archived';
type SortType = 'newest' | 'oldest' | 'streak' | 'health';

const categoryLabels: Record<HabitCategory, string> = {
  health: '🏥 Health',
  learning: '📚 Learning',
  productivity: '⚡ Productivity',
  mindfulness: '🧘 Mindfulness',
  fitness: '💪 Fitness',
  other: '📌 Other',
};

export default function HabitsPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={
        <div className="min-h-screen pb-28">
          <div className="relative z-10 max-w-2xl mx-auto px-4 pb-12 pt-4">
            <div className="mt-8 flex items-center justify-center">
              <LoadingSpinner />
            </div>
          </div>
          <BottomNav />
        </div>
      }>
        <HabitsContent />
      </Suspense>
    </ProtectedRoute>
  );
}

import ConfirmDialog from '@/components/ConfirmDialog';

function HabitsContent() {
  const { 
    habits, bulkDelete, bulkArchive, bulkUnarchive, 
    bulkChangeCategory, getHabitHealth, setGlobalModalOpen 
  } = useKineticStore();
  const searchParams = useSearchParams();
  const mounted = useMounted();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('newest');
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedHabits, setSelectedHabits] = useState<Set<string>>(new Set());
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showArchivedSection, setShowArchivedSection] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);

  useEffect(() => {
    if (showSortMenu || showCategoryMenu || showDeleteConfirm || showArchiveConfirm) {
      setGlobalModalOpen(true);
      return () => setGlobalModalOpen(false);
    }
  }, [showSortMenu, showCategoryMenu, showDeleteConfirm, showArchiveConfirm, setGlobalModalOpen]);

  useEffect(() => {
    if (searchParams.get('add') === 'true') {
      setIsModalOpen(true);
      setEditingHabit(null);
    }
  }, [searchParams]);

  // Filter and sort habits
  const filteredHabits = useMemo(() => {
    if (!mounted) return [];
    
    let result = [...habits];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(h => 
        h.name.toLowerCase().includes(query) ||
        h.category.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (filter === 'active') {
      result = result.filter(h => !h.isArchived);
    } else if (filter === 'archived') {
      result = result.filter(h => h.isArchived);
    }

    // Sort
    switch (sort) {
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'streak':
        result.sort((a, b) => b.streak - a.streak);
        break;
      case 'health':
        result.sort((a, b) => getHabitHealth(a.id) - getHabitHealth(b.id));
        break;
    }

    return result;
  }, [mounted, habits, searchQuery, filter, sort, getHabitHealth]);

  // Group habits by category (only for active habits)
  const groupedHabits = useMemo(() => {
    const activeHabits = filteredHabits.filter(h => !h.isArchived);
    const archivedHabits = filteredHabits.filter(h => h.isArchived);

    const grouped: Record<HabitCategory, Habit[]> = {
      health: [],
      learning: [],
      productivity: [],
      mindfulness: [],
      fitness: [],
      other: [],
    };

    activeHabits.forEach(habit => {
      grouped[habit.category].push(habit);
    });

    return { grouped, archivedHabits };
  }, [filteredHabits]);

  const toggleSelectHabit = (habitId: string) => {
    setSelectedHabits(prev => {
      const next = new Set(prev);
      if (next.has(habitId)) {
        next.delete(habitId);
      } else {
        next.add(habitId);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (selectedHabits.size === filteredHabits.length) {
      setSelectedHabits(new Set());
    } else {
      setSelectedHabits(new Set(filteredHabits.map(h => h.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedHabits.size === 0) return;
    await bulkDelete(Array.from(selectedHabits));
    setSelectedHabits(new Set());
    setIsEditMode(false);
  };

  const handleBulkArchive = async () => {
    if (selectedHabits.size === 0) return;
    await bulkArchive(Array.from(selectedHabits));
    setSelectedHabits(new Set());
    setIsEditMode(false);
  };

  const handleBulkUnarchive = async () => {
    if (selectedHabits.size === 0) return;
    await bulkUnarchive(Array.from(selectedHabits));
    setSelectedHabits(new Set());
    setIsEditMode(false);
  };

  const handleBulkChangeCategory = async (category: HabitCategory) => {
    if (selectedHabits.size === 0) return;
    await bulkChangeCategory(Array.from(selectedHabits), category);
    setShowCategoryMenu(false);
  };

  const openEditModal = (habit: Habit | null) => {
    setEditingHabit(habit);
    setIsModalOpen(true);
  };

  const activeCategories = Object.entries(groupedHabits.grouped).filter(([_, habits]) => habits.length > 0);
  const hasArchivedHabits = groupedHabits.archivedHabits.length > 0;

  if (!mounted) {
    return (
      <div className="min-h-screen pb-28">
        <div className="relative z-10 max-w-2xl mx-auto px-4 pb-12 pt-4">
          <Header />
          <div className="mt-8 flex items-center justify-center">
            <LoadingSpinner />
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28 selection:bg-[var(--theme-foreground)] selection:text-[var(--theme-background)]">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[400px] bg-[var(--theme-foreground)]/[0.02] rounded-full blur-3xl -translate-y-1/2" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 pb-12 pt-4">
        <Header />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mt-6"
        >
          {/* Page Title */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-[var(--theme-text-primary)]">Habit Manager</h1>
              <p className="text-sm text-[var(--theme-text-secondary)]">{habits.filter(h => !h.isArchived).length} active habits</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => openEditModal(null)}
              className="w-12 h-12 rounded-xl bg-[var(--theme-foreground)] text-[var(--theme-background)] flex items-center justify-center"
            >
              <Plus className="w-6 h-6" />
            </motion.button>
          </div>

          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--theme-text-secondary)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search habits..."
              className="w-full bg-[var(--theme-foreground)]/5 border border-[var(--theme-border)] rounded-2xl pl-12 pr-4 py-3 text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-muted)] focus:outline-none focus:border-[var(--theme-foreground)]/30 transition-colors"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
            {(['all', 'active', 'archived'] as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`
                  px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all
                  ${filter === f 
                    ? 'bg-[var(--theme-foreground)] text-[var(--theme-background)]' 
                    : 'bg-[var(--theme-foreground)]/5 text-[var(--theme-text-secondary)] hover:bg-[var(--theme-foreground)]/10 hover:text-[var(--theme-text-primary)]'
                  }
                `}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
            
            {/* Sort dropdown */}
            <div className="relative ml-auto">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--theme-foreground)]/5 text-[var(--theme-text-secondary)] hover:bg-[var(--theme-foreground)]/10 hover:text-[var(--theme-text-primary)] transition-all"
              >
                <SortAsc className="w-4 h-4" />
                <span className="text-sm font-medium">Sort</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showSortMenu ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {showSortMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-48 glass rounded-xl overflow-hidden z-20"
                  >
                    {([
                      { value: 'newest', label: 'Newest First' },
                      { value: 'oldest', label: 'Oldest First' },
                      { value: 'streak', label: 'Longest Streak' },
                      { value: 'health', label: 'Needs Attention' },
                    ] as { value: SortType; label: string }[]).map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() => { setSort(value); setShowSortMenu(false); }}
                        className={`
                          w-full px-4 py-3 text-left text-sm transition-colors
                          ${sort === value 
                            ? 'bg-[var(--theme-foreground)] text-[var(--theme-background)] font-medium' 
                            : 'text-[var(--theme-text-primary)] hover:bg-[var(--theme-foreground)]/10'
                          }
                        `}
                      >
                        {label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Edit Mode Toggle & Bulk Actions */}
          <div className="flex items-center gap-2 mb-6">
            <button
              onClick={() => { setIsEditMode(!isEditMode); setSelectedHabits(new Set()); }}
              className={`
                px-4 py-2 rounded-full text-sm font-medium transition-all
                ${isEditMode 
                  ? 'bg-[var(--theme-foreground)] text-[var(--theme-background)]' 
                  : 'bg-[var(--theme-foreground)]/5 text-[var(--theme-text-secondary)] hover:bg-[var(--theme-foreground)]/10 hover:text-[var(--theme-text-primary)]'
                }
              `}
            >
              {isEditMode ? 'Done' : 'Select'}
            </button>

            <AnimatePresence>
              {isEditMode && (
                <>
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={selectAll}
                    className="px-3 py-2 rounded-full bg-[var(--theme-foreground)]/5 text-[var(--theme-text-secondary)] hover:bg-[var(--theme-foreground)]/10 hover:text-[var(--theme-text-primary)] text-sm font-medium transition-all"
                  >
                    {selectedHabits.size === filteredHabits.length ? 'Deselect All' : 'Select All'}
                  </motion.button>
                  
                  {selectedHabits.size > 0 && (
                    <>
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={() => setShowArchiveConfirm(true)}
                        className="p-2 rounded-full bg-[var(--theme-foreground)]/10 text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors"
                        title="Pause selected"
                      >
                        <Archive className="w-4 h-4" />
                      </motion.button>
                      
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={handleBulkUnarchive}
                        className="p-2 rounded-full bg-[var(--theme-foreground)]/10 text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors"
                        title="Unpause selected"
                      >
                        <ArchiveRestore className="w-4 h-4" />
                      </motion.button>
                      
                      <div className="relative">
                        <motion.button
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          onClick={() => setShowCategoryMenu(!showCategoryMenu)}
                          className="p-2 rounded-full bg-[var(--theme-foreground)]/10 text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors"
                          title="Change category"
                        >
                          <FolderOpen className="w-4 h-4" />
                        </motion.button>
                        
                        <AnimatePresence>
                          {showCategoryMenu && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="absolute left-0 mt-2 w-40 glass rounded-xl overflow-hidden z-20"
                            >
                              {Object.entries(categoryLabels).map(([value, label]) => (
                                <button
                                  key={value}
                                  onClick={() => handleBulkChangeCategory(value as HabitCategory)}
                                  className="w-full px-4 py-2 text-left text-sm text-[var(--theme-text-primary)] hover:bg-[var(--theme-foreground)]/10 transition-colors"
                                >
                                  {label}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={() => setShowDeleteConfirm(true)}
                        className="p-2 rounded-full bg-red-900/50 text-red-400 hover:bg-red-900 hover:text-red-300 transition-colors"
                        title="Delete selected"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                      
                      <span className="text-xs text-[var(--theme-text-secondary)] ml-2">
                        {selectedHabits.size} selected
                      </span>
                    </>
                  )}
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Habit List - Grouped by Category */}
          {habits.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass p-12 rounded-2xl text-center"
            >
              <div className="w-16 h-16 rounded-full bg-[var(--theme-foreground)]/5 flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-[var(--theme-text-secondary)]" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--theme-text-primary)] mb-2">No habits yet</h3>
              <p className="text-[var(--theme-text-secondary)] mb-6">Create your first habit to start tracking</p>
              <button
                onClick={() => openEditModal(null)}
                className="px-6 py-3 rounded-full bg-[var(--theme-foreground)] text-[var(--theme-background)] font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                Create Habit
              </button>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {/* Active habits by category */}
              {activeCategories.map(([category, categoryHabits]) => (
                <div key={category}>
                  <h3 className="text-sm font-bold text-[var(--theme-text-secondary)] uppercase tracking-widest mb-3 flex items-center gap-2">
                    <span>{categoryLabels[category as HabitCategory]}</span>
                    <span className="text-[var(--theme-text-muted)]">({categoryHabits.length})</span>
                  </h3>
                  <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                      {categoryHabits.map((habit) => (
                        <HabitManagerCard
                          key={habit.id}
                          habit={habit}
                          isSelected={selectedHabits.has(habit.id)}
                          isEditMode={isEditMode}
                          onSelect={() => toggleSelectHabit(habit.id)}
                          onEdit={() => openEditModal(habit)}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              ))}

              {/* Archived habits section */}
              {hasArchivedHabits && filter !== 'active' && (
                <div className="mt-8 pt-6 border-t border-[var(--theme-border)]">
                  <button
                    onClick={() => setShowArchivedSection(!showArchivedSection)}
                    className="flex items-center gap-2 text-sm font-bold text-[var(--theme-text-secondary)] uppercase tracking-widest mb-3 w-full"
                  >
                    <Archive className="w-4 h-4" />
                    <span>Paused Habits</span>
                    <span className="text-[var(--theme-text-muted)]">({groupedHabits.archivedHabits.length})</span>
                    <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${showArchivedSection ? 'rotate-180' : ''}`} />
                  </button>
                  
                  <AnimatePresence>
                    {showArchivedSection && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="space-y-3 overflow-hidden"
                      >
                        {groupedHabits.archivedHabits.map((habit) => (
                          <HabitManagerCard
                            key={habit.id}
                            habit={habit}
                            isSelected={selectedHabits.has(habit.id)}
                            isEditMode={isEditMode}
                            onSelect={() => toggleSelectHabit(habit.id)}
                            onEdit={() => openEditModal(habit)}
                          />
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* No results */}
              {filteredHabits.length === 0 && habits.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <p className="text-[var(--theme-text-secondary)]">No habits match your search</p>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
      </div>

      <BottomNav />
      
      <EditHabitModal
        habit={editingHabit}
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingHabit(null); }}
      />

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        title="Delete Habits?"
        message={`Are you sure you want to delete ${selectedHabits.size} habit(s)? This action cannot be undone.`}
        confirmLabel="Delete"
        isDestructive
      />

      <ConfirmDialog
        isOpen={showArchiveConfirm}
        onClose={() => setShowArchiveConfirm(false)}
        onConfirm={handleBulkArchive}
        title="Pause Habits?"
        message={`Are you sure you want to pause ${selectedHabits.size} habit(s)? You can unpause them later.`}
        confirmLabel="Pause"
      />
    </div>
  );
}
