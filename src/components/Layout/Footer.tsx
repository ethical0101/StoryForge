import React from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, Github, Mail, Linkedin } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container px-4 py-12 mx-auto">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-6 h-6 rounded-md bg-gradient-to-br from-purple-600 to-blue-600">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
              <span className="text-lg font-bold text-transparent bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text">
                StoryForge Pro
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Unleash your creativity with AI-powered storytelling, voice synthesis, and video narration.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="mb-4 font-semibold">Product</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/create-story" className="transition-colors hover:text-foreground">Create Stories</Link></li>
              <li><Link to="/explore" className="transition-colors hover:text-foreground">Explore</Link></li>
              <li><Link to="/library" className="transition-colors hover:text-foreground">Library</Link></li>
              <li><Link to="/dashboard" className="transition-colors hover:text-foreground">Dashboard</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="mb-4 font-semibold">Resources</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="transition-colors hover:text-foreground">Documentation</a></li>
              <li><a href="#" className="transition-colors hover:text-foreground">API Reference</a></li>
              <li><a href="#" className="transition-colors hover:text-foreground">Tutorials</a></li>
              <li><a href="#" className="transition-colors hover:text-foreground">Community</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 font-semibold">Connect</h3>
            <div className="flex space-x-4">
              <a
                href="https://github.com/ethical0101"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub Profile"
                className="transition-colors text-muted-foreground hover:text-foreground"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="https://www.linkedin.com/in/kommidruthendra/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn Profile"
                className="transition-colors text-muted-foreground hover:text-foreground"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="mailto:kommidruthendra2005@gmail.com"
                aria-label="Send Email"
                className="transition-colors text-muted-foreground hover:text-foreground"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="pt-8 mt-12 text-sm text-center border-t text-muted-foreground">
          <p>&copy; 2025 StoryForge Pro. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
