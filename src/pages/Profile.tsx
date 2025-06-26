import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  User, 
  MapPin, 
  Calendar, 
  BookOpen, 
  Heart, 
  Users, 
  Settings,
  Edit,
  Share,
  Eye,
  Clock,
  Save,
  X,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { useAuth } from '../contexts/AuthContext'
import { supabase, Story, Profile as ProfileType } from '../lib/supabase'
import { formatDate, truncateText } from '../lib/utils'
import toast from 'react-hot-toast'

export function Profile() {
  const { username } = useParams<{ username: string }>()
  const { user, profile: currentUserProfile, updateProfile } = useAuth()
  const [profile, setProfile] = useState<ProfileType | null>(null)
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [editForm, setEditForm] = useState({
    full_name: '',
    bio: '',
    avatar_url: ''
  })
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({})
  const [stats, setStats] = useState({
    totalViews: 0,
    totalLikes: 0,
    storiesCount: 0
  })

  const isOwnProfile = currentUserProfile?.username === username

  useEffect(() => {
    if (username) {
      fetchProfile()
    }
  }, [username])

  async function fetchProfile() {
    try {
      setLoading(true)
      
      // Fetch profile by username
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single()

      if (profileError) throw profileError

      setProfile(profileData)
      setEditForm({
        full_name: profileData.full_name || '',
        bio: profileData.bio || '',
        avatar_url: profileData.avatar_url || ''
      })

      // Fetch user's public stories
      const { data: storiesData, error: storiesError } = await supabase
        .from('stories')
        .select('*')
        .eq('author_id', profileData.id)
        .eq('is_public', true)
        .order('created_at', { ascending: false })

      if (storiesError) throw storiesError

      setStories(storiesData || [])

      // Calculate stats
      const totalViews = storiesData?.reduce((sum, story) => sum + story.views_count, 0) || 0
      const totalLikes = storiesData?.reduce((sum, story) => sum + story.likes_count, 0) || 0
      
      setStats({
        totalViews,
        totalLikes,
        storiesCount: storiesData?.length || 0
      })

    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const errors: {[key: string]: string} = {}
    
    if (!editForm.full_name.trim()) {
      errors.full_name = 'Full name is required'
    } else if (editForm.full_name.trim().length < 2) {
      errors.full_name = 'Full name must be at least 2 characters'
    }
    
    if (editForm.bio && editForm.bio.length > 500) {
      errors.bio = 'Bio must be less than 500 characters'
    }
    
    if (editForm.avatar_url && editForm.avatar_url.trim()) {
      try {
        new URL(editForm.avatar_url)
      } catch {
        errors.avatar_url = 'Please enter a valid URL'
      }
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form')
      return
    }

    setIsSaving(true)
    setSaveSuccess(false)
    
    try {
      console.log('🔄 Saving profile changes...', editForm)
      
      // Prepare the update data
      const updateData = {
        full_name: editForm.full_name.trim(),
        bio: editForm.bio.trim() || null,
        avatar_url: editForm.avatar_url.trim() || null,
        updated_at: new Date().toISOString()
      }
      
      console.log('📤 Sending update to Supabase:', updateData)
      
      // Update profile directly via Supabase
      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user!.id)
        .select()
        .single()

      if (error) {
        console.error('❌ Supabase update error:', error)
        throw error
      }

      console.log('✅ Profile updated successfully:', data)
      
      // Update local profile state
      setProfile(prev => prev ? { ...prev, ...updateData } : null)
      
      // Show success state
      setSaveSuccess(true)
      toast.success('Profile updated successfully!')
      
      // Close modal after a short delay
      setTimeout(() => {
        setIsEditing(false)
        setSaveSuccess(false)
      }, 1500)
      
    } catch (error: any) {
      console.error('❌ Error updating profile:', error)
      
      if (error.message?.includes('duplicate key')) {
        toast.error('Username is already taken')
      } else if (error.message?.includes('violates check constraint')) {
        toast.error('Invalid data provided')
      } else {
        toast.error(error.message || 'Failed to update profile. Please try again.')
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success('Profile link copied to clipboard!')
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setEditForm(prev => ({ ...prev, [name]: value }))
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleCancelEdit = () => {
    // Reset form to original values
    setEditForm({
      full_name: profile?.full_name || '',
      bio: profile?.bio || '',
      avatar_url: profile?.avatar_url || ''
    })
    setFormErrors({})
    setSaveSuccess(false)
    setIsEditing(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading profile..." />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Profile not found</h2>
          <p className="text-muted-foreground">The user you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card>
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-start gap-6">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.full_name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-12 w-12 text-white" />
                    )}
                  </div>
                </div>

                {/* Profile Info */}
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                    <div>
                      <h1 className="text-3xl font-bold mb-1">{profile.full_name}</h1>
                      <p className="text-muted-foreground">@{profile.username}</p>
                    </div>
                    <div className="flex gap-2 mt-4 sm:mt-0">
                      {isOwnProfile && (
                        <Button
                          variant="outline"
                          onClick={() => setIsEditing(true)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Profile
                        </Button>
                      )}
                      <Button variant="outline" onClick={handleShare}>
                        <Share className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                    </div>
                  </div>

                  {profile.bio && (
                    <p className="text-muted-foreground mb-4">{profile.bio}</p>
                  )}

                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Joined {formatDate(profile.created_at)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {profile.followers_count} followers
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <Card>
            <CardContent className="p-6 text-center">
              <BookOpen className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.storiesCount}</p>
              <p className="text-sm text-muted-foreground">Stories</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Eye className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total Views</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Heart className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.totalLikes.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total Likes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{profile.followers_count}</p>
              <p className="text-sm text-muted-foreground">Followers</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Published Stories
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stories.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No stories yet</h3>
                  <p className="text-muted-foreground">
                    {isOwnProfile ? "Start creating your first story!" : "This user hasn't published any stories yet."}
                  </p>
                  {isOwnProfile && (
                    <Link to="/create-story" className="mt-4 inline-block">
                      <Button variant="neon">Create Story</Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {stories.map((story) => (
                    <motion.div
                      key={story.id}
                      whileHover={{ y: -2 }}
                      className="group"
                    >
                      <Link to={`/story/${story.id}`}>
                        <Card className="h-full hover:shadow-lg transition-all">
                          {story.cover_image && (
                            <div className="aspect-video rounded-t-lg overflow-hidden">
                              <img
                                src={story.cover_image}
                                alt={story.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            </div>
                          )}
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
                                {story.genre}
                              </span>
                              <span className="px-2 py-1 text-xs font-medium bg-secondary/10 text-secondary-foreground rounded-full">
                                {story.type}
                              </span>
                            </div>
                            <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">
                              {story.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-3">
                              {truncateText(story.content, 100)}
                            </p>
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDate(story.created_at)}
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  {story.views_count}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Heart className="h-3 w-3" />
                                  {story.likes_count}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Enhanced Edit Profile Modal with Wider Width */}
        <Modal
          isOpen={isEditing}
          onClose={handleCancelEdit}
          title="Edit Profile"
          className="max-w-2xl"
        >
          <div className="p-6">
            <form onSubmit={handleEditSubmit} className="space-y-6">
              {/* Success Message */}
              {saveSuccess && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
                >
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-green-800 dark:text-green-200 font-medium">
                    Profile updated successfully!
                  </span>
                </motion.div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <Input
                  name="full_name"
                  value={editForm.full_name}
                  onChange={handleInputChange}
                  placeholder="Your full name"
                  required
                  disabled={isSaving}
                  className={formErrors.full_name ? 'border-red-500' : ''}
                />
                {formErrors.full_name && (
                  <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
                    <AlertCircle className="h-3 w-3" />
                    {formErrors.full_name}
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Bio</label>
                <Textarea
                  name="bio"
                  value={editForm.bio}
                  onChange={handleInputChange}
                  placeholder="Tell us about yourself..."
                  rows={4}
                  disabled={isSaving}
                  maxLength={500}
                  className={formErrors.bio ? 'border-red-500' : ''}
                />
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-muted-foreground">
                    {editForm.bio.length}/500 characters
                  </p>
                  {formErrors.bio && (
                    <div className="flex items-center gap-1 text-red-500 text-sm">
                      <AlertCircle className="h-3 w-3" />
                      {formErrors.bio}
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Avatar URL</label>
                <Input
                  name="avatar_url"
                  value={editForm.avatar_url}
                  onChange={handleInputChange}
                  placeholder="https://example.com/avatar.jpg"
                  type="url"
                  disabled={isSaving}
                  className={formErrors.avatar_url ? 'border-red-500' : ''}
                />
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-muted-foreground">
                    Enter a URL to your profile picture
                  </p>
                  {formErrors.avatar_url && (
                    <div className="flex items-center gap-1 text-red-500 text-sm">
                      <AlertCircle className="h-3 w-3" />
                      {formErrors.avatar_url}
                    </div>
                  )}
                </div>
              </div>

              {/* Enhanced Preview */}
              {(editForm.full_name || editForm.bio || editForm.avatar_url) && (
                <div className="border rounded-lg p-4 bg-muted/50">
                  <h4 className="font-medium mb-3">Preview</h4>
                  <div className="flex items-start gap-3">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      {editForm.avatar_url ? (
                        <img
                          src={editForm.avatar_url}
                          alt="Preview"
                          className="w-full h-full rounded-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      ) : (
                        <User className="h-8 w-8 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-semibold truncate text-lg">
                        {editForm.full_name || 'Your Name'}
                      </h5>
                      <p className="text-sm text-muted-foreground">@{profile.username}</p>
                      {editForm.bio && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                          {editForm.bio}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex gap-3 pt-4 border-t">
                <Button 
                  type="submit" 
                  variant="neon" 
                  className="flex-1"
                  disabled={isSaving || !editForm.full_name.trim() || saveSuccess}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : saveSuccess ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Saved!
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      </div>
    </div>
  )
}