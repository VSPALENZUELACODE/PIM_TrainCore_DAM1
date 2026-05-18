"use client"

import { useState, useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { AppProvider, useApp } from "@/lib/app-context"
import { AuthScreen } from "@/components/auth-screen"
import { BottomNavigation } from "@/components/bottom-navigation"
import { Dashboard } from "@/components/dashboard"
import { Routines } from "@/components/routines"
import { MuscleGroups } from "@/components/muscle-groups"
import { Statistics } from "@/components/statistics"
import { Profile } from "@/components/profile"

type Tab = "home" | "routines" | "muscles" | "stats" | "profile"

function AppContent() {
  const { isAuthenticated, logout } = useApp()
  const [activeTab, setActiveTab] = useState<Tab>("home")
  const [showApp, setShowApp] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if already authenticated
    const timer = setTimeout(() => {
      setIsLoading(false)
      if (isAuthenticated) {
        setShowApp(true)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [isAuthenticated])

  const handleAuthSuccess = () => {
    setShowApp(true)
  }

  const handleLogout = () => {
    logout()
    setShowApp(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-3 border-primary-foreground border-t-transparent rounded-full"
            />
          </div>
          <p className="text-muted-foreground">Cargando TrainCore...</p>
        </motion.div>
      </div>
    )
  }

  if (!showApp) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />
  }

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return <Dashboard />
      case "routines":
        return <Routines />
      case "muscles":
        return <MuscleGroups />
      case "stats":
        return <Statistics />
      case "profile":
        return <Profile />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto relative">
      {/* Page Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}

export function TrainCoreApp() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}
