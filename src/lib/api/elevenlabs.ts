const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY
const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io/v1'

export interface GenerateVoiceRequest {
  text: string
  voice_id?: string
  model_id?: string
  language?: string // New language parameter
  voice_settings?: {
    stability: number
    similarity_boost: number
    style?: number
    use_speaker_boost?: boolean
  }
}

// Supported languages with their models and voice recommendations
export const SUPPORTED_LANGUAGES = {
  'en': { 
    name: 'English', 
    model: 'eleven_monolingual_v1',
    flag: '🇺🇸',
    voices: ['pNInz6obpgDQGcFmaJgB', 'EXAVITQu4vr4xnSDxMaL', 'ErXwobaYiN019PkySvjV']
  },
  'es': { 
    name: 'Spanish', 
    model: 'eleven_multilingual_v2',
    flag: '🇪🇸',
    voices: ['pNInz6obpgDQGcFmaJgB', 'EXAVITQu4vr4xnSDxMaL']
  },
  'fr': { 
    name: 'French', 
    model: 'eleven_multilingual_v2',
    flag: '🇫🇷',
    voices: ['pNInz6obpgDQGcFmaJgB', 'EXAVITQu4vr4xnSDxMaL']
  },
  'de': { 
    name: 'German', 
    model: 'eleven_multilingual_v2',
    flag: '🇩🇪',
    voices: ['pNInz6obpgDQGcFmaJgB', 'EXAVITQu4vr4xnSDxMaL']
  },
  'it': { 
    name: 'Italian', 
    model: 'eleven_multilingual_v2',
    flag: '🇮🇹',
    voices: ['pNInz6obpgDQGcFmaJgB', 'EXAVITQu4vr4xnSDxMaL']
  },
  'pt': { 
    name: 'Portuguese', 
    model: 'eleven_multilingual_v2',
    flag: '🇵🇹',
    voices: ['pNInz6obpgDQGcFmaJgB', 'EXAVITQu4vr4xnSDxMaL']
  },
  'pl': { 
    name: 'Polish', 
    model: 'eleven_multilingual_v2',
    flag: '🇵🇱',
    voices: ['pNInz6obpgDQGcFmaJgB', 'EXAVITQu4vr4xnSDxMaL']
  },
  'hi': { 
    name: 'Hindi', 
    model: 'eleven_multilingual_v2',
    flag: '🇮🇳',
    voices: ['pNInz6obpgDQGcFmaJgB', 'EXAVITQu4vr4xnSDxMaL']
  },
  'ja': { 
    name: 'Japanese', 
    model: 'eleven_multilingual_v2',
    flag: '🇯🇵',
    voices: ['pNInz6obpgDQGcFmaJgB', 'EXAVITQu4vr4xnSDxMaL']
  },
  'ko': { 
    name: 'Korean', 
    model: 'eleven_multilingual_v2',
    flag: '🇰🇷',
    voices: ['pNInz6obpgDQGcFmaJgB', 'EXAVITQu4vr4xnSDxMaL']
  },
  'zh': { 
    name: 'Chinese', 
    model: 'eleven_multilingual_v2',
    flag: '🇨🇳',
    voices: ['pNInz6obpgDQGcFmaJgB', 'EXAVITQu4vr4xnSDxMaL']
  },
  'ar': { 
    name: 'Arabic', 
    model: 'eleven_multilingual_v2',
    flag: '🇸🇦',
    voices: ['pNInz6obpgDQGcFmaJgB', 'EXAVITQu4vr4xnSDxMaL']
  },
  'ru': { 
    name: 'Russian', 
    model: 'eleven_multilingual_v2',
    flag: '🇷🇺',
    voices: ['pNInz6obpgDQGcFmaJgB', 'EXAVITQu4vr4xnSDxMaL']
  },
  'nl': { 
    name: 'Dutch', 
    model: 'eleven_multilingual_v2',
    flag: '🇳🇱',
    voices: ['pNInz6obpgDQGcFmaJgB', 'EXAVITQu4vr4xnSDxMaL']
  },
  'sv': { 
    name: 'Swedish', 
    model: 'eleven_multilingual_v2',
    flag: '🇸🇪',
    voices: ['pNInz6obpgDQGcFmaJgB', 'EXAVITQu4vr4xnSDxMaL']
  }
}

// Function to detect language from text (basic implementation)
export function detectLanguage(text: string): string {
  // Simple language detection based on character patterns
  const cleanText = text.toLowerCase().trim()
  
  // Check for specific language patterns
  if (/[一-龯]/.test(text)) return 'zh' // Chinese characters
  if (/[ひらがなカタカナ]/.test(text)) return 'ja' // Japanese hiragana/katakana
  if (/[가-힣]/.test(text)) return 'ko' // Korean hangul
  if (/[а-яё]/.test(text)) return 'ru' // Cyrillic
  if (/[ا-ي]/.test(text)) return 'ar' // Arabic
  if (/[अ-ह]/.test(text)) return 'hi' // Hindi
  
  // Check for common words in different languages
  const spanishWords = ['el', 'la', 'de', 'que', 'y', 'en', 'un', 'es', 'se', 'no', 'te', 'lo', 'le', 'da', 'su', 'por', 'son', 'con', 'para', 'una', 'tiene', 'más', 'este', 'está', 'todo', 'pero', 'sus', 'muy', 'era', 'sobre', 'mi', 'ser', 'fue', 'si', 'ya', 'vez', 'porque', 'cuando', 'él', 'uno', 'donde', 'bien', 'tiempo', 'mucho', 'hay', 'ahora', 'algo', 'estoy', 'puedo']
  const frenchWords = ['le', 'de', 'et', 'à', 'un', 'il', 'être', 'et', 'en', 'avoir', 'que', 'pour', 'dans', 'ce', 'son', 'une', 'sur', 'avec', 'ne', 'se', 'pas', 'tout', 'plus', 'par', 'grand', 'en', 'une', 'être', 'et', 'à', 'il', 'avoir', 'ne', 'je', 'son', 'que', 'se', 'qui', 'ce', 'dans', 'en', 'du', 'elle', 'au', 'de', 'le', 'tout', 'et', 'y', 'mais', 'd', 'lui', 'nous', 'comme', 'ou', 'si', 'leur', 'y', 'dire', 'elle', 'si', 'son', 'tout', 'en', 'les', 'bien', 'être', 'à', 'de', 'le', 'avoir', 'que', 'pour']
  const germanWords = ['der', 'die', 'und', 'in', 'den', 'von', 'zu', 'das', 'mit', 'sich', 'des', 'auf', 'für', 'ist', 'im', 'dem', 'nicht', 'ein', 'eine', 'als', 'auch', 'es', 'an', 'werden', 'aus', 'er', 'hat', 'dass', 'sie', 'nach', 'wird', 'bei', 'einer', 'um', 'am', 'sind', 'noch', 'wie', 'einem', 'über', 'einen', 'so', 'zum', 'war', 'haben', 'nur', 'oder', 'aber', 'vor', 'zur', 'bis', 'mehr', 'durch', 'man', 'sein', 'wurde', 'sei', 'in']
  const italianWords = ['il', 'di', 'che', 'e', 'la', 'per', 'un', 'in', 'con', 'del', 'da', 'a', 'al', 'le', 'si', 'dei', 'nel', 'della', 'i', 'non', 'una', 'delle', 'alla', 'lo', 'gli', 'come', 'più', 'ma', 'tutto', 'anche', 'prima', 'molto', 'bene', 'dove', 'quando', 'chi', 'tempo', 'ogni', 'state', 'fatto', 'mentre', 'erano', 'quella', 'essere', 'loro', 'questa', 'quello', 'senza', 'cose', 'cosa', 'questi', 'casa', 'subito', 'però', 'tipo', 'visto', 'generale', 'mano', 'proprio', 'gente', 'punto', 'bambino', 'sì', 'sicuro', 'ma', 'governo', 'modo', 'condizioni', 'pensare', 'corso', 'gruppo', 'verso', 'politica', 'grado', 'milioni', 'arrivo', 'comune', 'libro', 'partito', 'particolare', 'scuola', 'salti', 'potere', 'sociale', 'internazionale', 'proprio', 'piccolo', 'nazionale', 'sì', 'lavoro', 'grande', 'stato', 'anno', 'giorno', 'paese', 'caso', 'mano', 'parte', 'giovane', 'parola', 'problema', 'mondo', 'vita', 'sistema', 'società', 'momento', 'durante', 'tutti', 'informazione', 'corpo', 'servizio', 'piedi', 'consiglio', 'davanti', 'mese', 'governo', 'interesse', 'storia', 'risultato', 'agosto', 'attività', 'posizione', 'comune', 'sicurezza', 'centro', 'attenzione', 'città', 'politico', 'religioso', 'economia', 'ambiente', 'forza', 'produzione', 'ricerca', 'popolazione', 'testa', 'controllo', 'termine', 'rapporto', 'mercato', 'confronto', 'spirito', 'mestiere', 'condizione', 'sviluppo', 'parere', 'mezzo', 'effetto', 'fine', 'nord', 'industria', 'carattere', 'materia', 'straniero', 'numero', 'pubblico', 'funzione', 'uso', 'possibilità', 'corso', 'studio', 'maggiore', 'comunicazione', 'lavoro', 'famiglia', 'sera', 'dieci', 'ora', 'tipo', 'nome', 'strada', 'faccia', 'gioco', 'parola', 'posto', 'compagnia', 'azione', 'casa', 'crescita', 'gruppo', 'ufficio', 'denaro', 'offerta', 'ambiente', 'presidente', 'albero', 'merito', 'accesso', 'resto', 'discussione', 'ricerca', 'memoria', 'impresa', 'sera', 'spirito', 'mestiere', 'condizione', 'sviluppo', 'parere', 'mezzo', 'effetto', 'fine', 'nord', 'industria', 'carattere', 'materia', 'straniero', 'numero', 'pubblico', 'funzione', 'uso', 'possibilità', 'corso', 'studio', 'maggiore', 'comunicazione', 'lavoro', 'famiglia', 'sera', 'dieci', 'ora', 'tipo', 'nome', 'strada', 'faccia', 'gioco', 'parola', 'posto', 'compagnia', 'azione', 'casa', 'crescita', 'gruppo', 'ufficio', 'denaro', 'offerta', 'ambiente', 'presidente', 'albero', 'merito', 'accesso', 'resto', 'discussione', 'ricerca', 'memoria', 'impresa']
  const portugueseWords = ['o', 'de', 'a', 'e', 'do', 'da', 'em', 'um', 'para', 'é', 'com', 'não', 'uma', 'os', 'no', 'se', 'na', 'por', 'mais', 'as', 'dos', 'como', 'mas', 'foi', 'ao', 'ele', 'das', 'tem', 'à', 'seu', 'sua', 'ou', 'ser', 'quando', 'muito', 'há', 'nos', 'já', 'está', 'eu', 'também', 'só', 'pelo', 'pela', 'até', 'isso', 'ela', 'entre', 'era', 'depois', 'sem', 'mesmo', 'aos', 'ter', 'seus', 'suas', 'numa', 'pelos', 'pelas', 'esse', 'eles', 'estão', 'você', 'tinha', 'foram', 'essa', 'num', 'nem', 'suas', 'meu', 'às', 'minha', 'têm', 'numa', 'pelos', 'pelas', 'esse', 'eles', 'estão', 'você', 'tinha', 'foram', 'essa', 'num', 'nem', 'suas', 'meu', 'às', 'minha', 'têm']
  
  const words = cleanText.split(/\s+/)
  let spanishCount = 0, frenchCount = 0, germanCount = 0, italianCount = 0, portugueseCount = 0
  
  words.forEach(word => {
    if (spanishWords.includes(word)) spanishCount++
    if (frenchWords.includes(word)) frenchCount++
    if (germanWords.includes(word)) germanCount++
    if (italianWords.includes(word)) italianCount++
    if (portugueseWords.includes(word)) portugueseCount++
  })
  
  const maxCount = Math.max(spanishCount, frenchCount, germanCount, italianCount, portugueseCount)
  
  if (maxCount > 0) {
    if (spanishCount === maxCount) return 'es'
    if (frenchCount === maxCount) return 'fr'
    if (germanCount === maxCount) return 'de'
    if (italianCount === maxCount) return 'it'
    if (portugueseCount === maxCount) return 'pt'
  }
  
  // Default to English
  return 'en'
}

export async function generateVoice(request: GenerateVoiceRequest): Promise<Blob> {
  const detectedLanguage = request.language || detectLanguage(request.text)
  const languageConfig = SUPPORTED_LANGUAGES[detectedLanguage] || SUPPORTED_LANGUAGES['en']
  
  const voiceId = request.voice_id || languageConfig.voices[0]
  const modelId = request.model_id || languageConfig.model
  
  try {
    console.log('🎤 Generating voice with ElevenLabs...')
    console.log('🌍 Language:', languageConfig.name, languageConfig.flag)
    console.log('🤖 Model:', modelId)
    console.log('🎵 Voice ID:', voiceId)
    
    const response = await fetch(
      `${ELEVENLABS_BASE_URL}/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text: request.text,
          model_id: modelId,
          voice_settings: request.voice_settings || {
            stability: 0.5,
            similarity_boost: 0.5,
            style: 0.0,
            use_speaker_boost: true
          }
        })
      }
    )

    if (!response.ok) {
      let errorMessage = `ElevenLabs API error: ${response.status} ${response.statusText}`
      
      try {
        const errorData = await response.json()
        if (errorData.detail) {
          errorMessage += ` - ${errorData.detail}`
        } else if (errorData.message) {
          errorMessage += ` - ${errorData.message}`
        }
      } catch {
        try {
          const errorText = await response.text()
          if (errorText) {
            errorMessage += ` - ${errorText}`
          }
        } catch {
          // If all else fails, use the basic error message
        }
      }
      
      console.error('❌ ElevenLabs API error:', errorMessage)
      throw new Error(errorMessage)
    }

    const audioBlob = await response.blob()
    console.log('✅ Voice generated successfully!')
    console.log('📊 Audio size:', audioBlob.size, 'bytes')
    console.log('🌍 Language used:', languageConfig.name, languageConfig.flag)
    
    return audioBlob
  } catch (error) {
    console.error('❌ Error generating voice:', error)
    
    if (error instanceof Error && error.message.includes('ElevenLabs API error:')) {
      throw error
    }
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('ElevenLabs API: Network connection failed. Please check your internet connection.')
    }
    
    const originalMessage = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`ElevenLabs voice generation failed: ${originalMessage}`)
  }
}

export async function getVoices() {
  try {
    const response = await fetch(`${ELEVENLABS_BASE_URL}/voices`, {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      }
    })

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.voices
  } catch (error) {
    console.error('Error fetching voices:', error)
    return []
  }
}

// Generate automatic banner/cover image using ElevenLabs (placeholder for future implementation)
export async function generateAutoBanner(title: string, genre: string): Promise<string> {
  // For now, return a genre-appropriate placeholder
  // In the future, this could integrate with image generation APIs
  const genreImages = {
    fantasy: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=400&fit=crop&q=80',
    'sci-fi': 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=800&h=400&fit=crop&q=80',
    mystery: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop&q=80',
    romance: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=400&fit=crop&q=80',
    horror: 'https://images.unsplash.com/photo-1520637836862-4d197d17c90a?w=800&h=400&fit=crop&q=80',
    adventure: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop&q=80',
    drama: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop&q=80',
    comedy: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=400&fit=crop&q=80',
    thriller: 'https://images.unsplash.com/photo-1520637836862-4d197d17c90a?w=800&h=400&fit=crop&q=80',
    historical: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop&q=80',
    contemporary: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=400&fit=crop&q=80',
    children: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=400&fit=crop&q=80'
  }
  
  console.log('🎨 Auto-generating banner for:', title, 'Genre:', genre)
  return genreImages[genre] || genreImages.fantasy
}

export async function uploadAudioToSupabase(audioBlob: Blob, storyId: string): Promise<string> {
  const { supabase } = await import('../supabase')
  
  try {
    console.log('📤 Starting audio upload to Supabase...')
    console.log('📊 Audio blob size:', audioBlob.size, 'bytes')
    console.log('📊 Audio blob type:', audioBlob.type)
    
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 15)
    const fileName = `story-audio-${storyId}-${timestamp}-${randomId}.mp3`
    
    console.log('📁 Uploading file:', fileName)
    
    if (audioBlob.size === 0) {
      throw new Error('Audio blob is empty')
    }
    
    const audioFile = new File([audioBlob], fileName, { 
      type: 'audio/mpeg',
      lastModified: Date.now()
    })
    
    console.log('📁 File created:', audioFile.name, audioFile.size, 'bytes')
    
    let uploadError = null
    let uploadData = null
    
    for (let attempt = 1; attempt <= 3; attempt++) {
      console.log(`📤 Upload attempt ${attempt}/3...`)
      
      const { data, error } = await supabase.storage
        .from('audio')
        .upload(fileName, audioFile, {
          contentType: 'audio/mpeg',
          upsert: false,
          cacheControl: '3600'
        })

      if (error) {
        console.error(`❌ Upload attempt ${attempt} failed:`, error)
        uploadError = error
        
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
        }
      } else {
        console.log('✅ Upload successful:', data)
        uploadData = data
        uploadError = null
        break
      }
    }

    if (uploadError) {
      console.error('❌ All upload attempts failed:', uploadError)
      throw new Error(`Failed to upload audio after 3 attempts: ${uploadError.message}`)
    }

    const { data: { publicUrl } } = supabase.storage
      .from('audio')
      .getPublicUrl(fileName)

    console.log('✅ Audio uploaded successfully!')
    console.log('🔗 Public URL:', publicUrl)

    return publicUrl
  } catch (error) {
    console.error('❌ Error in uploadAudioToSupabase:', error)
    throw new Error(`Failed to upload audio: ${error.message}`)
  }
}