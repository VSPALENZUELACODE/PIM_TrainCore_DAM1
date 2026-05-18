"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  X, 
  Clock, 
  Flame, 
  Zap, 
  Play,
  ChevronRight
} from "lucide-react"
import { useApp } from "@/lib/app-context"

interface Exercise {
  name: string
  sets: number
  reps: string
  rest: number
}

interface MuscleGroupData {
  id: string
  name: string
  icon: string
  color: string
  exercises: Exercise[]
  duration: number
  calories: number
  difficulty: "Principiante" | "Intermedio" | "Avanzado"
}

const muscleGroups: MuscleGroupData[] = [
  {
    id: "chest",
    name: "Pecho",
    icon: "💪",
    color: "from-red-500/20 to-orange-500/20",
    difficulty: "Intermedio",
    duration: 45,
    calories: 320,
    exercises: [
      { name: "Press de banca", sets: 4, reps: "8-10", rest: 90 },
      { name: "Press inclinado", sets: 3, reps: "10-12", rest: 60 },
      { name: "Aperturas con mancuernas", sets: 3, reps: "12-15", rest: 60 },
      { name: "Flexiones", sets: 3, reps: "Al fallo", rest: 45 },
    ]
  },
  {
    id: "back",
    name: "Espalda",
    icon: "🏋️",
    color: "from-blue-500/20 to-cyan-500/20",
    difficulty: "Intermedio",
    duration: 50,
    calories: 350,
    exercises: [
      { name: "Dominadas", sets: 4, reps: "8-10", rest: 90 },
      { name: "Remo con barra", sets: 4, reps: "8-10", rest: 90 },
      { name: "Jalon al pecho", sets: 3, reps: "10-12", rest: 60 },
      { name: "Remo en polea baja", sets: 3, reps: "12-15", rest: 60 },
    ]
  },
  {
    id: "legs",
    name: "Pierna",
    icon: "🦵",
    color: "from-green-500/20 to-emerald-500/20",
    difficulty: "Avanzado",
    duration: 55,
    calories: 450,
    exercises: [
      { name: "Sentadillas", sets: 4, reps: "8-10", rest: 120 },
      { name: "Prensa de pierna", sets: 4, reps: "10-12", rest: 90 },
      { name: "Zancadas", sets: 3, reps: "12 c/pierna", rest: 60 },
      { name: "Extension de cuadriceps", sets: 3, reps: "15", rest: 45 },
      { name: "Curl femoral", sets: 3, reps: "12-15", rest: 45 },
    ]
  },
  {
    id: "shoulders",
    name: "Hombros",
    icon: "🎯",
    color: "from-purple-500/20 to-pink-500/20",
    difficulty: "Intermedio",
    duration: 40,
    calories: 280,
    exercises: [
      { name: "Press militar", sets: 4, reps: "8-10", rest: 90 },
      { name: "Elevaciones laterales", sets: 3, reps: "12-15", rest: 45 },
      { name: "Elevaciones frontales", sets: 3, reps: "12-15", rest: 45 },
      { name: "Pajaros", sets: 3, reps: "15", rest: 45 },
    ]
  },
  {
    id: "biceps",
    name: "Biceps",
    icon: "💪",
    color: "from-amber-500/20 to-yellow-500/20",
    difficulty: "Principiante",
    duration: 30,
    calories: 180,
    exercises: [
      { name: "Curl con barra", sets: 4, reps: "10-12", rest: 60 },
      { name: "Curl martillo", sets: 3, reps: "12", rest: 45 },
      { name: "Curl concentrado", sets: 3, reps: "12 c/brazo", rest: 45 },
    ]
  },
  {
    id: "triceps",
    name: "Triceps",
    icon: "🔥",
    color: "from-rose-500/20 to-red-500/20",
    difficulty: "Principiante",
    duration: 30,
    calories: 180,
    exercises: [
      { name: "Press frances", sets: 4, reps: "10-12", rest: 60 },
      { name: "Extension en polea", sets: 3, reps: "12-15", rest: 45 },
      { name: "Fondos en banco", sets: 3, reps: "Al fallo", rest: 60 },
    ]
  },
  {
    id: "abs",
    name: "Abdomen",
    icon: "🎖️",
    color: "from-teal-500/20 to-cyan-500/20",
    difficulty: "Principiante",
    duration: 25,
    calories: 150,
    exercises: [
      { name: "Crunch abdominal", sets: 4, reps: "20", rest: 30 },
      { name: "Plancha", sets: 3, reps: "45 seg", rest: 30 },
      { name: "Elevacion de piernas", sets: 3, reps: "15", rest: 30 },
      { name: "Bicicleta", sets: 3, reps: "20 c/lado", rest: 30 },
    ]
  },
  {
    id: "cardio",
    name: "Cardio",
    icon: "❤️",
    color: "from-pink-500/20 to-rose-500/20",
    difficulty: "Intermedio",
    duration: 30,
    calories: 300,
    exercises: [
      { name: "Burpees", sets: 4, reps: "10", rest: 45 },
      { name: "Mountain climbers", sets: 4, reps: "30 seg", rest: 30 },
      { name: "Jumping jacks", sets: 4, reps: "30", rest: 30 },
      { name: "High knees", sets: 4, reps: "30 seg", rest: 30 },
    ]
  },
]

export function MuscleGroups() {
  const [selectedGroup, setSelectedGroup] = useState<MuscleGroupData | null>(null)
  const { startWorkout } = useApp()

  const handleStartWorkout = () => {
    if (selectedGroup) {
      startWorkout(`${selectedGroup.name} - Entrenamiento completo`)
      setSelectedGroup(null)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Principiante": return "text-green-400 bg-green-400/10"
      case "Intermedio": return "text-yellow-400 bg-yellow-400/10"
      case "Avanzado": return "text-red-400 bg-red-400/10"
      default: return "text-muted-foreground bg-muted"
    }
  }

  return (
    <>
      <div className="pb-24 px-4">
        {/* Header */}
        <div className="pt-6 pb-4">
          <h1 className="text-2xl font-bold text-foreground">Grupos Musculares</h1>
          <p className="text-muted-foreground text-sm">Selecciona que quieres entrenar hoy</p>
        </div>

        {/* Muscle Group Grid */}
        <div className="grid grid-cols-2 gap-3">
          {muscleGroups.map((group, index) => (
            <motion.button
              key={group.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedGroup(group)}
              className={`relative bg-gradient-to-br ${group.color} border border-border rounded-2xl p-4 text-left overflow-hidden group`}
            >
              <div className="absolute inset-0 bg-card/80" />
              <div className="relative z-10">
                <span className="text-3xl mb-2 block">{group.icon}</span>
                <h3 className="font-semibold text-foreground">{group.name}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-muted-foreground">{group.duration} min</span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">{group.calories} kcal</span>
                </div>
              </div>
              <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight className="w-5 h-5 text-primary" />
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Exercise Detail Modal */}
      <AnimatePresence>
        {selectedGroup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end"
            onClick={() => setSelectedGroup(null)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-card border-t border-border rounded-t-3xl max-h-[85vh] overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{selectedGroup.icon}</span>
                    <div>
                      <h2 className="text-xl font-bold text-foreground">{selectedGroup.name}</h2>
                      <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(selectedGroup.difficulty)}`}>
                        {selectedGroup.difficulty}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedGroup(null)}
                    className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
                  >
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="text-sm text-foreground">{selectedGroup.duration} min</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-primary" />
                    <span className="text-sm text-foreground">{selectedGroup.calories} kcal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="text-sm text-foreground">{selectedGroup.exercises.length} ejercicios</span>
                  </div>
                </div>
              </div>

              {/* Exercise List */}
              <div className="p-4 overflow-y-auto max-h-[50vh]">
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">EJERCICIOS</h3>
                <div className="space-y-3">
                  {selectedGroup.exercises.map((exercise, index) => (
                    <motion.div
                      key={exercise.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-secondary/50 rounded-xl p-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">{exercise.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {exercise.sets} series × {exercise.reps}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Descanso</p>
                          <p className="text-sm text-foreground">{exercise.rest}s</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Start Button */}
              <div className="p-4 border-t border-border bg-card">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleStartWorkout}
                  className="w-full bg-primary text-primary-foreground font-semibold py-4 rounded-xl flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  Comenzar Entrenamiento
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
