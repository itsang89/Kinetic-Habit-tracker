'use client';

import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Edit2, Check } from 'lucide-react';

interface KineticSliderProps {
  value: number;
  max: number;
  onChange: (value: number) => void;
  onComplete?: () => void;
  unit?: string;
}

export default function KineticSlider({ value, max, onChange, onComplete, unit = 'min' }: KineticSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [width, setWidth] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value.toString());
  
  // Motion value for the slider position (0 to width)
  const x = useMotionValue(0);
  
  // Map x to percentage (0 to 100)
  const progress = useTransform(x, [0, width], [0, 100]);
  
  // Map x to value (0 to max)
  const displayValue = useTransform(x, [0, width], [0, max]);

  useEffect(() => {
    if (containerRef.current) {
      setWidth(containerRef.current.offsetWidth);
    }
  }, []);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Sync internal x with prop value when not dragging
  useEffect(() => {
    if (!isDragging && width > 0) {
      const targetX = (Math.min(value, max) / max) * width;
      animate(x, targetX, { type: 'spring', stiffness: 300, damping: 30 });
    }
    if (!isEditing) {
      setEditValue(value.toString());
    }
  }, [value, max, width, isDragging, isEditing, x]);

  const handleDragEnd = () => {
    setIsDragging(false);
    const currentX = x.get();
    const percent = Math.min(1, Math.max(0, currentX / width));
    const newValue = Math.round(percent * max);
    
    onChange(newValue);
    
    if (newValue >= max && onComplete) {
      onComplete();
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
      if (isEditing) return;
      // Allow tap to jump
      if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const clientX = e.clientX;
          const offsetX = clientX - rect.left;
          const constrainedX = Math.min(width, Math.max(0, offsetX));
          
          animate(x, constrainedX, { type: 'spring', stiffness: 400, damping: 25 });
          
          const percent = Math.min(1, Math.max(0, constrainedX / width));
          const newValue = Math.round(percent * max);
          onChange(newValue);
      }
  };

  const handleManualSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const numValue = parseInt(editValue);
    if (!isNaN(numValue)) {
      onChange(Math.max(0, numValue));
    }
    setIsEditing(false);
  };

  return (
    <div className="w-full space-y-2 select-none touch-none">
      <div className="flex justify-between items-center px-1">
        <div className="flex items-center gap-2">
          {isEditing ? (
            <form onSubmit={handleManualSubmit} className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => handleManualSubmit()}
                className="w-16 bg-[var(--theme-foreground)]/10 border border-[var(--theme-foreground)]/30 rounded-lg px-2 py-0.5 text-sm font-bold text-[var(--theme-text-primary)] focus:outline-none focus:border-[var(--theme-foreground)]"
              />
              <button type="submit" className="text-[var(--theme-text-primary)] hover:opacity-80">
                <Check className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <button 
              onClick={() => setIsEditing(true)}
              className="group flex items-center gap-1.5 hover:text-[var(--theme-text-primary)] transition-colors"
            >
              <span className="text-xs font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider group-hover:text-[var(--theme-text-primary)]">
                  {value} / {max} {unit}
              </span>
              <Edit2 className="w-3 h-3 text-[var(--theme-text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}
        </div>
        <span className="text-xs font-bold text-[var(--theme-text-tertiary)]">
            {Math.round((value / max) * 100)}%
        </span>
      </div>

      <div 
        ref={containerRef}
        className="relative h-12 bg-[var(--theme-foreground)]/5 rounded-2xl overflow-hidden cursor-pointer border border-[var(--theme-border)]"
        onPointerDown={handlePointerDown}
      >
        {/* Fill Track */}
        <motion.div 
          className="absolute inset-y-0 left-0 bg-[var(--theme-foreground)]/10"
          style={{ width: x }}
        >
             <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[var(--theme-foreground)]/20" />
        </motion.div>
        
        {/* Active Fill (Brighter) */}
        <motion.div
            className="absolute inset-y-0 left-0 bg-[var(--theme-foreground)]"
            style={{ width: x, opacity: useTransform(x, [0, width], [0.3, 1]) }}
        />

        {/* Handle */}
        <motion.div
          drag="x"
          dragConstraints={containerRef}
          dragElastic={0}
          dragMomentum={false}
          style={{ x }}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={handleDragEnd}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 1.2, cursor: 'grabbing' }}
          className="absolute top-1 bottom-1 w-2 bg-[var(--theme-background)] rounded-full shadow-[0_0_10px_rgba(0,0,0,0.3)] z-10 cursor-grab ml-[-1px] border border-[var(--theme-foreground)]"
        >
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-0.5 h-4 bg-[var(--theme-foreground)] rounded-full" />
            </div>
        </motion.div>
        
        {/* Text over bar (optional, better contrast mix-blend-mode?) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             <motion.span 
                className="text-xs font-bold text-[var(--theme-background)] mix-blend-screen"
                style={{ opacity: useTransform(x, [0, width/2], [0, 1]) }}
             >
                 {unit.toUpperCase()}
             </motion.span>
        </div>
      </div>
    </div>
  );
}

