import { useQuery } from '@tanstack/react-query';
import {
  fetchCFUser,
  fetchCFRatingHistory,
  fetchCFSubmissions,
  buildRatingHistory,
  buildHeatmapData,
  buildTopicStats,
  detectWeakTopics,
  generateInsights,
  generateRecommendations,
  predictNextRating,
  buildSolvedSet,
} from '../services/codeforces';
import { fetchCFProblems } from '../services/codeforces';

export function useCFUser(handle: string) {
  return useQuery({
    queryKey: ['cf-user', handle],
    queryFn: () => fetchCFUser(handle),
    enabled: !!handle,
    staleTime: 1000 * 60 * 10, // 10 min
  });
}

export function useCFRatingHistory(handle: string) {
  return useQuery({
    queryKey: ['cf-rating', handle],
    queryFn: () => fetchCFRatingHistory(handle),
    enabled: !!handle,
  });
}

export function useCFSubmissions(handle: string) {
  return useQuery({
    queryKey: ['cf-submissions', handle],
    queryFn: () => fetchCFSubmissions(handle, 500),
    enabled: !!handle,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCFAnalytics(handle: string) {
  const { data: user, isLoading: userLoading, error: userError } = useCFUser(handle);
  const { data: contests = [], isLoading: ratingsLoading } = useCFRatingHistory(handle);
  const { data: submissions = [], isLoading: subsLoading } = useCFSubmissions(handle);

  const ratingHistory = buildRatingHistory(contests);
  const heatmapData = buildHeatmapData(submissions);
  const topicStats = buildTopicStats(submissions);
  const weakTopics = detectWeakTopics(topicStats);
  const insights = generateInsights(contests, submissions, topicStats);
  const solvedSet = buildSolvedSet(submissions);
  const { predicted, trend } = predictNextRating(contests);

  const totalSolved = new Set(
    submissions.filter((s) => s.verdict === 'OK').map((s) => `${s.problem.contestId}-${s.problem.index}`)
  ).size;

  const todaySolved = submissions.filter((s) => {
    const today = new Date().toISOString().split('T')[0];
    const subDate = new Date(s.creationTimeSeconds * 1000).toISOString().split('T')[0];
    return s.verdict === 'OK' && subDate === today;
  }).length;

  return {
    user,
    contests,
    submissions,
    ratingHistory,
    heatmapData,
    topicStats,
    weakTopics,
    insights,
    solvedSet,
    predictedRating: predicted,
    ratingTrend: trend,
    totalSolved,
    todaySolved,
    isLoading: userLoading || ratingsLoading || subsLoading,
    error: userError,
  };
}

export function useRecommendations(handle: string, currentRating: number) {
  const { data: submissions = [] } = useCFSubmissions(handle);
  const { data: problemsData } = useQuery({
    queryKey: ['cf-problems'],
    queryFn: fetchCFProblems,
    staleTime: 1000 * 60 * 60, // 1 hour
    enabled: !!handle && currentRating > 0,
  });

  const solvedSet = buildSolvedSet(submissions);
  const topicStats = buildTopicStats(submissions);
  const weakTopics = detectWeakTopics(topicStats);
  const problems = problemsData?.problems ?? [];

  const recommendations = generateRecommendations(problems, weakTopics, currentRating, solvedSet);

  return { recommendations, isLoading: !problemsData };
}
