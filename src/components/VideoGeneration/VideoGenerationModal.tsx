import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Video, 
  Mic, 
  Settings, 
  Play, 
  Download, 
  X, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Clock,
  Zap,
  Sparkles,
  Scissors,
  DollarSign,
  Palette,
  User,
  Image,
  Globe,
  Volume2,
  Wand2,
  AlertTriangle,
  Shield,
  Info
} from 'lucide-react'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { generateStoryVideo, VideoProgressTracker, VideoProgress } from '../../lib/api/video'
import { getVoices, SUPPORTED_LANGUAGES, detectLanguage, generateAutoBanner } from '../../lib/api/elevenlabs'
import { getPersonas } from '../../lib/api/tavus'
import toast from 'react-hot-toast'

interface VideoGenerationModalProps {
  isOpen: boolean
  onClose: () => void
  story: {
    id: string
    title: string
    content: string
  }
  onVideoGenerated?: () => void
}

export function VideoGenerationModal({ isOpen, onClose, story, onVideoGenerated }: VideoGenerationModalProps) {
  const [step, setStep] = useState<'settings' | 'generating' | 'completed' | 'error'>('settings')
  const [voices, setVoices] = useState<any[]>([])
  const [personas, setPersonas] = useState<any[]>([])
  const [detectedLang, setDetectedLang] = useState('en')
  const [settings, setSettings] = useState({
    voice_id: 'pNInz6obpgDQGcFmaJgB',
    language: 'en',
    stability: 0.5,
    similarity_boost: 0.75,
    persona_id: 'rb17cf590e15',
    background_url: '',
    videoStyle: 'persona' as 'persona',
    animeStyle: 'anime' as 'manga' | 'anime' | 'chibi' | 'realistic',
    autoBanner: true
  })
  const [result, setResult] = useState<{
    audioUrl?: string
    videoId?: string
    videoUrl?: string
    videoStyle?: string
    bannerUrl?: string
  }>({})
  const [progress, setProgress] = useState<VideoProgress>({
    status: 'processing',
    progress: 0,
    estimatedTimeLeft: 0,
    message: 'Initializing...'
  })
  const [progressTracker] = useState(() => new VideoProgressTracker())
  const [startTime, setStartTime] = useState<number>(0)
  const [isLoadingPersonas, setIsLoadingPersonas] = useState(false)
  const [generatingBanner, setGeneratingBanner] = useState(false)
  const [showWarning, setShowWarning] = useState(false)

  // Calculate optimized content preview
  const optimizedContent = React.useMemo(() => {
    const words = story.content.split(/\s+/)
    const maxWords = 50 // Fixed to 50 words for persona style
    
    if (words.length <= maxWords) return story.content
    
    const sentences = story.content.split(/[.!?]+/)
    let optimized = ''
    let wordCount = 0
    
    for (const sentence of sentences) {
      const sentenceWords = sentence.trim().split(/\s+/)
      if (wordCount + sentenceWords.length <= maxWords) {
        optimized += sentence.trim() + '. '
        wordCount += sentenceWords.length
      } else {
        break
      }
    }
    
    if (optimized.trim().length === 0) {
      optimized = words.slice(0, maxWords).join(' ') + '...'
    }
    
    return optimized.trim()
  }, [story.content])

  React.useEffect(() => {
    if (isOpen) {
      loadVoicesAndPersonas()
      setStartTime(Date.now())
      
      // Auto-detect language
      const detected = detectLanguage(story.content)
      setDetectedLang(detected)
      setSettings(prev => ({ 
        ...prev, 
        language: detected,
        voice_id: SUPPORTED_LANGUAGES[detected]?.voices[0] || 'pNInz6obpgDQGcFmaJgB'
      }))
    }
    
    return () => {
      progressTracker.stopTracking()
    }
  }, [isOpen])

  async function loadVoicesAndPersonas() {
    setIsLoadingPersonas(true)
    try {
      const [voicesData, personasData] = await Promise.all([
        getVoices(),
        getPersonas()
      ])
      setVoices(voicesData)
      setPersonas(personasData)
      
      if (personasData.length > 0) {
        const yourPersona = personasData.find(p => p.replica_id === 'rb17cf590e15')
        if (!yourPersona && personasData.length > 0) {
          setSettings(prev => ({ 
            ...prev, 
            persona_id: personasData[0].replica_id 
          }))
        }
      }
    } catch (error) {
      console.error('Error loading voices and personas:', error)
      toast.error('Failed to load available personas. Please try again.')
    } finally {
      setIsLoadingPersonas(false)
    }
  }

  async function handleGenerateBanner() {
    setGeneratingBanner(true)
    try {
      const bannerUrl = await generateAutoBanner(story.title, 'fantasy')
      setResult(prev => ({ ...prev, bannerUrl }))
      toast.success('🎨 Auto-banner generated!')
    } catch (error) {
      toast.error('Failed to generate banner')
    } finally {
      setGeneratingBanner(false)
    }
  }

  async function handleGenerate() {
    if (!settings.persona_id) {
      toast.error('Please select an AI persona before generating the video.')
      return
    }

    // Show warning about not closing window
    setShowWarning(true)
    
    console.log('🎬 Starting video generation for story:', story.id, 'Style: persona', 'Language:', settings.language)
    setStep('generating')
    setStartTime(Date.now())
    
    const languageConfig = SUPPORTED_LANGUAGES[settings.language]
    
    setProgress({
      status: 'processing',
      progress: 10,
      estimatedTimeLeft: 120,
      message: `${languageConfig.flag} ✂️ Optimizing content for video...`
    })

    try {
      // Auto-generate banner if enabled
      if (settings.autoBanner) {
        setTimeout(async () => {
          try {
            const bannerUrl = await generateAutoBanner(story.title, 'fantasy')
            setResult(prev => ({ ...prev, bannerUrl }))
          } catch (error) {
            console.error('Banner generation failed:', error)
          }
        }, 1000)
      }

      const progressUpdates = [
        { progress: 20, message: `${languageConfig.flag} 📝 Content optimized for short video` },
        { progress: 35, message: `${languageConfig.flag} 🎤 Generating voice narration...` },
        { progress: 50, message: `${languageConfig.flag} 📤 Uploading audio to cloud...` },
        { progress: 65, message: `${languageConfig.flag} 🎥 Initializing AI video generation...` },
        { progress: 75, message: `${languageConfig.flag} 🤖 Setting up AI avatar...` },
        { progress: 85, message: `${languageConfig.flag} ⚡ Starting video processing...` }
      ]

      for (let i = 0; i < progressUpdates.length; i++) {
        setTimeout(() => {
          setProgress(prev => ({
            ...prev,
            ...progressUpdates[i],
            estimatedTimeLeft: Math.max(90 - (i * 15), 30)
          }))
        }, i * 1500)
      }

      const generationResult = await generateStoryVideo({
        storyId: story.id,
        storyTitle: story.title,
        storyContent: story.content,
        videoStyle: 'persona', // Fixed to persona only
        voiceSettings: {
          voice_id: settings.voice_id,
          stability: settings.stability,
          similarity_boost: settings.similarity_boost,
          style: 0.0,
          use_speaker_boost: true
        },
        videoSettings: {
          persona_id: settings.persona_id,
          background_url: settings.background_url || undefined
        }
      })

      console.log('✅ Video generation initiated for story:', story.id, 'with video ID:', generationResult.videoId)

      setResult(prev => ({
        ...prev,
        audioUrl: generationResult.audioUrl,
        videoId: generationResult.videoId,
        videoStyle: 'persona'
      }))

      setProgress({
        status: 'processing',
        progress: 85,
        estimatedTimeLeft: 90,
        message: `${languageConfig.flag} 🎬 AI video processing started...`
      })

      progressTracker.startTracking(generationResult.videoId, (progressUpdate) => {
        console.log('📊 Progress update received for story:', story.id, 'video:', generationResult.videoId, progressUpdate)
        
        // Enhanced progress tracking with better messages
        let enhancedMessage = progressUpdate.message
        if (progressUpdate.progress >= 85 && progressUpdate.progress < 95) {
          enhancedMessage = `${languageConfig.flag} 🎬 Finalizing video rendering...`
        } else if (progressUpdate.progress >= 95 && progressUpdate.progress < 100) {
          enhancedMessage = `${languageConfig.flag} ✨ Almost ready! Final processing...`
        } else if (progressUpdate.progress >= 100) {
          enhancedMessage = `${languageConfig.flag} 🎉 Video generation completed!`
        }
        
        const updatedProgress = {
          ...progressUpdate,
          message: enhancedMessage || progressUpdate.message
        }
        
        setProgress(updatedProgress)
        
        if (progressUpdate.status === 'completed' && progressUpdate.videoUrl) {
          console.log('🎉 Video generation completed for story:', story.id, 'URL:', progressUpdate.videoUrl)
          setResult(prev => ({ ...prev, videoUrl: progressUpdate.videoUrl }))
          setStep('completed')
          setShowWarning(false)
          toast.success(`🎉 ${languageConfig.flag} Video generated successfully!`)
          onVideoGenerated?.()
        } else if (progressUpdate.status === 'failed') {
          console.error('❌ Video generation failed for story:', story.id)
          setStep('error')
          setShowWarning(false)
          toast.error('❌ Video generation failed')
        }
      }, story.id)

    } catch (error: any) {
      console.error('❌ Video generation error for story:', story.id, error)
      setStep('error')
      setShowWarning(false)
      setProgress({
        status: 'failed',
        progress: 0,
        message: '❌ Generation failed'
      })
      toast.error(error.message || 'Failed to generate video')
    }
  }

  const handleClose = () => {
    if (step === 'generating' && progress.progress < 100) {
      if (!confirm('Video generation is in progress. Are you sure you want to close? This may interrupt the process.')) {
        return
      }
    }
    
    progressTracker.stopTracking()
    setStep('settings')
    setResult({})
    setProgress({
      status: 'processing',
      progress: 0,
      estimatedTimeLeft: 0,
      message: 'Initializing...'
    })
    setShowWarning(false)
    onClose()
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getElapsedTime = () => {
    if (startTime === 0) return '0:00'
    const elapsed = Math.floor((Date.now() - startTime) / 1000)
    return formatTime(elapsed)
  }

  const originalWordCount = story.content.split(/\s+/).length
  const optimizedWordCount = optimizedContent.split(/\s+/).length
  const estimatedDuration = Math.ceil(optimizedWordCount / 2.5)
  const languageConfig = SUPPORTED_LANGUAGES[settings.language]

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-5xl">
      <div className="p-6 modal-content scroll-container">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Video className="h-6 w-6 text-primary" />
            🎬 Generate Multilingual Story Video
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-accent rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Warning Banner */}
        {showWarning && step === 'generating' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 warning-banner rounded-lg"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-red-800 dark:text-red-200">⚠️ Important: Do Not Close This Window</h4>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  Video generation is in progress. Closing this window or navigating away may interrupt the process and cause generation to fail.
                  Please keep this tab open until completion.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'settings' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div>
              <h3 className="text-lg font-semibold mb-2">Story: {story.title}</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Story ID: {story.id} • Original content: {originalWordCount} words
              </p>
            </div>

            {/* Video Storage Information */}
            <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 p-4 rounded-lg border">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-3">
                <Info className="h-4 w-4" />
                <span className="font-medium">📁 Video Storage Information</span>
              </div>
              <div className="space-y-2 text-sm text-blue-600 dark:text-blue-400">
                <p><strong>🎬 Generated videos are stored in:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li><strong>Supabase Database:</strong> Video metadata and links</li>
                  <li><strong>Tavus Cloud:</strong> Actual video files (MP4 format)</li>
                  <li><strong>ElevenLabs Storage:</strong> Audio narration files</li>
                  <li><strong>Your Library:</strong> Accessible via the Videos page</li>
                </ul>
                <p className="mt-2"><strong>📥 Download:</strong> Videos can be downloaded as MP4 files once generation is complete</p>
              </div>
            </div>

            {/* Language Detection & Selection */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-lg border">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-3">
                <Globe className="h-4 w-4" />
                <span className="font-medium">🌍 Language Detection & Voice Optimization</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Detected Language: {languageConfig.flag} {languageConfig.name}
                  </label>
                  <select
                    value={settings.language}
                    onChange={(e) => {
                      const newLang = e.target.value
                      const newConfig = SUPPORTED_LANGUAGES[newLang]
                      setSettings(prev => ({ 
                        ...prev, 
                        language: newLang,
                        voice_id: newConfig.voices[0]
                      }))
                    }}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md"
                  >
                    {Object.entries(SUPPORTED_LANGUAGES).map(([code, config]) => (
                      <option key={code} value={code}>
                        {config.flag} {config.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Optimized Model: {languageConfig.model}
                  </label>
                  <div className="px-3 py-2 bg-muted rounded-md text-sm text-muted-foreground">
                    {languageConfig.model === 'eleven_multilingual_v2' ? 
                      '🌍 Multilingual Model (Best for non-English)' : 
                      '🇺🇸 Monolingual Model (Optimized for English)'
                    }
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-blue-600 dark:text-blue-400">
                ✨ Voice and model automatically optimized for {languageConfig.flag} {languageConfig.name} content
              </p>
            </div>

            {/* Video Style - Only Persona Available */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-4 rounded-lg border">
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-3">
                <User className="h-4 w-4" />
                <span className="font-medium">🤖 AI Persona Video Style</span>
              </div>
              
              <div className="border-2 border-primary bg-primary/5 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center shadow-md">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h5 className="font-semibold">AI Persona (Selected)</h5>
                    <p className="text-sm text-muted-foreground">Human-like AI avatar narrating your story</p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-primary ml-auto" />
                </div>
                <ul className="text-xs space-y-1 mb-3">
                  <li className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    Realistic AI avatar
                  </li>
                  <li className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    Professional narration
                  </li>
                  <li className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    Quick generation (60-90 seconds)
                  </li>
                </ul>
              </div>
              
              {/* Future Improvements Notice */}
              <div className="mt-4 p-3 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 mb-2">
                  <Sparkles className="h-4 w-4" />
                  <span className="font-medium">🚀 Coming Soon</span>
                </div>
                <div className="space-y-1 text-sm text-orange-600 dark:text-orange-400">
                  <p><strong>🎨 Anime Style:</strong> Anime-inspired visual storytelling</p>
                  <p><strong>📸 Slideshow:</strong> Static images with voice narration</p>
                  <p className="text-xs mt-2 italic">These features will be available in future updates!</p>
                </div>
              </div>
            </div>

            {/* Content Optimization Preview */}
            <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 p-4 rounded-lg border">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-3">
                <Scissors className="h-4 w-4" />
                <span className="font-medium">💰 Content Optimization</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                <div>
                  <span className="text-muted-foreground">Original: </span>
                  <span className="font-semibold">{originalWordCount} words</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Optimized: </span>
                  <span className="font-semibold text-green-600">{optimizedWordCount} words</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Video length: </span>
                  <span className="font-semibold">~{estimatedDuration} seconds</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Language: </span>
                  <span className="font-semibold text-purple-600">{languageConfig.flag} {languageConfig.name}</span>
                </div>
              </div>
              <div className="bg-white/50 dark:bg-black/20 p-3 rounded text-sm">
                <p className="font-medium mb-1">Optimized content preview:</p>
                <p className="text-muted-foreground italic">"{optimizedContent}"</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  <Mic className="h-4 w-4 inline mr-1" />
                  Voice Selection ({languageConfig.flag} {languageConfig.name} Optimized)
                </label>
                <select
                  value={settings.voice_id}
                  onChange={(e) => setSettings(prev => ({ ...prev, voice_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md"
                >
                  {languageConfig.voices.map(voiceId => (
                    <option key={voiceId} value={voiceId}>
                      {voiceId === 'pNInz6obpgDQGcFmaJgB' ? `Adam (Recommended for ${languageConfig.name})` : voiceId}
                    </option>
                  ))}
                  {voices.filter(voice => !languageConfig.voices.includes(voice.voice_id)).map(voice => (
                    <option key={voice.voice_id} value={voice.voice_id}>
                      {voice.name} (General)
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  🎯 Voice automatically selected for optimal {languageConfig.name} pronunciation
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Voice Stability
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={settings.stability}
                    onChange={(e) => setSettings(prev => ({ ...prev, stability: parseFloat(e.target.value) }))}
                    className="w-full"
                  />
                  <span className="text-xs text-muted-foreground">{settings.stability}</span>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Similarity Boost
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={settings.similarity_boost}
                    onChange={(e) => setSettings(prev => ({ ...prev, similarity_boost: parseFloat(e.target.value) }))}
                    className="w-full"
                  />
                  <span className="text-xs text-muted-foreground">{settings.similarity_boost}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  <Video className="h-4 w-4 inline mr-1" />
                  AI Persona
                </label>
                {isLoadingPersonas ? (
                  <div className="flex items-center gap-2 px-3 py-2 border border-input bg-background rounded-md">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Loading personas...</span>
                  </div>
                ) : (
                  <select
                    value={settings.persona_id}
                    onChange={(e) => setSettings(prev => ({ ...prev, persona_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md"
                  >
                    <option value="rb17cf590e15">Default Persona (rb17cf590e15)</option>
                    {personas.filter(p => p.replica_id !== 'rb17cf590e15').map(persona => (
                      <option key={persona.replica_id} value={persona.replica_id}>
                        {persona.name || persona.replica_id}
                      </option>
                    ))}
                  </select>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Using your configured persona for video generation
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Background URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/background.jpg"
                  value={settings.background_url}
                  onChange={(e) => setSettings(prev => ({ ...prev, background_url: e.target.value }))}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md"
                />
              </div>

              {/* Auto Banner Generation */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-lg border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Wand2 className="h-4 w-4 text-purple-600" />
                    <span className="font-medium text-purple-600 dark:text-purple-400">🎨 Auto Banner Generation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="autoBanner"
                      checked={settings.autoBanner}
                      onChange={(e) => setSettings(prev => ({ ...prev, autoBanner: e.target.checked }))}
                      className="rounded"
                    />
                    <label htmlFor="autoBanner" className="text-sm font-medium">
                      Auto-generate banner
                    </label>
                  </div>
                </div>
                
                {result.bannerUrl && (
                  <div className="mb-3">
                    <img src={result.bannerUrl} alt="Generated banner" className="w-full h-24 object-cover rounded" />
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateBanner}
                    disabled={generatingBanner}
                    className="flex-1"
                  >
                    {generatingBanner ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-3 w-3 mr-1" />
                        Generate Banner Now
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
                  ✨ Automatically generates a genre-appropriate banner for your video
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="neon"
                onClick={handleGenerate}
                className="flex-1 video-generate-button"
                disabled={!settings.persona_id || isLoadingPersonas}
              >
                <Video className="h-4 w-4 mr-2" />
                🎬 Generate {languageConfig.flag} Video (~{estimatedDuration}s)
              </Button>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
            </div>
          </motion.div>
        )}

        {step === 'generating' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6"
          >
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
              <Loader2 className="h-10 w-10 text-white animate-spin" />
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">
                🎬 Generating {languageConfig.flag} Video
              </h3>
              <p className="text-muted-foreground mb-2">
                Story ID: {story.id} • Video ID: {result.videoId || 'Generating...'}
              </p>
              <p className="text-muted-foreground mb-4">
                {progress.message}
              </p>
              
              <div className="w-full bg-muted rounded-full h-4 mb-4 overflow-hidden shadow-inner">
                <motion.div 
                  className="h-4 rounded-full flex items-center justify-end pr-3 relative bg-gradient-to-r from-purple-600 via-blue-600 to-green-500"
                  initial={{ width: '0%' }}
                  animate={{ width: `${Math.max(progress.progress, 10)}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  />
                  
                  {progress.progress > 20 && (
                    <span className="text-xs text-white font-bold relative z-10">
                      {Math.round(progress.progress)}%
                    </span>
                  )}
                </motion.div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-left">
                  <span className="text-muted-foreground">Progress: </span>
                  <span className="font-semibold">{Math.round(progress.progress)}%</span>
                </div>
                <div className="text-right">
                  <span className="text-muted-foreground">Elapsed: </span>
                  <span className="font-semibold">{getElapsedTime()}</span>
                </div>
                {progress.estimatedTimeLeft && progress.estimatedTimeLeft > 0 && (
                  <>
                    <div className="text-left">
                      <span className="text-muted-foreground">Remaining: </span>
                      <span className="font-semibold text-orange-600">~{formatTime(progress.estimatedTimeLeft)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-muted-foreground">Language: </span>
                      <span className="font-semibold text-purple-600">{languageConfig.flag} {languageConfig.name}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span>✅ Content optimized ({optimizedWordCount} words, {languageConfig.flag} {languageConfig.name})</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span>✅ {languageConfig.flag} Voice narration generated</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span>✅ Audio uploaded to library</span>
              </div>
              {settings.autoBanner && (
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span>✅ Auto-banner generated</span>
                </div>
              )}
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                {progress.progress > 85 ? (
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                ) : (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500 flex-shrink-0" />
                )}
                <span>🎬 AI video generation in progress</span>
              </div>
              {progress.progress > 95 && (
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Loader2 className="h-4 w-4 animate-spin text-purple-500 flex-shrink-0" />
                  <span>🎨 Finalizing video rendering</span>
                </div>
              )}
            </div>

            <div className="p-4 rounded-lg border bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20">
              <div className="flex items-center gap-2 mb-2 text-green-600 dark:text-green-400">
                <DollarSign className="h-4 w-4" />
                <span className="font-medium">
                  {languageConfig.flag} 💰 Credit-Optimized Generation
                </span>
              </div>
              <p className="text-sm text-green-600 dark:text-green-400">
                Generating ~{estimatedDuration} second {languageConfig.name} video with optimized content to save ElevenLabs credits.
              </p>
            </div>

            {/* Progress stuck warning */}
            {progress.progress >= 99 && getElapsedTime() > '3:00' && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">Processing is taking longer than expected...</span>
                </div>
                <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                  The video is in final processing stages. This can take a few extra minutes for complex content.
                </p>
              </div>
            )}
          </motion.div>
        )}

        {step === 'completed' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6"
          >
            <div className="w-16 h-16 mx-auto bg-green-500 rounded-full flex items-center justify-center shadow-lg">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">
                🎉 {languageConfig.flag} Video Generated Successfully!
              </h3>
              <p className="text-muted-foreground mb-2">
                Story ID: {story.id} • Video ID: {result.videoId}
              </p>
              <p className="text-muted-foreground">
                Your {languageConfig.name} optimized ~{estimatedDuration} second AI-narrated video is ready!
              </p>
            </div>

            <div className="space-y-3">
              {result.bannerUrl && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Wand2 className="h-4 w-4" />
                    Auto-Generated Banner
                  </h4>
                  <img src={result.bannerUrl} alt="Generated banner" className="w-full h-32 object-cover rounded" />
                </div>
              )}

              {result.audioUrl && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Volume2 className="h-4 w-4" />
                    {languageConfig.flag} Audio Narration ({optimizedWordCount} words)
                  </h4>
                  <audio controls className="w-full">
                    <source src={result.audioUrl} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}

              {result.videoUrl && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    🎬 {languageConfig.flag} Video (~{estimatedDuration}s)
                  </h4>
                  <video controls className="w-full rounded">
                    <source src={result.videoUrl} type="video/mp4" />
                    Your browser does not support the video element.
                  </video>
                </div>
              )}
            </div>

            <div className="p-4 rounded-lg border bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20">
              <div className="flex items-center gap-2 mb-2 text-green-600 dark:text-green-400">
                <DollarSign className="h-4 w-4" />
                <span className="font-medium">
                  {languageConfig.flag} 💰 Credits Saved!
                </span>
              </div>
              <p className="text-sm text-green-600 dark:text-green-400">
                Used {optimizedWordCount} words instead of {originalWordCount} - saved ~{Math.round((1 - optimizedWordCount/originalWordCount) * 100)}% ElevenLabs credits!
              </p>
            </div>

            <div className="flex gap-3">
              {result.videoUrl && (
                <Button
                  variant="outline"
                  onClick={() => {
                    const link = document.createElement('a')
                    link.href = result.videoUrl!
                    link.download = `${story.title}-${languageConfig.name}.mp4`
                    link.click()
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Video
                </Button>
              )}
              <Button variant="neon" onClick={handleClose} className="flex-1">
                🎉 Done
              </Button>
            </div>
          </motion.div>
        )}

        {step === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6"
          >
            <div className="w-16 h-16 mx-auto bg-red-500 rounded-full flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-white" />
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Generation Failed</h3>
              <p className="text-muted-foreground">
                {languageConfig.flag} Video generation encountered an error for story {story.id}. Please try again.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep('settings')}
              >
                Try Again
              </Button>
              <Button variant="neon" onClick={handleClose} className="flex-1">
                Close
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </Modal>
  )
}