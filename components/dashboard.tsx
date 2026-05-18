"use client"

import { motion } from "framer-motion"
import { 
  Flame, 
  Timer, 
  TrendingUp, 
  Calendar,
  Play,
  Pause,
  ChevronRight,
  Zap
} from "lucide-react"
import { useApp } from "@/lib/app-context"
import { 
  Area, 
  AreaChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis,
  Tooltip
} from "recharts"

const weekDays = ["L", "M", "X", "J", "V", "S", "D"]

const chartData = [
  { day: "Lun", calories: 280 },
  { day: "Mar", calories: 0 },
  { day: "Mie", calories: 320 },
  { day: "Jue", calories: 400 },
  { day: "Vie", calories: 0 },
  { day: "Sab", calories: 350 },
  { day: "Dom", calories: 180 },
]

export function Dashboard() {
  const { 
    user, 
    currentWorkout, 
    stopWorkout,
    workoutSessions,
    weeklyActivity,
    totalCaloriesThisWeek,
    totalWorkoutsThisWeek
  } = useApp()

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return "Hoy"
    if (diffDays === 1) return "Ayer"
    return `Hace ${diffDays} dias`
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="pb-24 px-4"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="pt-6 pb-4">
        <p className="text-muted-foreground text-sm">Hola de nuevo,</p>
        <h1 className="text-2xl font-bold text-foreground">{user?.name || "Atleta"}</h1>
      </motion.div>

      {/* Active Workout Banner */}
      {currentWorkout.isActive && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-primary/20 border border-primary/30 rounded-2xl p-4 mb-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary text-sm font-medium">Entrenamiento activo</p>
              <p className="text-foreground font-semibold">{currentWorkout.currentExercise}</p>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1">
                  <Timer className="w-4 h-4 text-primary" />
                  <span className="text-sm font-mono">{formatTime(currentWorkout.elapsedTime)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Flame className="w-4 h-4 text-primary" />
                  <span className="text-sm">{currentWorkout.caloriesBurned} kcal</span>
                </div>
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={stopWorkout}
              className="w-12 h-12 bg-primary rounded-full flex items-center justify-center"
            >
              <Pause className="w-6 h-6 text-primary-foreground" />
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Stats Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3 mb-4">
        {/* Calories Card */}
        <div className="bg-card border border-border rounded-2xl p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <Flame className="w-8 h-8 text-primary mb-2" />
          <p className="text-muted-foreground text-sm">Calorias quemadas</p>
          <p className="text-2xl font-bold text-foreground">
            {currentWorkout.isActive ? currentWorkout.caloriesBurned : totalCaloriesThisWeek}
          </p>
          <p className="text-xs text-muted-foreground">
            {currentWorkout.isActive ? "Sesion actual" : "Esta semana"}
          </p>
        </div>

        {/* Timer Card */}
        <div className="bg-card border border-border rounded-2xl p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-chart-2/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <Timer className="w-8 h-8 text-chart-2 mb-2" />
          <p className="text-muted-foreground text-sm">Tiempo total</p>
          <p className="text-2xl font-bold text-foreground font-mono">
            {currentWorkout.isActive 
              ? formatTime(currentWorkout.elapsedTime)
              : `${workoutSessions.reduce((sum, s) => sum + s.duration, 0)} min`
            }
          </p>
          <p className="text-xs text-muted-foreground">
            {currentWorkout.isActive ? "En progreso" : "Total acumulado"}
          </p>
        </div>
      </motion.div>

      {/* Weekly Activity */}
      <motion.div variants={itemVariants} className="bg-card border border-border rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Actividad semanal</h3>
          </div>
          <span className="text-sm text-primary font-medium">{totalWorkoutsThisWeek} de 7 dias</span>
        </div>
        <div className="flex justify-between">
          {weekDays.map((day, index) => (
            <div key={day} className="flex flex-col items-center gap-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className={`w-9 h-9 rounded-full flex items-center justify-center ${
                  weeklyActivity[index]
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {weeklyActivity[index] ? (
                  <Zap className="w-4 h-4" />
                ) : (
                  <span className="text-xs font-medium">{day}</span>
                )}
              </motion.div>
              <span className="text-xs text-muted-foreground">{day}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Progress Chart */}
      <motion.div variants={itemVariants} className="bg-card border border-border rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Progreso semanal</h3>
          </div>
          <span className="text-sm text-muted-foreground">Calorias</span>
        </div>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorCalories" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.7 0.18 45)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="oklch(0.7 0.18 45)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="day" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: "oklch(0.65 0 0)", fontSize: 12 }}
              />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  backgroundColor: "oklch(0.15 0.005 250)",
                  border: "1px solid oklch(0.25 0.005 250)",
                  borderRadius: "8px",
                  color: "oklch(0.98 0 0)"
                }}
                labelStyle={{ color: "oklch(0.98 0 0)" }}
              />
              <Area
                type="monotone"
                dataKey="calories"
                stroke="oklch(0.7 0.18 45)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorCalories)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Recent Sessions */}
      <motion.div variants={itemVariants} className="bg-card border border-border rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Sesiones recientes</h3>
          <button className="text-sm text-primary font-medium flex items-center gap-1">
            Ver todas
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-3">
          {workoutSessions.slice(0, 3).map((session, index) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                  <Play className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">{session.name}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(session.date)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-foreground">{session.calories} kcal</p>
                <p className="text-xs text-muted-foreground">{session.duration} min</p>
              </div>
            </motion.div>
          ))}
          {workoutSessions.length === 0 && (
            <p className="text-center text-muted-foreground py-4">
              No hay sesiones recientes
            </p>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
