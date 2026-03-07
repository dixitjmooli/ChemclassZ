// Badge System for ChemClass Pro

export interface Badge {
  id: string;
  name: string;
  icon: string;
  color: string;
  bgColor: string;
  threshold: number;
}

// Chapter Badges (RPG/Adventure Style)
export const CHAPTER_BADGES: Badge[] = [
  {
    id: 'locked',
    name: 'Locked',
    icon: '🔒',
    color: 'text-gray-500',
    bgColor: 'bg-gray-100',
    threshold: 0,
  },
  {
    id: 'scout',
    name: 'Scout',
    icon: '🗡️',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    threshold: 21,
  },
  {
    id: 'warrior',
    name: 'Warrior',
    icon: '🛡️',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    threshold: 56,
  },
  {
    id: 'king',
    name: 'King',
    icon: '👑',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    threshold: 86,
  },
];

// Overall Badges
export const OVERALL_BADGES: Badge[] = [
  {
    id: 'beginner',
    name: 'Beginner',
    icon: '🌱',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    threshold: 0,
  },
  {
    id: 'rising-star',
    name: 'Rising Star',
    icon: '🌟',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    threshold: 50,
  },
  {
    id: 'champion',
    name: 'Champion',
    icon: '⚡',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    threshold: 75,
  },
  {
    id: 'legend',
    name: 'Legend',
    icon: '👑',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    threshold: 90,
  },
];

// Get chapter badge based on progress percentage
export function getChapterBadge(progressPercent: number): Badge {
  if (progressPercent >= 86) return CHAPTER_BADGES[3]; // King
  if (progressPercent >= 56) return CHAPTER_BADGES[2]; // Warrior
  if (progressPercent >= 21) return CHAPTER_BADGES[1]; // Scout
  return CHAPTER_BADGES[0]; // Locked
}

// Get overall badge based on progress percentage
export function getOverallBadge(progressPercent: number): Badge {
  if (progressPercent >= 90) return OVERALL_BADGES[3]; // Legend
  if (progressPercent >= 75) return OVERALL_BADGES[2]; // Champion
  if (progressPercent >= 50) return OVERALL_BADGES[1]; // Rising Star
  return OVERALL_BADGES[0]; // Beginner
}

// Get next badge to achieve
export function getNextBadge(currentProgress: number, badges: Badge[]): Badge | null {
  for (const badge of badges) {
    if (currentProgress < badge.threshold) {
      return badge;
    }
  }
  return null; // Already at highest badge
}

// Calculate progress needed for next badge
export function getProgressToNextBadge(currentProgress: number, badges: Badge[]): number {
  const nextBadge = getNextBadge(currentProgress, badges);
  if (!nextBadge) return 0;
  return nextBadge.threshold - currentProgress;
}
