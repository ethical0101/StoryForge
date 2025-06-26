import React, { createContext, useContext, useEffect, useState } from 'react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { supabase, Profile, testConnection, createDemoProfile } from '../lib/supabase'
import toast from 'react-hot-toast'

interface AuthContextType {
  user: SupabaseUser | null
  profile: Profile | null
  loading: boolean
  isDemo: boolean
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string, username: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
  refreshSubscription: () => Promise<void>
  enterDemoMode: () => void
  exitDemoMode: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDemo, setIsDemo] = useState(false)

  // Computed property for authentication status
  const isAuthenticated = !!(user && profile) || isDemo

  useEffect(() => {
    initializeAuth()
  }, [])

  // Enhanced session persistence - prevent logout on page refresh/navigation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Don't prevent unload, just ensure auth state persists
      if (user && !isDemo) {
        // Auth state will be restored on next load
        console.log('🔄 Page unloading, auth state will persist')
        // Store session info in sessionStorage as backup
        sessionStorage.setItem('storyforge_auth_backup', JSON.stringify({
          userId: user.id,
          email: user.email,
          timestamp: Date.now()
        }))
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user && !isDemo) {
        // Refresh auth state when page becomes visible again
        console.log('👁️ Page visible again, checking auth state')
        refreshAuthState()
      }
    }

    // Enhanced focus event handling
    const handleFocus = () => {
      if (user && !isDemo) {
        console.log('🔍 Window focused, verifying auth state')
        refreshAuthState()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [user, isDemo])

  async function refreshAuthState() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        console.error('❌ Error refreshing auth state:', error)
        return
      }

      if (session?.user && !user) {
        console.log('🔄 Restoring auth state for:', session.user.email)
        setUser(session.user)
        await fetchProfile(session.user.id)
      } else if (session?.user && user && session.user.id === user.id) {
        // Session exists and matches current user - all good
        console.log('✅ Auth state verified for:', session.user.email)
      } else if (!session?.user && user && !isDemo) {
        // Session lost but we have a user - try to restore from backup
        const backup = sessionStorage.getItem('storyforge_auth_backup')
        if (backup) {
          try {
            const backupData = JSON.parse(backup)
            const timeDiff = Date.now() - backupData.timestamp
            if (timeDiff < 5 * 60 * 1000) { // 5 minutes
              console.log('🔄 Attempting to restore session from backup')
              // Don't clear user state immediately, let them continue
              return
            }
          } catch (e) {
            console.error('Error parsing auth backup:', e)
          }
        }
        console.warn('⚠️ Session lost, but keeping user logged in')
      }
    } catch (error) {
      console.error('❌ Error in refreshAuthState:', error)
    }
  }

  async function initializeAuth() {
    try {
      console.log('🔄 Initializing authentication...')
      
      // Test database connection first
      const connectionOk = await testConnection()
      if (!connectionOk) {
        console.warn('⚠️ Database connection failed - limited functionality')
        setLoading(false)
        return
      }

      // Get initial session
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('❌ Error getting session:', error)
        setLoading(false)
        return
      }

      if (session?.user) {
        console.log('✅ Found existing session for:', session.user.email)
        setUser(session.user)
        await fetchProfile(session.user.id)
      } else {
        console.log('ℹ️ No existing session found')
        setLoading(false)
      }

      // Enhanced auth state change listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('🔄 Auth state changed:', event, session?.user?.email)
          
          if (event === 'SIGNED_IN' && session?.user) {
            console.log('✅ User signed in:', session.user.email)
            setUser(session.user)
            await fetchProfile(session.user.id)
            setIsDemo(false)
            // Clear any backup data
            sessionStorage.removeItem('storyforge_auth_backup')
          } else if (event === 'SIGNED_OUT') {
            // Only clear state if this was an intentional logout
            if (!isDemo) {
              console.log('👋 User signed out')
              setUser(null)
              setProfile(null)
              setLoading(false)
              // Clear backup data
              sessionStorage.removeItem('storyforge_auth_backup')
            }
          } else if (event === 'TOKEN_REFRESHED' && session?.user) {
            console.log('🔄 Token refreshed for:', session.user.email)
            setUser(session.user)
            // Update backup
            sessionStorage.setItem('storyforge_auth_backup', JSON.stringify({
              userId: session.user.id,
              email: session.user.email,
              timestamp: Date.now()
            }))
          }
        }
      )

      return () => subscription.unsubscribe()
    } catch (error) {
      console.error('❌ Error initializing auth:', error)
      setLoading(false)
    }
  }

  async function fetchProfile(userId: string) {
    try {
      console.log('🔄 Fetching profile for user:', userId)
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (profileError) {
        console.error('❌ Error fetching profile:', profileError)
        // Profile doesn't exist, wait for trigger to create it
        setTimeout(async () => {
          const { data: retryData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle()
          
          if (retryData) {
            console.log('✅ Profile loaded on retry:', retryData.username)
            setProfile(retryData)
          } else {
            console.warn('⚠️ Profile still not found after retry')
          }
          setLoading(false)
        }, 2000) // Wait 2 seconds for trigger
      } else if (profileData) {
        console.log('✅ Profile loaded successfully:', profileData.username)
        setProfile(profileData)
        setLoading(false)
      } else {
        console.log('ℹ️ No profile found - waiting for trigger to create it')
        setLoading(false)
      }
    } catch (error) {
      console.error('❌ Unexpected error fetching profile:', error)
      setLoading(false)
    }
  }

  async function signIn(email: string, password: string) {
    console.log('🔄 Starting sign in process for:', email)
    
    try {
      setLoading(true)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) {
        console.error('❌ Sign in error:', error)
        throw error
      }

      if (data.user) {
        console.log('✅ Sign in successful for:', data.user.email)
        // Auth state change listener will handle the rest
        toast.success('Welcome back!')
      }
    } catch (error) {
      console.error('❌ Sign in failed:', error)
      setLoading(false)
      throw error
    }
  }

  async function signUp(email: string, password: string, fullName: string, username: string) {
    console.log('🔄 Starting sign up process for:', email, 'with username:', username)
    
    try {
      setLoading(true)
      
      // Check if username is available first
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username.trim())
        .maybeSingle()

      if (existingProfile) {
        throw new Error('Username is already taken')
      }

      // Create auth user with metadata
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            username: username.trim()
          }
        }
      })

      if (error) {
        console.error('❌ Sign up error:', error)
        throw error
      }

      if (data.user) {
        console.log('✅ Auth user created successfully:', data.user.id)
        toast.success('Account created successfully!')
        // The trigger will create the profile automatically
        // Auth state change listener will handle the rest
      }
    } catch (error) {
      console.error('❌ Sign up failed:', error)
      setLoading(false)
      throw error
    }
  }

  async function signOut() {
    try {
      console.log('🔄 Starting sign out process...')
      setLoading(true)
      
      // Clear local state first
      setUser(null)
      setProfile(null)
      setIsDemo(false)
      
      // Clear backup data
      sessionStorage.removeItem('storyforge_auth_backup')
      
      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('❌ Supabase sign out error:', error)
        // Don't throw error, as we've already cleared local state
      }
      
      console.log('✅ Signed out successfully')
      toast.success('Signed out successfully')
    } catch (error) {
      console.error('❌ Sign out error:', error)
      // Even if there's an error, ensure local state is cleared
      setUser(null)
      setProfile(null)
      setIsDemo(false)
      sessionStorage.removeItem('storyforge_auth_backup')
    } finally {
      setLoading(false)
    }
  }

  async function updateProfile(updates: Partial<Profile>) {
    if (!user) {
      throw new Error('User not authenticated')
    }

    console.log('🔄 Updating profile for user:', user.id, 'with updates:', updates)

    try {
      // Optimistic update - update local state first
      setProfile(prev => prev ? { ...prev, ...updates } : null)

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)

      if (error) {
        console.error('❌ Error updating profile:', error)
        // Revert optimistic update on error
        await fetchProfile(user.id)
        throw error
      }

      console.log('✅ Profile updated successfully')
      toast.success('Profile updated successfully!')
    } catch (error) {
      console.error('❌ Profile update failed:', error)
      throw error
    }
  }

  async function refreshSubscription() {
    // Placeholder for subscription refresh logic
    console.log('🔄 Refreshing subscription...')
  }

  function enterDemoMode() {
    setIsDemo(true)
    setProfile(createDemoProfile())
    setLoading(false)
    toast.success('Entered demo mode - explore without signing up!')
  }

  function exitDemoMode() {
    setIsDemo(false)
    setProfile(null)
    setUser(null)
  }

  const value = {
    user,
    profile,
    loading,
    isDemo,
    isAuthenticated,
    signIn,
    signUp,
    signOut,
    updateProfile,
    refreshSubscription,
    enterDemoMode,
    exitDemoMode,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}