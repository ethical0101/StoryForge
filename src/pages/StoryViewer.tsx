import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  Heart, 
  Bookmark, 
  Share2, 
  Play, 
  Pause,
  Volume2,
  Eye,
  Calendar,
  User
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { supabase, Story } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { formatDate, estimateReadingTime } from '../lib/utils'
import toast from 'react-hot-toast'

export function StoryViewer() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [story, setStory] = useState<Story | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLiked, setIsLiked] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (id) {
      fetchStory(id)
      checkInteractions(id)
    }
  }, [id, user])

  async function fetchStory(storyId: string) {
    try {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('id', storyId)
        .single()

      if (error) throw error

      setStory(data)
      
      // Increment view count
      await supabase
        .from('stories')
        .update({ views_count: data.views_count + 1 })
        .eq('id', storyId)
    } catch (error) {
      console.error('Error fetching story:', error)
      toast.error('Story not found')
      navigate('/explore')
    } finally {
      setLoading(false)
    }
  }

  async function checkInteractions(storyId: string) {
    if (!user) return

    try {
      const { data } = await supabase
        .from('story_interactions')
        .select('type')
        .eq('story_id', storyId)
        .eq('user_id', user.id)

      if (data) {
        setIsLiked(data.some(interaction => interaction.type === 'like'))
        setIsBookmarked(data.some(interaction => interaction.type === 'bookmark'))
      }
    } catch (error) {
      console.error('Error checking interactions:', error)
    }
  }

  async function handleLike() {
    if (!user || !story) return

    try {
      if (isLiked) {
        await supabase
          .from('story_interactions')
          .delete()
          .eq('story_id', story.id)
          .eq('user_id', user.id)
          .eq('type', 'like')

        await supabase
          .from('stories')
          .update({ likes_count: story.likes_count - 1 })
          .eq('id', story.id)

        setStory(prev => prev ? { ...prev, likes_count: prev.likes_count - 1 } : null)
      } else {
        await supabase
          .from('story_interactions')
          .insert([{
            story_id: story.id,
            user_id: user.id,
            type: 'like'
          }])

        await supabase
          .from('stories')
          .update({ likes_count: story.likes_count + 1 })
          .eq('id', story.id)

        setStory(prev => prev ? { ...prev, likes_count: prev.likes_count + 1 } : null)
      }

      setIsLiked(!isLiked)
    } catch (error) {
      console.error('Error toggling like:', error)
      toast.error('Failed to update like')
    }
  }

  async function handleBookmark() {
    if (!user || !story) return

    try {
      if (isBookmarked) {
        await supabase
          .from('story_interactions')
          .delete()
          .eq('story_id', story.id)
          .eq('user_id', user.id)
          .eq('type', 'bookmark')
      } else {
        await supabase
          .from('story_interactions')
          .insert([{
            story_id: story.id,
            user_id: user.id,
            type: 'bookmark'
          }])
      }

      setIsBookmarked(!isBookmarked)
      toast.success(isBookmarked ? 'Removed from bookmarks' : 'Added to bookmarks')
    } catch (error) {
      console.error('Error toggling bookmark:', error)
      toast.error('Failed to update bookmark')
    }
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({
        title: story?.title,
        text: `Check out this story: ${story?.title}`,
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied to clipboard!')
    }
  }

  function toggleAudio() {
    if (!story?.audio_url) return

    if (!audioElement) {
      const audio = new Audio(story.audio_url)
      audio.onended = () => setIsPlaying(false)
      setAudioElement(audio)
      audio.play()
      setIsPlaying(true)
    } else {
      if (isPlaying) {
        audioElement.pause()
        setIsPlaying(false)
      } else {
        audioElement.play()
        setIsPlaying(true)
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading story..." />
      </div>
    )
  }

  if (!story) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Story not found</h1>
          <Button onClick={() => navigate('/explore')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Explore
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="px-3 py-1 text-sm font-medium bg-primary/10 text-primary rounded-full">
              {story.genre}
            </span>
            <span className="px-3 py-1 text-sm font-medium bg-secondary/10 text-secondary-foreground rounded-full">
              {story.type}
            </span>
            <span className="px-3 py-1 text-sm font-medium bg-accent/10 text-accent-foreground rounded-full">
              {story.length}
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold mb-4">{story.title}</h1>

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {story.author_name}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(story.created_at)}
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {story.views_count} views
              </div>
              <span>{estimateReadingTime(story.content)} min read</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                className={isLiked ? 'text-red-500' : ''}
              >
                <Heart className={`h-4 w-4 mr-1 ${isLiked ? 'fill-current' : ''}`} />
                {story.likes_count}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBookmark}
                className={isBookmarked ? 'text-blue-500' : ''}
              >
                <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Cover Image */}
        {story.cover_image && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <div className="aspect-video rounded-lg overflow-hidden">
              <img
                src={story.cover_image}
                alt={story.title}
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>
        )}

        {/* Audio Player */}
        {story.audio_url && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Volume2 className="h-5 w-5" />
                  Audio Narration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleAudio}
                  >
                    {isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {isPlaying ? 'Playing...' : 'Click to play audio narration'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Video Player */}
        {story.video_url && story.video_url.startsWith('tavus:') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <Card>
              <CardHeader>
                <CardTitle>AI Video Narration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">
                    Video ID: {story.video_url.replace('tavus:', '')}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Video processing may take a few minutes
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Story Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardContent className="p-8">
              <div className="prose dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap text-lg leading-relaxed">
                  {story.content}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}