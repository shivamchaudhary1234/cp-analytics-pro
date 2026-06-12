import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  User, Code2, Activity, Trophy, Star, Edit3, Save, RefreshCw,
  ExternalLink, Calendar, Zap
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useAppStore } from '../../store/useAppStore';
import { useCFUser, useCFAnalytics } from '../../hooks/useCodeforcesData';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, StatCard } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui';
import { getRankColor, formatNumber, timeAgo } from '../../lib/utils';
import toast from 'react-hot-toast';
import { useState } from 'react';

const profileSchema = z.object({
  name: z.string().min(2, 'Name too short'),
  cf_handle: z.string().min(2, 'Enter your Codeforces handle'),
  bio: z.string().max(200).optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { profile, setProfile, cfHandle, setCfHandle } = useAppStore();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const handle = cfHandle || profile?.cf_handle || '';
  const { data: cfUser, isLoading: cfLoading, refetch } = useCFUser(handle);
  const { totalSolved, contests, topicStats } = useCFAnalytics(handle);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: profile?.name ?? '', cf_handle: handle, bio: profile?.bio ?? '' },
  });

  useEffect(() => {
    if (profile) {
      reset({ name: profile.name, cf_handle: profile.cf_handle, bio: profile.bio ?? '' });
    }
  }, [profile, reset]);

  useEffect(() => {
    // Load profile from Supabase
    if (user?.id) {
      supabase.from('profiles').select('*').eq('user_id', user.id).single().then(({ data }: { data: any }) => {
        if (data) {
          setProfile(data);
          setCfHandle(data.cf_handle);
        }
      });
    }
  }, [user?.id, setCfHandle, setProfile]);

  const onSubmit = async (data: ProfileForm) => {
    if (!user) return;
    setSaving(true);
    const { data: upserted, error } = await supabase
      .from('profiles')
      .upsert({ 
        id: profile?.id,
        user_id: user.id, 
        name: data.name, 
        cf_handle: data.cf_handle, 
        bio: data.bio ?? '', 
        updated_at: new Date().toISOString() 
      })
      .select()
      .single();
    setSaving(false);
    if (error) {
      toast.error(error.message);
    } else {
      setProfile(upserted);
      setCfHandle(data.cf_handle);
      toast.success('Profile updated!');
      setEditing(false);
      refetch();
    }
  };

  const rankColor = cfUser ? getRankColor(cfUser.rank) : '#8B949E';

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-slide-up">
      {/* Profile Header */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row items-start gap-6">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-border-default">
              {cfUser?.avatar ? (
                <img src={cfUser.titlePhoto} alt={cfUser.handle} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-cyan-purple flex items-center justify-center">
                  <User size={36} className="text-white" />
                </div>
              )}
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-lg bg-accent-cyan/10 border border-accent-cyan/20 flex items-center justify-center">
              <Code2 size={14} className="text-accent-cyan" />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
              <div>
                <h2 className="text-2xl font-bold text-text-primary">{profile?.name ?? user?.email}</h2>
                {cfUser && (
                  <div className="flex items-center gap-2 mt-1">
                    <a
                      href={`https://codeforces.com/profile/${cfUser.handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm font-mono text-accent-cyan hover:underline"
                      id="cf-profile-link"
                    >
                      @{cfUser.handle} <ExternalLink size={12} />
                    </a>
                    <span className="badge" style={{ background: `${rankColor}15`, color: rankColor, border: `1px solid ${rankColor}30` }}>
                      {cfUser.rank}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {cfUser && (
                  <Button variant="ghost" size="sm" onClick={() => { refetch(); toast.success('Refreshed!'); }} id="refresh-cf">
                    <RefreshCw size={14} />
                  </Button>
                )}
                <Button variant="secondary" size="sm" onClick={() => setEditing(!editing)} id="edit-profile">
                  <Edit3 size={14} />
                  {editing ? 'Cancel' : 'Edit'}
                </Button>
              </div>
            </div>

            {cfLoading ? (
              <LoadingSpinner size="sm" />
            ) : cfUser ? (
              <>
                <div className="flex flex-wrap gap-4 mt-4">
                  <div className="text-center">
                    <div className="text-xl font-bold" style={{ color: rankColor }}>{cfUser.rating}</div>
                    <div className="text-xs text-text-muted">Current</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-text-primary">{cfUser.maxRating}</div>
                    <div className="text-xs text-text-muted">Peak</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-text-primary">{totalSolved}</div>
                    <div className="text-xs text-text-muted">Solved</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-text-primary">{contests.length}</div>
                    <div className="text-xs text-text-muted">Contests</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-text-primary">+{cfUser.contribution}</div>
                    <div className="text-xs text-text-muted">Contribution</div>
                  </div>
                </div>

                <p className="text-xs text-text-muted mt-3">
                  Last online: {timeAgo(cfUser.lastOnlineTimeSeconds)}
                </p>
              </>
            ) : !handle ? (
              <div className="text-text-secondary bg-bg-tertiary p-4 rounded-xl border border-border-muted">
                <p className="font-medium text-text-primary mb-1 flex items-center gap-2">
                  <Code2 size={18} className="text-accent-cyan" />
                  No Codeforces handle set
                </p>
                <p className="text-sm">Connect your Codeforces account to see your analytics, ratings, and performance insights.</p>
              </div>
            ) : (
              <p className="text-accent-red text-sm">Could not load Codeforces data. Check handle and try again.</p>
            )}
          </div>
        </div>

        {/* Edit form */}
        {editing && (
          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 pt-6 border-t border-border-default space-y-4 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Display Name" error={errors.name?.message} icon={<User size={16} />} id="edit-name" {...register('name')} />
              <Input label="Codeforces Handle" error={errors.cf_handle?.message} icon={<Code2 size={16} />} id="edit-cf-handle"
                hint="e.g., tourist, jiangly, Benq" {...register('cf_handle')} />
            </div>
            <Input label="Bio (optional)" error={errors.bio?.message} id="edit-bio" {...register('bio')} />
            <div className="flex gap-3">
              <Button type="submit" loading={saving} id="save-profile"><Save size={14} /> Save Changes</Button>
              <Button type="button" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          </form>
        )}
      </Card>

      {/* Stats grid */}
      {cfUser && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Current Rating" value={cfUser.rating} icon={<Activity size={18} />} color="cyan" sub={cfUser.rank} />
          <StatCard label="Peak Rating" value={cfUser.maxRating} icon={<Trophy size={18} />} color="purple" sub={cfUser.maxRank} />
          <StatCard label="Problems Solved" value={formatNumber(totalSolved)} icon={<Star size={18} />} color="green" />
          <StatCard label="Friend Count" value={cfUser.friendOfCount} icon={<User size={18} />} color="orange" />
        </div>
      )}

      {/* Top topics */}
      {topicStats.length > 0 && (
        <Card className="p-5">
          <CardHeader title="Top Topics" subtitle="Most attempted problem categories" icon={<Zap size={16} />} />
          <div className="flex flex-wrap gap-2">
            {topicStats.slice(0, 15).map((t) => (
              <div key={t.topic} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-tertiary border border-border-muted text-xs">
                <span className="text-text-secondary capitalize">{t.topic}</span>
                <span className="text-accent-cyan font-semibold">{t.solved}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent contests */}
      {contests.length > 0 && (
        <Card className="p-5">
          <CardHeader title="Recent Contests" icon={<Calendar size={16} />} />
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Contest</th>
                  <th>Rank</th>
                  <th>Old Rating</th>
                  <th>New Rating</th>
                  <th>Change</th>
                </tr>
              </thead>
              <tbody>
                {contests.slice(-10).reverse().map((c) => {
                  const delta = c.newRating - c.oldRating;
                  return (
                    <tr key={c.contestId}>
                      <td className="text-text-primary max-w-xs truncate">{c.contestName}</td>
                      <td className="text-text-secondary">#{c.rank}</td>
                      <td className="text-text-secondary">{c.oldRating}</td>
                      <td className="font-medium" style={{ color: getRankColor('') }}>{c.newRating}</td>
                      <td className={delta >= 0 ? 'text-accent-green font-medium' : 'text-accent-red font-medium'}>
                        {delta >= 0 ? '+' : ''}{delta}
                      </td>
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
