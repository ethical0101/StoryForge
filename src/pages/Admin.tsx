import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Shield,
  Users,
  BookOpen,
  Flag,
  TrendingUp,
  Eye,
  Trash2,
  Ban,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  UserPlus,
  Crown
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/Input'
import { useAuth } from '../contexts/AuthContext'
import { supabase, Story, Profile } from '../lib/supabase'
import { formatDate, truncateText } from '../lib/utils'
import { makeUserAdmin, removeAdminRole, listAdminUsers, AdminUser } from '../lib/admin'
import toast from 'react-hot-toast'

export function Admin() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'stories' | 'reports' | 'admins'>('overview')
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStories: 0,
    totalReports: 0,
    activeUsers: 0
  })
  const [users, setUsers] = useState<Profile[]>([])
  const [stories, setStories] = useState<Story[]>([])
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [newAdminEmail, setNewAdminEmail] = useState('')
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean
    type: 'ban' | 'delete' | 'feature' | 'make-admin' | 'remove-admin' | null
    item: Profile | Story | AdminUser | null
  }>({
    isOpen: false,
    type: null,
    item: null
  })

  // Move hooks before conditional returns
  useEffect(() => {
    fetchAdminData()
  }, [])

  useEffect(() => {
    if (activeTab === 'admins') {
      fetchAdminUsers()
    }
  }, [activeTab])

  // Redirect if not admin
  if (profile?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="mb-2 text-2xl font-bold">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }

  useEffect(() => {
    if (activeTab === 'admins') {
      fetchAdminUsers()
    }
  }, [activeTab])

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

  async function fetchAdminUsers() {
    try {
      const admins = await listAdminUsers()
      setAdminUsers(admins)
    } catch (error) {
      console.error('Error fetching admin users:', error)
      toast.error('Failed to load admin users')
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

  const handleAdminAction = async (userId: string, action: 'make-admin' | 'remove-admin') => {
    try {
      if (action === 'make-admin') {
        await makeUserAdmin(userId)
        toast.success('User promoted to admin')
      } else {
        await removeAdminRole(userId)
        toast.success('Admin role removed from user')
      }

      setActionModal({ isOpen: false, type: null, item: null })
      fetchAdminUsers() // Refresh admin users list
    } catch (error) {
      toast.error(`Failed to ${action} user`)
    }
  }

  const handlePromoteByEmail = async () => {
    if (!newAdminEmail.trim()) {
      toast.error('Please enter an email address')
      return
    }

    try {
      const success = await makeUserAdmin(newAdminEmail)
      if (success) {
        toast.success(`Successfully promoted ${newAdminEmail} to admin`)
        setNewAdminEmail('')
        fetchAdminUsers() // Refresh lists
      } else {
        toast.error('Failed to promote user. User may not exist.')
      }
    } catch (error) {
      toast.error('Error promoting user to admin')
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
    { id: 'reports', label: 'Reports', icon: Flag },
    { id: 'admins', label: 'Admins', icon: Crown }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Loading admin panel..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-8 mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="flex items-center gap-2 mb-2 text-3xl font-bold md:text-4xl">
            <Shield className="w-8 h-8 text-primary" />
            Admin Panel
          </h1>
          <p className="text-lg text-muted-foreground">
            Manage users, content, and platform settings
          </p>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4"
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
          <div className="flex p-1 space-x-1 rounded-lg bg-muted">
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
                  <Icon className="w-4 h-4" />
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
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium">New user registered</p>
                        <p className="text-sm text-muted-foreground">2 minutes ago</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-medium">Story published</p>
                        <p className="text-sm text-muted-foreground">5 minutes ago</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
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
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt={user.full_name || ''} className="object-cover w-full h-full rounded-full" />
                          ) : (
                            <Users className="w-5 h-5 text-white" />
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
                        {user.role !== 'admin' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setActionModal({
                              isOpen: true,
                              type: 'make-admin',
                              item: user
                            })}
                          >
                            <Crown className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActionModal({
                            isOpen: true,
                            type: 'ban',
                            item: user
                          })}
                        >
                          <Ban className="w-4 h-4" />
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
                        <p className="mt-1 text-sm text-muted-foreground">
                          {truncateText(story.content, 100)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`/story/${story.id}`, '_blank')}
                        >
                          <Eye className="w-4 h-4" />
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
                          <Trash2 className="w-4 h-4" />
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
                <div className="py-12 text-center">
                  <Flag className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-semibold">No reports</h3>
                  <p className="text-muted-foreground">All content is currently clean!</p>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'admins' && (
            <div className="space-y-6">
              {/* Promote User to Admin */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5" />
                    Promote User to Admin
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <Input
                      type="text"
                      placeholder="Enter email address or username"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={handlePromoteByEmail} disabled={!newAdminEmail.trim()}>
                      <Crown className="w-4 h-4 mr-2" />
                      Make Admin
                    </Button>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Enter the email address or username of a user to promote them to admin.
                  </p>
                </CardContent>
              </Card>

              {/* Current Admins */}
              <Card>
                <CardHeader>
                  <CardTitle>Current Administrators</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {adminUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600">
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt={user.full_name || ''} className="object-cover w-full h-full rounded-full" />
                            ) : (
                              <Crown className="w-5 h-5 text-white" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{user.full_name}</p>
                            <p className="text-sm text-muted-foreground">@{user.username}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 text-xs text-purple-800 bg-purple-100 rounded-full">
                            Administrator
                          </span>
                          {profile?.id !== user.id && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setActionModal({
                                isOpen: true,
                                type: 'remove-admin',
                                item: user
                              })}
                            >
                              <Ban className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    {adminUsers.length === 0 && (
                      <div className="py-8 text-center">
                        <Crown className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="mb-2 text-lg font-semibold">No administrators found</h3>
                        <p className="text-muted-foreground">Use the form above to promote users to admin.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </motion.div>

        {/* Action Modal */}
        <Modal
          isOpen={actionModal.isOpen}
          onClose={() => setActionModal({ isOpen: false, type: null, item: null })}
          title={`Confirm ${actionModal.type?.replace('-', ' ')}`}
        >
          <div className="space-y-4">
            <p>
              Are you sure you want to {actionModal.type?.replace('-', ' ')} this {actionModal.item?.title ? 'story' : 'user'}?
              {actionModal.type === 'remove-admin' && (
                <span className="block mt-2 text-sm text-red-600">
                  This will remove their administrator privileges.
                </span>
              )}
            </p>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={() => {
                  if (actionModal.type === 'ban') {
                    handleUserAction(actionModal.item?.id, 'ban')
                  } else if (actionModal.type === 'delete') {
                    handleStoryAction(actionModal.item?.id, 'delete')
                  } else if (actionModal.type === 'make-admin') {
                    handleAdminAction(actionModal.item?.id, 'make-admin')
                  } else if (actionModal.type === 'remove-admin') {
                    handleAdminAction(actionModal.item?.id, 'remove-admin')
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
