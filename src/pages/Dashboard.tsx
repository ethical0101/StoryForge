import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  PlusCircle, 
  BookOpen, 
  TrendingUp, 
  Clock, 
  Eye,
  Heart,
  Users,
  Sparkles,
  Play,
  Star,
  Zap,
  Video
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { useAuth } from '../contexts/AuthContext'
import { getUserStories, Story } from '../lib/supabase'
import { formatDate, truncateText } from '../lib/utils'

export function Dashboard() {
  const { user, profile, isDemo, exitDemoMode, isAuthenticated } = useAuth()
  const [recentStories, setRecentStories] = useState<Story[]>([])
  const [stats, setStats] = useState({
    totalStories: 0,
    totalViews: 0,
    totalLikes: 0,
    followersCount: 0
  })
  const [loading, setLoading] = useState(true)

  // Demo data for preview mode
  const demoStories = [
    {
      id: 'demo-1',
      title: 'The Enchanted Forest',
      content: 'In a mystical realm where ancient trees whispered secrets and magical creatures roamed freely, a young adventurer discovered a hidden path that would change their destiny forever...',
      genre: 'fantasy',
      type: 'story' as const,
      length: 'medium' as const,
      is_public: true,
      author_id: 'demo-user',
      author_name: 'Demo Creator',
      author_avatar: null,
      cover_image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop&q=80',
      audio_url: null,
      video_url: null,
      likes_count: 42,
      views_count: 156,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'demo-2',
      title: 'Digital Dreams',
      content: 'In the year 2087, humanity had learned to upload consciousness into digital realms. Maya was the first to discover that these virtual worlds held secrets that could reshape reality itself...',
      genre: 'sci-fi',
      type: 'story' as const,
      length: 'long' as const,
      is_public: true,
      author_id: 'demo-user',
      author_name: 'Demo Creator',
      author_avatar: null,
      cover_image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop&q=80',
      audio_url: 'demo-audio',
      video_url: null,
      likes_count: 89,
      views_count: 234,
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 'demo-3',
      title: 'The Last Library',
      content: 'When books became extinct and knowledge was stored only in minds, Elena discovered an underground library that held the key to restoring human wisdom...',
      genre: 'drama',
      type: 'story' as const,
      length: 'short' as const,
      is_public: true,
      author_id: 'demo-user',
      author_name: 'Demo Creator',
      author_avatar: null,
      cover_image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop&q=80',
      audio_url: null,
      video_url: 'demo-video',
      likes_count: 67,
      views_count: 189,
      created_at: new Date(Date.now() - 172800000).toISOString(),
      updated_at: new Date(Date.now() - 172800000).toISOString()
    }
  ]

  const demoStats = {
    totalStories: 3,
    totalViews: 579,
    totalLikes: 198,
    followersCount: 24
  }

  useEffect(() => {
    if (isDemo) {
      setRecentStories(demoStories)
      setStats(demoStats)
      setLoading(false)
    } else if (user?.id && isAuthenticated) {
      fetchDashboardData()
    } else {
      setLoading(false)
    }
  }, [isDemo, user, isAuthenticated])

  async function fetchDashboardData() {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      console.log('🔄 Fetching dashboard data for user:', user.id)
      
      // Fetch user stories
      const stories = await getUserStories(user.id)
      console.log('✅ Fetched stories:', stories.length)
      
      setRecentStories(stories.slice(0, 6)) // Show latest 6 stories
      
      // Calculate stats
      const totalViews = stories.reduce((sum, story) => sum + story.views_count, 0)
      const totalLikes = stories.reduce((sum, story) => sum + story.likes_count, 0)
      
      setStats({
        totalStories: stories.length,
        totalViews,
        totalLikes,
        followersCount: profile?.followers_count || 0
      })
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Total Stories',
      value: stats.totalStories,
      icon: BookOpen,
      color: 'text-blue-600'
    },
    {
      title: 'Total Views',
      value: stats.totalViews,
      icon: Eye,
      color: 'text-green-600'
    },
    {
      title: 'Total Likes',
      value: stats.totalLikes,
      icon: Heart,
      color: 'text-red-600'
    },
    {
      title: 'Followers',
      value: stats.followersCount,
      icon: Users,
      color: 'text-purple-600'
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Demo Mode Banner */}
        {isDemo && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="demo-badge">
                      <Play className="h-3 w-3 mr-1" />
                      Demo Mode
                    </div>
                    <p className="text-sm font-medium">
                      You're exploring StoryForge Pro! This is sample data to show you what's possible.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link to="/auth/register">
                      <Button variant="neon" size="sm">
                        Sign Up Free
                      </Button>
                    </Link>
                    <Button variant="outline" size="sm" onClick={exitDemoMode}>
                      Exit Demo
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            {isDemo ? 'Welcome to StoryForge Pro! 🎉' : `Welcome back, ${profile?.full_name}! 👋`}
          </h1>
          <p className="text-muted-foreground text-lg">
            {isDemo 
              ? 'Explore the power of AI storytelling with this interactive demo'
              : 'Ready to create something amazing today?'
            }
          </p>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex flex-wrap gap-4">
            <Link to="/create-story">
              <Button variant="neon" size="lg" className="flex items-center gap-2">
                <PlusCircle className="h-5 w-5" />
                {isDemo ? 'Try Story Creator' : 'Create New Story'}
              </Button>
            </Link>
            <Link to="/library">
              <Button variant="outline" size="lg" className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                {isDemo ? 'View Sample Library' : 'My Library'}
              </Button>
            </Link>
            <Link to="/videos">
              <Button variant="outline" size="lg" className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                🎞️ My Videos
              </Button>
            </Link>
            <Link to="/explore">
              <Button variant="outline" size="lg" className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Explore Stories
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {statCards.map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card key={stat.title} className="hover:shadow-lg transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                      <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
                      {isDemo && (
                        <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">Sample data</p>
                      )}
                    </div>
                    <Icon className={`h-8 w-8 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </motion.div>

        {/* Recent Stories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  {isDemo ? 'Sample Stories' : 'Recent Stories'}
                </CardTitle>
                <Link to="/library">
                  <Button variant="ghost">View All</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {recentStories.length === 0 ? (
                <div className="text-center py-12">
                  <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No stories yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first story to get started!
                  </p>
                  <Link to="/create-story">
                    <Button variant="neon">
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Create Story
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recentStories.map((story) => (
                    <motion.div
                      key={story.id}
                      whileHover={{ y: -2 }}
                      className="group"
                    >
                      <Link to={isDemo ? '#' : `/story/${story.id}`}>
                        <Card className="h-full hover:shadow-lg transition-all">
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
                            <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">
                              {story.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-3">
                              {truncateText(story.content, 100)}
                            </p>
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
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
                          </CardContent>
                        </Card>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Demo CTA */}
        {isDemo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8"
          >
            <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
              <CardContent className="p-8 text-center">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                    <Zap className="h-8 w-8 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-2">Ready to Create Your Own Stories?</h3>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  You've seen what's possible with StoryForge Pro. Sign up now to create unlimited stories, 
                  generate voice narrations, and share your creativity with the world!
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link to="/auth/register">
                    <Button variant="neon" size="lg">
                      <Star className="h-5 w-5 mr-2" />
                      Start Creating Free
                    </Button>
                  </Link>
                  <Link to="/auth/login">
                    <Button variant="outline" size="lg">
                      Sign In
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  )
}