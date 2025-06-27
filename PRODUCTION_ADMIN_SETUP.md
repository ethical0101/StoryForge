# 🚀 Production Admin Setup Guide

## Issue: Admin Panel Not Working on Vercel

The admin panel isn't working on your Vercel deployment because the admin user needs to be created in the production database.

## ✅ Solution: Create Admin User in Production

### Step 1: Register Admin Account
1. **Go to**: https://your-vercel-deployment.vercel.app/auth/register
2. **Register** with:
   - **Email**: `your-admin-email@gmail.com`
   - **Password**: Choose a secure password
   - **Username**: `your-username`
   - **Full Name**: `Your Full Name`

### Step 2: Run SQL Script in Supabase
1. **Open**: [Supabase Dashboard](https://app.supabase.com/projects) → Select your project
2. **Go to**: SQL Editor
3. **Run this SQL script**:

```sql
-- Promote your admin email to admin
UPDATE public.profiles
SET role = 'admin',
    subscription_status = 'premium'
WHERE id = (
  SELECT id
  FROM auth.users
  WHERE email = 'your-admin-email@gmail.com'
);

-- Verify the update worked
SELECT
  u.email,
  p.username,
  p.full_name,
  p.role,
  p.subscription_status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'your-admin-email@gmail.com';
```

### Step 3: Access Admin Panel
1. **Login** at: https://your-vercel-deployment.vercel.app/auth/login
2. **Use credentials**: `your-admin-email@gmail.com` + your password
3. **Navigate to**: https://your-vercel-deployment.vercel.app/admin

## 🔍 Troubleshooting

### If Registration Fails:
- Check Supabase Auth settings
- Ensure email confirmation is disabled for faster setup
- Try different email if needed

### If Admin Panel Still Not Working:
1. **Check browser console** for errors
2. **Verify SQL script** ran successfully
3. **Refresh the page** after login
4. **Clear browser cache** and cookies

### Alternative: Create Admin via SQL Only
If registration is problematic, you can create the admin user entirely via SQL:

```sql
-- Create auth user (this simulates registration)
-- Note: This is typically handled by Supabase Auth, but for admin setup:

-- First, check if user exists
SELECT * FROM auth.users WHERE email = 'your-admin-email@gmail.com';

-- If user doesn't exist and you can't register, create profile directly
-- (This will work when the user eventually registers)
INSERT INTO public.profiles (
  id,
  username,
  full_name,
  role,
  stories_count,
  followers_count,
  following_count,
  subscription_status
) VALUES (
  gen_random_uuid(), -- Temporary ID, will be updated when user registers
  'your-username',
  'Your Full Name',
  'admin',
  0, 0, 0,
  'premium'
) ON CONFLICT (username) DO UPDATE SET role = 'admin';
```

## 🎯 Expected Result

After completing these steps:
- ✅ Admin account exists in production database
- ✅ Can login at https://your-vercel-deployment.vercel.app/auth/login
- ✅ Can access admin panel at https://your-vercel-deployment.vercel.app/admin
- ✅ Full admin privileges on production site

## 📝 Production Admin Features

Once working, you'll have access to:
- **User Management**: View/moderate all users
- **Content Management**: Manage stories and reports
- **Analytics**: Platform statistics
- **Admin Tools**: Promote other users to admin

---

**Next Steps**: Follow Step 1 and Step 2 above, then test the admin panel access! 🚀
