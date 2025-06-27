-- SQL Script to Make kommidruthendra2005@gmail.com an Admin User
-- Run this in your Supabase SQL Editor

-- First, let's check if the user exists and get their ID
SELECT id, email, raw_user_meta_data
FROM auth.users
WHERE email = 'kommidruthendra2005@gmail.com';

-- Update the user's profile to admin role
-- This will work if the user has already registered
UPDATE public.profiles
SET role = 'admin'
WHERE id = (
  SELECT id
  FROM auth.users
  WHERE email = 'kommidruthendra2005@gmail.com'
);

-- Alternative: If you need to create the profile first (in case it doesn't exist)
-- Uncomment the following lines if needed:

-- INSERT INTO public.profiles (
--   id,
--   username,
--   full_name,
--   role,
--   stories_count,
--   followers_count,
--   following_count,
--   subscription_status
-- )
-- SELECT
--   id,
--   COALESCE(raw_user_meta_data->>'username', 'admin_user'),
--   COALESCE(raw_user_meta_data->>'full_name', 'Admin User'),
--   'admin',
--   0,
--   0,
--   0,
--   'premium'
-- FROM auth.users
-- WHERE email = 'kommidruthendra2005@gmail.com'
-- ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- Verify the update worked
SELECT p.*, u.email
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email = 'kommidruthendra2005@gmail.com';
