# Kinetic - Habit & Mood Tracker

A minimalist habit and mood tracker with a stunning monochrome aesthetic, built with Next.js 15, Tailwind CSS, and Framer Motion.

## Features

### Home Dashboard

#### Momentum Score
- Dynamic scoring algorithm that increases with habit completion
- Daily decay for missed habits keeps you accountable
- Beautiful animated circular progress indicator
- Clean monochrome design with trend indicators

#### Habit Management
- Create habits with customizable units (mins, pages, reps, etc.)
- Flexible scheduling (select specific days of the week)
- Streak tracking with flame indicators
- One-tap completion from the dashboard

#### Shield Protection
- One-time streak protection per habit
- Use it when life gets in the way
- Prevents streak reset for missed days

#### Happiness Log
- Daily mood slider (1-10 scale)
- Emoji-based mood visualization
- Quick daily logging with one tap

### Stats & Trends Section (NEW)

Navigate to the Trends tab to access powerful analytics:

#### Kinetic Energy Gauge
- Animated speedometer showing your overall momentum
- Motivational messages based on your current score
- Pulse animation that speeds up when score is high
- Quick stats: total habits, completions, best streak

#### Consistency Chain (Paper Chain)
- Visual history of your daily completions
- 30-day horizontal scrollable chain
- Filled nodes for complete days, broken links for missed days
- Shows current streak length

#### Total Volume Cards
- Lifetime totals for each habit
- Trophy-style cards showing big numbers
- "450 Pages Read," "2,000 Mins Meditated"
- Top 3 habits by volume highlighted

#### Streak Comparison
- Current streak vs best streak visualization
- Progress bar with ghost marker for record
- Countdown to beating your personal best

#### Weekly Wrap-Up
- Top habit of the week
- Overall completion rate
- Momentum change (+/-)
- Average mood score

#### Mood Insight Card
- AI-style correlation analysis
- Shows which habit impacts your mood most
- E.g., "Your mood is +1.5 points higher on days you complete 'Exercise'"

#### Day-of-Week Efficiency
- Bar chart showing completion rates for each day
- Identifies your weakest day
- Actionable feedback: "Friday needs attention - 40% completion rate"

#### Time-of-Day Performance
- Area chart showing when you complete habits
- Identifies peak productivity hours
- E.g., "You're most productive at 7am"

#### Habit Health Grid
- Battery indicators for each habit
- Health score based on last 7 days (weighted by recency)
- Alerts for habits at critical health

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS 4
- **Animations**: Framer Motion
- **State Management**: Zustand (with localStorage persistence)
- **Icons**: Lucide React
- **Charts**: Recharts
- **Backend Ready**: Supabase integration prepared

## Design System

### Colors
- **Background**: Pure Black (#000000)
- **Foreground**: Pure White (#ffffff)
- **Accents**: Grays (Neutral-400 to Neutral-900)

### UI Style
- Glassmorphic cards with backdrop blur
- High contrast typography
- Subtle white glow effects
- Smooth micro-interactions
- Bento grid layout for stats

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Run the development server**
   ```bash
   npm run dev
   ```

3. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx              # Home dashboard
│   └── trends/
│       └── page.tsx          # Stats & Trends page
├── components/
│   ├── AddHabitModal.tsx
│   ├── BottomNav.tsx         # Navigation between pages
│   ├── DemoDataLoader.tsx
│   ├── HabitCard.tsx
│   ├── HabitHeatmap.tsx
│   ├── HabitList.tsx
│   ├── Header.tsx
│   ├── MomentumScore.tsx
│   ├── MoodCorrelationChart.tsx
│   ├── MoodSlider.tsx
│   └── trends/
│       ├── DayEfficiencyChart.tsx
│       ├── HabitHealthGrid.tsx
│       ├── KineticEnergyGauge.tsx
│       ├── MoodInsightCard.tsx
│       ├── PaperChain.tsx
│       ├── StreakComparison.tsx
│       ├── TimePerformanceChart.tsx
│       ├── TotalVolumeCards.tsx
│       └── WeeklyWrapCard.tsx
├── lib/
│   └── supabase.ts
└── store/
    └── useKineticStore.ts    # Zustand store with stats selectors
```

## License

MIT License - Feel free to use this project for personal or commercial purposes.

---

Built with Next.js, Tailwind CSS, and Framer Motion
