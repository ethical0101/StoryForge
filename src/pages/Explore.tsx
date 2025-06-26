import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Search, 
  Filter, 
  TrendingUp, 
  Clock, 
  Heart,
  Eye,
  Bookmark,
  MessageCircle,
  Share2,
  User,
  Sparkles
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { Modal } from '../components/ui/Modal'
import { useAuth } from '../contexts/AuthContext'
import { supabase, Story } from '../lib/supabase'
import { formatDate, truncateText } from '../lib/utils'
import toast from 'react-hot-toast'

export function Explore() {
  const { user } = useAuth()
  const [stories, setStories] = useState<Story[]>([])
  const [filteredStories, setFilteredStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('all')
  const [selectedType, setSelectedType] = useState('all')
  const [sortBy, setSortBy] = useState('created_at')
  const [selectedStory, setSelectedStory] = useState<Story | null>(null)
  const [showStoryModal, setShowStoryModal] = useState(false)
  const [likedStories, setLikedStories] = useState<Set<string>>(new Set())
  const [bookmarkedStories, setBookmarkedStories] = useState<Set<string>>(new Set())

  const genres = [
    'all', 'fantasy', 'sci-fi', 'mystery', 'romance', 'horror', 'adventure',
    'drama', 'comedy', 'thriller', 'historical', 'contemporary', 'children'
  ]

  const types = [
    { value: 'all', label: 'All Types' },
    { value: 'story', label: 'Stories' },
    { value: 'poem', label: 'Poems' },
    { value: 'script', label: 'Scripts' },
    { value: 'blog', label: 'Blog Posts' }
  ]

  const sortOptions = [
    { value: 'created_at', label: 'Latest' },
    { value: 'views_count', label: 'Most Viewed' },
    { value: 'likes_count', label: 'Most Liked' },
    { value: 'title', label: 'Alphabetical' }
  ]

  useEffect(() => {
    fetchPublicStories()
    if (user) {
      fetchUserInteractions()
    }
  }, [user])

  useEffect(() => {
    filterAndSortStories()
  }, [stories, searchTerm, selectedGenre, selectedType, sortBy])

  async function fetchPublicStories() {
    try {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      setStories(data || [])
    } catch (error) {
      console.error('Error fetching stories:', error)
      toast.error('Failed to load stories')
    } finally {
      setLoading(false)
    }
  }

  async function fetchUserInteractions() {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('story_interactions')
        .select('story_id, type')
        .eq('user_id', user.id)

      if (error) throw error

      const liked = new Set<string>()
      const bookmarked = new Set<string>()

      data?.forEach(interaction => {
        if (interaction.type === 'like') {
          liked.add(interaction.story_id)
        } else if (interaction.type === 'bookmark') {
          bookmarked.add(interaction.story_id)
        }
      })

      setLikedStories(liked)
      setBookmarkedStories(bookmarked)
    } catch (error) {
      console.error('Error fetching user interactions:', error)
    }
  }

  function filterAndSortStories() {
    let filtered = [...stories]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(story =>
        story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        story.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        story.author_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Genre filter
    if (selectedGenre !== 'all') {
      filtered = filtered.filter(story => story.genre === selectedGenre)
    }

    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(story => story.type === selectedType)
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'views_count':
          return b.views_count - a.views_count
        case 'likes_count':
          return b.likes_count - a.likes_count
        case 'title':
          return a.title.localeCompare(b.title)
        case 'created_at':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

    setFilteredStories(filtered)
  }

  async function handleLikeStory(storyId: string) {
    if (!user) {
      toast.error('Please sign in to like stories')
      return
    }

    try {
      const isLiked = likedStories.has(storyId)
      
      if (isLiked) {
        // Unlike - find and delete the interaction
        const { data: existingLike } = await supabase
          .from('story_interactions')
          .select('id')
          .eq('story_id', storyId)
          .eq('user_id', user.id)
          .eq('type', 'like')
          .maybeSingle()

        if (existingLike) {
          await supabase
            .from('story_interactions')
            .delete()
            .eq('id', existingLike.id)

          // Update story likes count
          const story = stories.find(s => s.id === storyId)
          if (story) {
            await supabase
              .from('stories')
              .update({ likes_count: Math.max(0, story.likes_count - 1) })
              .eq('id', storyId)
          }

          setLikedStories(prev => {
            const newSet = new Set(prev)
            newSet.delete(storyId)
            return newSet
          })

          setStories(prev => prev.map(story => 
            story.id === storyId 
              ? { ...story, likes_count: Math.max(0, story.likes_count - 1) }
              : story
          ))

          toast.success('Story unliked')
        }
      } else {
        // Like
        await supabase
          .from('story_interactions')
          .insert([{
            story_id: storyId,
            user_id: user.id,
            type: 'like'
          }])

        // Update story likes count
        const story = stories.find(s => s.id === storyId)
        if (story) {
          await supabase
            .from('stories')
            .update({ likes_count: story.likes_count + 1 })
            .eq('id', storyId)
        }

        setLikedStories(prev => new Set([...prev, storyId]))

        setStories(prev => prev.map(story => 
          story.id === storyId 
            ? { ...story, likes_count: story.likes_count + 1 }
            : story
        ))

        toast.success('Story liked!')
      }
    } catch (error) {
      console.error('Error liking story:', error)
      toast.error('Failed to like story')
    }
  }

  async function handleBookmarkStory(storyId: string) {
    if (!user) {
      toast.error('Please sign in to bookmark stories')
      return
    }

    try {
      const isBookmarked = bookmarkedStories.has(storyId)

      if (isBookmarked) {
        // Remove bookmark
        const { data: existingBookmark } = await supabase
          .from('story_interactions')
          .select('id')
          .eq('story_id', storyId)
          .eq('user_id', user.id)
          .eq('type', 'bookmark')
          .maybeSingle()

        if (existingBookmark) {
          await supabase
            .from('story_interactions')
            .delete()
            .eq('id', existingBookmark.id)

          setBookmarkedStories(prev => {
            const newSet = new Set(prev)
            newSet.delete(storyId)
            return newSet
          })

          toast.success('Bookmark removed')
        }
      } else {
        // Add bookmark
        await supabase
          .from('story_interactions')
          .insert([{
            story_id: storyId,
            user_id: user.id,
            type: 'bookmark'
          }])

        setBookmarkedStories(prev => new Set([...prev, storyId]))
        toast.success('Story bookmarked!')
      }
    } catch (error) {
      console.error('Error bookmarking story:', error)
      toast.error('Failed to bookmark story')
    }
  }

  function handleShareStory(story: Story) {
    const url = `${window.location.origin}/story/${story.id}`
    navigator.clipboard.writeText(url)
    toast.success('Story link copied to clipboard!')
  }

  function openStoryModal(story: Story) {
    setSelectedStory(story)
    setShowStoryModal(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading stories..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-primary" />
            Explore Stories
          </h1>
          <p className="text-muted-foreground text-lg">
            Discover amazing stories from creators around the world
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search stories..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Genre Filter */}
                <select
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                  className="px-3 py-2 border border-input bg-background rounded-md"
                >
                  {genres.map(genre => (
                    <option key={genre} value={genre}>
                      {genre === 'all' ? 'All Genres' : genre.charAt(0).toUpperCase() + genre.slice(1)}
                    </option>
                  ))}
                </select>

                {/* Type Filter */}
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-3 py-2 border border-input bg-background rounded-md"
                >
                  {types.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>

                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-input bg-background rounded-md"
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stories Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="scroll-container"
        >
          {filteredStories.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No stories found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or filters to find more stories.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStories.map((story, index) => {
                const isLiked = likedStories.has(story.id)
                const isBookmarked = bookmarkedStories.has(story.id)
                
                return (
                  <motion.div
                    key={story.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -2 }}
                    className="group"
                  >
                    <Card className="h-full hover:shadow-lg transition-all cursor-pointer">
                      {story.cover_image && (
                        <div 
                          className="aspect-video rounded-t-lg overflow-hidden"
                          onClick={() => openStoryModal(story)}
                        >
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
                          {story.audio_url && (
                            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
                              Audio
                            </span>
                          )}
                          {story.video_url && (
                            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                              Video
                            </span>
                          )}
                        </div>
                        
                        <h3 
                          className="font-semibold mb-2 group-hover:text-primary transition-colors cursor-pointer"
                          onClick={() => openStoryModal(story)}
                        >
                          {story.title}
                        </h3>
                        
                        <p className="text-sm text-muted-foreground mb-3">
                          {truncateText(story.content, 100)}
                        </p>

                        {/* Author */}
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-6 h-6 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                            <User className="h-3 w-3 text-white" />
                          </div>
                          <span className="text-sm font-medium">{story.author_name}</span>
                        </div>

                        {/* Stats and Actions */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {story.views_count}
                            </div>
                            <div className="flex items-center gap-1">
                              <Heart className="h-3 w-3" />
                              {story.likes_count}
                            </div>
                            <span>{formatDate(story.created_at)}</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 mt-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleLikeStory(story.id)}
                            className={`flex-1 like-button ${isLiked ? 'liked' : ''}`}
                          >
                            <Heart className={`h-4 w-4 mr-1 heart-icon ${isLiked ? 'fill-current' : ''}`} />
                            Like
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleBookmarkStory(story.id)}
                            className={`flex-1 bookmark-button ${isBookmarked ? 'bookmarked' : ''}`}
                          >
                            <Bookmark className={`h-4 w-4 mr-1 bookmark-icon ${isBookmarked ? 'fill-current' : ''}`} />
                            Save
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleShareStory(story)}
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>

        {/* Story Modal */}
        <Modal
          isOpen={showStoryModal}
          onClose={() => setShowStoryModal(false)}
          title={selectedStory?.title}
          className="max-w-4xl"
        >
          {selectedStory && (
            <div className="space-y-6 modal-content scroll-container">
              {/* Story metadata */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
                  {selectedStory.genre}
                </span>
                <span className="px-2 py-1 text-xs font-medium bg-secondary/10 text-secondary-foreground rounded-full">
                  {selectedStory.type}
                </span>
                <span className="text-sm text-muted-foreground">
                  by {selectedStory.author_name}
                </span>
                <span className="text-sm text-muted-foreground">
                  {formatDate(selectedStory.created_at)}
                </span>
              </div>

              {/* Cover image */}
              {selectedStory.cover_image && (
                <div className="aspect-video rounded-lg overflow-hidden">
                  <img
                    src={selectedStory.cover_image}
                    alt={selectedStory.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Content */}
              <div className="prose dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap">
                  {selectedStory.content}
                </div>
              </div>

              {/* Audio player */}
              {selectedStory.audio_url && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Audio Narration</h4>
                  <audio controls className="w-full">
                    <source src={selectedStory.audio_url} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}

              {/* Video */}
              {selectedStory.video_url && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Video Narration</h4>
                  <p className="text-sm text-muted-foreground">
                    Video content available
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-4 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => handleLikeStory(selectedStory.id)}
                  className={`like-button ${likedStories.has(selectedStory.id) ? 'liked' : ''}`}
                >
                  <Heart className={`h-4 w-4 mr-2 heart-icon ${likedStories.has(selectedStory.id) ? 'fill-current' : ''}`} />
                  Like ({selectedStory.likes_count})
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleBookmarkStory(selectedStory.id)}
                  className={`bookmark-button ${bookmarkedStories.has(selectedStory.id) ? 'bookmarked' : ''}`}
                >
                  <Bookmark className={`h-4 w-4 mr-2 bookmark-icon ${bookmarkedStories.has(selectedStory.id) ? 'fill-current' : ''}`} />
                  Bookmark
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleShareStory(selectedStory)}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  )
}