"use client"

import { useState } from "react"
import { POSLogin } from "@/components/pos/pos-login"
import { POSDashboard } from "@/components/pos/pos-dashboard"
import { EasyBuyDashboard } from "@/components/easybuy/easybuy-dashboard"

type ViewType = "pos" | "easybuy"

export default function POSPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [staffName, setStaffName] = useState("")
  const [currentView, setCurrentView] = useState<ViewType>("pos")

  const handleLogin = (name: string) => {
    setStaffName(name)
    setIsLoggedIn(true)
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setStaffName("")
    setCurrentView("pos")
  }

  const handleOpenEasyBuy = () => {
    setCurrentView("easybuy")
  }

  const handleBackToPOS = () => {
    setCurrentView("pos")
  }

  if (!isLoggedIn) {
    return <POSLogin onLogin={handleLogin} />
  }

  if (currentView === "easybuy") {
    return <EasyBuyDashboard staffName={staffName} onBack={handleBackToPOS} />
  }

  return <POSDashboard staffName={staffName} onLogout={handleLogout} onOpenEasyBuy={handleOpenEasyBuy} />
}
