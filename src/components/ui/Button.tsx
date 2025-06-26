import React from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'neon' | 'demo'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  loading?: boolean
  children: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', loading, children, disabled, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'
    
    const variants = {
      default: 'bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-md hover:scale-[1.02] shadow-sm',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-md hover:scale-[1.02] shadow-sm',
      outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground hover:shadow-md hover:scale-[1.02] shadow-sm',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:shadow-md hover:scale-[1.02] shadow-sm',
      ghost: 'hover:bg-accent hover:text-accent-foreground hover:shadow-sm hover:scale-[1.02]',
      link: 'text-primary underline-offset-4 hover:underline hover:scale-[1.02]',
      neon: 'bg-gradient-to-r from-purple-600 to-blue-600 text-white border border-purple-500 hover:shadow-lg hover:shadow-purple-500/25 hover:border-purple-400 hover:scale-[1.02] transition-all duration-300 shadow-md',
      demo: 'bg-gradient-to-r from-orange-500 to-red-500 text-white border border-orange-400 hover:shadow-lg hover:shadow-orange-500/25 hover:border-orange-300 hover:scale-[1.02] transition-all duration-300 shadow-md font-semibold'
    }
    
    const sizes = {
      default: 'h-10 px-4 py-2',
      sm: 'h-9 rounded-md px-3',
      lg: 'h-11 rounded-md px-8',
      icon: 'h-10 w-10'
    }

    return (
      <motion.button
        ref={ref}
        className={cn(baseClasses, variants[variant], sizes[size], className)}
        disabled={loading || disabled}
        whileHover={{ scale: variant === 'neon' || variant === 'demo' ? 1.02 : 1.01 }}
        whileTap={{ scale: 0.98 }}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'

export { Button }