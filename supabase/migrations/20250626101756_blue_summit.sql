/*
  # Clear all users from database

  1. Data Cleanup
    - Remove all story interactions
    - Remove all stories
    - Remove all profiles
    - Remove all users from auth.users table

  2. Security
    - This migration will completely clear all user data
    - Use only for development/testing purposes
    - All user-generated content will be permanently deleted

  3. Order of Operations
    - Clear dependent tables first (story_interactions)
    - Then stories table
    - Then profiles table
    - Finally auth.users table
*/

-- Clear story interactions first (has foreign keys to stories and users)
DELETE FROM public.story_interactions;

-- Clear stories (has foreign key to users)
DELETE FROM public.stories;

-- Clear profiles (has foreign key to auth.users)
DELETE FROM public.profiles;

-- Clear users from auth schema (this is the main auth table)
DELETE FROM auth.users;

-- Reset any sequences if needed
-- Note: UUID primary keys don't use sequences, so this is not needed for this schema