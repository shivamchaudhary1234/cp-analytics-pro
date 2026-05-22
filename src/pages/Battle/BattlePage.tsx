import React, { useState } from 'react';
import {
  Swords, Plus, Hash, Play, Clock, CheckCircle2,
  Trophy, ExternalLink, Copy, Loader2, Crown
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useAppStore } from '../../store/useAppStore';
import { useBattle } from '../../hooks/useBattle';
import { useCFUser } from '../../hooks/useCodeforcesData';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge, EmptyState } from '../../components/ui';
import toast from 'react-hot-toast';

type BattleView = 'lobby' | 'room' | 'battle' | 'result';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export const BattlePage: React.FC = () => {
  const { user } = useAuth();
  const { cfHandle } = useAppStore();
  const { data: cfUser } = useCFUser(cfHandle);

  const {
    battle, participants, battleSubmissions, loading, error,
    timeLeft, createRoom, joinRoom, startBattle, submitSolved
  } = useBattle(user?.id ?? '');

  const [view, setView] = useState<BattleView>('lobby');
  const [joinCode, setJoinCode] = useState('');
  const [timerMinutes, setTimerMinutes] = useState(30);
  const [solvedProblems, setSolvedProblems] = useState<Set<number>>(new Set());

  const isHost = battle?.host_id === user?.id;
  const myParticipant = participants.find((p) => p.user_id === user?.id);
  const opponent = participants.find((p) => p.user_id !== user?.id);

  // Check if a problem was solved by me
  const iSolved = (idx: number) =>
    battleSubmissions.some((s) => s.user_id === user?.id && s.problem_index === idx && s.verdict === 'accepted');

  const opponentSolved = (idx: number) =>
    battleSubmissions.some((s) => s.user_id !== user?.id && s.problem_index === idx && s.verdict === 'accepted');

  const handleCreate = async () => {
    const avgRating = cfUser?.rating ?? 1200;
    const b = await createRoom(timerMinutes, avgRating);
    if (b) { setView('room'); toast.success(`Room created: ${b.room_code}`); }
    else toast.error(error ?? 'Failed to create room');
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return toast.error('Enter a room code');
    const b = await joinRoom(joinCode.trim());
    if (b) { setView('room'); toast.success('Joined room!'); }
    else toast.error(error ?? 'Failed to join');
  };

  const handleStart = async () => {
    if (!battle) return;
    await startBattle(battle.id);
    setView('battle');
    toast.success('Battle started!');
  };

  const handleSolve = async (idx: number) => {
    if (!battle || solvedProblems.has(idx)) return;
    await submitSolved(battle.id, idx);
    setSolvedProblems((s) => new Set([...s, idx]));
    toast.success('Problem marked as solved! 🎉');
  };

  const copyCode = () => {
    if (battle?.room_code) {
      navigator.clipboard.writeText(battle.room_code);
      toast.success('Room code copied!');
    }
  };

  // Determine winner
  const winner = battle?.status === 'finished'
    ? participants.sort((a, b) =>
        b.solved_count - a.solved_count || b.score - a.score
      )[0]
    : null;

  // Auto-transition to result
  React.useEffect(() => {
    if (battle?.status === 'finished' && view === 'battle') setView('result');
  }, [battle?.status, view]);

  // ── LOBBY ─────────────────────────────────────────────────────
  if (view === 'lobby') return (
    <div className="max-w-2xl mx-auto space-y-6 animate-slide-up">
      {/* Hero */}
      <div className="glass-card p-8 text-center border border-accent-cyan/20"
        style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.05), rgba(123,47,190,0.05))' }}>
        <div className="w-16 h-16 rounded-2xl bg-gradient-cyan-purple flex items-center justify-center mx-auto mb-4 shadow-glow-cyan">
          <Swords size={28} className="text-white" />
        </div>
        <h2 className="text-2xl font-bold gradient-text mb-2">Battle Arena</h2>
        <p className="text-text-secondary text-sm max-w-xs mx-auto">
          Challenge another coder to a real-time coding duel. Solve problems faster to win!
        </p>
      </div>

      {/* Create room */}
      <Card className="p-6">
        <CardHeader title="Create a Battle Room" subtitle="Set up a new 1v1 challenge" icon={<Plus size={16} />} />
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-text-secondary mb-2 block">Timer Duration</label>
            <div className="flex gap-2">
              {[15, 30, 45, 60].map((m) => (
                <button
                  key={m}
                  onClick={() => setTimerMinutes(m)}
                  id={`timer-${m}`}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all border ${
                    timerMinutes === m
                      ? 'bg-accent-cyan/15 border-accent-cyan/40 text-accent-cyan'
                      : 'border-border-default text-text-secondary hover:border-border-hover hover:text-text-primary'
                  }`}
                >
                  {m}m
                </button>
              ))}
            </div>
          </div>
          <Button
            variant="primary"
            className="w-full"
            loading={loading}
            onClick={handleCreate}
            id="create-battle-room"
          >
            <Swords size={16} />
            Create Battle Room
          </Button>
        </div>
      </Card>

      {/* Join room */}
      <Card className="p-6">
        <CardHeader title="Join a Battle Room" subtitle="Enter a room code to join" icon={<Hash size={16} />} />
        <div className="flex gap-3">
          <Input
            placeholder="Enter room code (e.g. AB3X7Z)"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            className="flex-1 font-mono tracking-widest uppercase"
            id="join-code-input"
          />
          <Button variant="primary" loading={loading} onClick={handleJoin} id="join-battle-room">
            <Play size={16} /> Join
          </Button>
        </div>
      </Card>

      {/* Rules */}
      <Card className="p-5">
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">How it works</p>
        <div className="space-y-2">
          {[
            ['🚀', 'Create or join a room using a 6-character code'],
            ['⚙️', 'Problems are auto-selected based on both players\' ratings'],
            ['⏱️', 'Solve problems on Codeforces before the timer runs out'],
            ['🏆', 'The player who solves more problems (or is faster) wins'],
          ].map(([icon, text]) => (
            <div key={text} className="flex items-start gap-2 text-sm text-text-secondary">
              <span>{icon}</span><span>{text}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  // ── WAITING ROOM ──────────────────────────────────────────────
  if (view === 'room' && battle) return (
    <div className="max-w-2xl mx-auto space-y-6 animate-slide-up">
      <Card className="p-8 text-center border border-accent-cyan/20">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-green/10 border border-accent-green/20 text-accent-green text-sm mb-6">
          <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
          Waiting for opponent
        </div>

        <p className="text-text-secondary text-sm mb-2">Room Code</p>
        <div className="flex items-center justify-center gap-3 mb-6">
          <span className="text-4xl font-mono font-bold tracking-[0.4em] gradient-text">{battle.room_code}</span>
          <button onClick={copyCode} className="btn-ghost p-2" id="copy-room-code" aria-label="Copy code">
            <Copy size={18} />
          </button>
        </div>

        <div className="flex items-center justify-center gap-6 mb-6">
          {participants.map((p) => (
            <div key={p.user_id} className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-2xl bg-gradient-cyan-purple flex items-center justify-center text-white text-xl font-bold">
                {p.user_id === user?.id ? '👤' : '🤖'}
              </div>
              <p className="text-sm font-medium text-text-primary">{p.user_id === user?.id ? 'You' : 'Opponent'}</p>
              <Badge variant="green">Ready</Badge>
            </div>
          ))}
          {participants.length < 2 && (
            <div className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-2xl border-2 border-dashed border-border-default flex items-center justify-center">
                <Loader2 size={24} className="text-text-muted animate-spin" />
              </div>
              <p className="text-sm text-text-muted">Waiting...</p>
            </div>
          )}
        </div>

        {isHost && participants.length >= 2 && (
          <Button variant="primary" className="w-full" onClick={handleStart} id="start-battle">
            <Play size={16} /> Start Battle
          </Button>
        )}
        {!isHost && (
          <p className="text-text-secondary text-sm">Waiting for host to start...</p>
        )}

        <div className="mt-4 text-xs text-text-muted">
          <Clock size={12} className="inline mr-1" />
          {battle.timer_minutes} minute battle · {battle.problems.length} problems
        </div>
      </Card>

      {/* Preview problems */}
      <Card className="p-5">
        <CardHeader title="Battle Problems" subtitle="Will be revealed when battle starts" icon={<Swords size={16} />} />
        <div className="space-y-2">
          {battle.problems.map((p, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-bg-tertiary border border-border-muted">
              <div>
                <p className="text-sm font-medium text-text-primary">{p.name}</p>
                <div className="flex gap-1 mt-1">
                  {p.tags.slice(0, 3).map((t) => <span key={t} className="text-[10px] bg-bg-hover px-1.5 py-0.5 rounded text-text-muted">{t}</span>)}
                </div>
              </div>
              <Badge variant="cyan">{p.rating}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  // ── ACTIVE BATTLE ─────────────────────────────────────────────
  if (view === 'battle' && battle) return (
    <div className="max-w-3xl mx-auto space-y-6 animate-slide-up">
      {/* Timer */}
      <div className="glass-card p-4 flex items-center justify-between border border-accent-red/20"
        style={{ background: timeLeft < 300 ? 'rgba(248,81,73,0.05)' : undefined }}>
        <div className="flex items-center gap-3">
          <Clock size={20} className={timeLeft < 300 ? 'text-accent-red animate-pulse' : 'text-accent-cyan'} />
          <div>
            <p className="text-xs text-text-secondary">Time Remaining</p>
            <p className={`text-3xl font-mono font-bold ${timeLeft < 300 ? 'text-accent-red' : 'text-accent-cyan'}`}>
              {formatTime(timeLeft)}
            </p>
          </div>
        </div>
        {/* Scoreboard */}
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-text-primary">{myParticipant?.solved_count ?? 0}</p>
            <p className="text-xs text-text-secondary">You</p>
          </div>
          <div className="text-2xl font-bold text-text-muted">vs</div>
          <div className="text-center">
            <p className="text-2xl font-bold text-text-primary">{opponent?.solved_count ?? 0}</p>
            <p className="text-xs text-text-secondary">Opponent</p>
          </div>
        </div>
      </div>

      {/* Problems */}
      <div className="space-y-4">
        {battle.problems.map((problem, idx) => {
          const mySolved = iSolved(idx);
          const oppSolved = opponentSolved(idx);
          return (
            <Card key={idx} className={`p-5 border transition-all ${mySolved ? 'border-accent-green/30 bg-accent-green/5' : 'border-border-default'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-text-muted">Problem {idx + 1}</span>
                    <Badge variant="cyan">{problem.rating}</Badge>
                    {mySolved && <Badge variant="green"><CheckCircle2 size={11} /> Solved</Badge>}
                    {!mySolved && oppSolved && <Badge variant="orange"><Trophy size={11} /> Opponent solved</Badge>}
                  </div>
                  <h3 className="text-base font-semibold text-text-primary">{problem.name}</h3>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {problem.tags.map((t) => (
                      <span key={t} className="text-[10px] bg-bg-hover border border-border-muted px-1.5 py-0.5 rounded text-text-muted">{t}</span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <a
                    href={problem.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1"
                    id={`open-problem-${idx}`}
                  >
                    Open <ExternalLink size={11} />
                  </a>
                  {!mySolved && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleSolve(idx)}
                      id={`mark-solved-${idx}`}
                    >
                      <CheckCircle2 size={13} /> Mark Solved
                    </Button>
                  )}
                  {mySolved && (
                    <div className="flex items-center gap-1 text-accent-green text-xs font-medium">
                      <CheckCircle2 size={13} /> Done!
                    </div>
                  )}
                </div>
              </div>

              {/* Progress row */}
              <div className="mt-3 flex items-center gap-3 text-xs text-text-muted">
                <span className={mySolved ? 'text-accent-green' : ''}>
                  You: {mySolved ? '✓' : '○'}
                </span>
                <span className={oppSolved ? 'text-accent-orange' : ''}>
                  Opponent: {oppSolved ? '✓' : '○'}
                </span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );

  // ── RESULT ────────────────────────────────────────────────────
  if (view === 'result') {
    const iWon = winner?.user_id === user?.id;
    return (
      <div className="max-w-xl mx-auto animate-slide-up">
        <Card className={`p-10 text-center border ${iWon ? 'border-accent-green/30' : 'border-accent-red/20'}`}>
          <div className="text-6xl mb-4">{iWon ? '🏆' : '😔'}</div>
          <h2 className="text-3xl font-bold mb-2" style={{ color: iWon ? '#3FB950' : '#F85149' }}>
            {iWon ? 'You Won!' : 'Better Luck Next Time'}
          </h2>
          <p className="text-text-secondary text-sm mb-8">
            {iWon ? 'Outstanding performance!' : 'Keep practicing and challenge again!'}
          </p>

          {/* Final scores */}
          <div className="flex items-center justify-center gap-8 mb-8">
            {participants.map((p) => (
              <div key={p.user_id} className="flex flex-col items-center gap-2">
                {p.user_id === winner?.user_id && <Crown size={20} className="text-accent-yellow" />}
                <div className="w-16 h-16 rounded-2xl bg-gradient-cyan-purple flex items-center justify-center text-2xl">
                  {p.user_id === user?.id ? '👤' : '🤖'}
                </div>
                <p className="text-sm font-medium">{p.user_id === user?.id ? 'You' : 'Opponent'}</p>
                <p className="text-2xl font-bold text-text-primary">{p.solved_count} <span className="text-sm text-text-muted">solved</span></p>
              </div>
            ))}
          </div>

          <div className="flex gap-3 justify-center">
            <Button variant="primary" onClick={() => { setView('lobby'); }} id="play-again">
              <Swords size={15} /> Play Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return <EmptyState icon="⚔️" title="Battle Arena" description="Something went wrong. Refresh the page." />;
};
