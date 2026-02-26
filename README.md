# Kinetic - Habit & Mood Tracker

> A minimalist habit and mood tracker with a stunning monochrome aesthetic.

Built with **Next.js 15**, **Tailwind CSS 4**, and **Framer Motion**, Kinetic is designed for focus and accountability.

## 🚀 Quick Start

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Navigate to [http://localhost:3000](http://localhost:3000) to see the app in action.

## ✨ Features

- **Momentum Score**: A dynamic scoring algorithm that rewards consistency and decays with missed habits.
- **Habit Management**: Create habits with customizable units, flexible scheduling, and streak tracking.
- **Shield Protection**: Protect your streaks once per habit when life gets in the way.
- **Happiness Log**: Daily mood tracking (1-10 scale) with visualization.
- **Stats & Trends**: Deep analytics including Kinetic Energy Gauge, Consistency Chain (Paper Chain), and Volume Tracking.
- **AI-Style Insights**: Mood correlation analysis to see how habits affect your well-being.
- **Efficiency Analysis**: Day-of-week and time-of-day performance charts.

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS 4
- **Animations**: Framer Motion
- **State Management**: Zustand (with localStorage persistence)
- **Icons**: Lucide React
- **Charts**: Recharts

## 🏗️ Architecture

- **State Management**: Uses Zustand for a global reactive state. The store is persisted to `localStorage` via the `persist` middleware.
- **Data Storage**: Local-first persistence in browser `localStorage`.
- **Momentum Logic**: Implements a daily decay system for missed habits and bonuses for completions.

For more details, see [ARCHITECTURE.md](./docs/ARCHITECTURE.md).

## 📂 Project Structure

```text
src/
├── app/          # Next.js App Router pages
├── components/   # UI components and feature-specific blocks
├── hooks/        # Custom React hooks
├── lib/          # Utilities, constants, and calculations
└── store/        # Zustand state store
```

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Built with focus by the Kinetic Team.
