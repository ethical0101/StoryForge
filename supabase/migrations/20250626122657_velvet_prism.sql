/*
  # Create audio storage bucket for video generation

  1. Storage Setup
    - Create 'audio' bucket for storing generated audio files
    - Configure bucket to be publicly accessible for playback
    - Set up appropriate policies for authenticated users

  2. Security
    - Allow authenticated users to upload audio files
    - Allow public read access for audio playback
    - Restrict uploads to authenticated users only

  3. Bucket Configuration
    - Public bucket for easy audio access
    - Appropriate file size limits
    - MIME type restrictions for audio files
*/

-- Create the audio storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio',
  'audio',
  true,
  52428800, -- 50MB limit
  ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm']
)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to upload audio files
CREATE POLICY "Authenticated users can upload audio files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'audio' AND
  auth.role() = 'authenticated'
);

-- Policy: Allow public read access to audio files
CREATE POLICY "Public read access for audio files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'audio');

-- Policy: Allow users to update their own audio files
CREATE POLICY "Users can update their own audio files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'audio' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'audio' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy: Allow users to delete their own audio files
CREATE POLICY "Users can delete their own audio files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'audio' AND auth.uid()::text = (storage.foldername(name))[1]);