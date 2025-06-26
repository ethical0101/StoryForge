const TAVUS_API_KEY = import.meta.env.VITE_TAVUS_API_KEY
const TAVUS_BASE_URL = 'https://tavusapi.com'

export interface GenerateVideoRequest {
  script: string
  persona_id: string // Make this required
  background_url?: string
  callback_url?: string
}

export async function generateVideo(request: GenerateVideoRequest): Promise<string> {
  try {
    console.log('🎬 Generating video with Tavus...')
    console.log('📝 Script length:', request.script.length, 'characters')
    console.log('🤖 Using persona:', request.persona_id)
    
    // Validate that persona_id is provided
    if (!request.persona_id) {
      throw new Error('Tavus API: persona_id is required for video generation')
    }
    
    const requestBody = {
      replica_id: request.persona_id,
      script: request.script,
      background_url: request.background_url || undefined,
      callback_url: request.callback_url || undefined,
      video_name: `StoryForge-${Date.now()}`,
    }
    
    console.log('📤 Sending request to Tavus:', JSON.stringify(requestBody, null, 2))
    
    const response = await fetch(`${TAVUS_BASE_URL}/v2/videos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': TAVUS_API_KEY,
      },
      body: JSON.stringify(requestBody)
    })

    console.log('📥 Tavus response status:', response.status, response.statusText)

    if (!response.ok) {
      let errorMessage = `Tavus API error: ${response.status} ${response.statusText}`
      
      try {
        const errorData = await response.json()
        console.log('❌ Tavus error data:', JSON.stringify(errorData, null, 2))
        
        if (errorData.error) {
          errorMessage += ` - ${errorData.error}`
        } else if (errorData.message) {
          errorMessage += ` - ${errorData.message}`
        } else if (errorData.detail) {
          errorMessage += ` - ${errorData.detail}`
        }
      } catch {
        // If we can't parse JSON, try to get text
        try {
          const errorText = await response.text()
          console.log('❌ Tavus error text:', errorText)
          if (errorText) {
            errorMessage += ` - ${errorText}`
          }
        } catch {
          // If all else fails, use the basic error message
        }
      }
      
      console.error('❌ Tavus API error:', errorMessage)
      throw new Error(errorMessage)
    }

    const data = await response.json()
    console.log('✅ Tavus response data:', JSON.stringify(data, null, 2))
    console.log('✅ Video generation started, ID:', data.video_id)
    
    return data.video_id
  } catch (error) {
    console.error('❌ Error generating video:', error)
    
    // If it's already our custom error, re-throw it
    if (error instanceof Error && error.message.includes('Tavus API error:')) {
      throw error
    }
    
    // For network or other errors, provide more context
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Tavus API: Network connection failed. Please check your internet connection.')
    }
    
    // Check for missing API key
    if (!TAVUS_API_KEY) {
      throw new Error('Tavus API: API key is not configured. Please check your environment variables.')
    }
    
    // For other errors, include the original message
    const originalMessage = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Tavus video generation failed: ${originalMessage}`)
  }
}

export async function getVideoStatus(videoId: string) {
  try {
    console.log('🔍 Checking video status for ID:', videoId)
    
    const response = await fetch(`${TAVUS_BASE_URL}/v2/videos/${videoId}`, {
      headers: {
        'x-api-key': TAVUS_API_KEY,
      }
    })

    console.log('📥 Video status response:', response.status, response.statusText)

    if (!response.ok) {
      let errorMessage = `Tavus API error: ${response.status} ${response.statusText}`
      
      try {
        const errorData = await response.json()
        console.log('❌ Video status error data:', JSON.stringify(errorData, null, 2))
        
        if (errorData.error) {
          errorMessage += ` - ${errorData.error}`
        } else if (errorData.message) {
          errorMessage += ` - ${errorData.message}`
        }
      } catch {
        // If we can't parse JSON, use the basic error message
      }
      
      throw new Error(errorMessage)
    }

    const data = await response.json()
    console.log('📊 Video status data:', JSON.stringify(data, null, 2))
    
    return data
  } catch (error) {
    console.error('❌ Error getting video status:', error)
    
    // If it's already our custom error, re-throw it
    if (error instanceof Error && error.message.includes('Tavus API error:')) {
      throw error
    }
    
    const originalMessage = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Failed to get video status: ${originalMessage}`)
  }
}

export async function getPersonas() {
  try {
    console.log('👥 Fetching available personas...')
    
    const response = await fetch(`${TAVUS_BASE_URL}/v2/replicas`, {
      headers: {
        'x-api-key': TAVUS_API_KEY,
      }
    })

    console.log('📥 Personas response:', response.status, response.statusText)

    if (!response.ok) {
      let errorMessage = `Tavus API error: ${response.status} ${response.statusText}`
      
      try {
        const errorData = await response.json()
        console.log('❌ Personas error data:', JSON.stringify(errorData, null, 2))
        
        if (errorData.error) {
          errorMessage += ` - ${errorData.error}`
        } else if (errorData.message) {
          errorMessage += ` - ${errorData.message}`
        }
      } catch {
        // If we can't parse JSON, use the basic error message
      }
      
      throw new Error(errorMessage)
    }

    const data = await response.json()
    console.log('👥 Personas data:', JSON.stringify(data, null, 2))
    
    return data.replicas || []
  } catch (error) {
    console.error('❌ Error fetching personas:', error)
    return []
  }
}