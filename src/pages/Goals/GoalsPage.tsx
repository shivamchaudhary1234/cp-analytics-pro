import React, { useEffect, useState } from 'react';
import { Target, Flame, Plus, Save, Calendar, TrendingUp, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useAppStore } from '../../store/useAppStore';
import { useCFUser, useCFAnalytics } from '../../hooks/useCodeforcesData';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ProgressBar, EmptyState } from '../../components/ui';
import { getRankColor, getLastNDays } from '../../lib/utils';
import type { Goal, Streak } from '../../types';
import toast from 'react-hot-toast';

export const GoalsPage: React.FC = () => {
  const { user } = useAuth();
  const { cfHandle, goal, setGoal, streak, setStreak } = useAppStore();
  const { data: cfUser } = useCFUser(cfHandle);
  const { heatmapData, contests } = useCFAnalytics(cfHandle);

  const [goalTarget, setGoalTarget] = useState('');
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load goal & streak
  useEffect(() => {
    if (!user?.id) return;
    supabase.from('goals').select('*').eq('user_id', user.id).single().then(({ data }: { data: any }) => {
      if (data) setGoal(data as Goal);
    });
    supabase.from('streaks').select('*').eq('user_id', user.id).single().then(({ data }: { data: any }) => {
      if (data) setStreak(data as Streak);
    });
  }, [user?.id, setGoal, setStreak]);

  // Calculate real streak from heatmap
  const calcStreak = () => {
    let current = 0;
    const reversed = [...heatmapData].reverse();
    for (const day of reversed) {
      if (day.count > 0) current++;
      else break;
    }
    return current;
  };

  const currentStreak = calcStreak();
  const longestStreak = streak?.longest_streak ?? currentStreak;

  const saveGoal = async () => {
    if (!user || !cfUser) return;
    const target = parseInt(goalTarget);
    if (isNaN(target) || target <= cfUser.rating) return toast.error('Target must be higher than current rating');
    setSaving(true);
    const { data, error } = await supabase.from('goals').upsert({
      user_id: user.id,
      platform: 'codeforces',
      target_rating: target,
      start_rating: cfUser.rating,
      current_rating: cfUser.rating,
    }).select().single();
    setSaving(false);
    if (error) toast.error(error.message);
    else { setGoal(data as Goal); setShowGoalForm(false); toast.success('Goal set!'); }
  };

  // Progress calculation
  const progress = goal && cfUser
    ? Math.max(0, Math.min(100, ((cfUser.rating - goal.start_rating) / (goal.target_rating - goal.start_rating)) * 100))
    : 0;

  // Estimate contests to goal
  const avgDelta = contests.length >= 3
    ? contests.slice(-10).reduce((a, c) => a + (c.newRating - c.oldRating), 0) / Math.min(10, contests.length)
    : 0;
  const ratingNeeded = goal && cfUser ? goal.target_rating - cfUser.rating : 0;
  const contestsNeeded = avgDelta > 0 && ratingNeeded > 0 ? Math.ceil(ratingNeeded / avgDelta) : null;

  // Heatmap last 12 weeks for streak calendar
  const last12Weeks = getLastNDays(84);
  const heatmapLookup = Object.fromEntries(heatmapData.map((d) => [d.date, d.count]));

  // Week grid
  const weeks: string[][] = [];
  for (let i = 0; i < last12Weeks.length; i += 7) {
    weeks.push(last12Weeks.slice(i, i + 7));
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-slide-up">
      {/* Streak hero */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 col-span-1 border border-accent-orange/20 text-center"
          style={{ background: 'linear-gradient(135deg, rgba(240,136,62,0.08), rgba(240,136,62,0.03))' }}>
          <Flame size={32} className="mx-auto mb-2 text-accent-orange" />
          <div className="text-4xl font-bold text-accent-orange">{currentStreak}</div>
          <div className="text-xs text-text-secondary mt-1">Day Streak 🔥</div>
        </Card>
        <Card className="p-5 text-center">
          <CheckCircle size={28} className="mx-auto mb-2 text-accent-green" />
          <div className="text-4xl font-bold text-text-primary">{longestStreak}</div>
          <div className="text-xs text-text-secondary mt-1">Longest Streak</div>
        </Card>
        <Card className="p-5 text-center">
          <Calendar size={28} className="mx-auto mb-2 text-accent-cyan" />
          <div className="text-4xl font-bold text-text-primary">
            {heatmapData.filter((d) => d.count > 0).length}
          </div>
          <div className="text-xs text-text-secondary mt-1">Active Days (Year)</div>
        </Card>
      </div>

      {/* Streak calendar (last 12 weeks) */}
      <Card className="p-5">
        <CardHeader title="Streak Calendar" subtitle="Last 12 weeks" icon={<Flame size={16} />} />
        <div className="flex gap-1 overflow-x-auto no-scrollbar pb-2">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1 flex-shrink-0">
              {week.map((date) => {
                const count = heatmapLookup[date] ?? 0;
                const isToday = date === new Date().toISOString().split('T')[0];
                return (
                  <div
                    key={date}
                    title={`${date}: ${count} solved`}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all cursor-default"
                    style={{
                      background: count > 0 ? `rgba(240,136,62,${Math.min(0.9, 0.2 + count * 0.15)})` : 'rgba(33,38,45,0.8)',
                      border: isToday ? '2px solid #F0883E' : '1px solid rgba(48,54,61,0.4)',
                    }}
                  >
                    {count > 0 && <span className="text-white">{count > 9 ? '9+' : count}</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-3 text-xs text-text-muted">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((l) => (
            <div key={l} className="w-4 h-4 rounded"
              style={{ background: l === 0 ? 'rgba(33,38,45,0.8)' : `rgba(240,136,62,${0.2 + l * 0.18})` }} />
          ))}
          <span>More</span>
        </div>
      </Card>

      {/* Goal Tracker */}
      <Card className="p-5">
        <CardHeader
          title="Goal Tracker"
          subtitle="Set and track your rating target"
          icon={<Target size={16} />}
          action={
            !showGoalForm && (
              <Button variant="secondary" size="sm" onClick={() => setShowGoalForm(true)} id="set-goal">
                <Plus size={13} /> {goal ? 'Update Goal' : 'Set Goal'}
              </Button>
            )
          }
        />

        {showGoalForm && cfUser && (
          <div className="mb-5 p-4 rounded-xl bg-bg-tertiary border border-border-muted animate-fade-in">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <Input
                  label={`Target Rating (Current: ${cfUser.rating})`}
                  type="number"
                  placeholder="e.g. 1600"
                  value={goalTarget}
                  onChange={(e) => setGoalTarget(e.target.value)}
                  id="goal-target-input"
                  hint={`Must be above ${cfUser.rating}`}
                />
              </div>
              <Button variant="primary" loading={saving} onClick={saveGoal} id="save-goal">
                <Save size={14} /> Save
              </Button>
              <Button variant="ghost" onClick={() => setShowGoalForm(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {goal && cfUser ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-text-secondary mb-1">Current</p>
                <p className="text-2xl font-bold" style={{ color: getRankColor(cfUser.rank) }}>{cfUser.rating}</p>
              </div>
              <TrendingUp size={20} className="text-accent-cyan" />
              <div className="text-right">
                <p className="text-xs text-text-secondary mb-1">Target</p>
                <p className="text-2xl font-bold text-accent-cyan">{goal.target_rating}</p>
              </div>
            </div>

            <ProgressBar
              value={progress}
              label={`${Math.round(progress)}% complete`}
              showPercent={false}
            />

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 rounded-xl bg-bg-tertiary border border-border-muted">
                <p className="text-lg font-bold text-text-primary">{ratingNeeded}</p>
                <p className="text-xs text-text-secondary">Rating needed</p>
              </div>
              <div className="p-3 rounded-xl bg-bg-tertiary border border-border-muted">
                <p className="text-lg font-bold text-text-primary">
                  {avgDelta > 0 ? `+${Math.round(avgDelta)}` : Math.round(avgDelta) || '—'}
                </p>
                <p className="text-xs text-text-secondary">Avg delta/contest</p>
              </div>
              <div className="p-3 rounded-xl bg-bg-tertiary border border-border-muted">
                <p className="text-lg font-bold text-accent-cyan">
                  {contestsNeeded ? `~${contestsNeeded}` : '—'}
                </p>
                <p className="text-xs text-text-secondary">Contests to go</p>
              </div>
            </div>

            {progress >= 100 && (
              <div className="p-4 rounded-xl bg-accent-green/10 border border-accent-green/20 text-center">
                <p className="text-accent-green font-semibold">🎉 Goal Achieved! Set a new target!</p>
              </div>
            )}
          </div>
        ) : (
          <EmptyState
            icon="🎯"
            title="No goal set"
            description="Set a rating target and track your progress contest by contest."
          />
        )}
      </Card>

      {/* Daily reminder toggle */}
      <Card className="p-5">
        <CardHeader title="Daily Reminder" icon={<Calendar size={16} />} />
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-secondary">Get notified to solve at least 2 problems daily</p>
          <button
            id="toggle-notifications"
            onClick={() => {
              if ('Notification' in window) {
                Notification.requestPermission().then((perm) => {
                  if (perm === 'granted') {
                    toast.success('Daily reminders enabled!');
                  }
                });
              } else {
                toast.error('Browser notifications not supported');
              }
            }}
            className="btn-secondary text-sm px-4 py-2"
          >
            Enable Reminders
          </button>
        </div>
      </Card>
    </div>
  );
};
