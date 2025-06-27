#!/usr/bin/env node

/**
 * Development utility to make a user an admin
 * Usage: node scripts/make-admin.js
 */

const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_ANON_KEY)')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function makeUserAdmin(email) {
  try {
    console.log(`🔧 Making user admin: ${email}`)

    // First, check if user exists in profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, full_name, role')
      .eq('username', email.split('@')[0])
      .single()

    if (profileError) {
      console.error('❌ User not found in profiles table:', profileError.message)
      console.log('💡 The user may need to register first.')
      return false
    }

    if (profile.role === 'admin') {
      console.log('✅ User is already an admin!')
      return true
    }

    console.log('✅ Found user:', profile.username, profile.full_name)

    // Update profile role to admin
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', profile.id)

    if (updateError) {
      console.error('❌ Error updating user role:', updateError.message)
      return false
    }

    console.log('✅ User successfully made admin')

    // Verify the update
    const { data: updatedProfile, error: verifyError } = await supabase
      .from('profiles')
      .select('role, username, full_name')
      .eq('id', profile.id)
      .single()

    if (verifyError) {
      console.error('❌ Error verifying update:', verifyError.message)
    } else {
      console.log('✅ Verification - User role:', updatedProfile.role)
      console.log('✅ User details:', updatedProfile.username, updatedProfile.full_name)
    }

    return true

  } catch (error) {
    console.error('❌ Error in makeUserAdmin:', error.message)
    return false
  }
}

// Run the script
const targetEmail = 'kommidruthendra2005@gmail.com'
makeUserAdmin(targetEmail)
  .then(success => {
    if (success) {
      console.log(`🎉 Successfully promoted ${targetEmail} to admin!`)
    } else {
      console.error(`💥 Failed to promote ${targetEmail} to admin`)
    }
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  })
