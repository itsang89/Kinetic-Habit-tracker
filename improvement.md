# Kinetic Habit App — Improvement Plan

> **Last updated:** 2026-03-09
> **Codebase version:** V1 (Next.js 16, React 19, Zustand 5, Firebase, Tailwind v4)

---

## Priority Checklist

### Feature Enhancements

- [ ] 20. Add date range selector to Trends page
- [ ] 21. Add habit-specific trend filtering on Trends page
- [ ] 22. Add habit duplication action in Habits Manager
- [ ] 23. Add notification/reminder infrastructure (service worker + push)
- [ ] 24. Add drag-to-reorder for habits within categories
- [ ] 25. Add "Load More" pagination for habit history (currently capped at 50)

### Data Integrity & Sync

- [ ] 26. Add retry logic with exponential backoff for Firestore operations
- [ ] 27. Add sync conflict resolution (timestamp-based last-writer-wins)
- [ ] 28. Add Firestore query pagination for large subcollections
- [ ] 29. Fix import race condition (replace `setTimeout(500)` with proper state waiting)
- [ ] 30. Fix CSV export to properly escape special characters

### Code Quality & Architecture

- [ ] 31. Add input validation for habit creation/update (name, target, schedule)
- [ ] 32. Add mood score range validation (1-10) in `logMood`
- [ ] 33. Fix store `partialize` to only persist data fields (not action functions)
- [ ] 34. Add accessibility attributes (aria-labels, aria-current, semantic nav)
- [ ] 35. Add comprehensive test suite (unit tests for store, utils; integration tests for pages)

### Auth & Security

- [ ] 36. Add email verification enforcement on sign-in
- [ ] 37. Add `signInWithRedirect` fallback for mobile browsers blocking popups
- [ ] 38. Add password change flow for authenticated users
- [ ] 39. Add re-authentication utility for sensitive operations

### Algorithm Refinements

- [ ] 40. Make momentum miss penalty proportional to total scheduled habits
- [ ] 41. Add diminishing returns to momentum gains near score ceiling
- [ ] 42. Apply streak multiplier bonus during real-time completions (not just batch calc)

---

## Improvement Proposals

---


### 20. Add Date Range Selector to Trends Page

**What:** All trend widgets use hardcoded time ranges (7 days, 30 days, 90 days). Users cannot select custom date ranges or switch between periods.

**Why:** Different users care about different timeframes. A user preparing for a weekly review wants 7-day data; someone doing a quarterly reflection wants 90-day data. Flexibility increases the Trends page's utility.

**How:**
1. Add a date range picker component at the top of the Trends page
2. Offer presets: "This Week", "Last 7 Days", "Last 30 Days", "Last 90 Days", "This Year", "Custom"
3. Pass the selected range as a prop to all trend components
4. Each trend component should accept `startDate` and `endDate` props and filter data accordingly

**Logic:**
```
const [range, setRange] = useState({ start: subDays(new Date(), 30), end: new Date() });
// Pass to all trend components:
<StreakComparison startDate={range.start} endDate={range.end} />
```

**UI:**
- Horizontal scrollable pill bar with preset options
- "Custom" option opens a date picker modal
- Selected range is visually highlighted
- Matches glassmorphic design language

**Placement:** `src/app/trends/page.tsx`, all components in `src/components/trends/`

**Conflicts:** All trend components currently compute their own date ranges internally. Refactoring them to accept date range props requires changes to every trend component.

---

### 21. Add Habit-Specific Trend Filtering

**What:** All trends show aggregate data across all habits. There is no ability to filter trends for a specific habit or category.

**Why:** Users want to understand individual habit performance over time, not just aggregate statistics. "How has my meditation practice trended?" is a natural question the current Trends page cannot answer.

**How:**
1. Add a habit/category filter dropdown to the Trends page header
2. Options: "All Habits", each individual habit name, each category
3. Pass the selected filter to trend components
4. Components filter their data to only include the selected habit(s)

**Logic:**
```
const [habitFilter, setHabitFilter] = useState<string | null>(null); // null = all
const filteredLogs = habitFilter
  ? habitLogs.filter(l => l.habitId === habitFilter)
  : habitLogs;
```

**UI:** Dropdown or pill selector below the page title, above the bento grid. When a specific habit is selected, show its icon and color as context.

**Placement:** `src/app/trends/page.tsx`, all components in `src/components/trends/`

**Conflicts:** Same as #20 — trend components need refactoring to accept filtered data as props rather than pulling directly from the store.

---

### 22. Add Habit Duplication

**What:** There is no "duplicate habit" action. Users who want to create a similar habit with slight variations must manually re-enter all fields.

**Why:** Common workflow: a user tracks "Morning Run" and wants to add "Evening Run" with the same schedule and target but a different name. Duplication saves time and reduces friction.

**How:**
1. Add a "Duplicate" action to the habit context menu in `HabitManagerCard`
2. Pre-populate the `EditHabitModal` with all fields from the source habit except the name (append " (copy)")
3. The duplicated habit gets a new ID and `createdAt`

**Logic:**
```
const duplicateHabit = (source: Habit) => {
  openEditModal({
    ...source,
    id: undefined,  // will be generated
    name: `${source.name} (copy)`,
    createdAt: undefined,  // will be set to now
    streak: 0,
    bestStreak: 0
  });
};
```

**UI:** "Duplicate" option in the swipe actions or context menu of `HabitManagerCard`. Opens the edit modal pre-filled.

**Placement:** `src/components/habits/HabitManagerCard.tsx`, `src/app/habits/page.tsx`

**Conflicts:** None. Uses existing `EditHabitModal` with pre-filled data.

---

### 23. Add Notification/Reminder Infrastructure

**What:** Notifications are listed as "Coming soon" in the profile page with a disabled toggle. No infrastructure exists for reminders.

**Why:** Habit reminders are the #1 requested feature in habit tracking apps. Without reminders, users must rely on memory to open the app, which defeats the purpose of building habits.

**How:**
1. Register a service worker for push notifications (`public/sw.js`)
2. Add the Web Push API subscription flow
3. Create a reminder scheduling system (store reminder times per habit)
4. For the MVP, use the Notification API for local notifications (no server required)
5. Add reminder time picker to the habit edit modal
6. Add notification preferences to the profile page

**Logic:**
```
// Per-habit reminder:
interface HabitReminder {
  habitId: string;
  time: string; // "08:00"
  enabled: boolean;
}

// Service worker schedules local notifications
self.addEventListener('message', (event) => {
  if (event.data.type === 'SCHEDULE_REMINDER') {
    // Calculate delay and use setTimeout or Notification API
  }
});
```

**UI:**
- Time picker in habit edit modal for setting reminder time
- Global notification toggle in profile settings
- Per-habit reminder toggle in habit settings
- Permission request dialog on first enable

**Placement:** New `public/sw.js`, new `src/lib/notifications.ts`, `src/components/habits/EditHabitModal.tsx`, `src/app/profile/page.tsx`

**Conflicts:** Service worker registration must not conflict with Next.js's built-in service worker handling. Must test with the app's offline persistence (Firestore offline).

---

### 24. Add Drag-to-Reorder for Habits

**What:** Habits within categories cannot be manually reordered. They are sorted by the algorithm (streak, name, etc.) but users cannot pin important habits to the top.

**Why:** Users have a mental model of their habit priority. The most important habit should be at the top. Algorithmic sorting may place a low-streak but high-priority habit at the bottom.

**How:**
1. Add a `sortOrder` field to the `Habit` interface
2. Add a drag-and-drop interaction to `HabitManagerCard` using a drag handle icon
3. On drop, update the `sortOrder` of all affected habits
4. In the habit list sorting logic, use `sortOrder` as the primary sort key when set
5. Use `@dnd-kit` or a lightweight drag library (or Framer Motion's `Reorder` component)

**Logic:**
```
// Habit interface addition:
sortOrder?: number;

// Sorting:
habits.sort((a, b) => (a.sortOrder ?? Infinity) - (b.sortOrder ?? Infinity));
```

**UI:**
- Drag handle icon (grip dots) on the left side of each habit card in the manager view
- Visual feedback during drag (lifted card, insertion line)
- Optional "Reset order" button to clear custom ordering

**Placement:** `src/components/habits/HabitManagerCard.tsx`, `src/app/habits/page.tsx`, `src/store/useKineticStore.ts`

**Conflicts:** Custom ordering conflicts with sort-by options (streak, name, category). When custom order is set, the sort dropdown should show "Custom" and other sort options should override it.

---

### 25. Add Pagination for Habit History

**What:** The habit detail page's history log is capped at 50 entries with no way to view older entries.

**Why:** Long-term users accumulate hundreds of log entries. Limiting to 50 without pagination means users cannot review their history beyond roughly 2 months.

**How:**
1. In `src/app/habits/[id]/page.tsx`, replace the `.slice(0, 50)` with paginated rendering
2. Add a "Load More" button at the bottom of the history list
3. Load 20 entries at a time
4. Alternatively, implement virtual scrolling for the entire history list

**Logic:**
```
const [page, setPage] = useState(1);
const PAGE_SIZE = 20;
const visibleLogs = allLogs.slice(0, page * PAGE_SIZE);
const hasMore = visibleLogs.length < allLogs.length;
```

**UI:** "Load More" button at the bottom of the history section. Shows count ("Showing 20 of 347").

**Placement:** `src/app/habits/[id]/page.tsx` line ~128

**Conflicts:** None. Simple pagination of existing data.

---

### 26. Add Retry Logic for Firestore Operations

**What:** All Firestore operations are fire-and-forget. Network failures silently lose data with no retry.

**Why:** Mobile users frequently have intermittent connectivity. A single failed sync can mean lost habit completions, which is the app's most critical data. Users should never lose tracked progress.

**How:**
1. Create a `withRetry` utility wrapper in `src/lib/firestore.ts`
2. Implement exponential backoff: 1s, 2s, 4s, max 3 retries
3. Wrap all Firestore write operations with the retry utility
4. Add a sync status indicator to the UI (synced/syncing/error)
5. Queue failed operations for retry on next successful connection

**Logic:**
```
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try { return await fn(); }
    catch (e) {
      if (i === maxRetries - 1) throw e;
      await sleep(Math.pow(2, i) * 1000);
    }
  }
}
```

**UI:** Small sync status icon in the header (checkmark = synced, spinner = syncing, warning = failed with retry option).

**Placement:** `src/lib/firestore.ts`, `src/components/Header.tsx`

**Conflicts:** Retry logic must be idempotent. Firestore `set` with merge is naturally idempotent, so retries are safe.

---

### 27. Add Sync Conflict Resolution

**What:** There is no conflict resolution between local and cloud data. `fetchFromCloud` does full replacement; `syncToFirestore` does full push. Simultaneous edits on two devices silently overwrite each other.

**Why:** Multi-device usage is a core use case (phone during the day, tablet at night). Without conflict resolution, data loss is inevitable for multi-device users.

**How:**
1. Add a `lastModified` timestamp to each entity (Habit, HabitLog, MoodLog, SkipLog)
2. During sync, compare timestamps per entity
3. Use last-writer-wins strategy: keep the version with the newer `lastModified`
4. During fetch, merge cloud and local data entity-by-entity rather than full-array replacement
5. Log conflicts for debugging

**Logic:**
```
function mergeEntities<T extends { id: string; lastModified: number }>(
  local: T[], cloud: T[]
): T[] {
  const merged = new Map<string, T>();
  for (const item of [...local, ...cloud]) {
    const existing = merged.get(item.id);
    if (!existing || item.lastModified > existing.lastModified) {
      merged.set(item.id, item);
    }
  }
  return Array.from(merged.values());
}
```

**UI:** No visible UI change for normal operation. Add a subtle "Merged X changes from cloud" toast when conflicts are resolved.

**Placement:** `src/store/useKineticStore.ts` (sync functions), `src/lib/firestore.ts`

**Conflicts:** Adding `lastModified` to all entities requires a data migration. Existing data without timestamps should be assigned `createdAt` or `Date.now()` as a fallback.

---

### 28. Add Firestore Query Pagination

**What:** `getSubCollectionData` fetches ALL documents in a subcollection at once, including soft-deleted ones. For users with years of data, this results in thousands of reads per sync.

**Why:** Firestore charges per document read. A user with 2 years of daily habit tracking (10 habits) would have ~7,300 log documents, all fetched on every sync. This is expensive and slow on poor connections.

**How:**
1. In `src/lib/firestore.ts`, modify `getSubCollectionData` to accept `limit` and `startAfter` cursor parameters
2. Add a `lastSyncTimestamp` to filter only documents modified since the last sync
3. Use Firestore's `where('lastModified', '>', lastSyncTimestamp)` query
4. Paginate with `limit(500)` and cursor-based pagination

**Logic:**
```
async function getSubCollectionData(userId, collection, since?: number) {
  let query = collection(db, `users/${userId}/${collection}`);
  if (since) {
    query = query.where('lastModified', '>', since).orderBy('lastModified');
  }
  query = query.limit(500);
  // ... paginate if more results
}
```

**UI:** No UI change. Performance improvement.

**Placement:** `src/lib/firestore.ts`

**Conflicts:** Requires `lastModified` field on all documents (see #27). Existing documents without this field need a migration or fallback query.

---

### 29. Fix Import Race Condition

**What:** The data import process in the Profile page uses `setTimeout(resolve, 500)` to wait for state to settle after `clearAllData`. This is a race condition — 500ms may not be enough on slow devices.

**Why:** If the timeout fires before state has settled, the subsequent import reads stale state, causing ID mapping failures, lost data, or duplicate entries.

**How:**
1. Replace the `setTimeout` hack with a proper Zustand `subscribe` callback that resolves when the state change is confirmed
2. Alternatively, make `clearAllData` return a Promise that resolves after the state update is committed
3. Use `await` chaining instead of timeout-based polling

**Logic:**
```
// Replace:
await new Promise(resolve => setTimeout(resolve, 500));
// With:
await new Promise<void>(resolve => {
  const unsub = useKineticStore.subscribe((state) => {
    if (state.habits.length === 0) { unsub(); resolve(); }
  });
  clearAllData();
});
```

**UI:** No change. Reliability fix.

**Placement:** `src/app/profile/page.tsx` line ~113

**Conflicts:** None. Drop-in replacement for the setTimeout.

---

### 30. Fix CSV Export Special Character Escaping

**What:** The CSV export function does not properly escape habit names containing commas, quotes, or newlines, corrupting the output file.

**Why:** Users with habit names like `Read "Deep Work"` or `Walk, Run, Swim` will produce malformed CSV that cannot be imported into spreadsheet software.

**How:**
1. In `src/app/profile/page.tsx`, create a `escapeCsvField` utility function
2. Apply it to all fields in the CSV export, not just the habit name
3. Follow RFC 4180: wrap fields containing commas, quotes, or newlines in double quotes; escape internal double quotes by doubling them

**Logic:**
```
function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
```

**UI:** No UI change. Export correctness fix.

**Placement:** `src/app/profile/page.tsx` lines 192-219

**Conflicts:** None. Additive utility function.

---

### 31. Add Input Validation for Habit CRUD

**What:** `addHabit` and `updateHabit` accept any input without validation. No checks for empty names, duplicate names, zero/negative targets, or empty schedules.

**Why:** Invalid data corrupts analytics (division by zero with `target: 0`), confuses users (duplicate names in lists), and can cause runtime crashes.

**How:**
1. Add a `validateHabit` function in `src/lib/habitValidation.ts`
2. Call it in `addHabit` and `updateHabit` before writing to state
3. Return validation errors to the UI for display
4. Validate: name non-empty and <= 50 chars, target > 0, schedule has >= 1 day, type is valid enum

**Logic:**
```
function validateHabit(habit: Partial<Habit>): ValidationResult {
  const errors: string[] = [];
  if (!habit.name?.trim()) errors.push('Name is required');
  if (habit.name && habit.name.length > 50) errors.push('Name too long');
  if (habit.target !== undefined && habit.target <= 0) errors.push('Target must be positive');
  if (habit.schedule && habit.schedule.length === 0) errors.push('Select at least one day');
  return { valid: errors.length === 0, errors };
}
```

**UI:** Show validation errors inline in the `EditHabitModal` form fields. Disable the save button when validation fails.

**Placement:** New file `src/lib/habitValidation.ts`, `src/store/useKineticStore.ts`, `src/components/habits/EditHabitModal.tsx`

**Conflicts:** None. Additive validation layer.

---

### 32. Add Mood Score Range Validation

**What:** `logMood` in the store does not validate that the score is between 1 and 10. Invalid values corrupt mood analytics.

**Why:** While the UI slider constrains input to 1-10, programmatic access (imports, bugs, future API) could write invalid values. Defense in depth requires store-level validation.

**How:**
1. In `src/store/useKineticStore.ts` `logMood` function, clamp the score to 1-10
2. Reject or warn on non-integer values

**Logic:**
```
logMood: (score: number) => {
  const clampedScore = Math.max(1, Math.min(10, Math.round(score)));
  // ... proceed with clampedScore
}
```

**UI:** No change. Defensive validation.

**Placement:** `src/store/useKineticStore.ts` line ~517

**Conflicts:** None.

---

### 33. Fix Store `partialize` to Only Persist Data

**What:** The Zustand `persist` middleware's `partialize` function uses a spread operator that includes all action functions in the persisted state, increasing serialization/deserialization overhead.

**Why:** Action functions are re-created on every store initialization. Persisting them wastes localStorage space and slows down hydration. With 50+ functions, this is non-trivial overhead.

**How:**
1. In `src/store/useKineticStore.ts`, change `partialize` to explicitly list only data fields:
```
partialize: (state) => ({
  habits: state.habits,
  habitLogs: state.habitLogs,
  moodLogs: state.moodLogs,
  skipLogs: state.skipLogs,
  momentumScore: state.momentumScore,
  lastDecayDate: state.lastDecayDate,
  weeklyContractTarget: state.weeklyContractTarget,
  selectedDate: state.selectedDate,
})
```

**Logic:** Only serialize state data. Actions are code, not state.

**UI:** No change. Performance optimization.

**Placement:** `src/store/useKineticStore.ts` lines 1424-1427

**Conflicts:** Must ensure all necessary data fields are included. Missing a field means it resets to the initial value on page reload.

---

### 34. Add Accessibility Attributes

**What:** The app lacks semantic HTML attributes, ARIA labels, and keyboard navigation support throughout.

**Why:** Accessibility is both a legal requirement (ADA, WCAG 2.1) and a usability improvement. Screen reader users cannot navigate the app. Keyboard-only users cannot interact with habit cards.

**How:**
1. Add `aria-label` to BottomNav (`<nav aria-label="Main navigation">`)
2. Add `aria-current="page"` to the active nav link
3. Add `role="button"` and `tabIndex={0}` to clickable habit cards
4. Add `onKeyDown` handlers for Enter/Space on interactive elements
5. Add `aria-live="polite"` to toast notifications
6. Add skip-to-content link in the layout
7. Ensure all form inputs have associated labels

**Logic:** Semantic HTML + ARIA attributes. No business logic changes.

**UI:** No visual change. Screen reader and keyboard navigation improvements.

**Placement:** Throughout all components, starting with `BottomNav.tsx`, `HabitCard.tsx`, `Toast.tsx`, `layout.tsx`

**Conflicts:** None. Additive attributes.

---

### 35. Add Comprehensive Test Suite

**What:** The project has zero tests — no test files, no test dependencies, no test configuration.

**Why:** Without tests, every change risks introducing regressions. The complex business logic (momentum calculation, streak tracking, completion status) is especially prone to subtle bugs that manual testing misses.

**How:**
1. Install testing dependencies: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`
2. Configure Vitest with Next.js support
3. Write unit tests for:
   - `completionUtils.ts` (all 5 status paths + edge cases)
   - `momentumUtils.ts` (boost, penalty, decay, status labels)
   - `habitCalculations.ts` (stats, calendar data)
   - `dateUtils.ts` (date formatting, comparison)
   - Store actions: `addHabit`, `logHabitCompletion`, `recalculateStreak`, `applyDailyDecay`
4. Write integration tests for key user flows:
   - Complete a habit and verify streak update
   - Navigate calendar strip and verify habit list changes
   - Import/export data round-trip

**Logic:** Test business rules, not implementation details. Focus on the most complex and bug-prone areas first.

**UI:** No UI change. Developer tooling.

**Placement:** `vitest.config.ts`, `src/__tests__/` directory

**Conflicts:** None. New development dependency and configuration.

---

### 36. Add Email Verification Enforcement

**What:** `signInWithEmail` does not check `user.emailVerified`. Users can sign in with unverified emails.

**Why:** Without verification, a user who typos their email during registration will lose access to their account (cannot reset password for wrong email). Also prevents account hijacking via email enumeration.

**How:**
1. In `src/contexts/AuthContext.tsx`, after successful `signInWithEmailAndPassword`, check `user.emailVerified`
2. If not verified, send a verification email and show a message asking the user to check their inbox
3. Do not set the user as authenticated until email is verified
4. Add a "Resend verification email" button

**Logic:**
```
const result = await signInWithEmailAndPassword(auth, email, password);
if (!result.user.emailVerified) {
  await sendEmailVerification(result.user);
  await signOut(auth);
  throw new Error('Please verify your email before signing in.');
}
```

**UI:** Verification prompt screen between sign-in and the main app. "Resend email" button with cooldown.

**Placement:** `src/contexts/AuthContext.tsx`, `src/app/login/page.tsx`

**Conflicts:** Existing users who never verified their email will be locked out. Must provide a path for them to verify (send verification email on next sign-in attempt).

---

### 37. Add `signInWithRedirect` Fallback for Mobile

**What:** Google sign-in uses `signInWithPopup`, which is blocked by many mobile browsers. There is no fallback to `signInWithRedirect`.

**Why:** Mobile is the primary platform for habit tracking apps. A broken Google sign-in on mobile is a critical user acquisition blocker.

**How:**
1. In `src/contexts/AuthContext.tsx`, detect mobile browsers (user agent or `window.innerWidth`)
2. Use `signInWithRedirect` on mobile, `signInWithPopup` on desktop
3. Handle the redirect result in the auth callback page (`/auth/callback`)
4. Re-enable the currently disabled auth callback page

**Logic:**
```
const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
if (isMobile) {
  await signInWithRedirect(auth, googleProvider);
} else {
  await signInWithPopup(auth, googleProvider);
}
```

**UI:** No change for the user. Same Google sign-in button, different implementation path.

**Placement:** `src/contexts/AuthContext.tsx`, `src/app/auth/callback/page.tsx`

**Conflicts:** The auth callback page is currently disabled with a comment. Must be re-implemented to handle the redirect result.

---

### 38. Add Password Change Flow

**What:** Authenticated users cannot change their password from within the app. The only option is the password reset email flow.

**Why:** Users should be able to change their password without leaving the app, especially after a security concern or when they want to use a stronger password.

**How:**
1. Add `changePassword` function to `AuthContext` that uses Firebase's `updatePassword`
2. Require current password for re-authentication before allowing the change
3. Add a "Change Password" section to the Profile page (visible only for email/password users)

**Logic:**
```
async changePassword(currentPassword: string, newPassword: string) {
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
}
```

**UI:** "Change Password" card in profile page with current password, new password, and confirm password fields.

**Placement:** `src/contexts/AuthContext.tsx`, `src/app/profile/page.tsx`

**Conflicts:** None. New feature addition.

---

### 39. Add Re-Authentication Utility

**What:** Firebase requires recent authentication for sensitive operations (email change, password change, account deletion). No re-authentication utility exists.

**Why:** Without this utility, implementing account deletion (#9), password change (#38), or email change requires duplicating re-authentication logic. A shared utility keeps the code DRY.

**How:**
1. Create `reauthenticate` function in `AuthContext` that:
   - Detects the user's sign-in provider (email or Google)
   - For email: prompts for password and uses `reauthenticateWithCredential`
   - For Google: uses `reauthenticateWithPopup` (or redirect on mobile)
2. Create a `ReauthDialog` component that is shown before sensitive operations

**Logic:**
```
async reauthenticate(): Promise<void> {
  const provider = user.providerData[0].providerId;
  if (provider === 'password') {
    const password = await promptForPassword(); // show dialog
    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);
  } else {
    await reauthenticateWithPopup(user, googleProvider);
  }
}
```

**UI:** Modal dialog requesting password (for email users) or triggering Google re-auth (for Google users).

**Placement:** `src/contexts/AuthContext.tsx`, new component `src/components/ReauthDialog.tsx`

**Conflicts:** Must be implemented before #9 (account deletion) and #38 (password change).

---

### 40. Make Momentum Penalty Proportional

**What:** The momentum miss penalty is a flat -5 regardless of how many habits are scheduled. A user with 1 habit missing loses the same as a user with 10 habits and 1 missing.

**Why:** Flat penalties punish users with fewer habits disproportionately. A user tracking 1 habit who misses a day loses 5 + 2 (decay) = 7 points, while a user tracking 10 habits who misses 1 out of 10 (90% completion rate) also loses 5 + 2 = 7 despite being far more consistent.

**How:**
1. In `src/lib/momentumUtils.ts`, change `calculateMomentumChange` to accept `totalScheduled` and `totalMissed` parameters
2. Calculate penalty as: `-(totalMissed / totalScheduled) * 10`
3. This makes 1/10 missed = -1, while 1/1 missed = -10

**Logic:**
```
const penalty = totalMissed > 0
  ? -Math.round((totalMissed / totalScheduled) * 10)
  : 0;
```

**UI:** No UI change. Algorithm refinement.

**Placement:** `src/lib/momentumUtils.ts`, `src/store/useKineticStore.ts` (callers)

**Conflicts:** Changes the momentum scoring formula. Users will see different scores after the update. Consider a one-time recalculation of momentum from historical data.

---

### 41. Add Diminishing Returns to Momentum Gains

**What:** A user at score 95 gains the same +10 for a completion as a user at score 20. There are no diminishing returns near the ceiling.

**Why:** Without diminishing returns, it is too easy to reach and maintain 100. The score loses meaning because everyone who is moderately consistent sits at 95-100. A logarithmic curve rewards consistency while making perfection aspirational.

**How:**
1. In `src/lib/momentumUtils.ts`, apply a multiplier based on current score:
   - Below 50: gains are amplified (1.5x) to encourage recovery
   - 50-80: normal gains (1.0x)
   - 80-95: reduced gains (0.5x)
   - Above 95: minimal gains (0.25x)
2. This creates a natural equilibrium where consistent users settle around 80-90

**Logic:**
```
function gainMultiplier(currentScore: number): number {
  if (currentScore < 50) return 1.5;
  if (currentScore < 80) return 1.0;
  if (currentScore < 95) return 0.5;
  return 0.25;
}
const boost = baseBoost * gainMultiplier(currentScore);
```

**UI:** No UI change. Algorithm refinement. Consider adding a tooltip explaining the scoring system.

**Placement:** `src/lib/momentumUtils.ts`

**Conflicts:** Same as #40 — changes the scoring formula. Existing users' scores will shift. Bundle with #40 and do a full momentum recalculation.

---

### 42. Apply Streak Bonus During Real-Time Completions

**What:** The `calculateMomentumScore` function in the store adds streak bonuses, but `logHabitCompletion` only calls `calculateMomentumChange` which does not include streak bonuses. Streak multipliers are never applied during normal completion.

**Why:** Streaks are a core feature. If maintaining a long streak doesn't result in higher momentum gains, the motivational impact of streaks is diminished. Users with 30-day streaks should feel the momentum benefit.

**How:**
1. In `src/store/useKineticStore.ts` `logHabitCompletion`, after calling `calculateMomentumChange`, add a streak bonus
2. The bonus should be proportional to the streak length: `Math.min(streak / 10, 3)` extra points (caps at +3 for 30+ day streaks)
3. Alternatively, refactor to use `calculateMomentumScore` for all momentum updates

**Logic:**
```
const baseChange = calculateMomentumChange(completionRate, missCount);
const streakBonus = Math.min(habit.streak / 10, 3); // +0.1 per streak day, max +3
const totalChange = baseChange + streakBonus;
newMomentum = clamp(0, 100, currentMomentum + totalChange);
```

**UI:** Consider showing "+X momentum" feedback with streak bonus breakdown when a completion extends a long streak.

**Placement:** `src/store/useKineticStore.ts` lines 460-470

**Conflicts:** Must coordinate with #40 and #41 to avoid over-engineering the momentum formula. All three algorithm changes should be designed together and deployed as a single update.
