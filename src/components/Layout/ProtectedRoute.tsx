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

  if (loading) {
    return <PageLoader />
  }

  // Check if user is authenticated (either real user or demo mode)
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />
  }

  // For admin routes, require real authentication and admin role
  if (requireAdmin) {
    if (isDemo) {
      return <Navigate to="/dashboard" replace />
    }
    if (!user || profile?.role !== 'admin') {
      return <Navigate to="/dashboard" replace />
    }
  }

  return <>{children}</>
}