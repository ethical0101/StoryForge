/*
  # Create audio storage bucket

  1. Storage Setup
    - Create 'audio' bucket for storing generated audio files
    - Configure bucket settings for audio file uploads
    - Set up proper security policies

  2. Security
    - Enable RLS on storage objects
    - Allow authenticated users to upload audio files
    - Allow public read access for audio playback
    - Allow users to manage their own audio files

  Note: This migration creates the storage infrastructure needed for video generation features.
*/

-- Create the audio storage bucket using the storage admin functions
DO $$
BEGIN
  -- Check if bucket already exists
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'audio'
  ) THEN
    -- Insert the bucket
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'audio',
      'audio',
      true,
      52428800, -- 50MB limit
      ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/x-mpeg-3', 'audio/mpeg3']
    );
  END IF;
END $$;

-- Create storage policies for the audio bucket
DO $$
BEGIN
  -- Policy: Allow authenticated users to upload audio files
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can upload audio files'
  ) THEN
    CREATE POLICY "Authenticated users can upload audio files"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'audio');
  END IF;

  -- Policy: Allow public read access to audio files
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Public read access for audio files'
  ) THEN
    CREATE POLICY "Public read access for audio files"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'audio');
  END IF;

  -- Policy: Allow users to update their own audio files
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can update their own audio files'
  ) THEN
    CREATE POLICY "Users can update their own audio files"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (bucket_id = 'audio' AND auth.uid()::text = owner::text)
    WITH CHECK (bucket_id = 'audio' AND auth.uid()::text = owner::text);
  END IF;

  -- Policy: Allow users to delete their own audio files
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can delete their own audio files'
  ) THEN
    CREATE POLICY "Users can delete their own audio files"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (bucket_id = 'audio' AND auth.uid()::text = owner::text);
  END IF;
END $$;