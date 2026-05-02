import type {
  CFUser,
  CFContest,
  CFSubmission,
  CFProblem,
  TopicStat,
  DailyStat,
  SmartInsight,
  WeakTopic,
  Recommendation,
  CFRatingChange,
} from '../types';
import { timestampToDate, getTopicColor } from '../lib/utils';

const CF_BASE = 'https://codeforces.com/api';

// ── Generic fetcher ──────────────────────────────────────────
async function cfFetch<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${CF_BASE}${endpoint}`);
  if (!res.ok) throw new Error(`Codeforces API error: ${res.status}`);
  const data = await res.json();
  if (data.status !== 'OK') throw new Error(data.comment ?? 'Codeforces API error');
  return data.result as T;
}

// ── User info ─────────────────────────────────────────────────
export async function fetchCFUser(handle: string): Promise<CFUser> {
  const users = await cfFetch<CFUser[]>(`/user.info?handles=${handle}`);
  return users[0];
}

// ── Rating history ────────────────────────────────────────────
export async function fetchCFRatingHistory(handle: string): Promise<CFContest[]> {
  return cfFetch<CFContest[]>(`/user.rating?handle=${handle}`);
}

// ── Submissions ───────────────────────────────────────────────
export async function fetchCFSubmissions(handle: string, count = 500): Promise<CFSubmission[]> {
  return cfFetch<CFSubmission[]>(`/user.status?handle=${handle}&count=${count}`);
}

// ── Problems list (for battle / recommendations) ──────────────
export async function fetchCFProblems(): Promise<{ problems: CFProblem[]; problemStatistics: unknown[] }> {
  return cfFetch<{ problems: CFProblem[]; problemStatistics: unknown[] }>('/problemset.problems');
}

// ── Upcoming contests ─────────────────────────────────────────
export async function fetchUpcomingContests(): Promise<unknown[]> {
  return cfFetch<unknown[]>('/contest.list?gym=false');
}

// ── Computed Analytics ────────────────────────────────────────

/**
 * Build rating change history with delta
 */
export function buildRatingHistory(contests: CFContest[]): CFRatingChange[] {
  return contests.map((c) => ({
    date: new Date(c.ratingUpdateTimeSeconds * 1000).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    rating: c.newRating,
    delta: c.newRating - c.oldRating,
    contestName: c.contestName,
    rank: c.rank,
  }));
}

/**
 * Build daily submission heatmap data (last 365 days)
 */
export function buildHeatmapData(submissions: CFSubmission[]): DailyStat[] {
  const counts: Record<string, number> = {};
  const accepted = submissions.filter((s) => s.verdict === 'OK');

  for (const sub of accepted) {
    const date = timestampToDate(sub.creationTimeSeconds);
    counts[date] = (counts[date] ?? 0) + 1;
  }

  const days: DailyStat[] = [];
  for (let i = 364; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    days.push({ date: key, count: counts[key] ?? 0 });
  }
  return days;
}

/**
 * Topic-wise breakdown from accepted submissions
 */
export function buildTopicStats(submissions: CFSubmission[]): TopicStat[] {
  const topicMap: Record<string, { total: number; solved: number; ratings: number[] }> = {};

  // Group all submissions by problem (deduplicate)
  const problemMap: Record<string, { tags: string[]; rating?: number; verdicts: string[] }> = {};
  for (const sub of submissions) {
    const key = `${sub.problem.contestId ?? 0}-${sub.problem.index}`;
    if (!problemMap[key]) {
      problemMap[key] = { tags: sub.problem.tags, rating: sub.problem.rating, verdicts: [] };
    }
    problemMap[key].verdicts.push(sub.verdict);
  }

  for (const { tags, rating, verdicts } of Object.values(problemMap)) {
    const solved = verdicts.some((v) => v === 'OK');
    for (const tag of tags) {
      if (!topicMap[tag]) topicMap[tag] = { total: 0, solved: 0, ratings: [] };
      topicMap[tag].total++;
      if (solved) topicMap[tag].solved++;
      if (rating) topicMap[tag].ratings.push(rating);
    }
  }

  return Object.entries(topicMap)
    .map(([topic, stat]) => ({
      topic,
      total: stat.total,
      solved: stat.solved,
      accuracy: stat.total > 0 ? Math.round((stat.solved / stat.total) * 100) : 0,
      avgRating:
        stat.ratings.length > 0
          ? Math.round(stat.ratings.reduce((a, b) => a + b, 0) / stat.ratings.length)
          : 0,
    }))
    .filter((t) => t.total >= 3)
    .sort((a, b) => b.total - a.total)
    .slice(0, 20);
}

/**
 * Weak topic detection (accuracy < 60%, at least 3 attempts)
 */
export function detectWeakTopics(topicStats: TopicStat[]): WeakTopic[] {
  return topicStats
    .filter((t) => t.accuracy < 60 && t.total >= 3)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 8)
    .map((t) => ({
      topic: t.topic,
      accuracy: t.accuracy,
      attempts: t.total,
      color: getTopicColor(t.topic),
    }));
}

/**
 * Generate smart insights from contest/submission data
 */
export function generateInsights(
  contests: CFContest[],
  submissions: CFSubmission[],
  topicStats: TopicStat[]
): SmartInsight[] {
  const insights: SmartInsight[] = [];

  if (contests.length >= 3) {
    // Contest type analysis
    const div3 = contests.filter((c) => c.contestName.toLowerCase().includes('div. 3'));
    const div2 = contests.filter((c) => c.contestName.toLowerCase().includes('div. 2'));
    if (div3.length > 0 && div2.length > 0) {
      const div3AvgDelta = div3.reduce((a, c) => a + (c.newRating - c.oldRating), 0) / div3.length;
      const div2AvgDelta = div2.reduce((a, c) => a + (c.newRating - c.oldRating), 0) / div2.length;
      if (div3AvgDelta > div2AvgDelta + 10) {
        insights.push({
          id: 'div3-better',
          type: 'info',
          title: 'You perform better in Div.3 contests',
          description: `Average gain in Div.3: +${Math.round(div3AvgDelta)} vs Div.2: ${div2AvgDelta > 0 ? '+' : ''}${Math.round(div2AvgDelta)}`,
          icon: '🎯',
        });
      }
    }

    // Recent trend
    const last5 = contests.slice(-5);
    const recentDelta = last5.reduce((a, c) => a + (c.newRating - c.oldRating), 0);
    if (recentDelta > 30) {
      insights.push({ id: 'rising', type: 'success', title: 'Rating on the rise!', description: `+${recentDelta} rating in your last 5 contests. Keep it up!`, icon: '📈' });
    } else if (recentDelta < -50) {
      insights.push({ id: 'declining', type: 'warning', title: 'Recent rating decline', description: `${recentDelta} rating over last 5 contests. Consider practicing more before next contest.`, icon: '📉' });
    }

    // Inactivity detection
    if (contests.length > 0) {
      const lastContest = contests[contests.length - 1];
      const daysSince = Math.floor((Date.now() / 1000 - lastContest.ratingUpdateTimeSeconds) / 86400);
      if (daysSince > 30) {
        insights.push({ id: 'inactive', type: 'warning', title: 'Contest inactivity detected', description: `${daysSince} days since your last contest. Regular participation helps maintain rating.`, icon: '⚠️' });
      }
    }
  }

  // Weak topic insight
  const weakest = topicStats.filter((t) => t.accuracy < 50 && t.total >= 5);
  if (weakest.length > 0) {
    insights.push({
      id: 'weak-topic',
      type: 'tip',
      title: `Your ${weakest[0].topic} accuracy is low`,
      description: `Only ${weakest[0].accuracy}% success rate on ${weakest[0].topic} problems. Focus on this topic.`,
      icon: '🧠',
    });
  }

  // High accuracy topic
  const strong = topicStats.filter((t) => t.accuracy >= 85 && t.total >= 5);
  if (strong.length > 0) {
    insights.push({
      id: 'strong-topic',
      type: 'success',
      title: `${strong[0].topic} is your strongest topic`,
      description: `${strong[0].accuracy}% accuracy across ${strong[0].total} problems. Excellent!`,
      icon: '💪',
    });
  }

  // Submission volume
  const accepted = submissions.filter((s) => s.verdict === 'OK').length;
  if (accepted > 200) {
    insights.push({ id: 'volume', type: 'info', title: 'Problem-solving veteran', description: `${accepted} problems solved. You're in the top tier of consistent solvers.`, icon: '🏆' });
  }

  return insights.slice(0, 5);
}

/**
 * Generate problem recommendations based on weak topics and rating
 */
export function generateRecommendations(
  problems: CFProblem[],
  weakTopics: WeakTopic[],
  currentRating: number,
  solvedIds: Set<string>
): Recommendation[] {
  const targetMin = currentRating - 100;
  const targetMax = currentRating + 300;
  const weakTopicNames = weakTopics.map((t) => t.topic.toLowerCase());

  const filtered = problems
    .filter((p) => {
      if (!p.rating || !p.contestId) return false;
      if (p.rating < targetMin || p.rating > targetMax) return false;
      const id = `${p.contestId}-${p.index}`;
      if (solvedIds.has(id)) return false;
      return p.tags.some((tag) => weakTopicNames.includes(tag.toLowerCase()));
    })
    .slice(0, 8);

  return filtered.map((p) => {
    const matchedTopic = p.tags.find((t) => weakTopicNames.includes(t.toLowerCase())) ?? p.tags[0];
    return {
      id: `${p.contestId}-${p.index}`,
      contestId: p.contestId!,
      index: p.index,
      name: p.name,
      rating: p.rating!,
      tags: p.tags,
      reason: `Practice ${matchedTopic} (your weak area)`,
      url: `https://codeforces.com/problemset/problem/${p.contestId}/${p.index}`,
    };
  });
}

/**
 * Predict next rating using linear regression on last N deltas
 */
export function predictNextRating(contests: CFContest[]): { predicted: number; trend: 'up' | 'down' | 'stable' } {
  if (contests.length === 0) return { predicted: 0, trend: 'stable' };
  const last = contests.slice(-10);
  const deltas = last.map((c) => c.newRating - c.oldRating);
  const avgDelta = deltas.reduce((a, b) => a + b, 0) / deltas.length;
  const current = contests[contests.length - 1].newRating;
  const predicted = Math.round(current + avgDelta);
  return {
    predicted,
    trend: avgDelta > 5 ? 'up' : avgDelta < -5 ? 'down' : 'stable',
  };
}

/**
 * Select battle problems based on average rating
 */
export async function selectBattleProblems(avgRating: number, count = 2): Promise<CFProblem[]> {
  const { problems } = await fetchCFProblems();
  const easy = problems.filter(
    (p) => p.rating && p.contestId && p.rating >= avgRating - 200 && p.rating <= avgRating
  );
  const medium = problems.filter(
    (p) => p.rating && p.contestId && p.rating > avgRating && p.rating <= avgRating + 300
  );

  const shuffled = (arr: CFProblem[]) => arr.sort(() => Math.random() - 0.5);
  const selected: CFProblem[] = [];

  if (count >= 1 && easy.length > 0) selected.push(shuffled(easy)[0]);
  if (count >= 2 && medium.length > 0) selected.push(shuffled(medium)[0]);

  return selected;
}

/**
 * Build solved problem IDs set for quick lookup
 */
export function buildSolvedSet(submissions: CFSubmission[]): Set<string> {
  return new Set(
    submissions
      .filter((s) => s.verdict === 'OK')
      .map((s) => `${s.problem.contestId ?? 0}-${s.problem.index}`)
  );
}
