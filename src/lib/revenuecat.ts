import * as Purchases from '@revenuecat/purchases-js'
import type { PurchasesOffering, CustomerInfo } from '@revenuecat/purchases-js'

const REVENUECAT_API_KEY = import.meta.env.VITE_REVENUECAT_API_KEY || 'your_revenuecat_api_key'

export interface SubscriptionPlan {
  id: string
  name: string
  description: string
  price: string
  features: string[]
  popular?: boolean
}

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for getting started',
    price: '$0',
    features: [
      '3 stories per month',
      'Basic AI generation',
      'Community access',
      'Standard support'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For serious creators',
    price: '$9.99/month',
    features: [
      'Unlimited stories',
      'Advanced AI generation',
      'Voice narration',
      'Priority support',
      'Custom genres',
      'Export options'
    ],
    popular: true
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'For professional storytellers',
    price: '$19.99/month',
    features: [
      'Everything in Pro',
      'Video narration',
      'Custom AI voices',
      'Advanced analytics',
      'White-label options',
      'API access',
      'Dedicated support'
    ]
  }
]

class RevenueCatService {
  private initialized = false

  async initialize(userId: string) {
    if (this.initialized) return

    try {
      await Purchases.configure({
        apiKey: REVENUECAT_API_KEY,
        appUserId: userId
      })
      this.initialized = true
    } catch (error) {
      console.error('Failed to initialize RevenueCat:', error)
    }
  }

  async getOfferings(): Promise<PurchasesOffering[]> {
    try {
      const offerings = await Purchases.getOfferings()
      return Object.values(offerings.all)
    } catch (error) {
      console.error('Failed to get offerings:', error)
      return []
    }
  }

  async purchasePackage(packageId: string): Promise<CustomerInfo | null> {
    try {
      const offerings = await this.getOfferings()
      const offering = offerings.find(o => o.identifier === 'default')
      const packageToPurchase = offering?.availablePackages.find(p => p.identifier === packageId)
      
      if (!packageToPurchase) {
        throw new Error('Package not found')
      }

      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase)
      return customerInfo
    } catch (error) {
      console.error('Failed to purchase package:', error)
      return null
    }
  }

  async restorePurchases(): Promise<CustomerInfo | null> {
    try {
      const customerInfo = await Purchases.restorePurchases()
      return customerInfo
    } catch (error) {
      console.error('Failed to restore purchases:', error)
      return null
    }
  }

  async getCustomerInfo(): Promise<CustomerInfo | null> {
    try {
      const customerInfo = await Purchases.getCustomerInfo()
      return customerInfo
    } catch (error) {
      console.error('Failed to get customer info:', error)
      return null
    }
  }

  async logout() {
    try {
      await Purchases.logOut()
      this.initialized = false
    } catch (error) {
      console.error('Failed to logout from RevenueCat:', error)
    }
  }
}

export const revenueCat = new RevenueCatService()

export function getSubscriptionStatus(customerInfo: CustomerInfo | null): 'free' | 'pro' | 'premium' {
  if (!customerInfo) return 'free'

  const activeEntitlements = customerInfo.entitlements.active
  
  if (activeEntitlements['premium']) return 'premium'
  if (activeEntitlements['pro']) return 'pro'
  
  return 'free'
}

export function hasActiveSubscription(customerInfo: CustomerInfo | null): boolean {
  if (!customerInfo) return false
  return Object.keys(customerInfo.entitlements.active).length > 0
}