'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';

// Fire particle component
const FireParticle = ({ delay, color }: { delay: number; color: string }) => {
  const randomX = Math.random() * 300 - 150;
  const randomY = Math.random() * 200 + 100;
  
  return (
    <motion.div
      className="absolute w-2 h-2 rounded-full"
      style={{ backgroundColor: color }}
      initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
      animate={{ 
        x: randomX, 
        y: -randomY, 
        opacity: 0, 
        scale: 0 
      }}
      transition={{ duration: 1.5, delay, ease: "easeOut" }}
    />
  );
};

export function StreakCelebration() {
  const streakCelebration = useAppStore((state) => state.streakCelebration);
  const closeStreakCelebration = useAppStore((state) => state.closeStreakCelebration);
  const soundPlayedRef = useRef(false);

  // Play celebration sound
  useEffect(() => {
    if (streakCelebration?.show && !soundPlayedRef.current) {
      soundPlayedRef.current = true;
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        const playNote = (frequency: number, startTime: number, duration: number) => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.value = frequency;
          oscillator.type = 'sine';
          
          gainNode.gain.setValueAtTime(0.3, startTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
          
          oscillator.start(startTime);
          oscillator.stop(startTime + duration);
        };
        
        const now = audioContext.currentTime;
        
        // Victory fanfare
        playNote(523.25, now, 0.15);        // C5
        playNote(659.25, now + 0.15, 0.15); // E5
        playNote(783.99, now + 0.3, 0.15);  // G5
        playNote(1046.50, now + 0.45, 0.3); // C6
        playNote(783.99, now + 0.8, 0.15);  // G5
        playNote(1046.50, now + 0.95, 0.4); // C6
      } catch (e) {
        console.log('Audio not supported');
      }
    }
    
    // Reset ref when closed
    if (!streakCelebration?.show) {
      soundPlayedRef.current = false;
    }
  }, [streakCelebration?.show]);

  // Auto close after 6 seconds
  useEffect(() => {
    if (streakCelebration?.show) {
      const timer = setTimeout(closeStreakCelebration, 6000);
      return () => clearTimeout(timer);
    }
  }, [streakCelebration?.show, closeStreakCelebration]);

  if (!streakCelebration?.show) return null;

  const fireColors = ['#FF6B35', '#FF8C42', '#FFD700', '#FF4500', '#FFA500'];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={closeStreakCelebration}
      >
        {/* Fire particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 40 }).map((_, i) => (
            <FireParticle 
              key={i} 
              delay={i * 0.03} 
              color={fireColors[i % fireColors.length]} 
            />
          ))}
        </div>

        {/* Main Card */}
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0, rotate: 10 }}
          transition={{ type: "spring", damping: 15, stiffness: 300 }}
          className="relative bg-gradient-to-br from-orange-50 to-yellow-50 rounded-3xl shadow-2xl p-8 max-w-sm mx-4 text-center border-2 border-orange-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Streak banner */}
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 via-red-500 to-yellow-500 text-white px-6 py-1 rounded-full font-bold text-sm shadow-lg whitespace-nowrap"
          >
            🔥 STREAK MILESTONE! 🔥
          </motion.div>

          {/* Streak number */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3, type: "spring", damping: 10 }}
            className="w-32 h-32 mx-auto bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center shadow-lg mb-4"
          >
            <motion.span 
              className="text-5xl font-bold text-white"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
            >
              {streakCelebration.days}
            </motion.span>
          </motion.div>

          {/* Days text */}
          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-2xl font-bold text-orange-600 mb-2"
          >
            Day Streak!
          </motion.h2>

          {/* Reward message */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl p-4 mb-4 shadow-inner"
          >
            <p className="text-lg font-medium text-gray-700">
              {streakCelebration.message}
            </p>
          </motion.div>

          {/* Motivational text */}
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-sm text-gray-500 mb-4"
          >
            Keep going! Consistency is the key to success! 🚀
          </motion.p>

          {/* Close button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            onClick={closeStreakCelebration}
            className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full font-semibold hover:opacity-90 transition-opacity"
          >
            Awesome! 🔥
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
