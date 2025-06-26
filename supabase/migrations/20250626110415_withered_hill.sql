-- Create a fresh, clean schema for StoryForge Pro
-- This migration creates all tables with proper relationships and RLS policies

-- First, clean up any existing data
DROP TABLE IF EXISTS story_interactions CASCADE;
DROP TABLE IF EXISTS stories CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Create profiles table
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  bio text,
  role text DEFAULT 'user' NOT NULL CHECK (role IN ('user', 'admin')),
  stories_count integer DEFAULT 0 NOT NULL,
  followers_count integer DEFAULT 0 NOT NULL,
  following_count integer DEFAULT 0 NOT NULL,
  subscription_status text DEFAULT 'free' NOT NULL CHECK (subscription_status IN ('free', 'pro', 'premium')),
  subscription_expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create stories table
CREATE TABLE stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  genre text NOT NULL,
  type text NOT NULL CHECK (type IN ('story', 'poem', 'script', 'blog')),
  length text NOT NULL CHECK (length IN ('micro', 'short', 'medium', 'long')),
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

-- Enable RLS on stories
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for stories
CREATE POLICY "Public stories are viewable by everyone"
  ON stories FOR SELECT
  USING (is_public = true OR auth.uid() = author_id);

CREATE POLICY "Users can insert their own stories"
  ON stories FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own stories"
  ON stories FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own stories"
  ON stories FOR DELETE
  USING (auth.uid() = author_id);

-- Create story_interactions table
CREATE TABLE story_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('like', 'bookmark', 'comment')),
  comment_text text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_story_interactions_story_id ON story_interactions(story_id);
CREATE INDEX idx_story_interactions_user_id ON story_interactions(user_id);

-- Unique constraint for likes and bookmarks (one per user per story)
CREATE UNIQUE INDEX idx_story_interactions_unique_like_bookmark 
ON story_interactions(story_id, user_id, type) 
WHERE type IN ('like', 'bookmark');

-- Enable RLS on story_interactions
ALTER TABLE story_interactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for story_interactions
CREATE POLICY "Users can view interactions on accessible stories"
  ON story_interactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stories 
      WHERE stories.id = story_interactions.story_id 
      AND (stories.is_public = true OR stories.author_id = auth.uid())
    )
  );

CREATE POLICY "Authenticated users can insert interactions"
  ON story_interactions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM stories 
      WHERE stories.id = story_interactions.story_id 
      AND (stories.is_public = true OR stories.author_id = auth.uid())
    )
  );

CREATE POLICY "Users can update their own interactions"
  ON story_interactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interactions"
  ON story_interactions FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Create profile automatically when user signs up
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
    -- Log error but don't fail user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at for stories
CREATE TRIGGER update_stories_updated_at
    BEFORE UPDATE ON stories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();