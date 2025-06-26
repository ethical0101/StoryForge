/*
  # Fix Authentication System

  1. Clean up existing data
  2. Recreate tables with proper structure
  3. Add trigger for automatic profile creation
  4. Ensure proper RLS policies
*/

-- Clean up existing data
DELETE FROM public.story_interactions;
DELETE FROM public.stories;
DELETE FROM public.profiles;

-- Clear auth data
DELETE FROM auth.sessions;
DELETE FROM auth.refresh_tokens;
DELETE FROM auth.users;

-- Drop and recreate profiles table
DROP TABLE IF EXISTS profiles CASCADE;
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  bio text,
  role text DEFAULT 'user' NOT NULL,
  stories_count integer DEFAULT 0 NOT NULL,
  followers_count integer DEFAULT 0 NOT NULL,
  following_count integer DEFAULT 0 NOT NULL,
  subscription_status text DEFAULT 'free' NOT NULL,
  subscription_expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Recreate stories table
DROP TABLE IF EXISTS stories CASCADE;
CREATE TABLE stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  genre text NOT NULL,
  type text NOT NULL,
  length text NOT NULL,
  is_public boolean DEFAULT true NOT NULL,
  author_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  author_name text NOT NULL,
  author_avatar text,
  cover_image text,
  audio_url text,
  video_url text,
  likes_count integer DEFAULT 0 NOT NULL,
  views_count integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public stories are viewable by everyone"
  ON stories
  FOR SELECT
  USING (is_public = true OR auth.uid() = author_id);

CREATE POLICY "Users can insert their own stories"
  ON stories
  FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own stories"
  ON stories
  FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own stories"
  ON stories
  FOR DELETE
  USING (auth.uid() = author_id);

-- Recreate story_interactions table
DROP TABLE IF EXISTS story_interactions CASCADE;
CREATE TABLE story_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('like', 'bookmark', 'comment')),
  comment_text text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_story_interactions_story_id ON story_interactions(story_id);
CREATE INDEX IF NOT EXISTS idx_story_interactions_user_id ON story_interactions(user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_story_interactions_unique_like_bookmark 
ON story_interactions(story_id, user_id, type) 
WHERE type IN ('like', 'bookmark');

ALTER TABLE story_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view interactions on accessible stories"
  ON story_interactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stories 
      WHERE stories.id = story_interactions.story_id 
      AND (stories.is_public = true OR stories.author_id = auth.uid())
    )
  );

CREATE POLICY "Authenticated users can insert interactions"
  ON story_interactions
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM stories 
      WHERE stories.id = story_interactions.story_id 
      AND (stories.is_public = true OR stories.author_id = auth.uid())
    )
  );

CREATE POLICY "Users can update their own interactions"
  ON story_interactions
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interactions"
  ON story_interactions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create improved trigger function for profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Create profile with data from user metadata
  INSERT INTO public.profiles (
    id, 
    username, 
    full_name, 
    role, 
    stories_count, 
    followers_count, 
    following_count, 
    subscription_status
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    'user',
    0,
    0,
    0,
    'free'
  );
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log error but don't fail the user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger and create new one
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();