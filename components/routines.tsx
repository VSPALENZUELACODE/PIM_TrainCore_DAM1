"use client"

import { motion } from "framer-motion"
import { 
  Play,
  Clock,
  Flame,
  ChevronRight,
  Star
} from "lucide-react"
import { useApp } from "@/lib/app-context"

interface Routine {
  id: string
  name: string
  description: string
  duration: number
  calories: number
  exercises: number
  difficulty: "Principiante" | "Intermedio" | "Avanzado"
  featured?: boolean
}

const routines: Routine[] = [
  {
    id: "1",
    name: "Full Body Blast",
    description: "Entrenamiento completo para todo el cuerpo",
    duration: 45,
    calories: 400,
    exercises: 8,
    difficulty: "Intermedio",
    featured: true
  },
  {
    id: "2",
    name: "Core Destroyer",
    description: "Abdominales intensos para definir",
    duration: 25,
    calories: 200,
    exercises: 6,
    difficulty: "Avanzado"
  },
  {
    id: "3",
    name: "Upper Body Power",
    description: "Fuerza para tren superior",
    duration: 40,
    calories: 320,
    exercises: 7,
    difficulty: "Intermedio"
  },
  {
    id: "4",
    name: "Leg Day Essential",
    description: "Rutina completa de piernas",
    duration: 50,
    calories: 450,
    exercises: 6,
    difficulty: "Avanzado"
  },
  {
    id: "5",
    name: "HIIT Cardio",
    description: "Quema grasa en poco tiempo",
    duration: 20,
    calories: 250,
    exercises: 5,
    difficulty: "Intermedio"
  },
  {
    id: "6",
    name: "Beginner Basics",
    description: "Perfecto para empezar tu viaje fitness",
    duration: 30,
    calories: 180,
    exercises: 6,
    difficulty: "Principiante"
  },
]

export function Routines() {
  const { startWorkout } = useApp()

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Principiante": return "text-green-400 bg-green-400/10"
      case "Intermedio": return "text-yellow-400 bg-yellow-400/10"
      case "Avanzado": return "text-red-400 bg-red-400/10"
      default: return "text-muted-foreground bg-muted"
    }
  }

  const featuredRoutine = routines.find(r => r.featured)
  const otherRoutines = routines.filter(r => !r.featured)

  return (
    <div className="pb-24 px-4">
      {/* Header */}
      <div className="pt-6 pb-4">
        <h1 className="text-2xl font-bold text-foreground">Rutinas</h1>
        <p className="text-muted-foreground text-sm">Entrenamientos disenados para ti</p>
      </div>

      {/* Featured Routine */}
      {featuredRoutine && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 rounded-2xl p-5 mb-6 overflow-hidden"
        >
          <div className="absolute top-3 right-3">
            <div className="flex items-center gap-1 bg-primary/20 px-2 py-1 rounded-full">
              <Star className="w-3 h-3 text-primary fill-primary" />
              <span className="text-xs text-primary font-medium">Destacado</span>
            </div>
          </div>
          <h3 className="text-xl font-bold text-foreground mb-1">{featuredRoutine.name}</h3>
          <p className="text-muted-foreground text-sm mb-4">{featuredRoutine.description}</p>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-foreground">{featuredRoutine.duration} min</span>
            </div>
            <div className="flex items-center gap-1">
              <Flame className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-foreground">{featuredRoutine.calories} kcal</span>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(featuredRoutine.difficulty)}`}>
              {featuredRoutine.difficulty}
            </span>
          </div>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => startWorkout(featuredRoutine.name)}
            className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5" />
            Empezar ahora
          </motion.button>
        </motion.div>
      )}

      {/* Other Routines */}
      <h3 className="text-sm font-semibold text-muted-foreground mb-3">TODAS LAS RUTINAS</h3>
      <div className="space-y-3">
        {otherRoutines.map((routine, index) => (
          <motion.div
            key={routine.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-card border border-border rounded-2xl p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="font-semibold text-foreground">{routine.name}</h4>
                <p className="text-sm text-muted-foreground mb-2">{routine.description}</p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{routine.duration} min</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Flame className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{routine.calories} kcal</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getDifficultyColor(routine.difficulty)}`}>
                    {routine.difficulty}
                  </span>
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => startWorkout(routine.name)}
                className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center"
              >
                <ChevronRight className="w-5 h-5 text-primary" />
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
