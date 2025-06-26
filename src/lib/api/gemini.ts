const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta'

export interface GenerateStoryRequest {
  genre: string
  type: 'story' | 'poem' | 'script' | 'blog'
  length: 'micro' | 'short' | 'medium' | 'long'
  prompt: string
  title?: string
  forVideo?: boolean // New flag to generate shorter content for videos
}

export interface GenerateImageRequest {
  title: string
  genre: string
  style?: string
}

export async function generateStory(request: GenerateStoryRequest): Promise<string> {
  // Adjust length for video generation to save credits
  const lengthMap = request.forVideo ? {
    micro: '30-50 words',
    short: '50-100 words', 
    medium: '100-150 words',
    long: '150-200 words'
  } : {
    micro: '50-100 words',
    short: '200-500 words', 
    medium: '500-1000 words',
    long: '1000-2000 words'
  }

  const systemPrompt = request.forVideo 
    ? `You are a creative AI storyteller. Generate a concise, engaging ${request.type} in the ${request.genre} genre with approximately ${lengthMap[request.length]}. Make it perfect for video narration - clear, dramatic, and suitable for voice-over. Focus on vivid imagery and strong narrative flow.`
    : `You are a creative AI storyteller. Generate a ${request.type} in the ${request.genre} genre with approximately ${lengthMap[request.length]}. Make it engaging, well-structured, and appropriate for all audiences.`

  const userPrompt = `${request.prompt}${request.title ? ` Title: "${request.title}"` : ''}`

  try {
    console.log('🤖 Generating story with Gemini...', request.forVideo ? '(Video optimized)' : '')
    
    const response = await fetch(
      `${GEMINI_BASE_URL}/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${systemPrompt}\n\n${userPrompt}`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.8,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: request.forVideo ? 300 : 2048, // Limit tokens for video
          }
        })
      }
    )

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`)
    }

    const data = await response.json()
    const generatedText = data.candidates[0]?.content?.parts[0]?.text || 'Failed to generate story'
    
    console.log('✅ Story generated successfully, length:', generatedText.length, 'characters')
    return generatedText
  } catch (error) {
    console.error('❌ Error generating story:', error)
    throw new Error('Failed to generate story. Please try again.')
  }
}

export async function generateCoverImage(request: GenerateImageRequest): Promise<string> {
  const prompt = `Create a book cover image for a ${request.genre} ${request.title}. Style: ${request.style || 'modern digital art'}. High quality, professional book cover design.`

  try {
    const response = await fetch(
      `${GEMINI_BASE_URL}/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Generate an image description for: ${prompt}`
                }
              ]
            }
          ]
        })
      }
    )

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`)
    }

    // For now, return a placeholder URL since Gemini doesn't generate images directly
    // In production, you'd use this description with an image generation service
    return `https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=600&fit=crop&q=80`
  } catch (error) {
    console.error('Error generating cover image:', error)
    return `https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=600&fit=crop&q=80`
  }
}