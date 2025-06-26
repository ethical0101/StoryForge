import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Sparkles, 
  Mic, 
  Video, 
  BookOpen, 
  Users, 
  Zap, 
  ArrowRight,
  Star,
  CheckCircle,
  Play
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card, CardContent } from '../components/ui/Card'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export function Landing() {
  const { enterDemoMode } = useAuth()
  const navigate = useNavigate()

  const handleTryDemo = () => {
    enterDemoMode()
    navigate('/dashboard')
  }

  const features = [
    {
      icon: Sparkles,
      title: 'AI Story Generation',
      description: 'Create compelling stories, poems, scripts, and blogs with advanced AI technology.'
    },
    {
      icon: Mic,
      title: 'Voice Synthesis',
      description: 'Transform your stories into lifelike audio narrations with ElevenLabs technology.'
    },
    {
      icon: Video,
      title: 'Video Narration',
      description: 'Generate professional video presentations of your stories with AI avatars.'
    },
    {
      icon: BookOpen,
      title: 'Story Library',
      description: 'Organize, manage, and share your creative works in your personal library.'
    },
    {
      icon: Users,
      title: 'Community',
      description: 'Discover, like, and comment on stories from creators around the world.'
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Generate content in seconds with our optimized AI pipeline.'
    }
  ]

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Content Creator',
      content: 'StoryForge Pro revolutionized my creative process. I can now create engaging content with audio and video in minutes!',
      rating: 5
    },
    {
      name: 'Marcus Johnson',
      role: 'Author',
      content: 'The AI-generated stories are incredibly creative and the voice synthesis is so realistic. This tool is a game-changer.',
      rating: 5
    },
    {
      name: 'Emily Rodriguez',
      role: 'Educator',  
      content: 'My students love creating stories with StoryForge Pro. The platform makes storytelling accessible and fun for everyone.',
      rating: 5
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative container mx-auto px-4 py-24 lg:py-32">
          <div className="text-center space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
                Your Personalized
                <span className="block bg-gradient-to-r from-yellow-400 to-pink-400 bg-clip-text text-transparent">
                  AI Story Universe
                </span>
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto"
            >
              Create compelling stories with AI, bring them to life with realistic voices, 
              and share them with video narration - all in one powerful platform.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Link to="/auth/register">
                <Button 
                  size="lg" 
                  variant="neon"
                  className="text-lg px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-purple-500/25"
                >
                  Start Creating Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button 
                size="lg" 
                variant="demo"
                onClick={handleTryDemo}
                className="text-lg px-8 py-4"
              >
                <Play className="mr-2 h-5 w-5" />
                Try Demo
              </Button>
              <Link to="/explore">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="text-lg px-8 py-4 border-white text-white hover:bg-white hover:text-gray-900"
                >
                  Explore Stories
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-sm text-gray-300"
            >
              <span className="demo-badge">Demo Mode</span> - No signup required • Full features preview
            </motion.div>
          </div>
        </div>

        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white/20 rounded-full"
              initial={{ 
                x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
                y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000),
                opacity: 0
              }}
              animate={{ 
                y: -100,
                opacity: [0, 1, 0]
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                repeat: Infinity,
                delay: Math.random() * 2
              }}
            />
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to Create Amazing Stories
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powered by the latest AI technology from Google Gemini, ElevenLabs, and Tavus
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow border border-purple-200 dark:border-purple-800">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center mb-4">
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-accent/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Loved by Creators Worldwide
            </h2>
            <p className="text-xl text-muted-foreground">
              See what our community has to say about StoryForge Pro
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <blockquote className="text-muted-foreground mb-4">
                      "{testimonial.content}"
                    </blockquote>
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-purple-600 to-blue-600">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Ready to Transform Your Stories?
            </h2>
            <p className="text-xl text-gray-200 max-w-2xl mx-auto">
              Join thousands of creators who are already using StoryForge Pro to bring their imagination to life.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/auth/register">
                <Button 
                  size="lg"
                  className="text-lg px-8 py-4 bg-white text-purple-600 hover:bg-gray-100"
                >
                  Get Started Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button 
                size="lg"
                variant="demo"
                onClick={handleTryDemo}
                className="text-lg px-8 py-4 bg-orange-500 hover:bg-orange-600"
              >
                <Play className="mr-2 h-5 w-5" />
                Try Demo First
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}