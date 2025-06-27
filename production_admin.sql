-- Production Admin Setup for your admin email
-- Run this in Supabase SQL Editor AFTER registering the account

-- Step 1: Check if user exists in auth.users
SELECT id, email, created_at, email_confirmed_at
FROM auth.users
WHERE email = 'your-admin-email@gmail.com';

-- Step 2: Check current profile status
SELECT p.id, p.username, p.full_name, p.role, u.email
FROM public.profiles p
RIGHT JOIN auth.users u ON p.id = u.id
WHERE u.email = 'your-admin-email@gmail.com';

-- Step 3: Promote to admin (run this after Steps 1 & 2 confirm user exists)
UPDATE public.profiles
SET role = 'admin',
    subscription_status = 'premium'
WHERE id = (
  SELECT id
  FROM auth.users
  WHERE email = 'your-admin-email@gmail.com'
);

-- Step 4: Verify admin promotion worked
SELECT
  u.email,
  u.email_confirmed_at,
  p.id,
  p.username,
  p.full_name,
  p.role,
  p.subscription_status,
  p.created_at as profile_created
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'your-admin-email@gmail.com';

-- Step 5: List all admin users (should include the new admin)
SELECT
  u.email,
  p.username,
  p.full_name,
  p.role,
  p.created_at
FROM public.profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE p.role = 'admin'
ORDER BY p.created_at DESC;
