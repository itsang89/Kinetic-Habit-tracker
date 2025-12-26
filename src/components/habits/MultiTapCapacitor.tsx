'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, Check } from 'lucide-react';
import { useState } from 'react';

interface MultiTapCapacitorProps {
  value: number;
  max: number;
  onChange: (value: number) => void;
  unit?: string;
}

export default function MultiTapCapacitor({ value, max, onChange, unit = 'cups' }: MultiTapCapacitorProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value.toString());
  
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const handleIncrement = (e: React.MouseEvent) => {
    if (isEditing) return;
    e.stopPropagation();
    onChange(Math.min(max + 10, value + 1)); // Allow slight overfill
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(Math.max(0, value - 1));
  };

  const handleManualSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const numValue = parseInt(editValue);
    if (!isNaN(numValue)) {
      onChange(Math.max(0, numValue));
    }
    setIsEditing(false);
  };

  const handleValueClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditValue(value.toString());
  };

  return (
    <div 
        className="flex items-center gap-4"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
    >
      {/* Decrement Button (visible on hover or if value > 0) */}
      <AnimatePresence>
        {(isHovered || value > 0) && !isEditing && (
            <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={handleDecrement}
                className="p-2 rounded-full bg-[var(--theme-foreground)]/5 hover:bg-[var(--theme-foreground)]/10 text-[var(--theme-text-secondary)] transition-colors"
            >
                <Minus className="w-4 h-4" />
            </motion.button>
        )}
      </AnimatePresence>

      {/* Capacitor (Ring) */}
      <motion.div
        whileHover={!isEditing ? { scale: 1.05 } : {}}
        onClick={handleIncrement}
        className="relative w-20 h-20 rounded-full flex items-center justify-center bg-[var(--theme-foreground)]/5 border-4 border-[var(--theme-foreground)]/10 cursor-pointer"
      >
        <svg className="absolute inset-0 w-full h-full -rotate-90 transform" viewBox="0 0 80 80">
            {/* Background Circle */}
            <circle
                cx="40"
                cy="40"
                r={radius}
                stroke="currentColor"
                strokeWidth="4"
                fill="transparent"
                className="text-transparent"
            />
            {/* Progress Circle */}
            <motion.circle
                cx="40"
                cy="40"
                r={radius}
                stroke="currentColor"
                strokeWidth="4"
                fill="transparent"
                strokeDasharray={circumference}
                animate={{ strokeDashoffset }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
                className={`${value >= max ? 'text-[var(--theme-text-primary)]' : 'text-[var(--theme-text-secondary)]'}`}
            />
        </svg>

        {/* Center Content */}
        <div className="flex flex-col items-center z-10">
            {isEditing ? (
                <form onSubmit={handleManualSubmit} onClick={e => e.stopPropagation()}>
                    <input
                        autoFocus
                        type="number"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onBlur={() => handleManualSubmit()}
                        className="w-12 bg-transparent text-center text-xl font-bold text-[var(--theme-text-primary)] focus:outline-none"
                    />
                </form>
            ) : value >= max ? (
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    onClick={handleValueClick}
                >
                    <Check className="w-6 h-6 text-[var(--theme-text-primary)]" />
                </motion.div>
            ) : (
                <div onClick={handleValueClick} className="flex flex-col items-center">
                    <span className="text-xl font-bold text-[var(--theme-text-primary)]">
                        {value}
                    </span>
                    <span className="text-[9px] text-[var(--theme-text-tertiary)] uppercase font-bold">
                        / {max}
                    </span>
                </div>
            )}
        </div>
        
        {/* Hover Plus Indicator */}
        {!isEditing && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: isHovered && value < max ? 1 : 0 }}
                className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full pointer-events-none"
            >
                <Plus className="w-6 h-6 text-white" />
            </motion.div>
        )}
      </motion.div>
      
      {/* Label outside */}
      <div className="flex flex-col">
          <span className="text-xs font-bold text-[var(--theme-text-secondary)] uppercase">
              {unit}
          </span>
          <span className="text-[10px] text-[var(--theme-text-tertiary)]">
              Target: {max}
          </span>
      </div>
    </div>
  );
}

