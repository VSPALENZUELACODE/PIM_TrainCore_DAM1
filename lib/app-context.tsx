"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface User {
  id: string
  name: string
  email: string
  avatar?: string
  weight?: number
  height?: number
  goal?: string
}

interface WorkoutSession {
  id: string
  name: string
  muscleGroup: string
  duration: number
  calories: number
  date: Date
  exercises: string[]
}

interface AppContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (name: string, email: string, password: string) => Promise<boolean>
  logout: () => void
  workoutSessions: WorkoutSession[]
  addWorkoutSession: (session: Omit<WorkoutSession, "id">) => void
  currentWorkout: {
    isActive: boolean
    startTime: Date | null
    elapsedTime: number
    currentExercise: string | null
    caloriesBurned: number
  }
  startWorkout: (exerciseName: string) => void
  stopWorkout: () => void
  weeklyActivity: boolean[]
  totalCaloriesThisWeek: number
  totalWorkoutsThisWeek: number
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [workoutSessions, setWorkoutSessions] = useState<WorkoutSession[]>([])
  const [currentWorkout, setCurrentWorkout] = useState({
    isActive: false,
    startTime: null as Date | null,
    elapsedTime: 0,
    currentExercise: null as string | null,
    caloriesBurned: 0,
  })
  const [weeklyActivity, setWeeklyActivity] = useState<boolean[]>([false, false, false, false, false, false, false])

  // Load saved data on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("traincore_user")
    const savedSessions = localStorage.getItem("traincore_sessions")
    
    if (savedUser) {
      setUser(JSON.parse(savedUser))
      setIsAuthenticated(true)
    }
    
    if (savedSessions) {
      const sessions = JSON.parse(savedSessions).map((s: WorkoutSession) => ({
        ...s,
        date: new Date(s.date)
      }))
      setWorkoutSessions(sessions)
    }
    
    // Initialize with some demo sessions
    if (!savedSessions) {
      const demoSessions: WorkoutSession[] = [
        {
          id: "1",
          name: "Entrenamiento de Pecho",
          muscleGroup: "chest",
          duration: 45,
          calories: 320,
          date: new Date(Date.now() - 86400000),
          exercises: ["Press de banca", "Aperturas", "Flexiones"]
        },
        {
          id: "2",
          name: "Cardio HIIT",
          muscleGroup: "cardio",
          duration: 30,
          calories: 280,
          date: new Date(Date.now() - 172800000),
          exercises: ["Burpees", "Mountain climbers", "Jumping jacks"]
        },
        {
          id: "3",
          name: "Pierna Completa",
          muscleGroup: "legs",
          duration: 50,
          calories: 400,
          date: new Date(Date.now() - 259200000),
          exercises: ["Sentadillas", "Zancadas", "Prensa"]
        }
      ]
      setWorkoutSessions(demoSessions)
      setWeeklyActivity([true, false, true, true, false, true, false])
    }
  }, [])

  // Timer for active workout
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (currentWorkout.isActive && currentWorkout.startTime) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - currentWorkout.startTime!.getTime()) / 1000)
        const caloriesPerSecond = 0.15 // ~9 cal/min
        setCurrentWorkout(prev => ({
          ...prev,
          elapsedTime: elapsed,
          caloriesBurned: Math.floor(elapsed * caloriesPerSecond)
        }))
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [currentWorkout.isActive, currentWorkout.startTime])

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    if (email && password.length >= 6) {
      const newUser: User = {
        id: "1",
        name: email.split("@")[0],
        email,
        weight: 75,
        height: 175,
        goal: "Ganar masa muscular"
      }
      setUser(newUser)
      setIsAuthenticated(true)
      localStorage.setItem("traincore_user", JSON.stringify(newUser))
      return true
    }
    return false
  }

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    if (name && email && password.length >= 6) {
      const newUser: User = {
        id: "1",
        name,
        email,
        weight: 70,
        height: 170,
        goal: "Mantenerme en forma"
      }
      setUser(newUser)
      setIsAuthenticated(true)
      localStorage.setItem("traincore_user", JSON.stringify(newUser))
      return true
    }
    return false
  }

  const logout = () => {
    setUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem("traincore_user")
  }

  const addWorkoutSession = (session: Omit<WorkoutSession, "id">) => {
    const newSession: WorkoutSession = {
      ...session,
      id: Date.now().toString()
    }
    const updatedSessions = [newSession, ...workoutSessions]
    setWorkoutSessions(updatedSessions)
    localStorage.setItem("traincore_sessions", JSON.stringify(updatedSessions))
    
    // Update weekly activity
    const today = new Date().getDay()
    const newWeekly = [...weeklyActivity]
    newWeekly[today === 0 ? 6 : today - 1] = true
    setWeeklyActivity(newWeekly)
  }

  const startWorkout = (exerciseName: string) => {
    setCurrentWorkout({
      isActive: true,
      startTime: new Date(),
      elapsedTime: 0,
      currentExercise: exerciseName,
      caloriesBurned: 0
    })
  }

  const stopWorkout = () => {
    if (currentWorkout.isActive && currentWorkout.elapsedTime > 60) {
      addWorkoutSession({
        name: currentWorkout.currentExercise || "Entrenamiento",
        muscleGroup: "general",
        duration: Math.floor(currentWorkout.elapsedTime / 60),
        calories: currentWorkout.caloriesBurned,
        date: new Date(),
        exercises: [currentWorkout.currentExercise || "Ejercicio general"]
      })
    }
    setCurrentWorkout({
      isActive: false,
      startTime: null,
      elapsedTime: 0,
      currentExercise: null,
      caloriesBurned: 0
    })
  }

  const totalCaloriesThisWeek = workoutSessions
    .filter(s => {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return s.date > weekAgo
    })
    .reduce((sum, s) => sum + s.calories, 0)

  const totalWorkoutsThisWeek = workoutSessions
    .filter(s => {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return s.date > weekAgo
    }).length

  return (
    <AppContext.Provider value={{
      user,
      isAuthenticated,
      login,
      register,
      logout,
      workoutSessions,
      addWorkoutSession,
      currentWorkout,
      startWorkout,
      stopWorkout,
      weeklyActivity,
      totalCaloriesThisWeek,
      totalWorkoutsThisWeek
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider")
  }
  return context
}
