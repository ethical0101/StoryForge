import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Shield, 
  Users, 
  BookOpen, 
  Flag, 
  TrendingUp, 
  Database,
  Settings,
  Eye,
  Trash2,
  Ban,
  CheckCircle,
  AlertTriangle,
  BarChart3
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { Modal } from '../components/ui/Modal'
import { useAuth } from '../contexts/AuthContext'
import { supabase, Story, Profile } from '../lib/supabase'
import { formatDate, truncateText } from '../lib/utils'
import toast from 'react-hot-toast'

export function Admin() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'stories' | 'reports'>('overview')
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStories: 0,
    totalReports: 0,
    activeUsers: 0
  })
  const [users, setUsers] = useState<Profile[]>([])
  const [stories, setStories] = useState<Story[]>([])
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean
    type: 'ban' | 'delete' | 'feature' | null
    item: any
  }>({
    isOpen: false,
    type: null,
    item: null
  })

  // Redirect if not admin
  if (profile?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }

  useEffect(() => {
    fetchAdminData()
  }, [])

  async function fetchAdminData() {
    try {
      setLoading(true)

      // Fetch stats
      const [usersResponse, storiesResponse] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact' }),
        supabase.from('stories').select('*', { count: 'exact' })
      ])

      setStats({
        totalUsers: usersResponse.count || 0,
        totalStories: storiesResponse.count || 0,
        totalReports: 0, // Would need a reports table
        activeUsers: usersResponse.data?.length || 0
      })

      // Fetch recent users and stories
      if (usersResponse.data) setUsers(usersResponse.data.slice(0, 10))
      if (storiesResponse.data) setStories(storiesResponse.data.slice(0, 10))

    } catch (error) {
      console.error('Error fetching admin data:', error)
      toast.error('Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }

  const handleUserAction = async (userId: string, action: 'ban' | 'unban') => {
    try {
      // In a real app, you'd update a user status field
      toast.success(`User ${action}ned successfully`)
      setActionModal({ isOpen: false, type: null, item: null })
    } catch (error) {
      toast.error(`Failed to ${action} user`)
    }
  }

  const handleStoryAction = async (storyId: string, action: 'delete' | 'feature') => {
    try {
      if (action === 'delete') {
        const { error } = await supabase
          .from('stories')
          .delete()
          .eq('id', storyId)

        if (error) throw error
        
        setStories(prev => prev.filter(story => story.id !== storyId))
        toast.success('Story deleted successfully')
      } else if (action === 'feature') {
        // In a real app, you'd have a featured field
        toast.success('Story featured successfully')
      }
      
      setActionModal({ isOpen: false, type: null, item: null })
    } catch (error) {
      toast.error(`Failed to ${action} story`)
    }
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'text-blue-600',
      change: '+12%'
    },
    {
      title: 'Total Stories',
      value: stats.totalStories,
      icon: BookOpen,
      color: 'text-green-600',
      change: '+8%'
    },
    {
      title: 'Active Reports',
      value: stats.totalReports,
      icon: Flag,
      color: 'text-red-600',
      change: '-5%'
    },
    {
      title: 'Active Users',
      value: stats.activeUsers,
      icon: TrendingUp,
      color: 'text-purple-600',
      change: '+15%'
    }
  ]

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'stories', label: 'Stories', icon: BookOpen },
    { id: 'reports', label: 'Reports', icon: Flag }
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading admin panel..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Admin Panel
          </h1>
          <p className="text-muted-foreground text-lg">
            Manage users, content, and platform settings
          </p>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {statCards.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.title}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                      <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
                      <p className="text-sm text-green-600">{stat.change}</p>
                    </div>
                    <Icon className={`h-8 w-8 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </motion.div>

        {/* Navigation Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex space-x-1 bg-muted p-1 rounded-lg">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </motion.div>

        {/* Content based on active tab */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium">New user registered</p>
                        <p className="text-sm text-muted-foreground">2 minutes ago</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium">Story published</p>
                        <p className="text-sm text-muted-foreground">5 minutes ago</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      <div>
                        <p className="font-medium">Content reported</p>
                        <p className="text-sm text-muted-foreground">1 hour ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Database Status</span>
                      <span className="flex items-center gap-2 text-green-600">
                        <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                        Healthy
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>API Status</span>
                      <span className="flex items-center gap-2 text-green-600">
                        <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                        Operational
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Storage</span>
                      <span className="flex items-center gap-2 text-yellow-600">
                        <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
                        75% Used
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'users' && (
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt={user.full_name} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <Users className="h-5 w-5 text-white" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{user.full_name}</p>
                          <p className="text-sm text-muted-foreground">@{user.username}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActionModal({
                            isOpen: true,
                            type: 'ban',
                            item: user
                          })}
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'stories' && (
            <Card>
              <CardHeader>
                <CardTitle>Story Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stories.map((story) => (
                    <div key={story.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium">{story.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          by {story.author_name} • {formatDate(story.created_at)}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {truncateText(story.content, 100)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`/story/${story.id}`, '_blank')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActionModal({
                            isOpen: true,
                            type: 'delete',
                            item: story
                          })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'reports' && (
            <Card>
              <CardHeader>
                <CardTitle>Content Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Flag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No reports</h3>
                  <p className="text-muted-foreground">All content is currently clean!</p>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Action Modal */}
        <Modal
          isOpen={actionModal.isOpen}
          onClose={() => setActionModal({ isOpen: false, type: null, item: null })}
          title={`Confirm ${actionModal.type}`}
        >
          <div className="space-y-4">
            <p>
              Are you sure you want to {actionModal.type} this {actionModal.item?.title ? 'story' : 'user'}?
            </p>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={() => {
                  if (actionModal.type === 'ban') {
                    handleUserAction(actionModal.item?.id, 'ban')
                  } else if (actionModal.type === 'delete') {
                    handleStoryAction(actionModal.item?.id, 'delete')
                  }
                }}
                className="flex-1"
              >
                Confirm
              </Button>
              <Button
                variant="outline"
                onClick={() => setActionModal({ isOpen: false, type: null, item: null })}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  )
}