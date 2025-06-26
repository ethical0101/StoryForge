import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  BookOpen, 
  Search, 
  Filter, 
  Grid, 
  List, 
  Eye,
  Heart,
  Calendar,
  Edit,
  Trash2,
  Share2,
  Download,
  Play,
  Video
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { Modal } from '../components/ui/Modal'
import { useAuth } from '../contexts/AuthContext'
import { supabase, Story } from '../lib/supabase'
import { formatDate, truncateText } from '../lib/utils'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

export function Library() {
  const { user } = useAuth()
  const [stories, setStories] = useState<Story[]>([])
  const [filteredStories, setFilteredStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('all')
  const [selectedType, setSelectedType] = useState('all')
  const [sortBy, setSortBy] = useState('created_at')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; story: Story | null }>({
    isOpen: false,
    story: null
  })

  const genres = ['all', 'fantasy', 'sci-fi', 'mystery', 'romance', 'horror', 'adventure', 'drama', 'comedy', 'thriller', 'historical', 'contemporary', 'children']
  const types = ['all', 'story', 'poem', 'script', 'blog']
  const sortOptions = [
    { value: 'created_at', label: 'Date Created' },
    { value: 'updated_at', label: 'Last Modified' },
    { value: 'title', label: 'Title' },
    { value: 'views_count', label: 'Views' },
    { value: 'likes_count', label: 'Likes' }
  ]

  useEffect(() => {
    fetchStories()
  }, [user])

  useEffect(() => {
    filterAndSortStories()
  }, [stories, searchTerm, selectedGenre, selectedType, sortBy])

  async function fetchStories() {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('author_id', user.id)
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

  function filterAndSortStories() {
    let filtered = [...stories]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(story =>
        story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        story.content.toLowerCase().includes(searchTerm.toLowerCase())
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
        case 'title':
          return a.title.localeCompare(b.title)
        case 'views_count':
          return b.views_count - a.views_count
        case 'likes_count':
          return b.likes_count - a.likes_count
        case 'updated_at':
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

    setFilteredStories(filtered)
  }

  async function handleDeleteStory(storyId: string) {
    try {
      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', storyId)

      if (error) throw error

      setStories(prev => prev.filter(story => story.id !== storyId))
      toast.success('Story deleted successfully')
    } catch (error) {
      console.error('Error deleting story:', error)
      toast.error('Failed to delete story')
    } finally {
      setDeleteModal({ isOpen: false, story: null })
    }
  }

  function handleShare(story: Story) {
    const url = `${window.location.origin}/story/${story.id}`
    navigator.clipboard.writeText(url)
    toast.success('Story link copied to clipboard!')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading your library..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" />
            My Library
          </h1>
          <p className="text-muted-foreground text-lg">
            Manage and organize your creative works
          </p>
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search stories..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

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

                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-3 py-2 border border-input bg-background rounded-md"
                >
                  {types.map(type => (
                    <option key={type} value={type}>
                      {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>

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

                <div className="flex gap-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                Showing {filteredStories.length} of {stories.length} stories
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stories Grid/List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {filteredStories.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No stories found</h3>
                <p className="text-muted-foreground mb-6">
                  {stories.length === 0 
                    ? "You haven't created any stories yet. Start your creative journey!"
                    : "Try adjusting your search or filters to find what you're looking for."
                  }
                </p>
                <Link to="/create-story">
                  <Button variant="neon">Create Your First Story</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
            }>
              {filteredStories.map((story, index) => (
                <motion.div
                  key={story.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {viewMode === 'grid' ? (
                    <Card className="h-full hover:shadow-lg transition-all group">
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
                        
                        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                          <span>{formatDate(story.created_at)}</span>
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

                        <div className="flex items-center gap-2">
                          <Link to={`/story/${story.id}`} className="flex-1">
                            <Button variant="outline" size="sm" className="w-full">
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                          </Link>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleShare(story)}
                          >
                            <Share2 className="h-3 w-3" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteModal({ isOpen: true, story })}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>

                        {/* Media indicators */}
                        <div className="flex items-center gap-2 mt-2">
                          {story.audio_url && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Play className="h-3 w-3" />
                              Audio
                            </div>
                          )}
                          {story.video_url && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Video className="h-3 w-3" />
                              Video
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="hover:shadow-lg transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          {story.cover_image && (
                            <div className="w-24 h-16 rounded overflow-hidden flex-shrink-0">
                              <img
                                src={story.cover_image}
                                alt={story.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
                                {story.genre}
                              </span>
                              <span className="px-2 py-1 text-xs font-medium bg-secondary/10 text-secondary-foreground rounded-full">
                                {story.type}
                              </span>
                            </div>
                            
                            <h3 className="font-semibold mb-1 truncate">{story.title}</h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              {truncateText(story.content, 150)}
                            </p>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>{formatDate(story.created_at)}</span>
                                <div className="flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  {story.views_count}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Heart className="h-3 w-3" />
                                  {story.likes_count}
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Link to={`/story/${story.id}`}>
                                  <Button variant="outline" size="sm">
                                    <Eye className="h-3 w-3 mr-1" />
                                    View
                                  </Button>
                                </Link>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleShare(story)}
                                >
                                  <Share2 className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setDeleteModal({ isOpen: true, story })}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={deleteModal.isOpen}
          onClose={() => setDeleteModal({ isOpen: false, story: null })}
          title="Delete Story"
        >
          <div className="space-y-4">
            <p>Are you sure you want to delete "{deleteModal.story?.title}"? This action cannot be undone.</p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setDeleteModal({ isOpen: false, story: null })}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteModal.story && handleDeleteStory(deleteModal.story.id)}
              >
                Delete
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  )
}