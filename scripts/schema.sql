-- ConnectHub database schema
-- Run this in Supabase SQL Editor for a fresh install.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  account_type TEXT NOT NULL DEFAULT 'user' CHECK (account_type IN ('user', 'business')),
  avatar_url TEXT,
  banner_url TEXT,
  bio TEXT,
  role TEXT,
  company TEXT,
  location TEXT,
  website TEXT,
  skills TEXT[] DEFAULT '{}',
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  is_admin BOOLEAN DEFAULT FALSE,
  is_banned BOOLEAN DEFAULT FALSE,
  banned_at TIMESTAMPTZ,
  banned_reason TEXT,
  profile_public BOOLEAN DEFAULT TRUE,
  show_email BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Posts
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  tags TEXT[] DEFAULT '{}',
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post likes
CREATE TABLE IF NOT EXISTS post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Post saves
CREATE TABLE IF NOT EXISTS post_saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Comments
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Polls
CREATE TABLE IF NOT EXISTS polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID UNIQUE NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  votes_count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(poll_id, user_id)
);

-- Jobs
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  location TEXT NOT NULL,
  salary_min INTEGER,
  salary_max INTEGER,
  salary_currency TEXT DEFAULT 'RUB',
  employment_type TEXT DEFAULT 'full-time',
  experience_level TEXT DEFAULT 'middle',
  tags TEXT[] DEFAULT '{}',
  is_hot BOOLEAN DEFAULT FALSE,
  applicants_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Job applications
CREATE TABLE IF NOT EXISTS job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, user_id)
);

-- Follows
CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_created ON jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_actor ON notifications(actor_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);

-- Helper functions
DROP FUNCTION IF EXISTS increment_poll_votes(UUID);

CREATE FUNCTION increment_poll_votes(option_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE poll_options
  SET votes_count = votes_count + 1
  WHERE id = option_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, name, account_type, company)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'account_type', 'user'),
    NEW.raw_user_meta_data->>'company'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()),
    FALSE
  );
$$;

CREATE OR REPLACE FUNCTION public.user_is_business_account(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT account_type = 'business'
      FROM public.profiles
      WHERE id = target_user_id
    ),
    FALSE
  );
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can update profiles"
  ON profiles FOR UPDATE
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own profile"
  ON profiles FOR DELETE
  USING (auth.uid() = id);

CREATE POLICY "Admins can delete profiles"
  ON profiles FOR DELETE
  USING (public.current_user_is_admin());

-- Posts
CREATE POLICY "Posts are viewable by everyone"
  ON posts FOR SELECT
  USING (true);

CREATE POLICY "Auth users can create posts"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "Admins can update posts"
  ON posts FOR UPDATE
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE
  USING (auth.uid() = author_id);

CREATE POLICY "Admins can delete posts"
  ON posts FOR DELETE
  USING (public.current_user_is_admin());

-- Likes
CREATE POLICY "Likes are viewable by everyone"
  ON post_likes FOR SELECT
  USING (true);

CREATE POLICY "Auth users can like"
  ON post_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike"
  ON post_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Saves
CREATE POLICY "Saves visible to owner"
  ON post_saves FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Auth users can save"
  ON post_saves FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave"
  ON post_saves FOR DELETE
  USING (auth.uid() = user_id);

-- Comments
CREATE POLICY "Comments are viewable by everyone"
  ON comments FOR SELECT
  USING (true);

CREATE POLICY "Auth users can comment"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  USING (auth.uid() = author_id);

CREATE POLICY "Admins can delete comments"
  ON comments FOR DELETE
  USING (public.current_user_is_admin());

-- Polls
CREATE POLICY "Polls are viewable by everyone"
  ON polls FOR SELECT
  USING (true);

CREATE POLICY "Authors can create polls on own posts"
  ON polls FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM posts
      WHERE posts.id = polls.post_id
        AND posts.author_id = auth.uid()
    )
  );

CREATE POLICY "Authors can delete own polls"
  ON polls FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM posts
      WHERE posts.id = polls.post_id
        AND posts.author_id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete polls"
  ON polls FOR DELETE
  USING (public.current_user_is_admin());

CREATE POLICY "Poll options viewable by everyone"
  ON poll_options FOR SELECT
  USING (true);

CREATE POLICY "Authors can create poll options"
  ON poll_options FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM polls
      JOIN posts ON posts.id = polls.post_id
      WHERE polls.id = poll_options.poll_id
        AND posts.author_id = auth.uid()
    )
  );

CREATE POLICY "Authors can delete poll options"
  ON poll_options FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM polls
      JOIN posts ON posts.id = polls.post_id
      WHERE polls.id = poll_options.poll_id
        AND posts.author_id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete poll options"
  ON poll_options FOR DELETE
  USING (public.current_user_is_admin());

-- Poll votes
CREATE POLICY "Votes viewable by everyone"
  ON poll_votes FOR SELECT
  USING (true);

CREATE POLICY "Auth users can vote"
  ON poll_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Jobs
CREATE POLICY "Jobs are viewable by everyone"
  ON jobs FOR SELECT
  USING (true);

CREATE POLICY "Business can create jobs"
  ON jobs FOR INSERT
  WITH CHECK (
    auth.uid() = company_id
    AND public.user_is_business_account(auth.uid())
  );

CREATE POLICY "Business can update own jobs"
  ON jobs FOR UPDATE
  USING (auth.uid() = company_id)
  WITH CHECK (auth.uid() = company_id);

CREATE POLICY "Admins can update jobs"
  ON jobs FOR UPDATE
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

CREATE POLICY "Business can delete own jobs"
  ON jobs FOR DELETE
  USING (auth.uid() = company_id);

CREATE POLICY "Admins can delete jobs"
  ON jobs FOR DELETE
  USING (public.current_user_is_admin());

-- Job applications
CREATE POLICY "Applicants and employers see relevant job applications"
  ON job_applications FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1
      FROM jobs
      WHERE jobs.id = job_applications.job_id
        AND jobs.company_id = auth.uid()
    )
    OR public.current_user_is_admin()
  );

CREATE POLICY "Auth users can apply"
  ON job_applications FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM jobs
      WHERE jobs.id = job_applications.job_id
        AND jobs.company_id <> auth.uid()
    )
  );

CREATE POLICY "Users can withdraw own application"
  ON job_applications FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete job applications"
  ON job_applications FOR DELETE
  USING (public.current_user_is_admin());

-- Follows
CREATE POLICY "Follows are viewable"
  ON follows FOR SELECT
  USING (true);

CREATE POLICY "Auth users can follow"
  ON follows FOR INSERT
  WITH CHECK (
    auth.uid() = follower_id
    AND follower_id <> following_id
  );

CREATE POLICY "Users can unfollow"
  ON follows FOR DELETE
  USING (auth.uid() = follower_id);

-- Notifications
CREATE POLICY "Users see own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Actors can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (
    actor_id IS NULL
    OR auth.uid() = actor_id
    OR public.current_user_is_admin()
  );

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete notifications"
  ON notifications FOR DELETE
  USING (public.current_user_is_admin());
