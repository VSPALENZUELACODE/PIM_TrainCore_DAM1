"use client"

import { motion } from "framer-motion"
import { 
  TrendingUp, 
  Flame, 
  Clock, 
  Calendar,
  Target,
  Award
} from "lucide-react"
import { useApp } from "@/lib/app-context"
import { 
  Bar, 
  BarChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis,
  Tooltip,
  Line,
  LineChart
} from "recharts"

const weeklyData = [
  { day: "Lun", workouts: 1, calories: 280 },
  { day: "Mar", workouts: 0, calories: 0 },
  { day: "Mie", workouts: 1, calories: 320 },
  { day: "Jue", workouts: 1, calories: 400 },
  { day: "Vie", workouts: 0, calories: 0 },
  { day: "Sab", workouts: 1, calories: 350 },
  { day: "Dom", workouts: 0, calories: 180 },
]

const monthlyProgress = [
  { week: "Sem 1", calories: 1200 },
  { week: "Sem 2", calories: 1450 },
  { week: "Sem 3", calories: 1100 },
  { week: "Sem 4", calories: 1530 },
]

export function Statistics() {
  const { 
    workoutSessions, 
    totalCaloriesThisWeek, 
    totalWorkoutsThisWeek 
  } = useApp()

  const totalMinutes = workoutSessions.reduce((sum, s) => sum + s.duration, 0)
  const avgCaloriesPerWorkout = workoutSessions.length > 0 
    ? Math.round(workoutSessions.reduce((sum, s) => sum + s.calories, 0) / workoutSessions.length)
    : 0

  const stats = [
    { 
      icon: Flame, 
      label: "Calorias totales", 
      value: totalCaloriesThisWeek.toLocaleString(),
      suffix: "kcal",
      color: "text-primary"
    },
    { 
      icon: Clock, 
      label: "Tiempo total", 
      value: totalMinutes,
      suffix: "min",
      color: "text-chart-2"
    },
    { 
      icon: Target, 
      label: "Entrenamientos", 
      value: totalWorkoutsThisWeek,
      suffix: "esta semana",
      color: "text-chart-4"
    },
    { 
      icon: Award, 
      label: "Promedio por sesion", 
      value: avgCaloriesPerWorkout,
      suffix: "kcal",
      color: "text-chart-5"
    },
  ]

  return (
    <div className="pb-24 px-4">
      {/* Header */}
      <div className="pt-6 pb-4">
        <h1 className="text-2xl font-bold text-foreground">Estadisticas</h1>
        <p className="text-muted-foreground text-sm">Tu progreso y rendimiento</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="bg-card border border-border rounded-2xl p-4"
            >
              <Icon className={`w-6 h-6 ${stat.color} mb-2`} />
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.suffix}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </motion.div>
          )
        })}
      </div>

      {/* Weekly Activity Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl p-4 mb-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Actividad semanal</h3>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData}>
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
              <Bar 
                dataKey="calories" 
                fill="oklch(0.7 0.18 45)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Monthly Progress Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-2xl p-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Progreso mensual</h3>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyProgress}>
              <XAxis 
                dataKey="week" 
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
              <Line 
                type="monotone" 
                dataKey="calories" 
                stroke="oklch(0.7 0.18 45)"
                strokeWidth={3}
                dot={{ fill: "oklch(0.7 0.18 45)", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  )
}
