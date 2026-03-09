import * as React from "react";
import type { Metadata } from "next";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";
import { ToastProvider } from '@/components/ToastProvider';
import ErrorBoundary from '@/components/ErrorBoundary';
import { AuthProvider } from '@/contexts/AuthContext';

export const metadata: Metadata = {
  title: "Kinetic - Habit & Mood Tracker",
  description: "Track your momentum, build habits, and understand your happiness patterns",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-[var(--theme-foreground)] focus:text-[var(--theme-background)] rounded-lg">
          Skip to main content
        </a>
        <ErrorBoundary>
          <AuthProvider>
            <ThemeProvider>
              <ToastProvider>
                <main id="main-content" tabIndex={-1}>
                  {children}
                </main>
              </ToastProvider>
            </ThemeProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
