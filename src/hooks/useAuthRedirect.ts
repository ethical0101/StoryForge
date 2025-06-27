import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

/**
 * Custom hook to handle authentication-based routing
 * Redirects users based on their authentication status
 */
export function useAuthRedirect() {
  const { isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // Don't redirect while auth state is loading
    if (loading) return

    const publicRoutes = ['/', '/auth/login', '/auth/register']
    const isPublicRoute = publicRoutes.includes(location.pathname)

    // If user is on a public route and authenticated, redirect to dashboard
    if (isAuthenticated && isPublicRoute) {
      const from = location.state?.from?.pathname
      navigate(from || '/dashboard', { replace: true })
    }

    // If user is on a protected route and not authenticated, redirect to login
    if (!isAuthenticated && !isPublicRoute) {
      navigate('/auth/login', {
        state: { from: location },
        replace: true
      })
    }
  }, [isAuthenticated, loading, location, navigate])

  return { isAuthenticated, loading }
}

/**
 * Hook to check if user can access admin routes
 */
export function useAdminAccess() {
  const { user, profile, isDemo } = useAuth()

  const canAccessAdmin = !isDemo && user && profile?.role === 'admin'

  return { canAccessAdmin }
}
