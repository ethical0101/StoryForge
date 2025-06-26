import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  PenTool, 
  Sparkles, 
  Mic, 
  Video, 
  Save, 
  Eye,
  ImageIcon,
  Settings,
  Play,
  Scissors,
  DollarSign
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { VideoGenerationModal } from '../components/VideoGeneration/VideoGenerationModal'
import { generateStory, generateCoverImage } from '../lib/api/gemini'
import { generateVoice, uploadAudioToSupabase } from '../lib/api/elevenlabs'
import { createStory } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

export function CreateStory() {
  const { user, profile, isDemo, isAuthenticated } = useAuth()
  const [formData, setFormData] = useState({
    title: '',
    prompt: '',
    genre: 'fantasy',
    type: 'story' as 'story' | 'poem' | 'script' | 'blog',
    length: 'medium' as 'micro' | 'short' | 'medium' | 'long',
    isPublic: true
  })
  const [generatedContent, setGeneratedContent] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [audioUrl, setAudioUrl] = useState('')
  const [savedStoryId, setSavedStoryId] = useState<string | null>(null)
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [loading, setLoading] = useState({
    story: false,
    image: false,
    audio: false,
    saving: false
  })

  const genres = [
    'fantasy', 'sci-fi', 'mystery', 'romance', 'horror', 'adventure',
    'drama', 'comedy', 'thriller', 'historical', 'contemporary', 'children'
  ]

  const types = [
    { value: 'story', label: 'Story' },
    { value: 'poem', label: 'Poem' },
    { value: 'script', label: 'Script' },
    { value: 'blog', label: 'Blog Post' }
  ]

  const lengths = [
    { value: 'micro', label: 'Micro (50-100 words)' },
    { value: 'short', label: 'Short (200-500 words)' },
    { value: 'medium', label: 'Medium (500-1000 words)' },
    { value: 'long', label: 'Long (1000-2000 words)' }
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleGenerateStory = async () => {
    if (!formData.prompt.trim()) {
      toast.error('Please enter a prompt for your story')
      return
    }

    if (isDemo) {
      // Demo mode - show sample content
      setGeneratedContent(`In the mystical realm of ${formData.genre}, where ancient magic flows through every living thing, our story begins...

This is a sample story generated in demo mode. The actual AI-powered story generation uses Google Gemini to create unique, engaging content based on your prompt.

Your prompt: "${formData.prompt}"

In the full version, this would be a complete ${formData.length} ${formData.type} in the ${formData.genre} genre, crafted specifically for your vision.

Sign up to unlock the full power of AI storytelling!`)
      toast.success('Demo story generated! Sign up to create real AI stories.')
      return
    }

    setLoading(prev => ({ ...prev, story: true }))
    try {
      const content = await generateStory({
        genre: formData.genre,
        type: formData.type,
        length: formData.length,
        prompt: formData.prompt,
        title: formData.title,
        forVideo: false // Regular story generation
      })
      setGeneratedContent(content)
      toast.success('Story generated successfully!')
    } catch (error) {
      toast.error('Failed to generate story')
    } finally {
      setLoading(prev => ({ ...prev, story: false }))
    }
  }

  const handleGenerateVideoOptimizedStory = async () => {
    if (!formData.prompt.trim()) {
      toast.error('Please enter a prompt for your story')
      return
    }

    if (isDemo) {
      setGeneratedContent(`A brave knight discovered a magical crystal that could grant any wish. But when she touched it, she realized the greatest magic was already within her heart.`)
      toast.success('Demo video-optimized story generated!')
      return
    }

    setLoading(prev => ({ ...prev, story: true }))
    try {
      const content = await generateStory({
        genre: formData.genre,
        type: formData.type,
        length: 'micro', // Force micro for video
        prompt: formData.prompt,
        title: formData.title,
        forVideo: true // Video-optimized generation
      })
      setGeneratedContent(content)
      toast.success('Video-optimized story generated! Perfect for short videos.')
    } catch (error) {
      toast.error('Failed to generate story')
    } finally {
      setLoading(prev => ({ ...prev, story: false }))
    }
  }

  const handleGenerateImage = async () => {
    if (!formData.title.trim()) {
      toast.error('Please enter a title first')
      return
    }

    if (isDemo) {
      setCoverImage('https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=600&fit=crop&q=80')
      toast.success('Demo cover image generated!')
      return
    }

    setLoading(prev => ({ ...prev, image: true }))
    try {
      const imageUrl = await generateCoverImage({
        title: formData.title,
        genre: formData.genre
      })
      setCoverImage(imageUrl)
      toast.success('Cover image generated!')
    } catch (error) {
      toast.error('Failed to generate cover image')
    } finally {
      setLoading(prev => ({ ...prev, image: false }))
    }
  }

  const handleGenerateAudio = async () => {
    if (!generatedContent) {
      toast.error('Please generate story content first')
      return
    }

    if (isDemo) {
      setAudioUrl('demo-audio-url')
      toast.success('Demo audio generated! Sign up to create real voice narrations.')
      return
    }

    if (!isAuthenticated) {
      toast.error('Please sign in to generate audio')
      return
    }

    setLoading(prev => ({ ...prev, audio: true }))
    try {
      const audioBlob = await generateVoice({ text: generatedContent })
      
      // Create a temporary story ID for audio upload
      const tempStoryId = `temp-${Date.now()}`
      const uploadedAudioUrl = await uploadAudioToSupabase(audioBlob, tempStoryId)
      
      setAudioUrl(uploadedAudioUrl)
      toast.success('Audio generated successfully!')
    } catch (error) {
      toast.error('Failed to generate audio')
    } finally {
      setLoading(prev => ({ ...prev, audio: false }))
    }
  }

  const handleGenerateVideo = () => {
    if (!generatedContent) {
      toast.error('Please generate story content first')
      return
    }

    if (isDemo) {
      toast.error('Video generation is available in the full version. Sign up to unlock this feature!')
      return
    }

    if (!isAuthenticated || !user || !profile) {
      toast.error('Please sign in to generate videos')
      return
    }

    if (!savedStoryId) {
      toast.error('Please save your story first before generating video')
      return
    }

    setShowVideoModal(true)
  }

  const handleSaveStory = async () => {
    if (!formData.title.trim() || !generatedContent) {
      toast.error('Please provide a title and generate content first')
      return
    }

    if (isDemo) {
      toast.success('Story saved in demo mode! Sign up to save real stories.')
      setSavedStoryId('demo-story-id')
      return
    }

    if (!isAuthenticated || !user || !profile) {
      toast.error('Please sign in to save stories')
      return
    }

    setLoading(prev => ({ ...prev, saving: true }))
    try {
      const newStory = await createStory({
        title: formData.title,
        content: generatedContent,
        genre: formData.genre,
        type: formData.type,
        length: formData.length,
        is_public: formData.isPublic,
        author_id: user.id,
        author_name: profile.full_name || 'Anonymous',
        author_avatar: profile.avatar_url,
        cover_image: coverImage || null,
        audio_url: audioUrl || null,
        video_url: null
      })

      if (newStory) {
        setSavedStoryId(newStory.id)
        toast.success('Story saved successfully!')
      }
      
    } catch (error) {
      console.error('Error saving story:', error)
      toast.error('Failed to save story')
    } finally {
      setLoading(prev => ({ ...prev, saving: false }))
    }
  }

  const wordCount = generatedContent.split(/\s+/).filter(word => word.length > 0).length
  const estimatedVideoLength = Math.ceil(wordCount / 2.5) // ~2.5 words per second

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-2">
            <PenTool className="h-8 w-8 text-primary" />
            Create Your Story
            {isDemo && (
              <span className="demo-badge text-sm">
                <Play className="h-3 w-3 mr-1" />
                Demo
              </span>
            )}
          </h1>
          <p className="text-muted-foreground text-lg">
            {isDemo 
              ? 'Experience the power of AI storytelling in demo mode'
              : 'Use the power of AI to bring your imagination to life'
            }
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Story Setup */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Story Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Title</label>
                  <Input
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Enter a captivating title..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Story Prompt</label>
                  <Textarea
                    name="prompt"
                    value={formData.prompt}
                    onChange={handleInputChange}
                    placeholder="Describe your story idea, characters, or setting..."
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Genre</label>
                    <select
                      name="genre"
                      value={formData.genre}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-input bg-background rounded-md"
                    >
                      {genres.map(genre => (
                        <option key={genre} value={genre}>
                          {genre.charAt(0).toUpperCase() + genre.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Type</label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-input bg-background rounded-md"
                    >
                      {types.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Length</label>
                    <select
                      name="length"
                      value={formData.length}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-input bg-background rounded-md"
                    >
                      {lengths.map(length => (
                        <option key={length.value} value={length.value}>
                          {length.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPublic"
                    name="isPublic"
                    checked={formData.isPublic}
                    onChange={handleInputChange}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="isPublic" className="text-sm font-medium">
                    Make story public
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Button
                    onClick={handleGenerateStory}
                    variant="neon"
                    size="lg"
                    className="w-full"
                    loading={loading.story}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {isDemo ? 'Try Story Generator' : 'Generate Story'}
                  </Button>
                  
                  <Button
                    onClick={handleGenerateVideoOptimizedStory}
                    variant="outline"
                    size="lg"
                    className="w-full bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-green-200 dark:border-green-800 hover:from-green-100 hover:to-blue-100"
                    loading={loading.story}
                  >
                    <Scissors className="h-4 w-4 mr-2" />
                    💰 Video-Optimized Story
                  </Button>
                </div>
                
                {generatedContent && (
                  <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 p-3 rounded-lg border">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                      <DollarSign className="h-3 w-3" />
                      <span className="text-xs font-medium">Credit Usage Info</span>
                    </div>
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      Current story: {wordCount} words (~{estimatedVideoLength}s video)
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Enhancement Tools */}
            {generatedContent && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>AI Enhancement Tools</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Button
                      onClick={handleGenerateImage}
                      variant="outline"
                      loading={loading.image}
                      className="flex items-center justify-center gap-2 h-12"
                    >
                      <ImageIcon className="h-4 w-4" />
                      Cover Image
                    </Button>
                    <Button
                      onClick={handleGenerateAudio}
                      variant="outline"
                      loading={loading.audio}
                      className="flex items-center justify-center gap-2 h-12"
                    >
                      <Mic className="h-4 w-4" />
                      Voice Audio
                    </Button>
                    <Button
                      onClick={handleGenerateVideo}
                      variant="neon"
                      disabled={!savedStoryId}
                      className="flex items-center justify-center gap-2 h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-purple-500/25"
                    >
                      <Video className="h-4 w-4" />
                      🎬 Generate Video
                    </Button>
                    <Button
                      onClick={handleSaveStory}
                      variant="outline"
                      loading={loading.saving}
                      disabled={!generatedContent}
                      className="flex items-center justify-center gap-2 h-12"
                    >
                      <Save className="h-4 w-4" />
                      Save Story
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </motion.div>

          {/* Right Column - Preview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Story Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading.story ? (
                  <div className="flex items-center justify-center py-12">
                    <LoadingSpinner text="Generating your story..." />
                  </div>
                ) : generatedContent ? (
                  <div className="space-y-6">
                    {/* Cover Image */}
                    {coverImage && (
                      <div className="aspect-video rounded-lg overflow-hidden">
                        <img
                          src={coverImage}
                          alt="Story cover"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Title */}
                    {formData.title && (
                      <h2 className="text-2xl font-bold">{formData.title}</h2>
                    )}

                    {/* Content */}
                    <div className="prose dark:prose-invert max-w-none">
                      <div className="whitespace-pre-wrap text-sm">
                        {generatedContent}
                      </div>
                    </div>

                    {/* Story Stats */}
                    <div className="bg-muted p-3 rounded-lg text-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-muted-foreground">Words: </span>
                          <span className="font-semibold">{wordCount}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Video length: </span>
                          <span className="font-semibold">~{estimatedVideoLength}s</span>
                        </div>
                      </div>
                    </div>

                    {/* Audio Player */}
                    {audioUrl && audioUrl !== 'demo-audio-url' && (
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium mb-2">Audio Narration</h4>
                        <audio controls className="w-full">
                          <source src={audioUrl} type="audio/mpeg" />
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    )}

                    {audioUrl === 'demo-audio-url' && (
                      <div className="border rounded-lg p-4 bg-orange-50 dark:bg-orange-900/20">
                        <h4 className="font-medium mb-2">Demo Audio Narration</h4>
                        <p className="text-sm text-muted-foreground">
                          In the full version, your story would be converted to realistic voice narration using ElevenLabs AI.
                        </p>
                      </div>
                    )}

                    {/* Demo Video Promotion */}
                    {isDemo && generatedContent && (
                      <div className="border rounded-lg p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <Video className="h-4 w-4" />
                          🎬 AI Video Generation
                        </h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Transform your story into a professional AI-narrated video with optimized content for credit savings.
                        </p>
                        <Button variant="neon" size="sm" onClick={() => window.location.href = '/auth/register'}>
                          Sign Up to Unlock Video Generation
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Your generated story will appear here</p>
                    {isDemo && (
                      <p className="text-sm mt-2 text-orange-600 dark:text-orange-400">
                        Demo mode - experience AI storytelling risk-free!
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Video Generation Modal */}
        {savedStoryId && savedStoryId !== 'demo-story-id' && (
          <VideoGenerationModal
            isOpen={showVideoModal}
            onClose={() => setShowVideoModal(false)}
            story={{
              id: savedStoryId,
              title: formData.title,
              content: generatedContent
            }}
          />
        )}
      </div>
    </div>
  )
}