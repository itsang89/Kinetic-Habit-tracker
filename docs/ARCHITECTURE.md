# System Architecture

This document outlines the technical architecture of Kinetic.

## Overview

Kinetic is a client-first web application built with Next.js. It prioritizes a fast, offline-capable experience using local state persistence, with optional cloud synchronization.

## 🧠 State Management (Zustand)

The core application state is managed by [Zustand](https://github.com/pmndrs/zustand) in `src/store/useKineticStore.ts`.

### Persistence
The store uses the `persist` middleware to save the entire application state to `localStorage`. This ensures that users can use the app without an account or an internet connection.

### Core Entities
- **Habit**: Definition of a habit (name, unit, target, schedule).
- **HabitLog**: A specific completion record for a habit.
- **MoodLog**: Daily mood entry.
- **MomentumScore**: A calculated value representing overall progress.

## ⚡ Momentum & Decay Logic

Kinetic uses a custom algorithm to calculate user "Momentum":

1.  **Bonuses**: Completing a habit adds to the score. Proportional credit is given for partial completions.
2.  **Daily Decay**: Every day, a fixed decay is applied. Additionally, for every scheduled habit missed the previous day, an extra penalty is applied.
3.  **Shields**: Users can use a "Shield" once per habit to prevent a streak reset and score penalty for a single missed day. The shield becomes available again after it is used (cooldown logic).

## ☁️ Cloud Synchronization

The app is integrated with **Supabase** for optional cloud sync.

### Sync Strategy
- **Debounced Sync**: To avoid excessive writes, the app waits for a period of inactivity (`SYNC_DEBOUNCE_MS`) before pushing local changes to Supabase.
- **Manual Initialization**: When the app starts, it attempts to fetch the latest state from the cloud and merges it with the local state.
- **Conflict Resolution**: Currently, the app follows a "last-write-wins" or "cloud-overwrites-local" strategy upon initialization.

## 📊 Analytics & Trends

The "Trends" tab utilizes [Recharts](https://recharts.org/) to visualize data processed through Zustand selectors:

- **Day-of-Week Efficiency**: Calculated by looking back at the last 12 weeks of completions.
- **Time-of-Day Performance**: Aggregates completions by hour.
- **Mood Correlation**: Compares average mood scores on days with high vs. low habit completion rates.

## 📁 Directory Structure

- `src/app`: Page components and routing.
- `src/components`: Reusable UI elements, organized by feature (e.g., `trends/`, `habits/`).
- `src/lib`: Domain logic, including `habitCalculations.ts` and `dateUtils.ts`.
- `src/store`: The central Zustand store and types.
- `src/hooks`: Feature-specific hooks for forms, progress tracking, etc.
