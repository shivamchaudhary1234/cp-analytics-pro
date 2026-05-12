import React, { useState } from 'react';
import {
  Activity, Zap, Brain, Target, RefreshCw,
  TrendingUp, TrendingDown, Minus, Download, AlertCircle, Lightbulb
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useCFAnalytics, useRecommendations } from '../../hooks/useCodeforcesData';
import { RatingGraph } from '../../components/charts/RatingGraph';
import { Heatmap } from '../../components/charts/Heatmap';
import { TopicChart, AccuracyChart } from '../../components/charts/TopicChart';
import { Card, CardHeader, StatCard } from '../../components/ui/Card';
import { Badge, LoadingSpinner, EmptyState, ProgressBar } from '../../components/ui';
import { Button } from '../../components/ui/Button';
import { formatNumber, formatDelta, getRankColor } from '../../lib/utils';
import toast from 'react-hot-toast';


const insightBg = {
  info: 'bg-accent-cyan/5 border-accent-cyan/15',
  warning: 'bg-accent-orange/5 border-accent-orange/15',
  success: 'bg-accent-green/5 border-accent-green/15',
  tip: 'bg-accent-yellow/5 border-accent-yellow/15',
};

const trendIcon = (t: 'up' | 'down' | 'stable') =>
  t === 'up' ? <TrendingUp size={16} className="text-accent-green" /> :
  t === 'down' ? <TrendingDown size={16} className="text-accent-red" /> :
  <Minus size={16} className="text-text-secondary" />;

export const DashboardPage: React.FC = () => {
  const { cfHandle } = useAppStore();
  const [topicView, setTopicView] = useState<'bar' | 'radar'>('bar');

  const {
    user, ratingHistory, heatmapData, topicStats, weakTopics,
    insights, totalSolved, todaySolved, predictedRating, ratingTrend,
    contests, submissions, isLoading, error
  } = useCFAnalytics(cfHandle);

  const { recommendations } = useRecommendations(cfHandle, user?.rating ?? 1200);

  // Weekly solved
  const weeklySolved = React.useMemo(() => {
    const now = Date.now() / 1000;
    return new Set(
      submissions.filter((s) => s.verdict === 'OK' && now - s.creationTimeSeconds < 7 * 86400)
        .map((s) => `${s.problem.contestId}-${s.problem.index}`)
    ).size;
  }, [submissions]);

  if (!cfHandle) {
    return (
      <EmptyState
        icon="🎯"
        title="Set up your Codeforces handle"
        description="Go to Profile and add your Codeforces handle to see your analytics dashboard."
        action={
          <Button variant="primary" onClick={() => window.location.href = '/profile'} id="go-to-profile">
            Set Up Profile
          </Button>
        }
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-text-secondary">Loading your analytics...</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <EmptyState
        icon="⚠️"
        title="Failed to load data"
        description={`Could not fetch data for "${cfHandle}". Make sure the handle is correct.`}
        action={<Button variant="secondary" onClick={() => window.location.reload()}>Try Again</Button>}
      />
    );
  }

  const handleExport = () => {
    toast.success('Preparing PDF export...');
    setTimeout(() => {
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(`<h1>${cfHandle} - CP Analytics Report</h1><p>Rating: ${user.rating}</p>`);
        win.print();
      }
    }, 500);
  };

  return (
    <div className="space-y-6 animate-slide-up" id="dashboard-content">
      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Current Rating"
          value={user.rating}
          sub={user.rank}
          icon={<Activity size={18} />}
          color="cyan"
          trend={ratingTrend}
        />
        <StatCard
          label="Problems Solved"
          value={formatNumber(totalSolved)}
          icon={<Zap size={18} />}
          color="purple"
          sub={`${todaySolved} today`}
        />
        <StatCard
          label="Contests"
          value={contests.length}
          icon={<Target size={18} />}
          color="green"
          sub={`Peak: ${user.maxRating}`}
        />
        <StatCard
          label="This Week"
          value={weeklySolved}
          icon={<TrendingUp size={18} />}
          color="orange"
          sub="problems solved"
        />
      </div>

      {/* Rating predictor banner */}
      {predictedRating > 0 && (
        <div className="glass-card p-4 flex items-center justify-between flex-wrap gap-3 border border-accent-cyan/20"
          style={{ background: 'rgba(0,212,255,0.04)' }}>
          <div className="flex items-center gap-3">
            {trendIcon(ratingTrend)}
            <div>
              <p className="text-sm font-semibold text-text-primary">Rating Predictor</p>
              <p className="text-xs text-text-secondary">Based on your last 10 contest deltas</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-accent-cyan">{predictedRating}</p>
            <p className="text-xs text-text-secondary">predicted next rating</p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleExport} id="export-pdf">
            <Download size={14} /> Export PDF
          </Button>
        </div>
      )}

      {/* Rating graph */}
      <Card className="p-5">
        <CardHeader
          title="Rating History"
          subtitle={`${contests.length} contests`}
          icon={<Activity size={16} />}
          action={
            <Button variant="ghost" size="sm" id="refresh-rating">
              <RefreshCw size={14} />
            </Button>
          }
        />
        <RatingGraph data={ratingHistory} currentRating={user.rating} currentRank={user.rank} />
      </Card>

      {/* Heatmap */}
      <Card className="p-5">
        <CardHeader title="Activity Heatmap" subtitle="Last 365 days" icon={<Zap size={16} />} />
        <Heatmap data={heatmapData} />
      </Card>

      {/* Topics + Accuracy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <CardHeader
            title="Topic Breakdown"
            icon={<Brain size={16} />}
            action={
              <div className="flex gap-1">
                <button
                  onClick={() => setTopicView('bar')}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${topicView === 'bar' ? 'bg-accent-cyan/20 text-accent-cyan' : 'text-text-secondary hover:text-text-primary'}`}
                  id="topic-bar-view"
                >
                  Bar
                </button>
                <button
                  onClick={() => setTopicView('radar')}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${topicView === 'radar' ? 'bg-accent-cyan/20 text-accent-cyan' : 'text-text-secondary hover:text-text-primary'}`}
                  id="topic-radar-view"
                >
                  Radar
                </button>
              </div>
            }
          />
          <TopicChart data={topicStats} view={topicView} />
        </Card>

        <Card className="p-5">
          <CardHeader title="Topic Accuracy" subtitle="Success rate by category" icon={<Target size={16} />} />
          {topicStats.length > 0 ? <AccuracyChart data={topicStats} /> : <p className="text-text-secondary text-sm">Not enough data yet.</p>}
        </Card>
      </div>

      {/* Smart Insights */}
      {insights.length > 0 && (
        <Card className="p-5">
          <CardHeader title="Smart Insights" subtitle="AI-powered analysis of your patterns" icon={<Brain size={16} />} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {insights.map((insight) => (
              <div key={insight.id} className={`p-3 rounded-xl border flex items-start gap-3 ${insightBg[insight.type]}`}>
                <span className="text-xl flex-shrink-0">{insight.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-text-primary">{insight.title}</p>
                  <p className="text-xs text-text-secondary mt-0.5">{insight.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Weak Topics */}
      {weakTopics.length > 0 && (
        <Card className="p-5">
          <CardHeader title="Weak Topics" subtitle="Topics needing improvement" icon={<AlertCircle size={16} />} />
          <div className="space-y-3">
            {weakTopics.map((topic) => (
              <div key={topic.topic} className="flex items-center gap-4">
                <div className="w-32 text-sm text-text-secondary capitalize truncate">{topic.topic}</div>
                <div className="flex-1">
                  <ProgressBar value={topic.accuracy} showPercent={false} color={`${topic.color}80`} />
                </div>
                <div className="w-16 text-right">
                  <span className="text-xs font-medium text-accent-red">{topic.accuracy}%</span>
                </div>
                <div className="w-16 text-right">
                  <span className="text-xs text-text-muted">{topic.attempts} tried</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card className="p-5">
          <CardHeader title="Recommended Problems" subtitle="Curated for your weak areas" icon={<Lightbulb size={16} />} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recommendations.map((rec) => (
              <a
                key={rec.id}
                href={rec.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-xl bg-bg-tertiary border border-border-muted hover:border-accent-cyan/30 transition-all group block"
                id={`rec-${rec.id}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary group-hover:text-accent-cyan transition-colors truncate">{rec.name}</p>
                    <p className="text-xs text-text-muted mt-0.5">{rec.reason}</p>
                  </div>
                  <Badge variant="cyan" className="flex-shrink-0">{rec.rating}</Badge>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {rec.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-bg-hover text-text-muted">{tag}</span>
                  ))}
                </div>
              </a>
            ))}
          </div>
        </Card>
      )}

      {/* Contest history table */}
      {contests.length > 0 && (
        <Card className="p-5">
          <CardHeader title="Contest History" subtitle={`${contests.length} total contests`} icon={<Target size={16} />} />
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Contest</th>
                  <th>Rank</th>
                  <th>Change</th>
                  <th>New Rating</th>
                </tr>
              </thead>
              <tbody>
                {[...contests].reverse().slice(0, 15).map((c) => {
                  const delta = c.newRating - c.oldRating;
                  return (
                    <tr key={c.contestId}>
                      <td className="text-text-primary max-w-[280px] truncate">
                        <a href={`https://codeforces.com/contest/${c.contestId}`} target="_blank" rel="noopener noreferrer"
                          className="hover:text-accent-cyan transition-colors">
                          {c.contestName}
                        </a>
                      </td>
                      <td className="text-text-secondary">#{c.rank}</td>
                      <td>
                        <span className={`font-medium text-sm ${delta >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                          {formatDelta(delta)}
                        </span>
                      </td>
                      <td className="font-semibold" style={{ color: getRankColor(c.contestName) }}>{c.newRating}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};
