import { supabase } from './supabase'

/**
 * Admin management functions
 */

export interface AdminUser {
  id: string
  username: string
  full_name: string | null
  role: string
  created_at: string
  avatar_url?: string
}

export async function makeUserAdmin(emailOrUsername: string): Promise<boolean> {
  try {
    console.log(`🔧 Making user admin: ${emailOrUsername}`)

    let authUserId: string | null = null
    let userProfile: AdminUser | null = null

    // First, try to find the user in auth.users table if it's an email
    if (emailOrUsername.includes('@')) {
      console.log('🔍 Looking up user by email in auth.users...')

      // Query auth.users table for the email
      const { data: authUser, error: authError } = await supabase
        .from('auth.users')
        .select('id, email, raw_user_meta_data')
        .eq('email', emailOrUsername)
        .single()

      if (authError) {
        console.error('❌ User not found in auth.users:', authError.message)
      } else if (authUser) {
        console.log('✅ Found user in auth.users:', authUser.email)
        authUserId = authUser.id

        // Now check if they have a profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single()

        if (profileError) {
          console.log('📝 No profile found, will create one')
        } else {
          userProfile = profile
          console.log('✅ Found existing profile:', profile.username)
        }
      }
    } else {
      // Try to find by username in profiles
      console.log('🔍 Looking up user by username in profiles...')
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', emailOrUsername)
        .single()

      if (!profileError && profile) {
        userProfile = profile
        authUserId = profile.id
        console.log('✅ Found user by username:', profile.username)
      }
    }

    // If we found a user with auth ID
    if (authUserId) {
      if (userProfile) {
        // User has a profile - check if already admin
        if (userProfile.role === 'admin') {
          console.log('✅ User is already an admin')
          return true
        }

        // Update existing profile to admin
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ role: 'admin' })
          .eq('id', authUserId)

        if (updateError) {
          console.error('❌ Error updating user role:', updateError.message)
          return false
        }

        console.log('✅ User successfully promoted to admin')
        return true
      } else {
        // User exists in auth but no profile - create admin profile
        const username = emailOrUsername.includes('@') ? emailOrUsername.split('@')[0] : emailOrUsername
        const fullName = emailOrUsername.includes('@') ?
          emailOrUsername.split('@')[0].replace(/[0-9]/g, '').charAt(0).toUpperCase() +
          emailOrUsername.split('@')[0].replace(/[0-9]/g, '').slice(1) :
          'Admin User'

        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: authUserId,
            username: username,
            full_name: fullName,
            role: 'admin',
            stories_count: 0,
            followers_count: 0,
            following_count: 0,
            subscription_status: 'premium'
          })

        if (insertError) {
          console.error('❌ Error creating admin profile:', insertError.message)
          return false
        }

        console.log('✅ Created new admin profile for existing auth user')
        return true
      }
    }

    // If no user found anywhere, create a placeholder profile (for future registration)
    if (emailOrUsername.includes('@')) {
      console.log('📝 Creating placeholder admin profile for future registration...')
      const username = emailOrUsername.split('@')[0]
      const fullName = username.replace(/[0-9]/g, '').charAt(0).toUpperCase() +
                      username.replace(/[0-9]/g, '').slice(1)

      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: crypto.randomUUID(),
          username: username,
          full_name: fullName,
          role: 'admin',
          stories_count: 0,
          followers_count: 0,
          following_count: 0,
          subscription_status: 'premium',
          email: emailOrUsername // Store email for future matching
        })

      if (insertError) {
        console.error('❌ Error creating placeholder admin user:', insertError.message)
        return false
      }

      console.log('✅ Created placeholder admin profile - user will be admin when they register')
      return true
    }

    console.error('❌ User not found and cannot create placeholder')
    return false

  } catch (error) {
    console.error('❌ Error in makeUserAdmin:', error)
    return false
  }
}

export async function removeAdminRole(email: string): Promise<boolean> {
  try {
    console.log(`🔧 Removing admin role from: ${email}`)

    // Get user ID from email
    const { data: user, error: userError } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', email)
      .single()

    if (userError || !user) {
      console.error('❌ User not found:', userError)
      return false
    }

    // Update profile role to user
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'user' })
      .eq('id', user.id)

    if (updateError) {
      console.error('❌ Error updating user role:', updateError)
      return false
    }

    console.log('✅ Admin role successfully removed')
    return true

  } catch (error) {
    console.error('❌ Error in removeAdminRole:', error)
    return false
  }
}

export async function listAdminUsers(): Promise<AdminUser[]> {
  try {
    console.log('📋 Fetching admin users...')

    const { data: admins, error } = await supabase
      .from('profiles')
      .select(`
        id,
        username,
        full_name,
        role,
        created_at
      `)
      .eq('role', 'admin')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching admin users:', error)
      return []
    }

    console.log(`✅ Found ${admins?.length || 0} admin users`)
    return admins || []

  } catch (error) {
    console.error('❌ Error in listAdminUsers:', error)
    return []
  }
}

export async function getUserRole(email: string): Promise<string | null> {
  try {
    // This requires a more complex query that joins auth.users with profiles
    // For now, we'll use the profile lookup by username or other identifier
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', email) // This would need to be adjusted based on how you identify users
      .single()

    if (error || !profile) {
      return null
    }

    return profile.role

  } catch (error) {
    console.error('❌ Error getting user role:', error)
    return null
  }
}
