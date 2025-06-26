/*
  # Create profiles table

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `username` (text, unique, required)
      - `full_name` (text)
      - `avatar_url` (text)
      - `bio` (text)
      - `role` (text, default 'user')
      - `stories_count` (integer, default 0)
      - `followers_count` (integer, default 0)
      - `following_count` (integer, default 0)
      - `created_at` (timestamp with timezone, default now)

  2. Security
    - Enable RLS on `profiles` table
    - Add policy for public profile viewing
    - Add policy for users to insert their own profile
    - Add policy for users to update their own profile
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  bio text,
  role text DEFAULT 'user' NOT NULL,
  stories_count integer DEFAULT 0 NOT NULL,
  followers_count integer DEFAULT 0 NOT NULL,
  following_count integer DEFAULT 0 NOT NULL,
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