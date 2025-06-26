import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Video, 
  Play, 
  Download, 
  Eye, 
  Calendar,
  Search,
  Filter,
  Grid,
  List,
  Trash2,
  Share2,
  Zap,
  Clock,
  Plus,
  RefreshCw
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { Modal } from '../components/ui/Modal'
import { VideoGenerationModal } from '../components/VideoGeneration/VideoGenerationModal'
import { useAuth } from '../contexts/AuthContext'
import { getVideoLibrary, checkVideoStatus, VideoProgressTracker } from '../lib/api/video'
import { formatDate, truncateText } from '../lib/utils'
import toast from 'react-hot-toast'

interface VideoItem {
  id: string
  title: string
  content: string
  video_url: string
  audio_url: string
  cover_image: string
  created_at: string
  genre: string
  type: string
  videoId: string
  hasVideo: boolean
  hasAudio: boolean
}

export function VideoLibrary() {
  const { user, profile } = useAuth()
  const [stories, setStories] = useState<VideoItem[]>([])
  const [filteredStories, setFilteredStories] = useState<VideoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null)
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [showGenerationModal, setShowGenerationModal] = useState(false)
  const [selectedStoryForGeneration, setSelectedStoryForGeneration] = useState<VideoItem | null>(null)
  const [videoStatuses, setVideoStatuses] = useState<{[key: string]: { status: string, progress: number }}>({})
  const [progressTracker] = useState(() => new VideoProgressTracker())

  const genres = ['all', 'fantasy', 'sci-fi', 'mystery', 'romance', 'horror', 'adventure', 'drama', 'comedy', 'thriller']

  useEffect(() => {
    if (user) {
      fetchVideoLibrary()
    }
    
    return () => {
      progressTracker.stopTracking()
    }
  }, [user])

  useEffect(() => {
    filterStories()
  }, [stories, searchTerm, selectedGenre])

  async function fetchVideoLibrary() {
    if (!user) return

    try {
      console.log('📚 Fetching video library for user:', user.id)
      const videoData = await getVideoLibrary(user.id)
      console.log('✅ Fetched video data:', videoData.length, 'stories')
      
      setStories(videoData)
      
      // Check status of processing videos
      const processingVideos = videoData.filter(v => v.videoId && !v.hasVideo)
      console.log('🔄 Found', processingVideos.length, 'processing videos')
      
      for (const story of processingVideos) {
        if (story.videoId) {
          console.log('🎯 Tracking progress for story:', story.id, 'video:', story.videoId)
          trackVideoProgress(story.videoId, story.id)
        }
      }
    } catch (error) {
      console.error('❌ Error fetching video library:', error)
      toast.error('Failed to load video library')
    } finally {
      setLoading(false)
    }
  }

  async function refreshVideoLibrary() {
    setRefreshing(true)
    try {
      await fetchVideoLibrary()
      toast.success('Video library refreshed!')
    } catch (error) {
      toast.error('Failed to refresh library')
    } finally {
      setRefreshing(false)
    }
  }

  function trackVideoProgress(videoId: string, storyId: string) {
    console.log('🎯 Starting progress tracking for video:', videoId, 'story:', storyId)
    
    progressTracker.startTracking(videoId, (progress) => {
      console.log('📊 Progress update for story:', storyId, 'video:', videoId, progress)
      
      setVideoStatuses(prev => ({
        ...prev,
        [videoId]: { status: progress.status, progress: progress.progress }
      }))
      
      if (progress.status === 'completed' && progress.videoUrl) {
        console.log('✅ Video completed for story:', storyId, 'URL:', progress.videoUrl)
        
        // Update the story in our local state
        setStories(prev => prev.map(story => 
          story.id === storyId 
            ? { ...story, video_url: progress.videoUrl!, hasVideo: true }
            : story
        ))
        toast.success(`Video generation completed for "${stories.find(s => s.id === storyId)?.title}"!`)
      } else if (progress.status === 'failed') {
        console.error('❌ Video failed for story:', storyId)
        toast.error(`Video generation failed for "${stories.find(s => s.id === storyId)?.title}"`)
      }
    }, storyId) // Pass story ID for proper tracking
  }

  function filterStories() {
    let filtered = [...stories]

    if (searchTerm) {
      filtered = filtered.filter(story =>
        story.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedGenre !== 'all') {
      filtered = filtered.filter(story => story.genre === selectedGenre)
    }

    setFilteredStories(filtered)
  }

  function handleVideoClick(story: VideoItem) {
    console.log('🎬 Playing video for story:', story.id, 'URL:', story.video_url)
    setSelectedVideo(story)
    setShowVideoModal(true)
  }

  function handleGenerateVideo(story: VideoItem) {
    console.log('🎬 Generating video for story:', story.id)
    setSelectedStoryForGeneration(story)
    setShowGenerationModal(true)
  }

  function handleDownload(story: VideoItem) {
    if (story.video_url?.startsWith('http')) {
      const link = document.createElement('a')
      link.href = story.video_url
      link.download = `${story.title}.mp4`
      link.click()
      console.log('📥 Downloading video for story:', story.id, 'URL:', story.video_url)
    } else {
      toast.error('Video is still processing')
    }
  }

  function handleShare(story: VideoItem) {
    const url = `${window.location.origin}/story/${story.id}`
    navigator.clipboard.writeText(url)
    toast.success('Story link copied to clipboard!')
  }

  function onVideoGenerated() {
    console.log('🎉 Video generation completed, refreshing library...')
    fetchVideoLibrary()
    setShowGenerationModal(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading video library..." />
      </div>
    )
  }

  const storiesWithVideos = filteredStories.filter(s => s.hasVideo)
  const storiesWithoutVideos = filteredStories.filter(s => !s.hasVideo)

  console.log('📊 Library stats:', {
    total: filteredStories.length,
    withVideos: storiesWithVideos.length,
    withoutVideos: storiesWithoutVideos.length,
    processing: Object.keys(videoStatuses).length
  })

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-2">
                <Video className="h-8 w-8 text-primary" />
                🎞️ My Videos
              </h1>
              <p className="text-muted-foreground text-lg">
                Your AI-generated video library and story collection
              </p>
            </div>
            <Button
              variant="outline"
              onClick={refreshVideoLibrary}
              disabled={refreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

                <div className="text-sm text-muted-foreground flex items-center">
                  {filteredStories.length} stories • {storiesWithVideos.length} videos
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Generated Videos Section */}
        {storiesWithVideos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Play className="h-6 w-6 text-green-600" />
              Generated Videos ({storiesWithVideos.length})
            </h2>
            
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
            }>
              {storiesWithVideos.map((story, index) => (
                <motion.div
                  key={`video-${story.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {viewMode === 'grid' ? (
                    <Card className="h-full hover:shadow-lg transition-all group cursor-pointer">
                      <div 
                        className="aspect-video rounded-t-lg overflow-hidden bg-muted relative"
                        onClick={() => handleVideoClick(story)}
                      >
                        {story.cover_image ? (
                          <img
                            src={story.cover_image}
                            alt={story.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Video className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                        
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                            <Play className="h-6 w-6 text-black ml-1" />
                          </div>
                        </div>

                        <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs">
                          ✅ Video Ready
                        </div>
                      </div>
                      
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
                        
                        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(story.created_at)}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleVideoClick(story)}
                            className="flex-1"
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Play Video
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownload(story)}
                            disabled={!story.video_url?.startsWith('http')}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleShare(story)}
                          >
                            <Share2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="hover:shadow-lg transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div 
                            className="w-32 h-20 rounded overflow-hidden flex-shrink-0 bg-muted cursor-pointer relative group"
                            onClick={() => handleVideoClick(story)}
                          >
                            {story.cover_image ? (
                              <img
                                src={story.cover_image}
                                alt={story.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Video className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                            
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Play className="h-4 w-4 text-white" />
                            </div>

                            <div className="absolute top-1 left-1 bg-green-500 text-white px-1 py-0.5 rounded text-xs">
                              ✅
                            </div>
                          </div>
                          
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
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>{formatDate(story.created_at)}</span>
                                <span className="text-green-600">Video Ready</span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleVideoClick(story)}
                                >
                                  <Play className="h-3 w-3 mr-1" />
                                  Play
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDownload(story)}
                                  disabled={!story.video_url?.startsWith('http')}
                                >
                                  <Download className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleShare(story)}
                                >
                                  <Share2 className="h-3 w-3" />
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
          </motion.div>
        )}

        {/* Stories Without Videos Section */}
        {storiesWithoutVideos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Zap className="h-6 w-6 text-orange-600" />
              Stories Ready for Video Generation ({storiesWithoutVideos.length})
            </h2>
            
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
            }>
              {storiesWithoutVideos.map((story, index) => {
                const isProcessing = story.videoId && videoStatuses[story.videoId]
                const processingProgress = isProcessing ? videoStatuses[story.videoId].progress : 0
                
                return (
                  <motion.div
                    key={`story-${story.id}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    {viewMode === 'grid' ? (
                      <Card className={`h-full hover:shadow-lg transition-all group ${
                        isProcessing 
                          ? 'border-orange-300 dark:border-orange-700 bg-orange-50/50 dark:bg-orange-900/10' 
                          : 'border-dashed border-2 border-orange-200 dark:border-orange-800'
                      }`}>
                        <div className="aspect-video rounded-t-lg overflow-hidden bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 relative flex items-center justify-center">
                          {story.cover_image ? (
                            <>
                              <img
                                src={story.cover_image}
                                alt={story.title}
                                className="w-full h-full object-cover opacity-50"
                              />
                              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-yellow-500/20" />
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Video className="h-12 w-12 text-orange-400" />
                            </div>
                          )}
                          
                          <div className="absolute inset-0 flex items-center justify-center">
                            {isProcessing ? (
                              <div className="text-center">
                                <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mb-2 mx-auto">
                                  <Clock className="h-8 w-8 text-white animate-pulse" />
                                </div>
                                <p className="text-sm font-medium text-orange-700 dark:text-orange-300">
                                  Processing {processingProgress}%
                                </p>
                              </div>
                            ) : (
                              <div className="text-center">
                                <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mb-2 mx-auto">
                                  <Plus className="h-8 w-8 text-white" />
                                </div>
                                <p className="text-sm font-medium text-orange-700 dark:text-orange-300">
                                  Generate Video
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
                              {story.genre}
                            </span>
                            <span className="px-2 py-1 text-xs font-medium bg-secondary/10 text-secondary-foreground rounded-full">
                              {story.type}
                            </span>
                            {story.hasAudio && (
                              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
                                Audio Ready
                              </span>
                            )}
                            {isProcessing && (
                              <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 rounded-full">
                                Processing
                              </span>
                            )}
                          </div>
                          
                          <h3 className="font-semibold mb-2">
                            {story.title}
                          </h3>
                          
                          <p className="text-sm text-muted-foreground mb-3">
                            {truncateText(story.content, 80)}
                          </p>
                          
                          <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(story.created_at)}
                            </div>
                          </div>

                          {isProcessing ? (
                            <div className="space-y-2">
                              <div className="w-full bg-muted rounded-full h-2">
                                <div 
                                  className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                                  style={{ width: `${processingProgress}%` }}
                                />
                              </div>
                              <p className="text-xs text-center text-muted-foreground">
                                Video processing... {processingProgress}%
                              </p>
                            </div>
                          ) : (
                            <Button
                              variant="neon"
                              size="sm"
                              onClick={() => handleGenerateVideo(story)}
                              className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600"
                            >
                              <Video className="h-3 w-3 mr-1" />
                              🎬 Generate Video
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className={`hover:shadow-lg transition-all ${
                        isProcessing 
                          ? 'border-orange-300 dark:border-orange-700 bg-orange-50/50 dark:bg-orange-900/10' 
                          : 'border-dashed border-2 border-orange-200 dark:border-orange-800'
                      }`}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div className="w-32 h-20 rounded overflow-hidden flex-shrink-0 bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 flex items-center justify-center">
                              {isProcessing ? (
                                <Clock className="h-8 w-8 text-orange-500 animate-pulse" />
                              ) : (
                                <Plus className="h-8 w-8 text-orange-500" />
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
                                  {story.genre}
                                </span>
                                <span className="px-2 py-1 text-xs font-medium bg-secondary/10 text-secondary-foreground rounded-full">
                                  {story.type}
                                </span>
                                {story.hasAudio && (
                                  <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
                                    Audio Ready
                                  </span>
                                )}
                                {isProcessing && (
                                  <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 rounded-full">
                                    Processing
                                  </span>
                                )}
                              </div>
                              
                              <h3 className="font-semibold mb-1 truncate">{story.title}</h3>
                              <p className="text-sm text-muted-foreground mb-2">
                                {truncateText(story.content, 100)}
                              </p>
                              
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span>{formatDate(story.created_at)}</span>
                                  <span className={isProcessing ? "text-orange-600" : "text-orange-600"}>
                                    {isProcessing ? `Processing ${processingProgress}%` : 'Ready for Video'}
                                  </span>
                                </div>
                                
                                {isProcessing ? (
                                  <div className="w-20 bg-muted rounded-full h-2">
                                    <div 
                                      className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                                      style={{ width: `${processingProgress}%` }}
                                    />
                                  </div>
                                ) : (
                                  <Button
                                    variant="neon"
                                    size="sm"
                                    onClick={() => handleGenerateVideo(story)}
                                    className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600"
                                  >
                                    <Video className="h-3 w-3 mr-1" />
                                    🎬 Generate
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {filteredStories.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Video className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No stories found</h3>
              <p className="text-muted-foreground mb-6">
                Create your first story to start generating videos!
              </p>
              <Button variant="neon" onClick={() => window.location.href = '/create-story'}>
                Create Story
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Video Player Modal */}
        <Modal
          isOpen={showVideoModal}
          onClose={() => setShowVideoModal(false)}
          title={selectedVideo?.title}
          className="max-w-4xl"
        >
          {selectedVideo && (
            <div className="space-y-6">
              <div className="text-sm text-muted-foreground mb-4">
                Story ID: {selectedVideo.id} • Video URL: {selectedVideo.video_url}
              </div>
              
              {selectedVideo.video_url?.startsWith('http') ? (
                <div className="aspect-video rounded-lg overflow-hidden">
                  <video controls className="w-full h-full" key={selectedVideo.video_url}>
                    <source src={selectedVideo.video_url} type="video/mp4" />
                    Your browser does not support the video element.
                  </video>
                </div>
              ) : (
                <div className="aspect-video rounded-lg bg-muted flex items-center justify-center">
                  <div className="text-center">
                    <Video className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Video is still processing...</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Video URL: {selectedVideo.video_url}
                    </p>
                  </div>
                </div>
              )}

              {selectedVideo.audio_url && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Audio Narration</h4>
                  <audio controls className="w-full">
                    <source src={selectedVideo.audio_url} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}

              <div className="flex gap-4">
                {selectedVideo.video_url?.startsWith('http') && (
                  <Button
                    variant="outline"
                    onClick={() => handleDownload(selectedVideo)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Video
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => handleShare(selectedVideo)}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Video Generation Modal */}
        {selectedStoryForGeneration && (
          <VideoGenerationModal
            isOpen={showGenerationModal}
            onClose={() => setShowGenerationModal(false)}
            story={{
              id: selectedStoryForGeneration.id,
              title: selectedStoryForGeneration.title,
              content: selectedStoryForGeneration.content
            }}
            onVideoGenerated={onVideoGenerated}
          />
        )}
      </div>
    </div>
  )
}