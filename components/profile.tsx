"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { 
  User,
  Settings,
  LogOut,
  ChevronRight,
  Moon,
  Sun,
  Bell,
  Shield,
  HelpCircle,
  Edit3,
  Save,
  X
} from "lucide-react"
import { useApp } from "@/lib/app-context"

export function Profile() {
  const { user, logout } = useApp()
  const [isEditing, setIsEditing] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [notifications, setNotifications] = useState(true)
  
  const [editName, setEditName] = useState(user?.name || "")
  const [editWeight, setEditWeight] = useState(user?.weight?.toString() || "70")
  const [editHeight, setEditHeight] = useState(user?.height?.toString() || "170")
  const [editGoal, setEditGoal] = useState(user?.goal || "")

  const menuItems = [
    { 
      icon: Bell, 
      label: "Notificaciones", 
      toggle: true,
      value: notifications,
      onToggle: () => setNotifications(!notifications)
    },
    { 
      icon: isDarkMode ? Moon : Sun, 
      label: "Modo oscuro", 
      toggle: true,
      value: isDarkMode,
      onToggle: () => setIsDarkMode(!isDarkMode)
    },
    { icon: Shield, label: "Privacidad", action: true },
    { icon: HelpCircle, label: "Ayuda y soporte", action: true },
    { icon: Settings, label: "Configuracion", action: true },
  ]

  const handleSave = () => {
    setIsEditing(false)
  }

  return (
    <div className="pb-24 px-4">
      {/* Header */}
      <div className="pt-6 pb-4">
        <h1 className="text-2xl font-bold text-foreground">Perfil</h1>
        <p className="text-muted-foreground text-sm">Tu informacion personal</p>
      </div>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl p-5 mb-6"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div>
              {isEditing ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="text-xl font-bold text-foreground bg-input border border-border rounded-lg px-2 py-1"
                />
              ) : (
                <h2 className="text-xl font-bold text-foreground">{user?.name || "Usuario"}</h2>
              )}
              <p className="text-muted-foreground text-sm">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
          >
            {isEditing ? (
              <Save className="w-5 h-5 text-primary" />
            ) : (
              <Edit3 className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
        </div>

        {/* User Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-secondary/50 rounded-xl p-3 text-center">
            {isEditing ? (
              <input
                type="number"
                value={editWeight}
                onChange={(e) => setEditWeight(e.target.value)}
                className="w-full text-center text-lg font-bold text-foreground bg-input border border-border rounded-lg px-2 py-1"
              />
            ) : (
              <p className="text-lg font-bold text-foreground">{user?.weight || 70}</p>
            )}
            <p className="text-xs text-muted-foreground">Peso (kg)</p>
          </div>
          <div className="bg-secondary/50 rounded-xl p-3 text-center">
            {isEditing ? (
              <input
                type="number"
                value={editHeight}
                onChange={(e) => setEditHeight(e.target.value)}
                className="w-full text-center text-lg font-bold text-foreground bg-input border border-border rounded-lg px-2 py-1"
              />
            ) : (
              <p className="text-lg font-bold text-foreground">{user?.height || 170}</p>
            )}
            <p className="text-xs text-muted-foreground">Altura (cm)</p>
          </div>
          <div className="bg-secondary/50 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-foreground">
              {user?.weight && user?.height 
                ? Math.round((user.weight / ((user.height/100) ** 2)) * 10) / 10
                : "24.2"
              }
            </p>
            <p className="text-xs text-muted-foreground">IMC</p>
          </div>
        </div>

        {/* Goal */}
        <div className="mt-4">
          <p className="text-sm text-muted-foreground mb-2">Objetivo</p>
          {isEditing ? (
            <input
              type="text"
              value={editGoal}
              onChange={(e) => setEditGoal(e.target.value)}
              placeholder="Tu objetivo fitness"
              className="w-full text-foreground bg-input border border-border rounded-xl px-3 py-2"
            />
          ) : (
            <div className="bg-primary/10 rounded-xl px-3 py-2">
              <p className="text-primary font-medium">{user?.goal || "Mantenerme en forma"}</p>
            </div>
          )}
        </div>

        {isEditing && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setIsEditing(false)}
            className="w-full mt-4 py-2 text-muted-foreground flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" />
            Cancelar
          </motion.button>
        )}
      </motion.div>

      {/* Menu Items */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden mb-6">
        {menuItems.map((item, index) => {
          const Icon = item.icon
          return (
            <motion.button
              key={item.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={item.toggle ? item.onToggle : undefined}
              className="w-full flex items-center justify-between p-4 border-b border-border last:border-b-0 hover:bg-secondary/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 text-muted-foreground" />
                <span className="text-foreground">{item.label}</span>
              </div>
              {item.toggle ? (
                <div 
                  className={`w-12 h-7 rounded-full p-1 transition-colors ${
                    item.value ? "bg-primary" : "bg-secondary"
                  }`}
                >
                  <motion.div
                    className="w-5 h-5 bg-white rounded-full"
                    animate={{ x: item.value ? 20 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </div>
              ) : (
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Logout Button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        whileTap={{ scale: 0.98 }}
        onClick={logout}
        className="w-full bg-destructive/10 text-destructive font-semibold py-4 rounded-2xl flex items-center justify-center gap-2"
      >
        <LogOut className="w-5 h-5" />
        Cerrar sesion
      </motion.button>
    </div>
  )
}
