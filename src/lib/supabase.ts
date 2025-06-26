import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Key:', supabaseKey ? 'Present' : 'Missing')

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'storyforge-pro'
    }
  }
})

// Test the connection
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Supabase auth event:', event, session?.user?.email)
})

export type Story = {
  id: string
  title: string
  content: string
  genre: string
  type: 'story' | 'poem' | 'script' | 'blog'
  length: 'micro' | 'short' | 'medium' | 'long'
  is_public: boolean
  author_id: string
  author_name: string
  author_avatar?: string
  cover_image?: string
  audio_url?: string
  video_url?: string
  likes_count: number
  views_count: number
  created_at: string
  updated_at: string
}

export type Profile = {
  id: string
  username: string
  full_name: string
  avatar_url?: string
  bio?: string
  role: 'user' | 'admin'
  stories_count: number
  followers_count: number
  following_count: number
  subscription_status: 'free' | 'pro' | 'premium'
  subscription_expires_at?: string
  created_at: string
  updated_at?: string
}

export type StoryInteraction = {
  id: string
  story_id: string
  user_id: string
  type: 'like' | 'bookmark' | 'comment'
  comment_text?: string
  created_at: string
}

// Helper function to test database connection
export async function testConnection() {
  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1)
    if (error) {
      console.error('Database connection test failed:', error)
      return false
    }
    console.log('Database connection successful')
    return true
  } catch (error) {
    console.error('Database connection error:', error)
    return false
  }
}

// Helper function to create a demo user profile
export function createDemoProfile(): Profile {
  return {
    id: 'demo-user-id',
    username: 'demo_user',
    full_name: 'Demo User',
    avatar_url: undefined,
    bio: 'This is a demo account showcasing StoryForge Pro features',
    role: 'user',
    stories_count: 3,
    followers_count: 24,
    following_count: 12,
    subscription_status: 'free',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
}

// Helper function to get user stories
export async function getUserStories(userId: string): Promise<Story[]> {
  try {
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .eq('author_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching user stories:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getUserStories:', error)
    return []
  }
}

// Helper function to create a new story
export async function createStory(story: Omit<Story, 'id' | 'created_at' | 'updated_at' | 'likes_count' | 'views_count'>): Promise<Story | null> {
  try {
    const { data, error } = await supabase
      .from('stories')
      .insert([{
        ...story,
        likes_count: 0,
        views_count: 0
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating story:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error in createStory:', error)
    throw error
  }
}