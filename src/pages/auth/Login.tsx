import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, Sparkles, AlertCircle } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{email?: string, password?: string}>({})
  
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  const from = location.state?.from?.pathname || '/dashboard'

  const validateForm = () => {
    const newErrors: {email?: string, password?: string} = {}
    
    if (!email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email'
    }
    
    if (!password) {
      newErrors.password = 'Password is required'
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
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
      await signIn(email, password)
      
      // Show success message
      toast.success('Welcome back!')
      
      // Small delay to show the success message
      setTimeout(() => {
        navigate(from, { replace: true })
      }, 1000)
      
    } catch (error: any) {
      console.error('Login error:', error)
      
      if (error.message?.includes('Invalid login credentials')) {
        toast.error('Invalid email or password. Please check your credentials.')
      } else if (error.message?.includes('Email not confirmed')) {
        toast.error('Please confirm your email address before signing in.')
      } else if (error.message?.includes('Too many requests')) {
        toast.error('Too many login attempts. Please try again later.')
      } else {
        toast.error(error.message || 'Failed to sign in. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 px-4">
      <div className="absolute inset-0 bg-black/20" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative w-full max-w-md"
      >
        <Card className="border-purple-200 dark:border-purple-800 shadow-2xl">
          <CardHeader className="text-center pb-8">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
            <p className="text-muted-foreground">Sign in to your StoryForge Pro account</p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (errors.email) setErrors(prev => ({...prev, email: undefined}))
                    }}
                    className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                    autoComplete="email"
                    autoFocus
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
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if (errors.password) setErrors(prev => ({...prev, password: undefined}))
                    }}
                    className={`pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                    autoComplete="current-password"
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
              </div>

              <Button
                type="submit"
                variant="neon"
                size="lg"
                className="w-full"
                loading={loading}
                disabled={loading}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link to="/auth/register" className="text-primary hover:underline font-medium">
                  Sign up here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}