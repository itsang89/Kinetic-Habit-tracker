'use client';

import { motion } from 'framer-motion';
import { Smile } from 'lucide-react';
import { useKineticStore } from '@/store/useKineticStore';
import { useState, useEffect } from 'react';

const moodEmojis = ['💀', '😫', '😩', '☹️', '😐', '🙂', '😊', '😎', '🤩', '🚀'];
const moodLabels = ['Terrible', 'Very Bad', 'Bad', 'Poor', 'Okay', 'Good', 'Great', 'Excellent', 'Amazing', 'Unstoppable'];

interface MoodSliderProps {
  date?: string; // Format: YYYY-MM-DD
}

export default function MoodSlider({ date }: MoodSliderProps) {
  const { logMood, getMoodOnDate } = useKineticStore();
  const [mounted, setMounted] = useState(false);
  const [mood, setMood] = useState(5);
  const [hasLogged, setHasLogged] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const targetDate = date || new Date().toISOString().split('T')[0];
    const todaysMood = getMoodOnDate(targetDate);
    if (todaysMood !== null) {
      setMood(todaysMood);
      setHasLogged(true);
    } else {
      setMood(5);
      setHasLogged(false);
    }
  }, [mounted, date, getMoodOnDate]);

  const handleMoodChange = (value: number) => {
    setMood(value);
  };

  const handleSave = async () => {
    await logMood(mood, date);
    setHasLogged(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass p-8"
    >
      <div className="flex items-center gap-3 mb-8">
         <div className="w-8 h-8 rounded-full bg-[var(--theme-foreground)]/10 flex items-center justify-center">
            <Smile className="w-4 h-4 text-[var(--theme-text-primary)]" />
         </div>
        <h2 className="text-sm font-semibold text-[var(--theme-text-primary)] uppercase tracking-widest">Daily Log</h2>
      </div>

      <div className="flex flex-col items-center">
        {/* Emoji display */}
        <motion.div
           key={mood}
           initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
           animate={{ scale: 1, opacity: 1, rotate: 0 }}
           className="w-24 h-24 rounded-full bg-[var(--theme-foreground)]/5 border border-[var(--theme-border)] flex items-center justify-center text-5xl mb-4 shadow-xl"
        >
          {moodEmojis[mood - 1]}
        </motion.div>
        
        <motion.p
          key={moodLabels[mood - 1]}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xl font-bold text-[var(--theme-text-primary)] mb-8"
        >
          {moodLabels[mood - 1]}
        </motion.p>

        {/* Custom Range Slider Container */}
        <div className="w-full mb-8 relative px-2">
           {/* Custom Track */}
          <div className="absolute top-1/2 left-0 w-full h-1 bg-[var(--theme-foreground)]/20 rounded-full -translate-y-1/2 pointer-events-none overflow-hidden">
             <motion.div 
               className="h-full bg-[var(--theme-foreground)]"
               style={{ width: `${((mood - 1) / 9) * 100}%` }} 
             />
          </div>

          <input
            type="range"
            min="1"
            max="10"
            value={mood}
            onChange={(e) => handleMoodChange(parseInt(e.target.value))}
            className="w-full relative z-10 opacity-0 cursor-pointer h-8"
          />
          
          {/* Visible Thumb */}
          <motion.div 
             className="absolute top-1/2 w-6 h-6 bg-[var(--theme-background)] border-2 border-[var(--theme-foreground)] rounded-full -translate-y-1/2 pointer-events-none shadow-[0_0_15px_var(--theme-glow)]"
             style={{ left: `calc(${((mood - 1) / 9) * 100}% - 12px)` }}
          />

          <div className="flex justify-between mt-4 text-[10px] text-[var(--theme-text-secondary)] font-medium uppercase tracking-widest">
            <span>Low Energy</span>
            <span>High Energy</span>
          </div>
        </div>

        {/* Save button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          className={`
            w-full py-4 rounded-2xl font-bold text-sm tracking-wide transition-all uppercase
            ${hasLogged
              ? 'bg-[var(--theme-foreground)]/10 text-[var(--theme-text-secondary)] border border-[var(--theme-border)] hover:bg-[var(--theme-foreground)]/20 hover:text-[var(--theme-text-primary)]'
              : 'bg-[var(--theme-foreground)] text-[var(--theme-background)] hover:opacity-90'
            }
          `}
        >
          {hasLogged ? 'Update Log' : 'Log Mood'}
        </motion.button>
      </div>
    </motion.div>
  );
}
