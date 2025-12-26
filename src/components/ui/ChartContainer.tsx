'use client';

import { useEffect, useState, useRef, ReactNode } from 'react';
import { ResponsiveContainer } from 'recharts';

interface ChartContainerProps {
  children: ReactNode;
  className?: string;
  minHeight?: number;
}

/**
 * A wrapper component that defers Recharts rendering until container dimensions are valid.
 * This prevents the common "width/height -1" errors from Recharts.
 */
export default function ChartContainer({ 
  children, 
  className = '',
  minHeight = 100 
}: ChartContainerProps) {
  const [ready, setReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Small delay to ensure container has valid dimensions
    const timer = setTimeout(() => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        if (width > 0 && height > 0) {
          setReady(true);
        }
      }
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  // Also handle resize
  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
          setReady(true);
        }
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div 
      ref={containerRef} 
      className={`w-full ${className}`}
      style={{ minHeight }}
    >
      {ready ? (
        <ResponsiveContainer width="100%" height="100%" minWidth={50} minHeight={50}>
          {children as any}
        </ResponsiveContainer>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}


