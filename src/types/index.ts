// ============================================================
// TypeScript types for CP Analytics Pro
// ============================================================

// ---------- Auth ----------
export interface User {
  id: string;
  email: string;
  created_at: string;
}

// ---------- Profile ----------
export interface Profile {
  id: string;
  user_id: string;
  name: string;
  cf_handle: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
}

// ---------- Codeforces ----------
export interface CFUser {
  handle: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  country?: string;
  city?: string;
  organization?: string;
  contribution: number;
  rank: string;
  maxRank: string;
  rating: number;
  maxRating: number;
  lastOnlineTimeSeconds: number;
  registrationTimeSeconds: number;
  friendOfCount: number;
  avatar: string;
  titlePhoto: string;
}

export interface CFContest {
  contestId: number;
  contestName: string;
  handle: string;
  rank: number;
  ratingUpdateTimeSeconds: number;
  oldRating: number;
  newRating: number;
}

export interface CFSubmission {
  id: number;
  contestId?: number;
  creationTimeSeconds: number;
  relativeTimeSeconds: number;
  problem: CFProblem;
  author: { members: { handle: string }[]; participantType: string };
  programmingLanguage: string;
  verdict: string;
  testset: string;
  passedTestCount: number;
  timeConsumedMillis: number;
  memoryConsumedBytes: number;
}

export interface CFProblem {
  contestId?: number;
  problemsetName?: string;
  index: string;
  name: string;
  type: string;
  rating?: number;
  tags: string[];
}

export interface CFRatingChange {
  date: string;
  rating: number;
  delta: number;
  contestName: string;
  rank: number;
}

// ---------- Analytics ----------
export interface TopicStat {
  topic: string;
  total: number;
  solved: number;
  accuracy: number;
  avgRating: number;
}

export interface DailyStat {
  date: string;
  count: number;
}

export interface SmartInsight {
  id: string;
  type: 'info' | 'warning' | 'success' | 'tip';
  title: string;
  description: string;
  icon: string;
}

export interface WeakTopic {
  topic: string;
  accuracy: number;
  attempts: number;
  color: string;
}

// ---------- Goal ----------
export interface Goal {
  id: string;
  user_id: string;
  platform: 'codeforces';
  target_rating: number;
  start_rating: number;
  current_rating: number;
  created_at: string;
}

// ---------- Streak ----------
export interface Streak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_active_date: string;
  updated_at: string;
}

// ---------- Battle ----------
export type BattleStatus = 'waiting' | 'active' | 'finished';

export interface Battle {
  id: string;
  room_code: string;
  host_id: string;
  status: BattleStatus;
  timer_minutes: number;
  problems: BattleProblem[];
  started_at?: string;
  finished_at?: string;
  created_at: string;
}

export interface BattleParticipant {
  id: string;
  battle_id: string;
  user_id: string;
  score: number;
  solved_count: number;
  joined_at: string;
  profile?: Profile;
}

export interface BattleProblem {
  contestId: number;
  index: string;
  name: string;
  rating: number;
  tags: string[];
  url: string;
}

export interface BattleSubmission {
  id: string;
  battle_id: string;
  user_id: string;
  problem_index: number;
  verdict: 'accepted' | 'wrong' | 'pending';
  attempted_at: string;
}

// ---------- Leaderboard ----------
export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  name: string;
  cf_handle: string;
  avatar_url?: string;
  cf_rating: number;
  cf_max_rating: number;
  cf_rank: string;
  current_streak: number;
  consistency_score: number;
}

// ---------- Recommendation ----------
export interface Recommendation {
  id: string;
  contestId: number;
  index: string;
  name: string;
  rating: number;
  tags: string[];
  reason: string;
  url: string;
}

// ---------- Stats Cache ----------
export interface StatsCache {
  id: string;
  user_id: string;
  platform: string;
  raw_json: unknown;
  fetched_at: string;
}

// ---------- Compare ----------
export interface CompareData {
  handle: string;
  user: CFUser;
  ratingHistory: CFContest[];
  submissions: CFSubmission[];
  topicStats: TopicStat[];
}
