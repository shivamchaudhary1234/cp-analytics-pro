-- CP Analytics Pro - Supabase Database Schema

-- 1. Profiles Table
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    name TEXT NOT NULL,
    cf_handle TEXT,
    lc_username TEXT,
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone." ON profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile." ON profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile." ON profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- 2. Stats Cache Table
CREATE TABLE stats_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    platform TEXT NOT NULL, -- 'codeforces' or 'leetcode'
    raw_json JSONB NOT NULL,
    fetched_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE stats_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own stats cache." ON stats_cache
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stats cache." ON stats_cache
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Goals Table
CREATE TABLE goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    platform TEXT NOT NULL,
    target_rating INTEGER NOT NULL,
    start_rating INTEGER NOT NULL,
    current_rating INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own goals." ON goals
    FOR ALL USING (auth.uid() = user_id);

-- 4. Streaks Table
CREATE TABLE streaks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_active_date DATE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own streaks." ON streaks
    FOR ALL USING (auth.uid() = user_id);

-- 5. Battles Table
CREATE TABLE battles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_code TEXT NOT NULL UNIQUE,
    host_id UUID REFERENCES auth.users(id) NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('waiting', 'active', 'finished')),
    timer_minutes INTEGER NOT NULL,
    problems JSONB NOT NULL, -- Array of problems
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE battles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Battles are viewable by everyone." ON battles
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create battles." ON battles
    FOR INSERT WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts can update their battles." ON battles
    FOR UPDATE USING (auth.uid() = host_id);

-- 6. Battle Participants
CREATE TABLE battle_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    battle_id UUID REFERENCES battles(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    score INTEGER DEFAULT 0,
    solved_count INTEGER DEFAULT 0,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(battle_id, user_id)
);

ALTER TABLE battle_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants are viewable by everyone." ON battle_participants
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can join battles." ON battle_participants
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own participation." ON battle_participants
    FOR UPDATE USING (auth.uid() = user_id);

-- 7. Battle Submissions
CREATE TABLE battle_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    battle_id UUID REFERENCES battles(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    problem_index INTEGER NOT NULL,
    verdict TEXT NOT NULL,
    attempted_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE battle_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Battle submissions are viewable by everyone." ON battle_submissions
    FOR SELECT USING (true);

CREATE POLICY "Participants can submit to battles." ON battle_submissions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 8. Leaderboard View (Helper)
-- Note: This requires active data in profiles and streaks
CREATE OR REPLACE VIEW leaderboard_view AS
SELECT 
    p.user_id,
    p.name,
    p.cf_handle,
    p.avatar_url,
    s.current_streak,
    (SELECT (raw_json->'result'->0->>'rating')::int FROM stats_cache sc WHERE sc.user_id = p.user_id AND sc.platform = 'codeforces' ORDER BY fetched_at DESC LIMIT 1) as cf_rating,
    (SELECT (raw_json->'result'->0->>'maxRating')::int FROM stats_cache sc WHERE sc.user_id = p.user_id AND sc.platform = 'codeforces' ORDER BY fetched_at DESC LIMIT 1) as cf_max_rating,
    (SELECT (raw_json->'result'->0->>'rank')::text FROM stats_cache sc WHERE sc.user_id = p.user_id AND sc.platform = 'codeforces' ORDER BY fetched_at DESC LIMIT 1) as cf_rank
FROM profiles p
LEFT JOIN streaks s ON p.user_id = s.user_id;

-- Realtime settings
-- Enable realtime for battles, participants and submissions
ALTER PUBLICATION supabase_realtime ADD TABLE battles;
ALTER PUBLICATION supabase_realtime ADD TABLE battle_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE battle_submissions;
