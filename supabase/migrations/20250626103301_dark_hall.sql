/*
  # Clear all users and data

  1. Clear all data
    - Remove all story interactions
    - Remove all stories  
    - Remove all profiles
    - Remove all auth users

  2. Reset the database to clean state
*/

-- Clear story interactions first (has foreign keys to stories and users)
DELETE FROM public.story_interactions;

-- Clear stories (has foreign key to users)
DELETE FROM public.stories;

-- Clear profiles (has foreign key to auth.users)
DELETE FROM public.profiles;

-- Clear users from auth schema (this is the main auth table)
DELETE FROM auth.users;

-- Clear any auth sessions
DELETE FROM auth.sessions;

-- Clear any auth refresh tokens
DELETE FROM auth.refresh_tokens;