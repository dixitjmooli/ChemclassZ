'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';

// Badge reward messages
const BADGE_REWARDS: Record<string, string> = {
  // Chapter badges
  'scout': '🗡️ Scout Badge! Get a chocolate for yourself!',
  'warrior': '🛡️ Warrior Badge! Treat yourself to something nice!',
  'king': '👑 King Badge! You deserve a special reward!',
  // Overall badges
  'rising-star': '🌟 Rising Star! Celebrate with your favorite snack!',
  'champion': '⚡ Champion Badge! Time for a reward!',
  'legend': '👑 LEGEND! You\'ve earned a BIG reward!',
};

// Confetti particle component
const ConfettiPiece = ({ delay, color }: { delay: number; color: string }) => {
  const randomX = Math.random() * 400 - 200;
  const randomY = Math.random() * 400 + 200;
  const randomRotate = Math.random() * 720 - 360;

  return (
    <motion.div
      className="absolute w-3 h-3 rounded-sm"
      style={{ backgroundColor: color }}
      initial={{ x: 0, y: -20, rotate: 0, opacity: 1, scale: 1 }}
      animate={{ x: randomX, y: randomY, rotate: randomRotate, opacity: 0, scale: 0 }}
      transition={{ duration: 2, delay, ease: "easeOut" }}
    />
  );
};

// Sparkle effect
const Sparkle = ({ delay, size }: { delay: number; size: number }) => {
  const randomX = Math.random() * 300 - 150;
  const randomY = Math.random() * 200 - 100;

  return (
    <motion.div
      className="absolute"
      style={{ left: `${50 + randomX / 3}%`, top: `${50 + randomY / 3}%`, fontSize: size }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0], rotate: [0, 180, 360] }}
      transition={{ duration: 1.5, delay, ease: "easeInOut" }}
    >
      ✨
    </motion.div>
  );
};

export function BadgeCelebration() {
  const badgeCelebration = useAppStore((state) => state.badgeCelebration);
  const closeBadgeCelebration = useAppStore((state) => state.closeBadgeCelebration);
  const [soundPlayed, setSoundPlayed] = useState(false);

  // Play celebration sound
  useEffect(() => {
    if (badgeCelebration?.show && !soundPlayed) {
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

        // Cheerful melody
        playNote(523.25, now, 0.2);        // C5
        playNote(659.25, now + 0.15, 0.2); // E5
        playNote(783.99, now + 0.3, 0.2);  // G5
        playNote(1046.50, now + 0.45, 0.3); // C6

        setSoundPlayed(true);
      } catch (e) {
        console.log('Audio not supported');
      }
    }
  }, [badgeCelebration?.show, soundPlayed]);

  // Auto close after 5 seconds
  useEffect(() => {
    if (badgeCelebration?.show) {
      const timer = setTimeout(closeBadgeCelebration, 5000);
      return () => clearTimeout(timer);
    }
  }, [badgeCelebration?.show, closeBadgeCelebration]);

  // Reset sound played when closed
  useEffect(() => {
    if (!badgeCelebration?.show) {
      setSoundPlayed(false);
    }
  }, [badgeCelebration?.show]);

  if (!badgeCelebration?.show) return null;

  const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];

  // Get reward message for badge
  const rewardMessage = BADGE_REWARDS[badgeCelebration.badgeId] || 'Keep up the great work!';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={closeBadgeCelebration}
      >
        {/* Confetti */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 50 }).map((_, i) => (
            <ConfettiPiece key={i} delay={i * 0.02} color={colors[i % colors.length]} />
          ))}
        </div>

        {/* Sparkles */}
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 12 }).map((_, i) => (
            <Sparkle key={i} delay={i * 0.1} size={16 + Math.random() * 16} />
          ))}
        </div>

        {/* Main Badge Card */}
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0, rotate: 10 }}
          transition={{ type: "spring", damping: 15, stiffness: 300 }}
          className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-sm mx-4 text-center"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Celebration banner */}
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
            className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 text-white px-6 py-1 rounded-full font-bold text-sm shadow-lg whitespace-nowrap"
          >
            🎉 BADGE UNLOCKED! 🎉
          </motion.div>

          {/* Badge Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", damping: 10 }}
            className={`w-32 h-32 mx-auto rounded-full ${badgeCelebration.badgeBgColor} flex items-center justify-center shadow-lg mb-4`}
          >
            <motion.span
              className="text-6xl"
              animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
            >
              {badgeCelebration.badgeIcon}
            </motion.span>
          </motion.div>

          {/* Badge Name */}
          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className={`text-3xl font-bold ${badgeCelebration.badgeColor} mb-2`}
          >
            {badgeCelebration.badgeName}
          </motion.h2>

          {/* Type */}
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-muted-foreground mb-4"
          >
            {badgeCelebration.type === 'overall' ? 'Overall Achievement' : `Chapter: ${badgeCelebration.chapterName}`}
          </motion.p>

          {/* Reward message */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 mb-4 border-2 border-yellow-200"
          >
            <p className="text-lg font-semibold text-orange-700">
              {rewardMessage}
            </p>
          </motion.div>

          {/* Close button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            onClick={closeBadgeCelebration}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-semibold hover:opacity-90 transition-opacity"
          >
            Awesome! 🚀
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
