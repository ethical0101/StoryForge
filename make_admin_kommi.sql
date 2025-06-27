-- SQL Script to Create Admin User for your admin email
-- Run this in your Supabase SQL Editor

-- First, check if the user exists in auth.users table
SELECT id, email, created_at
FROM auth.users
WHERE email = 'your-admin-email@gmail.com';

-- Check if they already have a profile
SELECT p.id, p.username, p.full_name, p.role, u.email
FROM public.profiles p
RIGHT JOIN auth.users u ON p.id = u.id
WHERE u.email = 'your-admin-email@gmail.com';

-- If user exists in auth.users but no profile, create one
INSERT INTO public.profiles (
  id,
  username,
  full_name,
  role,
  stories_count,
  followers_count,
  following_count,
  subscription_status,
  avatar_url
)
SELECT
  u.id,
  'your-username',
  COALESCE(u.raw_user_meta_data->>'full_name', 'Your Full Name'),
  'admin',
  0,
  0,
  0,
  'premium',
  'https://your-avatar-url.jpg'
FROM auth.users u
WHERE u.email = 'your-admin-email@gmail.com'
  AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);

-- If profile already exists, just update the role to admin
UPDATE public.profiles
SET role = 'admin',
    subscription_status = 'premium'
WHERE id = (
  SELECT id
  FROM auth.users
  WHERE email = 'your-admin-email@gmail.com'
);

-- Verify the result - show user with their auth info
SELECT
  u.email,
  u.created_at as auth_created,
  p.id,
  p.username,
  p.full_name,
  p.role,
  p.subscription_status,
  p.created_at as profile_created
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'your-admin-email@gmail.com';

-- Show all admin users
SELECT
  u.email,
  p.id,
  p.username,
  p.full_name,
  p.role,
  p.created_at
FROM public.profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE p.role = 'admin'
ORDER BY p.created_at DESC;
