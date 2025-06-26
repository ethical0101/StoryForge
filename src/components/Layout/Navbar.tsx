import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Home,
  PlusCircle,
  Library,
  Compass,
  User,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  Sparkles,
  Play,
  Video,
  Code,
  Github,
  Linkedin,
  Instagram,
  Twitter,
  Globe,
  Star
} from 'lucide-react'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { cn } from '../../lib/utils'

export function Navbar() {
  const { user, profile, signOut, isDemo, exitDemoMode } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showDeveloperInfo, setShowDeveloperInfo] = useState(false)

  // Only show full navigation if user is authenticated (not demo mode)
  const showFullNav = user && profile && !isDemo

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Create', href: '/create-story', icon: PlusCircle },
    { name: 'Library', href: '/library', icon: Library },
    { name: 'Videos', href: '/videos', icon: Video },
    { name: 'Explore', href: '/explore', icon: Compass },
  ]

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleExitDemo = () => {
    exitDemoMode()
    navigate('/')
  }

  const isActive = (path: string) => location.pathname === path

  return (
    <>
      <nav className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container px-4 mx-auto">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to={showFullNav || isDemo ? '/dashboard' : '/'} className="flex items-center space-x-2">
              <motion.div
                className="flex items-center space-x-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-bold text-transparent bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text">
                  StoryForge Pro
                </span>
                {isDemo && (
                  <span className="text-xs demo-badge">
                    <Play className="w-2 h-2 mr-1" />
                    Demo
                  </span>
                )}
              </motion.div>
            </Link>

            {/* Desktop Navigation - Only show if fully authenticated */}
            {showFullNav && (
              <div className="items-center hidden space-x-1 md:flex">
                {navItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={cn(
                        'flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:scale-105',
                        isActive(item.href)
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent hover:shadow-sm'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </Link>
                  )
                })}
              </div>
            )}

            {/* Right side */}
            <div className="flex items-center space-x-2">
              {/* About Developer Button - Always visible */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeveloperInfo(true)}
                className="items-center hidden gap-2 border border-purple-200 sm:flex bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 dark:border-purple-800 hover:from-purple-100 hover:to-blue-100 dark:hover:from-purple-900/30 dark:hover:to-blue-900/30"
              >
                <Code className="w-4 h-4" />
                About Developer
              </Button>

              {/* Theme toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="transition-transform rounded-full hover:scale-105"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>

              {showFullNav ? (
                <>
                  {/* Authenticated user menu */}
                  <div className="items-center hidden space-x-2 md:flex">
                    <Link to={`/profile/${profile?.username}`}>
                      <Button variant="ghost" size="icon" className="transition-transform rounded-full hover:scale-105">
                        <User className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleSignOut}
                      className="transition-transform rounded-full hover:scale-105"
                    >
                      <LogOut className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Mobile menu button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  >
                    {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                  </Button>
                </>
              ) : isDemo ? (
                <>
                  {/* Demo mode buttons */}
                  <div className="items-center hidden space-x-2 md:flex">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExitDemo}
                    >
                      Exit Demo
                    </Button>
                    <Link to="/auth/register">
                      <Button variant="neon" size="sm">
                        Sign Up Free
                      </Button>
                    </Link>
                  </div>

                  {/* Mobile menu button for demo */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  >
                    {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                  </Button>
                </>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link to="/auth/login">
                    <Button variant="ghost" className="transition-transform hover:scale-105">Sign In</Button>
                  </Link>
                  <Link to="/auth/register">
                    <Button variant="neon" className="transition-transform hover:scale-105">Get Started</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu */}
          {(showFullNav || isDemo) && mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="py-4 border-t md:hidden"
            >
              <div className="space-y-2">
                {/* About Developer - Mobile */}
                <button
                  onClick={() => {
                    setShowDeveloperInfo(true)
                    setMobileMenuOpen(false)
                  }}
                  className="flex items-center w-full px-3 py-2 space-x-2 text-sm font-medium text-left rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
                >
                  <Code className="w-4 h-4" />
                  <span>About Developer</span>
                </button>

                {(showFullNav || isDemo) && navItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={cn(
                        'flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                        isActive(item.href)
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                      )}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </Link>
                  )
                })}

                <div className="pt-2 space-y-2 border-t">
                  {showFullNav ? (
                    <>
                      <Link
                        to={`/profile/${profile?.username}`}
                        className="flex items-center px-3 py-2 space-x-2 text-sm font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <User className="w-4 h-4" />
                        <span>Profile</span>
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center w-full px-3 py-2 space-x-2 text-sm font-medium text-left rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </>
                  ) : isDemo ? (
                    <>
                      <button
                        onClick={() => {
                          handleExitDemo()
                          setMobileMenuOpen(false)
                        }}
                        className="flex items-center w-full px-3 py-2 space-x-2 text-sm font-medium text-left rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
                      >
                        <X className="w-4 h-4" />
                        <span>Exit Demo</span>
                      </button>
                      <Link
                        to="/auth/register"
                        className="flex items-center px-3 py-2 space-x-2 text-sm font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Sign Up Free</span>
                      </Link>
                    </>
                  ) : null}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </nav>

      {/* Developer Info Modal with Extended Width */}
      <Modal
        isOpen={showDeveloperInfo}
        onClose={() => setShowDeveloperInfo(false)}
        title="About the Developer"
        className="max-w-4xl"
      >
        <div className="p-6 space-y-6 modal-content scroll-container">
          {/* Developer Header */}
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-4 overflow-hidden border-4 rounded-full border-gradient-to-br from-purple-600 to-blue-600">
              <img
                src="https://lh3.googleusercontent.com/d/1qk5_k64IQmJVJRHGC7kmXUXiOBmed9oa"
                alt="Kommi Druthendra"
                className="object-cover w-full h-full"
                onError={(e) => {
                  // Hide the broken image and show fallback
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              <div
                className="items-center justify-center hidden w-full h-full text-2xl font-bold text-white rounded-full bg-gradient-to-br from-purple-600 to-blue-600"
              >
                KD
              </div>
            </div>
            <h3 className="mb-2 text-3xl font-bold">KOMMI DRUTHENDRA</h3>
            <p className="text-lg text-muted-foreground">Full Stack Developer & AI Enthusiast</p>
          </div>

          {/* About */}
          <div className="p-6 border rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
            <h4 className="flex items-center gap-2 mb-3 text-lg font-semibold">
              <Star className="w-5 h-5 text-yellow-500" />
              About StoryForge Pro
            </h4>
            <p className="leading-relaxed text-muted-foreground">
              StoryForge Pro is a cutting-edge AI-powered storytelling platform that combines the latest in
              artificial intelligence with creative writing. Built with modern web technologies and integrated
              with powerful AI services like Google Gemini, ElevenLabs, and Tavus to provide an unparalleled
              creative experience. This platform demonstrates advanced full-stack development skills, AI integration,
              real-time features, and modern UI/UX design principles.
            </p>
          </div>

          {/* Social Links */}
          <div>
            <h4 className="mb-4 text-lg font-semibold">Connect with the Developer</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <a
                href="https://github.com/ethical0101"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 transition-colors border rounded-lg hover:bg-accent group"
              >
                <Github className="w-6 h-6 transition-transform group-hover:scale-110" />
                <div>
                  <p className="font-medium">GitHub</p>
                  <p className="text-sm text-muted-foreground">@ethical0101</p>
                </div>
              </a>

              <a
                href="https://www.linkedin.com/in/kommidruthendra/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 transition-colors border rounded-lg hover:bg-accent group"
              >
                <Linkedin className="w-6 h-6 text-blue-600 transition-transform group-hover:scale-110" />
                <div>
                  <p className="font-medium">LinkedIn</p>
                  <p className="text-sm text-muted-foreground">Kommi Druthendra</p>
                </div>
              </a>

              <a
                href="https://www.instagram.com/i__am__hack_er/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 transition-colors border rounded-lg hover:bg-accent group"
              >
                <Instagram className="w-6 h-6 text-pink-600 transition-transform group-hover:scale-110" />
                <div>
                  <p className="font-medium">Instagram</p>
                  <p className="text-sm text-muted-foreground">@i__am__hack_er</p>
                </div>
              </a>

              <a
                href="https://x.com/Druthendra"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 transition-colors border rounded-lg hover:bg-accent group"
              >
                <Twitter className="w-6 h-6 transition-transform group-hover:scale-110" />
                <div>
                  <p className="font-medium">Twitter / X</p>
                  <p className="text-sm text-muted-foreground">@Druthendra</p>
                </div>
              </a>
            </div>
          </div>

          {/* Portfolio Highlight */}
          <div className="p-6 border rounded-lg bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20">
            <h4 className="flex items-center gap-2 mb-3 text-lg font-semibold">
              <Globe className="w-5 h-5 text-green-600" />
              Personal Portfolio
            </h4>
            <p className="mb-4 text-muted-foreground">
              Explore more projects and learn about my development journey through my personal portfolio website.
              Discover a collection of innovative projects showcasing expertise in modern web development, AI integration,
              and creative problem-solving.
            </p>
            <a
              href="https://ethical0101.github.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 font-medium text-white transition-colors bg-green-600 rounded-lg hover:bg-green-700"
            >
              <Globe className="w-4 h-4" />
              Visit Portfolio
            </a>
          </div>

          {/* Tech Stack */}
          <div>
            <h4 className="mb-4 text-lg font-semibold">Technologies & Skills Demonstrated</h4>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {[
                'React & TypeScript', 'Tailwind CSS', 'Supabase Database',
                'Google Gemini AI', 'ElevenLabs Voice AI', 'Tavus Video AI',
                'Framer Motion', 'Real-time Features', 'Authentication & Security',
                'Responsive Design', 'State Management', 'API Integration'
              ].map((tech) => (
                <span
                  key={tech}
                  className="px-3 py-2 text-sm font-medium text-center transition-colors rounded-lg bg-muted hover:bg-accent"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* Project Features */}
          <div className="p-6 border rounded-lg bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20">
            <h4 className="mb-3 text-lg font-semibold">🚀 Key Features Implemented</h4>
            <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
              <div>
                <h5 className="mb-2 font-medium">🤖 AI Integration</h5>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Multi-language story generation</li>
                  <li>• Realistic voice synthesis</li>
                  <li>• AI video avatar creation</li>
                  <li>• Smart content optimization</li>
                </ul>
              </div>
              <div>
                <h5 className="mb-2 font-medium">💻 Technical Excellence</h5>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Real-time progress tracking</li>
                  <li>• Secure authentication system</li>
                  <li>• Responsive design patterns</li>
                  <li>• Performance optimization</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="pt-6 text-center border-t">
            <p className="text-muted-foreground">
              Built with ❤️ by Kommi Druthendra • © 2024 StoryForge Pro
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Showcasing modern web development and AI integration expertise
            </p>
          </div>
        </div>
      </Modal>
    </>
  )
}
