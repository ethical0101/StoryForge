/*
  # Create stories table

  1. New Tables
    - `stories`
      - `id` (uuid, primary key, auto-generated)
      - `title` (text, required)
      - `content` (text, required)
      - `genre` (text, required)
      - `type` (text, required - story/poem/script/blog)
      - `length` (text, required - micro/short/medium/long)
      - `is_public` (boolean, default true)
      - `author_id` (uuid, references auth.users, required)
      - `author_name` (text, required)
      - `author_avatar` (text)
      - `cover_image` (text)
      - `audio_url` (text)
      - `video_url` (text)
      - `likes_count` (integer, default 0)
      - `views_count` (integer, default 0)
      - `created_at` (timestamp with timezone, default now)
      - `updated_at` (timestamp with timezone, default now)

  2. Security
    - Enable RLS on `stories` table
    - Add policy for public story viewing (public stories or own stories)
    - Add policy for users to insert their own stories
    - Add policy for users to update their own stories
    - Add policy for users to delete their own stories
*/

CREATE TABLE IF NOT EXISTS stories (
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