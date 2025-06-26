/*
  # Create story interactions table

  1. New Tables
    - `story_interactions`
      - `id` (uuid, primary key, auto-generated)
      - `story_id` (uuid, references stories, required)
      - `user_id` (uuid, references auth.users, required)
      - `type` (text, required - like/bookmark/comment)
      - `comment_text` (text, optional)
      - `created_at` (timestamp with timezone, default now)

  2. Security
    - Enable RLS on `story_interactions` table
    - Add policy for users to view interactions on public stories or their own stories
    - Add policy for authenticated users to insert interactions
    - Add policy for users to update their own interactions
    - Add policy for users to delete their own interactions

  3. Indexes
    - Add index on story_id for faster lookups
    - Add index on user_id for faster lookups
    - Add unique constraint on story_id, user_id, type for likes/bookmarks
*/

CREATE TABLE IF NOT EXISTS story_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
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