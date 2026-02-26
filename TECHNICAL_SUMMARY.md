# Kinetic App Technical Summary

This document summarizes the current codebase and behavior of Kinetic, a habit and mood tracker. It is intended to serve as a reference for a developer building a V2.

## 1. App Overview

### Core Purpose
Kinetic is a habit and mood tracker focused on daily execution, streaks, and momentum scoring. It helps users stay consistent, track completion, and correlate habits with mood over time.

### Target Users and Use Cases
- Individuals who want daily habit tracking and streak accountability.
- Users who want a lightweight, offline-first tracker with optional cloud sync.
- People interested in trends: weekly wrap-ups, day/time performance, mood correlations.

### Architecture
- **Client-first web app** using Next.js App Router.
- **Local persistence** via Zustand with `localStorage`.
- **Optional cloud sync** with Supabase (auth + database). No custom backend API in this repo.

### Tech Stack and Key Dependencies
- **Next.js (App Router)**, **React 19**
- **Tailwind CSS v4** + CSS variables
- **Zustand** for state management and persistence
- **Supabase** for auth and optional sync
- **Framer Motion** for animations
- **Recharts** for charts
- **Lucide React** for icons

Relevant files:
- `/Users/isaac/VibeCode/Projects/kinetic habit app/package.json`
- `/Users/isaac/VibeCode/Projects/kinetic habit app/src/app/layout.tsx`
- `/Users/isaac/VibeCode/Projects/kinetic habit app/src/app/globals.css`
- `/Users/isaac/VibeCode/Projects/kinetic habit app/src/store/useKineticStore.ts`
- `/Users/isaac/VibeCode/Projects/kinetic habit app/src/lib/supabase.ts`
- `/Users/isaac/VibeCode/Projects/kinetic habit app/src/lib/sync.ts`

---

## 2. Features & Functionality

### Home (`/`)
**Files:**
- `/Users/isaac/VibeCode/Projects/kinetic habit app/src/app/page.tsx`
- `/Users/isaac/VibeCode/Projects/kinetic habit app/src/components/HabitList.tsx`
- `/Users/isaac/VibeCode/Projects/kinetic habit app/src/components/HabitCard.tsx`
- `/Users/isaac/VibeCode/Projects/kinetic habit app/src/components/CalendarStrip.tsx`
- `/Users/isaac/VibeCode/Projects/kinetic habit app/src/components/CompactStats.tsx`
- `/Users/isaac/VibeCode/Projects/kinetic habit app/src/components/MoodSlider.tsx`
- `/Users/isaac/VibeCode/Projects/kinetic habit app/src/components/StreakRescueCard.tsx`

**User-facing features:**
- **Daily habit list** filtered by selected date (calendar strip).
- **Habit completion** via tap or progress controls.
- **Miss reason logging** when incomplete on today.
- **Streak rescue** panel showing at-risk habits.
- **Mood logging** on a 1–10 scale.
- **Compact stats**: today’s completion rate + momentum score.

**Behavior and flow:**
- Calendar selects date; habit list re-renders for the selected day.
- Tapping habits toggles completion (simple/duration/count types).
- Duration uses slider; count uses multi-tap ring.
- Mood slider logs or updates daily mood entry.

**Constraints/edge cases:**
- Completion ordering uses initial snapshot to prevent jumping during interaction.
- Past/future dates change labeling (e.g., “Upcoming Habits”).
- Miss reason UI only appears for today.

---

### Habit Manager (`/habits`)
**Files:**
- `/Users/isaac/VibeCode/Projects/kinetic habit app/src/app/habits/page.tsx`
- `/Users/isaac/VibeCode/Projects/kinetic habit app/src/components/habits/HabitManagerCard.tsx`
- `/Users/isaac/VibeCode/Projects/kinetic habit app/src/components/habits/EditHabitModal.tsx`
- `/Users/isaac/VibeCode/Projects/kinetic habit app/src/hooks/useHabitForm.ts`
- `/Users/isaac/VibeCode/Projects/kinetic habit app/src/lib/habitTemplates.ts`

**User-facing features:**
- **Create/edit habits** (name, type, unit, target, schedule, icon, category).
- **Quick-start packs** (sleep, fitness, study).
- **Search and filters** (all/active/archived).
- **Sort** (newest/oldest/streak/health).
- **Bulk actions** (archive/unarchive/delete/change category).
- **Swipe actions** (edit or archive/unarchive).
- **Archived habits section**.

**Behavior and flow:**
- Search & filter update list in-memory.
- Edit mode allows bulk selection.
- Modal handles create and edit; validates required fields.

**Constraints/edge cases:**
- Sorting by health depends on computed health score.
- Archived habits are grouped and optionally collapsed.

---

### Trends (`/trends`)
**Files:**
- `/Users/isaac/VibeCode/Projects/kinetic habit app/src/app/trends/page.tsx`
- `/Users/isaac/VibeCode/Projects/kinetic habit app/src/components/trends/*`

**User-facing features:**
- **Kinetic Energy Gauge** with 30-day simulated history.
- **Streak Comparison** and streak leaderboard.
- **Total Volume** (lifetime totals by habit).
- **Weekly Wrap** (completions, momentum change, contract status, miss reasons).
- **Consistency Chain (Paper Chain)** with 30-day and 90-day views.
- **Day Efficiency** (last 12 weeks + detailed analysis).
- **Time Performance** (hourly completion breakdown).
- **Habit Health** (7-day weighted health score).
- **Mood Insight** (mood trend + correlations, requires enough data).

**Behavior and flow:**
- Each card is a mini-dashboard with expandable modal.
- Most charts derive data via Zustand selectors.

**Constraints/edge cases:**
- Some charts require minimum data (e.g., mood logs >= 7 days).
- Performance depends on local state; no server aggregation.

---

### Profile (`/profile`)
**Files:**
- `/Users/isaac/VibeCode/Projects/kinetic habit app/src/app/profile/page.tsx`
- `/Users/isaac/VibeCode/Projects/kinetic habit app/src/components/ThemeProvider.tsx`

**User-facing features:**
- Profile edit (name + icon).
- Theme toggle (light/dark).
- Sync status and manual sync.
- Export JSON/CSV.
- Import JSON backup.
- Clear all data/logout.

**Constraints/edge cases:**
- Import matches habits by name + schedule, which can collide.
- Sync status is based only on local last sync timestamp.

---

### Auth (`/login`, `/auth/callback`)
**Files:**
- `/Users/isaac/VibeCode/Projects/kinetic habit app/src/app/login/page.tsx`
- `/Users/isaac/VibeCode/Projects/kinetic habit app/src/app/auth/callback/page.tsx`
- `/Users/isaac/VibeCode/Projects/kinetic habit app/src/contexts/AuthContext.tsx`

**User-facing features:**
- Email/password signup and login.
- Email confirmation flow.
- Password reset flow.
- Guest mode (local only).

**Constraints/edge cases:**
- Reset flow redirects to `/auth/reset-password`, which is missing.

---

## 3. Technical Implementation

### Core Store and Entities
**File:** `/Users/isaac/VibeCode/Projects/kinetic habit app/src/store/useKineticStore.ts`

Entities:
- **Habit**: name, type, target, unit, schedule, streak, bestStreak, shield, category, icon, archived status.
- **HabitLog**: habitId, value, completedAt.
- **MoodLog**: score, loggedAt.
- **MissReasonLog**: habitId, date, reason.

Main actions:
- CRUD on habits, logs, and mood entries.
- Archival and bulk actions.
- Streak and momentum calculations.
- Daily decay logic.
- Weekly contract tracking.
- Data export and clear.

### Momentum & Streak Logic
**File:** `/Users/isaac/VibeCode/Projects/kinetic habit app/src/store/useKineticStore.ts`

- **Momentum**: increases proportionally to completion percent; daily decay plus penalties for missed scheduled habits.
- **Shields**: one-time skip per habit; shield resets after use.
- **Streaks**: calculated per scheduled day; requires completion >= 100% of target.

### Analytics Selectors
**File:** `/Users/isaac/VibeCode/Projects/kinetic habit app/src/store/useKineticStore.ts`

- `getDayOfWeekEfficiency`, `getTimeOfDayPerformance`, `getPaperChainData`, `getHabitHealth`, `getMoodHabitInsight`, `getWeeklySummary`, and others.

### State Management and Data Flow
- Global Zustand store + `persist` to `localStorage`.
- Components read from selectors or state slices and call store actions.
- Derived data and charts computed in components or selectors.

### API Design and Auth
- No custom API endpoints; Supabase client used directly.
- Auth: Supabase email/password with confirmation and reset flows.
- Sync: debounced upserts of habits, logs, mood logs, and user profile.

### Third-Party Integrations
- Supabase for auth and optional sync.
- Recharts for charts.
- Framer Motion for animation.

---

## 4. Project Structure

```
/Users/isaac/VibeCode/Projects/kinetic habit app
├── src
│   ├── app            # Next.js App Router pages
│   ├── components     # UI components, grouped by feature
│   ├── contexts       # Auth context
│   ├── hooks          # Custom hooks
│   ├── lib            # Utilities, constants, templates, sync
│   └── store          # Zustand store
```

Patterns:
- Feature folders under `components/habits` and `components/trends`.
- Custom hooks (`useHabitForm`, `useHabitProgress`, `useMounted`, `useToast`).
- Shared utilities in `lib` (`habitCalculations`, `dateUtils`, `sync`).

---

## 5. Known Limitations & Technical Debt

- **Missing routes**:
  - `/habits/[id]` referenced but not implemented.
  - `/auth/reset-password` referenced but not implemented.

- **Sync gaps**:
  - Miss reason logs and weekly contract target are not synced.
  - Deletions are not synced (upsert only).

- **Guest mode decay**:
  - Daily decay only triggered for signed-in users (via initializeStore).

- **Timezone inconsistencies**:
  - Uses `toISOString()` and `startsWith` comparisons; may shift day boundaries in local time.

- **Inconsistent completion semantics**:
  - Calendar strip marks completion if any log exists (ignores partial).
  - Streaks require full completion.
  - Missed decay uses `< 50%` threshold.

- **Unused components**:
  - `MomentumScore`, `HabitHeatmap`, `MoodCorrelationChart` are present but not linked into pages.

- **Placeholder UX**:
  - Notifications, Help, About are not implemented.

- **Docs mismatch**:
  - README says Next.js 15; package.json uses Next.js 16.

---

## 6. Recommendations for V2

1. **Complete Missing Routes**
   - Implement `/habits/[id]` details page (history, analytics, edit actions).
   - Implement `/auth/reset-password` route for password reset flow.

2. **Sync Improvements**
   - Sync miss reason logs and weekly contract target.
   - Add delete propagation or soft-delete with sync.
   - Add versioning and conflict resolution strategy.

3. **Date & Time Normalization**
   - Introduce a shared date utility that uses local date keys.
   - Store a canonical `dayKey` separate from ISO timestamps.

4. **Consistent Completion Rules**
   - Centralize completion logic into a single utility.
   - Align UI and analytics thresholds (full vs partial vs missed).

5. **Analytics Expansion**
   - Promote unused charts to Trends view.
   - Add per-habit detail charts and custom ranges.

6. **Testing & Stability**
   - Add tests for streak calculation, decay, sync, and import/export.
   - Add schema validation for imports.

7. **Feature Roadmap**
   - Notifications/reminders.
   - Habit template marketplace or pack library.
   - Advanced insights: category correlations, habit clustering, predictive streak risks.
