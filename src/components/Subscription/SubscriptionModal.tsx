import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Check, Crown, Zap, Star } from 'lucide-react'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { subscriptionPlans, revenueCat } from '../../lib/revenuecat'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

interface SubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SubscriptionModal({ isOpen, onClose }: SubscriptionModalProps) {
  const { user, profile, refreshSubscription } = useAuth()
  const [loading, setLoading] = useState<string | null>(null)
  const [offerings, setOfferings] = useState<any[]>([])

  useEffect(() => {
    if (isOpen && user) {
      loadOfferings()
    }
  }, [isOpen, user])

  async function loadOfferings() {
    try {
      const revenueCatOfferings = await revenueCat.getOfferings()
      setOfferings(revenueCatOfferings)
    } catch (error) {
      console.error('Failed to load offerings:', error)
    }
  }

  async function handleSubscribe(planId: string) {
    if (!user) {
      toast.error('Please sign in to subscribe')
      return
    }

    setLoading(planId)
    try {
      const customerInfo = await revenueCat.purchasePackage(planId)
      if (customerInfo) {
        await refreshSubscription()
        toast.success('Subscription activated successfully!')
        onClose()
      }
    } catch (error: any) {
      if (error.userCancelled) {
        toast.error('Purchase cancelled')
      } else {
        toast.error('Failed to process subscription')
      }
    } finally {
      setLoading(null)
    }
  }

  async function handleRestore() {
    if (!user) return

    setLoading('restore')
    try {
      const customerInfo = await revenueCat.restorePurchases()
      if (customerInfo) {
        await refreshSubscription()
        toast.success('Purchases restored successfully!')
      }
    } catch (error) {
      toast.error('Failed to restore purchases')
    } finally {
      setLoading(null)
    }
  }

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'free': return <Zap className="h-6 w-6" />
      case 'pro': return <Star className="h-6 w-6" />
      case 'premium': return <Crown className="h-6 w-6" />
      default: return <Zap className="h-6 w-6" />
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-4xl">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Choose Your Plan</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {subscriptionPlans.map((plan) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`relative border rounded-lg p-6 ${
                plan.popular 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border bg-card'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-4">
                <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center ${
                  plan.popular 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {getPlanIcon(plan.id)}
                </div>
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p className="text-muted-foreground text-sm">{plan.description}</p>
                <div className="mt-2">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  {plan.id !== 'free' && (
                    <span className="text-muted-foreground">/month</span>
                  )}
                </div>
              </div>

              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.popular ? 'neon' : 'outline'}
                className="w-full"
                onClick={() => handleSubscribe(plan.id)}
                loading={loading === plan.id}
                disabled={profile?.subscription_status === plan.id}
              >
                {loading === plan.id ? (
                  <LoadingSpinner size="sm" />
                ) : profile?.subscription_status === plan.id ? (
                  'Current Plan'
                ) : plan.id === 'free' ? (
                  'Current Plan'
                ) : (
                  `Subscribe to ${plan.name}`
                )}
              </Button>
            </motion.div>
          ))}
        </div>

        <div className="text-center">
          <Button
            variant="ghost"
            onClick={handleRestore}
            loading={loading === 'restore'}
            className="text-sm"
          >
            Restore Purchases
          </Button>
        </div>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>
            Subscriptions auto-renew. Cancel anytime in your account settings.
          </p>
          <p className="mt-1">
            By subscribing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </Modal>
  )
}