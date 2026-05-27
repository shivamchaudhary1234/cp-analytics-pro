import React, { useEffect, useState } from 'react';
import { Trophy, Medal, RefreshCw, Crown, Flame, Star } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Card, CardHeader } from '../../components/ui/Card';
import { Badge, LoadingSpinner } from '../../components/ui';
import { Button } from '../../components/ui/Button';
import { getRankColor, calcConsistencyScore } from '../../lib/utils';
import type { LeaderboardEntry } from '../../types';
import { useAuth } from '../../hooks/useAuth';

const MEDAL_COLORS = ['#F6C549', '#C0C0C0', '#CD7F32'];

export const LeaderboardPage: React.FC = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [myRank, setMyRank] = useState<number | null>(null);

  const load = async () => {
    setRefreshing(true);
    try {
      // Fetch from profiles + stats_cache joined view
      const { data, error } = await supabase
        .from('leaderboard_view')
        .select('*')
        .order('cf_rating', { ascending: false })
        .limit(50);

      if (error) throw error;

      const mapped: LeaderboardEntry[] = (data ?? []).map((row: Record<string, unknown>, i: number) => ({
        rank: i + 1,
        user_id: row.user_id as string,
        name: row.name as string,
        cf_handle: row.cf_handle as string,
        avatar_url: row.avatar_url as string | undefined,
        cf_rating: row.cf_rating as number,
        cf_max_rating: row.cf_max_rating as number,
        cf_rank: row.cf_rank as string,
        current_streak: row.current_streak as number ?? 0,
        consistency_score: calcConsistencyScore(row.current_streak as number ?? 0, row.total_solved as number ?? 0),
      }));

      setEntries(mapped);
      const myIdx = mapped.findIndex((e) => e.user_id === user?.id);
      setMyRank(myIdx >= 0 ? myIdx + 1 : null);
    } catch {
      // If leaderboard_view doesn't exist yet, use mock data
      const mock: LeaderboardEntry[] = Array.from({ length: 10 }, (_, i) => ({
        rank: i + 1,
        user_id: `mock-${i}`,
        name: ['tourist', 'jiangly', 'Benq', 'Um_nik', 'neal', 'ecnerwala', 'Radewoosh', 'maroonrk', 'Petr', 'MifasolLasiDo'][i],
        cf_handle: ['tourist', 'jiangly', 'Benq', 'Um_nik', 'neal', 'ecnerwala', 'Radewoosh', 'maroonrk', 'Petr', 'MifasolLasiDo'][i],
        cf_rating: [3979, 3847, 3736, 3700, 3669, 3658, 3640, 3621, 3612, 3597][i],
        cf_max_rating: [3979, 3847, 3736, 3700, 3669, 3658, 3640, 3621, 3612, 3597][i],
        cf_rank: 'legendary grandmaster',
        current_streak: Math.floor(Math.random() * 100),
        consistency_score: Math.floor(Math.random() * 100),
      }));
      setEntries(mock);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const top3 = entries.slice(0, 3);

  if (loading) return <div className="flex items-center justify-center py-32"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-slide-up">
      {/* Hero */}
      <div className="glass-card p-6 text-center border border-accent-yellow/20"
        style={{ background: 'linear-gradient(135deg, rgba(210,153,34,0.05), rgba(0,212,255,0.05))' }}>
        <Trophy size={32} className="mx-auto mb-3 text-accent-yellow" />
        <h2 className="text-xl font-bold gradient-text">Global Leaderboard</h2>
        <p className="text-sm text-text-secondary mt-1">Ranked by Codeforces rating + consistency score</p>
      </div>

      {/* My rank */}
      {myRank && (
        <div className="glass-card px-5 py-3 flex items-center justify-between border border-accent-cyan/20">
          <div className="flex items-center gap-3">
            <Star size={16} className="text-accent-cyan" />
            <span className="text-sm text-text-secondary">Your global rank</span>
          </div>
          <Badge variant="cyan" className="text-base px-3 py-1">#{myRank}</Badge>
        </div>
      )}

      {/* Top 3 podium */}
      {top3.length >= 3 && (
        <Card className="p-6">
          <div className="flex items-end justify-center gap-4">
            {/* 2nd */}
            <div className="flex flex-col items-center gap-2 pb-0">
              <Medal size={20} style={{ color: MEDAL_COLORS[1] }} />
              <div className="w-16 h-16 rounded-2xl bg-bg-tertiary border border-border-default flex items-center justify-center text-xl font-bold text-text-secondary">
                {top3[1].name.charAt(0).toUpperCase()}
              </div>
              <a href={`https://codeforces.com/profile/${top3[1].cf_handle}`} target="_blank" rel="noopener noreferrer"
                className="text-xs font-semibold text-text-secondary hover:text-text-primary truncate max-w-[80px] text-center">
                {top3[1].cf_handle}
              </a>
              <span className="text-sm font-bold text-text-primary">{top3[1].cf_rating}</span>
              <div className="h-16 w-24 rounded-t-xl flex items-end justify-center pb-1 text-xs font-bold text-text-muted"
                style={{ background: 'rgba(192,192,192,0.1)', border: '1px solid rgba(192,192,192,0.2)' }}>2nd</div>
            </div>
            {/* 1st */}
            <div className="flex flex-col items-center gap-2">
              <Crown size={24} className="text-accent-yellow" />
              <div className="w-20 h-20 rounded-2xl bg-gradient-cyan-purple flex items-center justify-center text-2xl font-bold text-white shadow-glow-cyan">
                {top3[0].name.charAt(0).toUpperCase()}
              </div>
              <a href={`https://codeforces.com/profile/${top3[0].cf_handle}`} target="_blank" rel="noopener noreferrer"
                className="text-sm font-bold text-accent-yellow hover:underline truncate max-w-[90px] text-center">
                {top3[0].cf_handle}
              </a>
              <span className="text-lg font-bold text-text-primary">{top3[0].cf_rating}</span>
              <div className="h-24 w-28 rounded-t-xl flex items-end justify-center pb-1 text-sm font-bold text-accent-yellow"
                style={{ background: 'rgba(246,197,73,0.08)', border: '1px solid rgba(246,197,73,0.2)' }}>1st</div>
            </div>
            {/* 3rd */}
            <div className="flex flex-col items-center gap-2 pb-0">
              <Medal size={20} style={{ color: MEDAL_COLORS[2] }} />
              <div className="w-16 h-16 rounded-2xl bg-bg-tertiary border border-border-default flex items-center justify-center text-xl font-bold text-text-muted">
                {top3[2].name.charAt(0).toUpperCase()}
              </div>
              <a href={`https://codeforces.com/profile/${top3[2].cf_handle}`} target="_blank" rel="noopener noreferrer"
                className="text-xs font-semibold text-text-secondary hover:text-text-primary truncate max-w-[80px] text-center">
                {top3[2].cf_handle}
              </a>
              <span className="text-sm font-bold text-text-primary">{top3[2].cf_rating}</span>
              <div className="h-10 w-24 rounded-t-xl flex items-end justify-center pb-1 text-xs font-bold text-text-muted"
                style={{ background: 'rgba(205,127,50,0.1)', border: '1px solid rgba(205,127,50,0.2)' }}>3rd</div>
            </div>
          </div>
        </Card>
      )}

      {/* Full table */}
      <Card className="p-5">
        <CardHeader
          title="Rankings"
          subtitle={`${entries.length} registered coders`}
          icon={<Trophy size={16} />}
          action={
            <Button variant="ghost" size="sm" onClick={load} loading={refreshing} id="refresh-leaderboard">
              <RefreshCw size={14} /> Refresh
            </Button>
          }
        />
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Handle</th>
                <th>Rating</th>
                <th>Peak</th>
                <th>Rank Title</th>
                <th><Flame size={13} className="inline" /> Streak</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const isMe = entry.user_id === user?.id;
                return (
                  <tr key={entry.user_id} className={isMe ? 'bg-accent-cyan/5' : ''}>
                    <td>
                      <div className="flex items-center gap-2">
                        {entry.rank <= 3 ? (
                          <Medal size={16} style={{ color: MEDAL_COLORS[entry.rank - 1] }} />
                        ) : (
                          <span className="text-text-secondary font-mono text-sm">#{entry.rank}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <a
                        href={`https://codeforces.com/profile/${entry.cf_handle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium font-mono hover:text-accent-cyan transition-colors flex items-center gap-1"
                        style={{ color: isMe ? '#00D4FF' : undefined }}
                      >
                        {entry.cf_handle}
                        {isMe && <Badge variant="cyan" className="text-[10px]">You</Badge>}
                      </a>
                    </td>
                    <td>
                      <span className="font-bold" style={{ color: getRankColor(entry.cf_rank) }}>{entry.cf_rating}</span>
                    </td>
                    <td className="text-text-secondary">{entry.cf_max_rating}</td>
                    <td>
                      <span className="text-xs capitalize" style={{ color: getRankColor(entry.cf_rank) }}>{entry.cf_rank}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <Flame size={13} className="text-accent-orange" />
                        <span className="text-text-primary font-medium">{entry.current_streak}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-bg-hover overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-cyan-purple" style={{ width: `${Math.min(100, entry.consistency_score)}%` }} />
                        </div>
                        <span className="text-xs text-text-secondary">{entry.consistency_score}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
