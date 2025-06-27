import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { PageLoader } from '../ui/LoadingSpinner'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, profile, loading, isDemo, isAuthenticated } = useAuth()
  const location = useLocation()

  // Show loading spinner while authentication state is being determined
  if (loading) {
    return <PageLoader />
  }

  // Check if user is authenticated (either real user or demo mode)
  if (!isAuthenticated) {
    console.log('🔒 User not authenticated, redirecting to login')
    return <Navigate to="/auth/login" state={{ from: location }} replace />
  }

  // For admin routes, require real authentication and admin role
  if (requireAdmin) {
    if (isDemo) {
      console.log('🚫 Demo mode cannot access admin routes, redirecting to dashboard')
      return <Navigate to="/dashboard" replace />
    }
    if (!user || profile?.role !== 'admin') {
      console.log('🚫 User is not admin, redirecting to dashboard')
      return <Navigate to="/dashboard" replace />
    }
  }

  // Additional safety check - if we have a user but no profile and not in demo mode
  if (user && !profile && !isDemo) {
    console.log('⚠️ User exists but no profile found, redirecting to login')
    return <Navigate to="/auth/login" replace />
  }

  return <>{children}</>
}
