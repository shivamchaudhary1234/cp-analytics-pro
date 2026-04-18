import { type ClassValue } from 'clsx';

// Simple className joiner (avoids adding clsx dep — use inline logic)
export function cn(...inputs: ClassValue[]): string {
  return inputs
    .flat()
    .filter(Boolean)
    .join(' ')
    .trim();
}

// Format large numbers
export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

// Format date to readable string
export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateStr(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Get Codeforces rank color class
export function getRankColor(rank: string): string {
  const r = rank?.toLowerCase().replace(/ /g, '-') ?? '';
  if (r.includes('legendary')) return '#FF0000';
  if (r.includes('international-grandmaster')) return '#FF3333';
  if (r.includes('grandmaster')) return '#FF3333';
  if (r.includes('international-master')) return '#FF8C00';
  if (r.includes('master')) return '#FF8C00';
  if (r.includes('candidate-master') || r.includes('candidate master')) return '#AA00AA';
  if (r.includes('expert')) return '#0070DD';
  if (r.includes('specialist')) return '#1EFF00';
  if (r.includes('pupil')) return '#008000';
  return '#808080'; // newbie
}

// Get rank badge text color class
export function getRankBgColor(rank: string): string {
  const r = rank?.toLowerCase() ?? '';
  if (r.includes('grandmaster')) return 'bg-red-500/10 text-red-400 border-red-500/20';
  if (r.includes('master')) return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
  if (r.includes('candidate')) return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
  if (r.includes('expert')) return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
  if (r.includes('specialist')) return 'bg-green-500/10 text-green-400 border-green-500/20';
  if (r.includes('pupil')) return 'bg-green-700/10 text-green-600 border-green-700/20';
  return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
}

// Generate 6-char room code
export function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Get date string YYYY-MM-DD from timestamp
export function timestampToDate(ts: number): string {
  return new Date(ts * 1000).toISOString().split('T')[0];
}

// Calculate consistency score (0–100)
export function calcConsistencyScore(streak: number, totalSolved: number): number {
  const streakBonus = Math.min(streak * 2, 40);
  const volumeBonus = Math.min(Math.floor(totalSolved / 10), 60);
  return streakBonus + volumeBonus;
}

// Rating delta formatting
export function formatDelta(delta: number): string {
  return delta >= 0 ? `+${delta}` : `${delta}`;
}

// Truncate text
export function truncate(text: string, len: number): string {
  return text.length > len ? text.substring(0, len) + '…' : text;
}

// Debounce
export function debounce<T extends (...args: unknown[]) => unknown>(fn: T, ms: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

// Get last N days as date strings
export function getLastNDays(n: number): string[] {
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

// Capitalize first letter
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Time ago
export function timeAgo(timestamp: number): string {
  const seconds = Math.floor(Date.now() / 1000 - timestamp);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`;
  return `${Math.floor(seconds / 2592000)}mo ago`;
}

// Topic color map
export const TOPIC_COLORS: Record<string, string> = {
  'dp': '#00D4FF',
  'dynamic programming': '#00D4FF',
  'graphs': '#7B2FBE',
  'greedy': '#F0883E',
  'math': '#3FB950',
  'implementation': '#1F6FEB',
  'strings': '#D29922',
  'binary search': '#FF6B9D',
  'trees': '#4ADE80',
  'data structures': '#818CF8',
  'brute force': '#FB923C',
  'sorting': '#34D399',
  'number theory': '#A78BFA',
  'geometry': '#F472B6',
  'bitmasks': '#60A5FA',
  'two pointers': '#FBBF24',
  'combinatorics': '#E879F9',
  'dfs and similar': '#7B2FBE',
  'flows': '#0EA5E9',
  'games': '#EF4444',
};

export function getTopicColor(topic: string): string {
  return TOPIC_COLORS[topic.toLowerCase()] ?? '#8B949E';
}
