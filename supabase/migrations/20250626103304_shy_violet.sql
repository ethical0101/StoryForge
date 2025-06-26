/*
  # Create users table and update schema

  1. New Tables
    - `users` - Main user accounts table
    - Update `profiles` to reference new users table
    - Update `stories` to reference new users table
    - Update `story_interactions` to reference new users table

  2. Security
    - Enable RLS on all tables
    - Add policies for user data access
    - Ensure proper foreign key relationships
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  email_confirmed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own data"
  ON users
  FOR SELECT
  USING (auth.uid()::text = id::text);

-- Update profiles table to reference users instead of auth.users
DROP TABLE IF EXISTS profiles CASCADE;
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
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
  WITH CHECK (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid()::text = id::text);

-- Update stories table
DROP TABLE IF EXISTS stories CASCADE;
CREATE TABLE stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  genre text NOT NULL,
  type text NOT NULL,
  length text NOT NULL,
  is_public boolean DEFAULT true NOT NULL,
  author_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
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
  USING (is_public = true OR auth.uid()::text = author_id::text);

CREATE POLICY "Users can insert their own stories"
  ON stories
  FOR INSERT
  WITH CHECK (auth.uid()::text = author_id::text);

CREATE POLICY "Users can update their own stories"
  ON stories
  FOR UPDATE
  USING (auth.uid()::text = author_id::text);

CREATE POLICY "Users can delete their own stories"
  ON stories
  FOR DELETE
  USING (auth.uid()::text = author_id::text);

-- Update story_interactions table
DROP TABLE IF EXISTS story_interactions CASCADE;
CREATE TABLE story_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('like', 'bookmark', 'comment')),
  comment_text text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_story_interactions_story_id ON story_interactions(story_id);
CREATE INDEX IF NOT EXISTS idx_story_interactions_user_id ON story_interactions(user_id);

-- Unique constraint for likes and bookmarks (one per user per story)
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
      AND (stories.is_public = true OR stories.author_id::text = auth.uid()::text)
    )
  );

CREATE POLICY "Authenticated users can insert interactions"
  ON story_interactions
  FOR INSERT
  WITH CHECK (
    auth.uid()::text = user_id::text AND
    EXISTS (
      SELECT 1 FROM stories 
      WHERE stories.id = story_interactions.story_id 
      AND (stories.is_public = true OR stories.author_id::text = auth.uid()::text)
    )
  );

CREATE POLICY "Users can update their own interactions"
  ON story_interactions
  FOR UPDATE
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own interactions"
  ON story_interactions
  FOR DELETE
  USING (auth.uid()::text = user_id::text);

-- Create function to handle user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, password_hash, email_confirmed)
  VALUES (NEW.id, NEW.email, NEW.encrypted_password, NEW.email_confirmed_at IS NOT NULL);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();