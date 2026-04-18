import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Detect invalid/placeholder credentials
const isInvalid = !supabaseUrl || 
                 supabaseUrl.includes('your-project') || 
                 supabaseUrl.includes('placeholder') || 
                 supabaseAnonKey?.startsWith('sb_publishable_') ||
                 !supabaseAnonKey;

if (isInvalid) {
  console.warn(
    '⚠️ Invalid or missing Supabase credentials. Using mock client for demonstration purposes.\n' +
    'To use a real backend, update VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  );
}

// Simple mock for local development when Supabase is unavailable
const mockSupabase = {
  auth: {
    getSession: async () => ({
      data: {
        session: {
          user: { id: 'mock-user-id', email: 'demo@example.com', created_at: new Date().toISOString() },
        },
      },
      error: null,
    }),
    onAuthStateChange: (callback: any) => {
      setTimeout(() => {
        callback('SIGNED_IN', {
          user: { id: 'mock-user-id', email: 'demo@example.com', created_at: new Date().toISOString() },
        });
      }, 0);
      return { data: { subscription: { unsubscribe: () => {} } } };
    },
    signInWithPassword: async () => ({ data: { user: {} }, error: null }),
    signUp: async () => ({ data: { user: {} }, error: null }),
    signOut: async () => ({ error: null }),
  },
  from: (table: string) => {
    const chain = {
      select: () => chain,
      eq: () => chain,
      insert: (payload: any) => {
        const data = Array.isArray(payload) ? payload[0] : payload;
        return {
          ...chain,
          then: (resolve: any) => {
            resolve({
              data: { id: `mock-${table}-id`, ...data },
              error: null,
            });
          },
          select: () => ({
            single: async () => ({
              data: { id: `mock-${table}-id`, ...data },
              error: null,
            }),
          }),
        };
      },
      update: (payload: any) => {
        return {
          ...chain,
          then: (resolve: any) => {
            resolve({
              data: { id: `mock-${table}-id`, ...payload },
              error: null,
            });
          },
          select: () => ({
            single: async () => ({
              data: { id: `mock-${table}-id`, ...payload },
              error: null,
            }),
          }),
        };
      },
      upsert: () => chain,
      single: async () => {
        if (table === 'profiles') {
          return {
            data: {
              id: 'mock-profile-id',
              user_id: 'mock-user-id',
              name: 'Demo User',
              cf_handle: 'tourist',
              bio: 'Competitive Programmer & Data Enthusiast',
            },
            error: null,
          };
        }
        if (table === 'battles') {
          return {
            data: {
              id: 'mock-battle-id',
              room_code: 'MOCK77',
              host_id: 'mock-user-id',
              status: 'waiting',
              timer_minutes: 30,
              problems: [],
            },
            error: null,
          };
        }
        return { data: null, error: null };
      },
      then: (resolve: any) => {
        if (table === 'profiles') {
          resolve({
            data: {
              id: 'mock-profile-id',
              user_id: 'mock-user-id',
              name: 'Demo User',
              cf_handle: 'tourist',
              bio: 'Competitive Programmer & Data Enthusiast',
            },
            error: null,
          });
        } else if (table === 'battle_participants') {
          resolve({
            data: [
              { user_id: 'mock-user-id', solved_count: 0, score: 0, profiles: { name: 'Demo User' } },
              { user_id: 'opponent-id', solved_count: 0, score: 0, profiles: { name: 'Opponent' } }
            ],
            error: null,
          });
        } else {
          resolve({ data: null, error: null });
        }
      }
    };
    return chain;
  },
  removeChannel: () => {},
  channel: () => {
    const channelChain = {
      on: () => channelChain,
      subscribe: () => ({
        unsubscribe: () => {}
      })
    };
    return channelChain;
  }
};

export const supabase = isInvalid
  ? (mockSupabase as any)
  : createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });

export type SupabaseClient = typeof supabase;
