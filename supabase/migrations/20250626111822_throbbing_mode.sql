/*
  # Create core application tables

  1. New Tables
    - `profiles` - User profile information with subscription details
    - `stories` - Story content with metadata and media URLs
    - `story_interactions` - User interactions with stories (likes, bookmarks, comments)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Public read access for public stories and profiles

  3. Functions & Triggers
    - Auto-create profile when user signs up
    - Update story counts and interaction counts
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  username text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  bio text,
  role text DEFAULT 'user'::text NOT NULL,
  stories_count integer DEFAULT 0 NOT NULL,
  followers_count integer DEFAULT 0 NOT NULL,
  following_count integer DEFAULT 0 NOT NULL,
  subscription_status text DEFAULT 'free'::text NOT NULL,
  subscription_expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create stories table
CREATE TABLE IF NOT EXISTS public.stories (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  title text NOT NULL,
  content text NOT NULL,
  genre text NOT NULL,
  type text NOT NULL,
  length text NOT NULL,
  is_public boolean DEFAULT true NOT NULL,
  author_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  author_name text NOT NULL,
  author_avatar text,
  cover_image text,
  audio_url text,
  video_url text,
  likes_count integer DEFAULT 0 NOT NULL,
  views_count integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- Stories policies
CREATE POLICY "Public stories are viewable by everyone" ON public.stories
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view their own stories" ON public.stories
  FOR SELECT USING (auth.uid() = author_id);

CREATE POLICY "Users can create stories" ON public.stories
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own stories" ON public.stories
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own stories" ON public.stories
  FOR DELETE USING (auth.uid() = author_id);

-- Create story_interactions table
CREATE TABLE IF NOT EXISTS public.story_interactions (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  story_id uuid REFERENCES public.stories(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL, -- 'like', 'bookmark', 'comment'
  comment_text text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE (story_id, user_id, type)
);

ALTER TABLE public.story_interactions ENABLE ROW LEVEL SECURITY;

-- Story interactions policies
CREATE POLICY "Users can view their own interactions" ON public.story_interactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create interactions" ON public.story_interactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interactions" ON public.story_interactions
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update story counts
CREATE OR REPLACE FUNCTION public.update_story_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles 
    SET stories_count = stories_count + 1 
    WHERE id = NEW.author_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles 
    SET stories_count = stories_count - 1 
    WHERE id = OLD.author_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for story count updates
DROP TRIGGER IF EXISTS update_story_counts_trigger ON public.stories;
CREATE TRIGGER update_story_counts_trigger
  AFTER INSERT OR DELETE ON public.stories
  FOR EACH ROW EXECUTE FUNCTION public.update_story_counts();

-- Create function to update interaction counts
CREATE OR REPLACE FUNCTION public.update_interaction_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.type = 'like' THEN
    UPDATE public.stories 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.story_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' AND OLD.type = 'like' THEN
    UPDATE public.stories 
    SET likes_count = likes_count - 1 
    WHERE id = OLD.story_id;
    RETURN OLD;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for interaction count updates
DROP TRIGGER IF EXISTS update_interaction_counts_trigger ON public.story_interactions;
CREATE TRIGGER update_interaction_counts_trigger
  AFTER INSERT OR DELETE ON public.story_interactions
  FOR EACH ROW EXECUTE FUNCTION public.update_interaction_counts();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles (username);
CREATE INDEX IF NOT EXISTS stories_author_id_idx ON public.stories (author_id);
CREATE INDEX IF NOT EXISTS stories_is_public_idx ON public.stories (is_public);
CREATE INDEX IF NOT EXISTS stories_genre_idx ON public.stories (genre);
CREATE INDEX IF NOT EXISTS stories_type_idx ON public.stories (type);
CREATE INDEX IF NOT EXISTS stories_created_at_idx ON public.stories (created_at DESC);
CREATE INDEX IF NOT EXISTS story_interactions_story_id_idx ON public.story_interactions (story_id);
CREATE INDEX IF NOT EXISTS story_interactions_user_id_idx ON public.story_interactions (user_id);
CREATE INDEX IF NOT EXISTS story_interactions_type_idx ON public.story_interactions (type);