import React, { useState } from 'react';
import { Search, GitCompare, ExternalLink, TrendingUp } from 'lucide-react';
import { useCFUser, useCFAnalytics } from '../../hooks/useCodeforcesData';
import { RatingGraph } from '../../components/charts/RatingGraph';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingSpinner } from '../../components/ui';
import { getRankColor } from '../../lib/utils';

interface HandleInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  id: string;
}

const HandleInput: React.FC<HandleInputProps> = ({ label, value, onChange, id }) => (
  <div className="flex-1">
    <Input
      label={label}
      placeholder="Codeforces handle"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      icon={<Search size={16} />}
      id={id}
    />
  </div>
);

interface UserCard {
  handle: string;
  color?: string;
}

const UserSummary: React.FC<UserCard> = ({ handle, color = '#00D4FF' }) => {
  const { data: user, isLoading } = useCFUser(handle);
  if (isLoading) return <LoadingSpinner size="sm" />;
  if (!user) return <p className="text-xs text-accent-red">Not found</p>;
  return (
    <div className="flex flex-col items-center gap-2 p-4">
      <img src={user.titlePhoto} alt={handle} className="w-16 h-16 rounded-xl border-2"
        style={{ borderColor: color }} onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${handle}&background=21262D&color=fff`; }} />
      <a href={`https://codeforces.com/profile/${handle}`} target="_blank" rel="noopener noreferrer"
        className="text-sm font-bold hover:underline flex items-center gap-1" style={{ color }}>
        {handle} <ExternalLink size={11} />
      </a>
      <span className="text-xs capitalize" style={{ color: getRankColor(user.rank) }}>{user.rank}</span>
      <span className="text-2xl font-bold text-text-primary">{user.rating}</span>
    </div>
  );
};

export const ComparePage: React.FC = () => {
  const [handle1, setHandle1] = useState('');
  const [handle2, setHandle2] = useState('');
  const [compared, setCompared] = useState(false);

  const ana1 = useCFAnalytics(compared ? handle1 : '');
  const ana2 = useCFAnalytics(compared ? handle2 : '');

  const handleCompare = () => {
    if (!handle1.trim() || !handle2.trim()) return;
    setCompared(true);
  };

  // Topic intersection
  const allTopics = compared && ana1.topicStats.length && ana2.topicStats.length
    ? [...new Set([...ana1.topicStats.map(t => t.topic), ...ana2.topicStats.map(t => t.topic)])]
        .filter(t => {
          const t1 = ana1.topicStats.find(x => x.topic === t);
          const t2 = ana2.topicStats.find(x => x.topic === t);
          return t1 && t2;
        }).slice(0, 8)
    : [];

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-slide-up">
      {/* Search */}
      <Card className="p-6">
        <CardHeader title="Compare Two Coders" subtitle="Side-by-side Codeforces stats" icon={<GitCompare size={16} />} />
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <HandleInput label="Player 1" value={handle1} onChange={setHandle1} id="compare-handle1" />
          <div className="text-text-muted font-bold text-lg pb-2 hidden sm:block">VS</div>
          <HandleInput label="Player 2" value={handle2} onChange={setHandle2} id="compare-handle2" />
          <Button
            variant="primary"
            onClick={handleCompare}
            loading={compared && (ana1.isLoading || ana2.isLoading)}
            id="compare-submit"
            className="flex-shrink-0"
          >
            <GitCompare size={15} /> Compare
          </Button>
        </div>
      </Card>

      {compared && (
        <>
          {/* User summaries */}
          <div className="grid grid-cols-2 gap-4">
            <Card hover>
              <UserSummary handle={handle1} color="#00D4FF" />
            </Card>
            <Card hover>
              <UserSummary handle={handle2} color="#7B2FBE" />
            </Card>
          </div>

          {ana1.isLoading || ana2.isLoading ? (
            <div className="flex items-center justify-center py-20"><LoadingSpinner size="lg" /></div>
          ) : ana1.user && ana2.user ? (
            <>
              {/* Head-to-head stats */}
              <Card className="p-5">
                <CardHeader title="Head-to-Head" icon={<GitCompare size={16} />} />
                <div className="space-y-4">
                  {[
                    { label: 'Current Rating', v1: ana1.user.rating, v2: ana2.user.rating, suffix: '' },
                    { label: 'Peak Rating', v1: ana1.user.maxRating, v2: ana2.user.maxRating, suffix: '' },
                    { label: 'Problems Solved', v1: ana1.totalSolved, v2: ana2.totalSolved, suffix: '' },
                    { label: 'Contests', v1: ana1.contests.length, v2: ana2.contests.length, suffix: '' },
                    { label: 'Contribution', v1: ana1.user.contribution, v2: ana2.user.contribution, suffix: '' },
                  ].map(({ label, v1, v2, suffix }) => {
                    const total = v1 + v2 || 1;
                    const pct1 = Math.round((v1 / total) * 100);
                    const better = v1 > v2 ? 1 : v2 > v1 ? 2 : 0;
                    return (
                      <div key={label}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className={`font-semibold ${better === 1 ? 'text-accent-cyan' : 'text-text-secondary'}`}>
                            {v1.toLocaleString()}{suffix} {better === 1 && <TrendingUp size={12} className="inline" />}
                          </span>
                          <span className="text-text-muted text-xs">{label}</span>
                          <span className={`font-semibold ${better === 2 ? 'text-accent-purple' : 'text-text-secondary'}`}>
                            {better === 2 && <TrendingUp size={12} className="inline" />} {v2.toLocaleString()}{suffix}
                          </span>
                        </div>
                        <div className="flex gap-1 items-center">
                          <div className="flex-1 h-2 rounded-full overflow-hidden bg-bg-hover">
                            <div className="h-full rounded-full bg-accent-cyan transition-all" style={{ width: `${pct1}%` }} />
                          </div>
                          <div className="flex-1 h-2 rounded-full overflow-hidden bg-bg-hover">
                            <div className="h-full rounded-full bg-accent-purple transition-all ml-auto" style={{ width: `${100 - pct1}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Rating graphs side by side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="p-5">
                  <p className="text-sm font-semibold text-accent-cyan mb-3">{handle1}'s Rating</p>
                  <RatingGraph data={ana1.ratingHistory} currentRating={ana1.user.rating} currentRank={ana1.user.rank} />
                </Card>
                <Card className="p-5">
                  <p className="text-sm font-semibold text-accent-purple mb-3">{handle2}'s Rating</p>
                  <RatingGraph data={ana2.ratingHistory} currentRating={ana2.user.rating} currentRank={ana2.user.rank} />
                </Card>
              </div>

              {/* Topic comparison */}
              {allTopics.length > 0 && (
                <Card className="p-5">
                  <CardHeader title="Topic Comparison" subtitle="Common topics accuracy" icon={<GitCompare size={16} />} />
                  <div className="space-y-3">
                    {allTopics.map((topic) => {
                      const t1 = ana1.topicStats.find(x => x.topic === topic);
                      const t2 = ana2.topicStats.find(x => x.topic === topic);
                      if (!t1 || !t2) return null;
                      return (
                        <div key={topic}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-accent-cyan font-medium">{t1.accuracy}%</span>
                            <span className="text-text-muted capitalize">{topic}</span>
                            <span className="text-accent-purple font-medium">{t2.accuracy}%</span>
                          </div>
                          <div className="flex gap-1">
                            <div className="flex-1 h-1.5 rounded-full bg-bg-hover overflow-hidden">
                              <div className="h-full rounded-full transition-all" style={{ width: `${t1.accuracy}%`, background: '#00D4FF' }} />
                            </div>
                            <div className="flex-1 h-1.5 rounded-full bg-bg-hover overflow-hidden">
                              <div className="h-full rounded-full ml-auto transition-all" style={{ width: `${t2.accuracy}%`, background: '#7B2FBE' }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex gap-4 mt-4 text-xs">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-accent-cyan" /><span className="text-text-secondary">{handle1}</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-accent-purple" /><span className="text-text-secondary">{handle2}</span></div>
                  </div>
                </Card>
              )}
            </>
          ) : (
            <Card className="p-10 text-center">
              <p className="text-text-secondary">Could not load data. Check handles and try again.</p>
            </Card>
          )}
        </>
      )}
    </div>
  );
};
