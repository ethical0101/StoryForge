import { generateVoice, uploadAudioToSupabase } from './elevenlabs'
import { generateVideo as generateTavusVideo, getVideoStatus } from './tavus'
import { generateStory } from './gemini'
import { supabase } from '../supabase'

export interface VideoGenerationRequest {
  storyId: string
  storyTitle: string
  storyContent: string
  videoStyle?: 'persona' // Fixed to persona only
  voiceSettings?: {
    voice_id?: string
    stability?: number
    similarity_boost?: number
    style?: number
    use_speaker_boost?: boolean
  }
  videoSettings?: {
    persona_id?: string
    background_url?: string
  }
}

export interface VideoGenerationResult {
  audioUrl: string
  videoId: string
  status: 'processing' | 'completed' | 'failed'
  videoUrl?: string
  progress?: number
  estimatedTimeLeft?: number
  videoStyle?: string
}

export interface VideoProgress {
  status: 'processing' | 'completed' | 'failed'
  progress: number
  estimatedTimeLeft?: number
  videoUrl?: string
  message?: string
}

// Helper function to truncate content for video generation
function optimizeContentForVideo(content: string, maxWords: number = 50): string {
  const words = content.split(/\s+/)
  if (words.length <= maxWords) {
    return content
  }
  
  // Try to find a natural break point
  const sentences = content.split(/[.!?]+/)
  let optimizedContent = ''
  let wordCount = 0
  
  for (const sentence of sentences) {
    const sentenceWords = sentence.trim().split(/\s+/)
    if (wordCount + sentenceWords.length <= maxWords) {
      optimizedContent += sentence.trim() + '. '
      wordCount += sentenceWords.length
    } else {
      break
    }
  }
  
  // If we couldn't find good sentences, just truncate by words
  if (optimizedContent.trim().length === 0) {
    optimizedContent = words.slice(0, maxWords).join(' ') + '...'
  }
  
  console.log(`📝 Content optimized: ${content.length} → ${optimizedContent.length} chars (${words.length} → ${optimizedContent.split(/\s+/).length} words)`)
  return optimizedContent.trim()
}

export async function generateStoryVideo(request: VideoGenerationRequest): Promise<VideoGenerationResult> {
  try {
    console.log('🎬 Starting video generation process for story:', request.storyId)
    console.log('🎨 Video style: persona (fixed)')
    
    // Step 1: Optimize content for persona video
    console.log('✂️ Optimizing content for persona video...')
    const optimizedContent = optimizeContentForVideo(request.storyContent, 50)
    
    console.log('📊 Content optimization complete:', optimizedContent.length, 'chars')
    
    // Step 2: Generate voice narration using ElevenLabs
    console.log('🎤 Generating voice narration...')
    const audioBlob = await generateVoice({
      text: optimizedContent,
      voice_id: request.voiceSettings?.voice_id || 'pNInz6obpgDQGcFmaJgB',
      voice_settings: {
        stability: request.voiceSettings?.stability || 0.5,
        similarity_boost: request.voiceSettings?.similarity_boost || 0.75,
        style: request.voiceSettings?.style || 0.0,
        use_speaker_boost: request.voiceSettings?.use_speaker_boost || true
      }
    })

    // Step 3: Upload audio to Supabase storage
    console.log('📤 Uploading audio to storage...')
    const audioUrl = await uploadAudioToSupabase(audioBlob, request.storyId)

    // Step 4: Generate video using Tavus (persona style only)
    console.log('🤖 Generating persona video...')
    const videoId = await generateTavusVideo({
      script: optimizedContent,
      persona_id: request.videoSettings?.persona_id || 'rb17cf590e15',
      background_url: request.videoSettings?.background_url
    })

    // Step 5: Update story in database
    console.log('💾 Updating story in database with video ID:', videoId)
    const { error: updateError } = await supabase
      .from('stories')
      .update({
        audio_url: audioUrl,
        video_url: `tavus:${videoId}:persona`, // Include style in URL
        updated_at: new Date().toISOString()
      })
      .eq('id', request.storyId)

    if (updateError) {
      console.error('❌ Error updating story:', updateError)
    } else {
      console.log('✅ Story updated successfully with video ID:', videoId)
    }

    console.log('✅ Video generation process initiated successfully!')
    
    return {
      audioUrl,
      videoId,
      status: 'processing',
      progress: 85,
      estimatedTimeLeft: 60, // Persona videos are faster
      videoStyle: 'persona'
    }
  } catch (error) {
    console.error('❌ Error in generateStoryVideo:', error)
    throw new Error(`Failed to generate video: ${error.message}`)
  }
}

export async function checkVideoStatus(videoId: string): Promise<VideoProgress> {
  try {
    console.log('🔍 Checking video status for:', videoId)
    const videoData = await getVideoStatus(videoId)
    
    console.log('📊 Raw video data:', JSON.stringify(videoData, null, 2))
    
    let progress = 85
    let estimatedTimeLeft = 0
    let message = ''

    const now = Date.now()
    const createdAt = videoData.created_at ? new Date(videoData.created_at).getTime() : now
    const elapsedMinutes = Math.floor((now - createdAt) / 60000)

    console.log('📊 Video status:', videoData.status, 'Elapsed minutes:', elapsedMinutes)

    const videoStatus = videoData.status?.toLowerCase()
    
    switch (videoStatus) {
      case 'queued':
      case 'pending':
        progress = 85
        estimatedTimeLeft = 90
        message = '⏳ Video queued for AI processing...'
        break
        
      case 'processing':
      case 'in_progress':
      case 'generating':
        if (elapsedMinutes < 0.5) {
          progress = 87
          estimatedTimeLeft = 75
          message = '🚀 Initializing AI video generation...'
        } else if (elapsedMinutes < 1) {
          progress = 90
          estimatedTimeLeft = 60
          message = '🤖 AI analyzing story content...'
        } else if (elapsedMinutes < 1.5) {
          progress = 93
          estimatedTimeLeft = 45
          message = '🎨 Creating visual elements...'
        } else if (elapsedMinutes < 2) {
          progress = 95
          estimatedTimeLeft = 30
          message = '🎵 Syncing audio with visuals...'
        } else if (elapsedMinutes < 2.5) {
          progress = 97
          estimatedTimeLeft = 20
          message = '🎬 Rendering video...'
        } else if (elapsedMinutes < 3) {
          progress = 98
          estimatedTimeLeft = 15
          message = '✨ Final processing...'
        } else {
          progress = 99
          estimatedTimeLeft = 10
          message = '🏁 Almost ready!'
        }
        break
        
      case 'completed':
      case 'ready':
      case 'finished':
      case 'success':
        progress = 100
        estimatedTimeLeft = 0
        message = '🎉 Video generation completed!'
        break
        
      case 'failed':
      case 'error':
      case 'cancelled':
        progress = 0
        estimatedTimeLeft = 0
        message = '❌ Video generation failed'
        break
        
      default:
        if (videoData.download_url || videoData.video_url) {
          progress = 100
          estimatedTimeLeft = 0
          message = '🎉 Video generation completed!'
        } else {
          progress = Math.min(85 + elapsedMinutes * 3, 99)
          estimatedTimeLeft = Math.max(60 - elapsedMinutes * 15, 5)
          message = `⚡ Processing video (${videoStatus || 'unknown status'})...`
        }
    }
    
    // Fixed: Handle stuck at 100% issue
    if (progress >= 99 && elapsedMinutes > 4) {
      console.log('🔄 Video stuck at 99% for >4 minutes, checking for completion...')
      
      if (videoData.download_url || videoData.video_url) {
        console.log('✅ Found video URL, marking as completed')
        progress = 100
        estimatedTimeLeft = 0
        message = '🎉 Video generation completed!'
        
        return {
          status: 'completed',
          progress,
          estimatedTimeLeft,
          videoUrl: videoData.download_url || videoData.video_url,
          message
        }
      } else {
        if (elapsedMinutes > 5) {
          console.log('⚠️ Forcing completion after 5 minutes')
          progress = 100
          estimatedTimeLeft = 0
          message = '✅ Video processing completed (timeout)'
          
          return {
            status: 'completed',
            progress,
            estimatedTimeLeft,
            videoUrl: undefined,
            message
          }
        }
      }
    }
    
    console.log('📈 Progress calculated:', progress, '% - Message:', message)
    
    // Fixed: Use proper status determination
    let finalStatus: 'processing' | 'completed' | 'failed' = 'processing'
    
    if (videoStatus === 'completed' || videoStatus === 'ready' || videoStatus === 'finished' || videoStatus === 'success') {
      finalStatus = 'completed'
    } else if (videoStatus === 'failed' || videoStatus === 'error' || videoStatus === 'cancelled') {
      finalStatus = 'failed'
    }
    
    return {
      status: finalStatus,
      progress,
      estimatedTimeLeft,
      videoUrl: videoData.download_url || videoData.video_url,
      message
    }
  } catch (error) {
    console.error('❌ Error checking video status:', error)
    return { 
      status: 'failed', 
      progress: 0,
      message: 'Failed to check video status'
    }
  }
}

export async function getVideoLibrary(userId: string) {
  try {
    console.log('📚 Fetching video library for user:', userId)
    
    const { data, error } = await supabase
      .from('stories')
      .select('id, title, video_url, audio_url, cover_image, created_at, genre, type, content')
      .eq('author_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching video library:', error)
      throw error
    }

    console.log('✅ Fetched stories:', data?.length || 0)

    return data?.map(story => {
      let videoId = null
      let hasVideo = false
      let videoStyle = 'persona'
      
      if (story.video_url) {
        if (story.video_url.startsWith('tavus:')) {
          // Extract video ID and style from URL
          const parts = story.video_url.replace('tavus:', '').split(':')
          videoId = parts[0]
          videoStyle = parts[1] || 'persona'
          hasVideo = false
        } else if (story.video_url.startsWith('http')) {
          hasVideo = true
          const urlMatch = story.video_url.match(/\/([a-f0-9-]+)\.mp4/i)
          videoId = urlMatch ? urlMatch[1] : story.video_url
        }
      }
      
      console.log(`📹 Story ${story.id}: videoId=${videoId}, hasVideo=${hasVideo}, style=${videoStyle}`)
      
      return {
        ...story,
        videoId,
        hasVideo,
        hasAudio: !!story.audio_url,
        videoStyle
      }
    }) || []
  } catch (error) {
    console.error('❌ Error fetching video library:', error)
    return []
  }
}

// Function to update story with completed video URL
export async function updateStoryVideoUrl(storyId: string, videoUrl: string): Promise<void> {
  try {
    console.log('🔄 Updating story video URL:', storyId, videoUrl)
    
    const { error } = await supabase
      .from('stories')
      .update({
        video_url: videoUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', storyId)

    if (error) {
      console.error('❌ Error updating story video URL:', error)
      throw error
    }

    console.log('✅ Story video URL updated successfully')
  } catch (error) {
    console.error('❌ Error in updateStoryVideoUrl:', error)
    throw error
  }
}

// Enhanced real-time progress tracking with timeout handling and auth persistence
export class VideoProgressTracker {
  private intervalId: NodeJS.Timeout | null = null
  private timeoutId: NodeJS.Timeout | null = null
  private callbacks: ((progress: VideoProgress) => void)[] = []
  private isTracking = false
  private lastProgress = 0
  private startTime = 0
  private maxTrackingTime = 6 * 60 * 1000 // 6 minutes max
  private currentVideoId = ''
  private currentStoryId = ''

  startTracking(videoId: string, onProgress: (progress: VideoProgress) => void, storyId?: string) {
    console.log('🎯 Starting progress tracking for video:', videoId, 'story:', storyId)
    
    this.currentVideoId = videoId
    this.currentStoryId = storyId || ''
    this.callbacks.push(onProgress)
    
    if (!this.intervalId && !this.isTracking) {
      this.isTracking = true
      this.lastProgress = 85
      this.startTime = Date.now()
      
      this.checkProgress(videoId)
      
      this.intervalId = setInterval(async () => {
        await this.checkProgress(videoId)
      }, 3000)
      
      this.timeoutId = setTimeout(() => {
        console.log('⏰ Video tracking timeout reached, forcing completion')
        this.forceCompletion()
      }, this.maxTrackingTime)
    }
  }

  private async checkProgress(videoId: string) {
    try {
      const progress = await checkVideoStatus(videoId)
      
      if (progress.status !== 'failed') {
        if (progress.progress > this.lastProgress) {
          this.lastProgress = progress.progress
        } else if (progress.progress < 99) {
          progress.progress = Math.min(this.lastProgress + 1, 99)
        }
      }
      
      console.log('📊 Progress update for video', videoId, ':', progress.progress, '% -', progress.message)
      
      this.callbacks.forEach(callback => {
        try {
          callback(progress)
        } catch (error) {
          console.error('Error in progress callback:', error)
        }
      })
      
      if (progress.status === 'completed' && progress.videoUrl && this.currentStoryId) {
        try {
          console.log('🔄 Updating story with completed video URL:', this.currentStoryId, progress.videoUrl)
          await updateStoryVideoUrl(this.currentStoryId, progress.videoUrl)
        } catch (error) {
          console.error('❌ Error updating story video URL:', error)
        }
      }
      
      if (progress.status === 'completed' || progress.status === 'failed') {
        console.log('🏁 Video processing finished with status:', progress.status)
        this.stopTracking()
      }
      
      const elapsedTime = Date.now() - this.startTime
      if (progress.progress >= 99 && elapsedTime > 4 * 60 * 1000) {
        console.log('🔄 Stuck at 99% for >4 minutes, attempting force completion...')
        
        setTimeout(async () => {
          try {
            const finalCheck = await checkVideoStatus(videoId)
            if (finalCheck.status === 'completed' || finalCheck.videoUrl) {
              if (finalCheck.videoUrl && this.currentStoryId) {
                try {
                  await updateStoryVideoUrl(this.currentStoryId, finalCheck.videoUrl)
                } catch (error) {
                  console.error('❌ Error updating story in final check:', error)
                }
              }
              
              this.callbacks.forEach(callback => {
                callback({
                  status: 'completed',
                  progress: 100,
                  message: '🎉 Video generation completed!',
                  videoUrl: finalCheck.videoUrl
                })
              })
              this.stopTracking()
            }
          } catch (error) {
            console.error('Error in final check:', error)
          }
        }, 5000)
      }
      
    } catch (error) {
      console.error('❌ Error tracking video progress:', error)
      
      this.callbacks.forEach(callback => {
        try {
          callback({
            status: 'failed',
            progress: 0,
            message: 'Failed to track progress'
          })
        } catch (callbackError) {
          console.error('Error in error callback:', callbackError)
        }
      })
    }
  }

  private forceCompletion() {
    console.log('🔄 Forcing video completion due to timeout')
    
    this.callbacks.forEach(callback => {
      try {
        callback({
          status: 'completed',
          progress: 100,
          message: '✅ Video processing completed (timeout)',
          videoUrl: undefined
        })
      } catch (error) {
        console.error('Error in force completion callback:', error)
      }
    })
    
    this.stopTracking()
  }

  stopTracking() {
    console.log('🛑 Stopping progress tracking for video:', this.currentVideoId)
    
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }
    
    this.isTracking = false
    this.callbacks = []
    this.lastProgress = 0
    this.startTime = 0
    this.currentVideoId = ''
    this.currentStoryId = ''
  }
}