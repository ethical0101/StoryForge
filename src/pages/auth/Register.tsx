import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, User, Eye, EyeOff, Sparkles, AtSign, AlertCircle } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

export function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    username: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{[key: string]: string}>({})

  const { signUp, isAuthenticated, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, authLoading, navigate])

  // Don't render if user is already authenticated
  if (isAuthenticated) {
    return null
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({...prev, [name]: ''}))
    }
  }

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required'
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters'
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)
    setErrors({})

    try {
      await signUp(formData.email, formData.password, formData.fullName, formData.username)

      // Show success message and redirect
      toast.success('Account created successfully! Welcome to StoryForge Pro!')

      // Small delay to show the success message
      setTimeout(() => {
        navigate('/dashboard')
      }, 1000)

    } catch (error: any) {
      console.error('Registration error:', error)

      if (error.message?.includes('User already registered') || error.message?.includes('already_exists')) {
        toast.error('An account with this email already exists. Please sign in instead.')
      } else if (error.message?.includes('Username is already taken')) {
        setErrors({username: 'This username is already taken'})
        toast.error('Username is already taken. Please choose another.')
      } else if (error.message?.includes('Password should be at least 6 characters')) {
        setErrors({password: 'Password must be at least 6 characters'})
      } else if (error.message?.includes('Invalid email')) {
        setErrors({email: 'Please enter a valid email address'})
      } else {
        toast.error(error.message || 'Failed to create account. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 px-4 py-8">
      <div className="absolute inset-0 bg-black/20" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative w-full max-w-md"
      >
        <Card className="border-purple-200 dark:border-purple-800 shadow-2xl">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
            <p className="text-muted-foreground">Join StoryForge Pro and start creating</p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    name="fullName"
                    type="text"
                    placeholder="Full Name"
                    value={formData.fullName}
                    onChange={handleChange}
                    className={`pl-10 ${errors.fullName ? 'border-red-500' : ''}`}
                    autoComplete="name"
                    disabled={loading}
                  />
                  {errors.fullName && (
                    <div className="flex items-center gap-1 mt-1 text-red-500 text-xs">
                      <AlertCircle className="h-3 w-3" />
                      {errors.fullName}
                    </div>
                  )}
                </div>

                <div className="relative">
                  <AtSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    name="username"
                    type="text"
                    placeholder="Username"
                    value={formData.username}
                    onChange={handleChange}
                    className={`pl-10 ${errors.username ? 'border-red-500' : ''}`}
                    autoComplete="username"
                    disabled={loading}
                  />
                  {errors.username && (
                    <div className="flex items-center gap-1 mt-1 text-red-500 text-xs">
                      <AlertCircle className="h-3 w-3" />
                      {errors.username}
                    </div>
                  )}
                </div>
              </div>

              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  name="email"
                  type="email"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={handleChange}
                  className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                  autoComplete="email"
                  disabled={loading}
                />
                {errors.email && (
                  <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
                    <AlertCircle className="h-3 w-3" />
                    {errors.email}
                  </div>
                )}
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password (min 6 characters)"
                  value={formData.password}
                  onChange={handleChange}
                  className={`pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                  autoComplete="new-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                {errors.password && (
                  <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
                    <AlertCircle className="h-3 w-3" />
                    {errors.password}
                  </div>
                )}
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`pl-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                  autoComplete="new-password"
                  disabled={loading}
                />
                {errors.confirmPassword && (
                  <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
                    <AlertCircle className="h-3 w-3" />
                    {errors.confirmPassword}
                  </div>
                )}
              </div>

              <Button
                type="submit"
                variant="neon"
                size="lg"
                className="w-full"
                loading={loading}
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link to="/auth/login" className="text-primary hover:underline font-medium">
                  Sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
