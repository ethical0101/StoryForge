import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { Navbar } from './components/Layout/Navbar'
import { Footer } from './components/Layout/Footer'
import { ProtectedRoute } from './components/Layout/ProtectedRoute'

// Pages
import { Landing } from './pages/Landing'
import { Login } from './pages/auth/Login'
import { Register } from './pages/auth/Register'
import { Dashboard } from './pages/Dashboard'
import { CreateStory } from './pages/CreateStory'
import { StoryViewer } from './pages/StoryViewer'
import { Library } from './pages/Library'
import { Explore } from './pages/Explore'
import { Profile } from './pages/Profile'
import { Admin } from './pages/Admin'
import { VideoLibrary } from './pages/VideoLibrary'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <main>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/auth/login" element={<Login />} />
                <Route path="/auth/register" element={<Register />} />
                
                {/* Protected routes */}
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/create-story" 
                  element={
                    <ProtectedRoute>
                      <CreateStory />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/story/:id" 
                  element={
                    <ProtectedRoute>
                      <StoryViewer />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/library" 
                  element={
                    <ProtectedRoute>
                      <Library />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/videos" 
                  element={
                    <ProtectedRoute>
                      <VideoLibrary />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/explore" 
                  element={
                    <ProtectedRoute>
                      <Explore />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/profile/:username" 
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin" 
                  element={
                    <ProtectedRoute requireAdmin>
                      <Admin />
                    </ProtectedRoute>
                  } 
                />
              </Routes>
            </main>
            <Footer />
            <Toaster
              position="bottom-right"
              toastOptions={{
                duration: 4000,
                className: 'bg-background text-foreground border',
              }}
            />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App