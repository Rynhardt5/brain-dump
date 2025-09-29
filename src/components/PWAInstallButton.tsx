'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Smartphone } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export default function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if app is already installed
    const checkIfInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true)
        return
      }
      
      // Check for iOS Safari standalone mode
      if ((window.navigator as any).standalone === true) {
        setIsInstalled(true)
        return
      }
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setIsInstallable(true)
    }

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsInstallable(false)
      setDeferredPrompt(null)
    }

    checkIfInstalled()
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    try {
      // Show the install prompt
      await deferredPrompt.prompt()
      
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt')
      } else {
        console.log('User dismissed the install prompt')
      }
      
      // Clear the deferredPrompt
      setDeferredPrompt(null)
      setIsInstallable(false)
    } catch (error) {
      console.error('Error during installation:', error)
    }
  }

  // Don't show button if app is already installed
  if (isInstalled) {
    return null
  }

  // Don't show button if not installable
  if (!isInstallable || !deferredPrompt) {
    return null
  }

  return (
    <Button
      onClick={handleInstallClick}
      variant="outline"
      size="sm"
      className="flex items-center space-x-2 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300"
    >
      <Smartphone className="w-4 h-4" />
      <span className="hidden sm:inline">Install App</span>
      <span className="sm:hidden">Install</span>
    </Button>
  )
}
