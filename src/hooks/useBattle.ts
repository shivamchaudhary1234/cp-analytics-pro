import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { generateRoomCode } from '../lib/utils';
import { selectBattleProblems } from '../services/codeforces';
import type { Battle, BattleParticipant, BattleSubmission } from '../types';

export function useBattle(userId: string) {
  const [battle, setBattle] = useState<Battle | null>(null);
  const [participants, setParticipants] = useState<BattleParticipant[]>([]);
  const [battleSubmissions, setBattleSubmissions] = useState<BattleSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);

  // Create a new battle room
  const createRoom = useCallback(async (timerMinutes: number, avgRating: number) => {
    setLoading(true);
    setError(null);
    try {
      const roomCode = generateRoomCode();
      const problems = await selectBattleProblems(avgRating, 2);

      const battleProblems = problems.map((p) => ({
        contestId: p.contestId!,
        index: p.index,
        name: p.name,
        rating: p.rating ?? 0,
        tags: p.tags,
        url: `https://codeforces.com/problemset/problem/${p.contestId}/${p.index}`,
      }));

      const { data, error: dbErr } = await supabase
        .from('battles')
        .insert({
          room_code: roomCode,
          host_id: userId,
          status: 'waiting',
          timer_minutes: timerMinutes,
          problems: battleProblems,
        })
        .select()
        .single();

      if (dbErr) throw dbErr;

      // Add host as participant
      await supabase.from('battle_participants').insert({
        battle_id: data.id,
        user_id: userId,
        score: 0,
        solved_count: 0,
      });

      setBattle(data as Battle);
      return data as Battle;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to create room';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Join existing battle
  const joinRoom = useCallback(async (roomCode: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data: battleData, error: fetchErr } = await supabase
        .from('battles')
        .select('*')
        .eq('room_code', roomCode.toUpperCase())
        .single();

      if (fetchErr || !battleData) throw new Error('Room not found');
      if (battleData.status !== 'waiting') throw new Error('Battle already started or finished');

      const { error: joinErr } = await supabase.from('battle_participants').insert({
        battle_id: battleData.id,
        user_id: userId,
        score: 0,
        solved_count: 0,
      });

      if (joinErr) throw joinErr;
      setBattle(battleData as Battle);
      return battleData as Battle;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to join room';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Start battle (host only)
  const startBattle = useCallback(async (battleId: string) => {
    const { data, error: err } = await supabase
      .from('battles')
      .update({ status: 'active', started_at: new Date().toISOString() })
      .eq('id', battleId)
      .select()
      .single();
    if (!err && data) setBattle(data as Battle);
  }, []);

  // Submit problem solved
  const submitSolved = useCallback(async (battleId: string, problemIndex: number) => {
    await supabase.from('battle_submissions').insert({
      battle_id: battleId,
      user_id: userId,
      problem_index: problemIndex,
      verdict: 'accepted',
      attempted_at: new Date().toISOString(),
    });

    // Update participant score
    const current = participants.find((p) => p.user_id === userId);
    if (current) {
      await supabase
        .from('battle_participants')
        .update({ solved_count: current.solved_count + 1, score: (current.score ?? 0) + timeLeft })
        .eq('battle_id', battleId)
        .eq('user_id', userId);
    }
  }, [userId, participants, timeLeft]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!battle) return;

    const channel = supabase
      .channel(`battle-${battle.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'battles', filter: `id=eq.${battle.id}` }, (payload: any) => {
        setBattle(payload.new as Battle);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'battle_participants', filter: `battle_id=eq.${battle.id}` }, async () => {
        const { data } = await supabase.from('battle_participants').select('*, profiles(*)').eq('battle_id', battle.id);
        if (data) setParticipants(data as BattleParticipant[]);
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'battle_submissions', filter: `battle_id=eq.${battle.id}` }, (payload: any) => {
        setBattleSubmissions((prev) => [...prev, payload.new as BattleSubmission]);
      })
      .subscribe();

    // Load initial participants
    supabase.from('battle_participants').select('*, profiles(*)').eq('battle_id', battle.id).then(({ data }: { data: any }) => {
      if (data) setParticipants(data as BattleParticipant[]);
    });

    return () => { supabase.removeChannel(channel); };
  }, [battle?.id]);

  // Timer countdown
  useEffect(() => {
    if (!battle || battle.status !== 'active' || !battle.started_at) return;
    const endTime = new Date(battle.started_at).getTime() + battle.timer_minutes * 60 * 1000;

    const tick = () => {
      const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0) {
        supabase.from('battles').update({ status: 'finished', finished_at: new Date().toISOString() }).eq('id', battle.id);
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [battle?.status, battle?.started_at]);

  return { battle, participants, battleSubmissions, loading, error, timeLeft, createRoom, joinRoom, startBattle, submitSolved };
}
