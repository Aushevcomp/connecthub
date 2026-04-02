-- ConnectHub migration for existing Supabase projects.
-- Run this if your database was already created from an older schema.sql.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banned_reason TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_public BOOLEAN DEFAULT TRUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS show_email BOOLEAN DEFAULT FALSE;

ALTER TABLE posts ADD COLUMN IF NOT EXISTS image_url TEXT;

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_actor ON notifications(actor_id);

DROP FUNCTION IF EXISTS increment_poll_votes(UUID);

CREATE FUNCTION increment_poll_votes(option_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE poll_options
  SET votes_count = votes_count + 1
  WHERE id = option_id;
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

DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
CREATE POLICY "Admins can update profiles"
  ON profiles FOR UPDATE
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;
CREATE POLICY "Users can delete own profile"
  ON profiles FOR DELETE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
CREATE POLICY "Admins can delete profiles"
  ON profiles FOR DELETE
  USING (public.current_user_is_admin());

DROP POLICY IF EXISTS "Admins can update posts" ON posts;
CREATE POLICY "Admins can update posts"
  ON posts FOR UPDATE
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

DROP POLICY IF EXISTS "Admins can delete posts" ON posts;
CREATE POLICY "Admins can delete posts"
  ON posts FOR DELETE
  USING (public.current_user_is_admin());

DROP POLICY IF EXISTS "Admins can delete comments" ON comments;
CREATE POLICY "Admins can delete comments"
  ON comments FOR DELETE
  USING (public.current_user_is_admin());

DROP POLICY IF EXISTS "Authors can create polls on own posts" ON polls;
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

DROP POLICY IF EXISTS "Authors can delete own polls" ON polls;
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

DROP POLICY IF EXISTS "Admins can delete polls" ON polls;
CREATE POLICY "Admins can delete polls"
  ON polls FOR DELETE
  USING (public.current_user_is_admin());

DROP POLICY IF EXISTS "Authors can create poll options" ON poll_options;
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

DROP POLICY IF EXISTS "Authors can delete poll options" ON poll_options;
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

DROP POLICY IF EXISTS "Admins can delete poll options" ON poll_options;
CREATE POLICY "Admins can delete poll options"
  ON poll_options FOR DELETE
  USING (public.current_user_is_admin());

DROP POLICY IF EXISTS "Business can create jobs" ON jobs;
CREATE POLICY "Business can create jobs"
  ON jobs FOR INSERT
  WITH CHECK (
    auth.uid() = company_id
    AND public.user_is_business_account(auth.uid())
  );

DROP POLICY IF EXISTS "Business can update own jobs" ON jobs;
CREATE POLICY "Business can update own jobs"
  ON jobs FOR UPDATE
  USING (auth.uid() = company_id)
  WITH CHECK (auth.uid() = company_id);

DROP POLICY IF EXISTS "Business can delete own jobs" ON jobs;
CREATE POLICY "Business can delete own jobs"
  ON jobs FOR DELETE
  USING (auth.uid() = company_id);

DROP POLICY IF EXISTS "Admins can update jobs" ON jobs;
CREATE POLICY "Admins can update jobs"
  ON jobs FOR UPDATE
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

DROP POLICY IF EXISTS "Admins can delete jobs" ON jobs;
CREATE POLICY "Admins can delete jobs"
  ON jobs FOR DELETE
  USING (public.current_user_is_admin());

DROP POLICY IF EXISTS "Applicants and employers see relevant job applications" ON job_applications;
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

DROP POLICY IF EXISTS "Auth users can apply" ON job_applications;
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

DROP POLICY IF EXISTS "Users can withdraw own application" ON job_applications;
CREATE POLICY "Users can withdraw own application"
  ON job_applications FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can delete job applications" ON job_applications;
CREATE POLICY "Admins can delete job applications"
  ON job_applications FOR DELETE
  USING (public.current_user_is_admin());

DROP POLICY IF EXISTS "Auth users can follow" ON follows;
CREATE POLICY "Auth users can follow"
  ON follows FOR INSERT
  WITH CHECK (
    auth.uid() = follower_id
    AND follower_id <> following_id
  );

DROP POLICY IF EXISTS "System can create notifications" ON notifications;
DROP POLICY IF EXISTS "Actors can create notifications" ON notifications;
CREATE POLICY "Actors can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (
    actor_id IS NULL
    OR auth.uid() = actor_id
    OR public.current_user_is_admin()
  );

DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can delete notifications" ON notifications;
CREATE POLICY "Admins can delete notifications"
  ON notifications FOR DELETE
  USING (public.current_user_is_admin());
