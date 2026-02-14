"use client"

import { useState } from "react"
import { InvestorLogin } from "@/components/investor/investor-login"
import { InvestorDashboard } from "@/components/investor/investor-dashboard"
import type { Investor } from "@/lib/investor-types"

export default function InvestorPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentInvestor, setCurrentInvestor] = useState<Investor | null>(null)

  const handleLogin = (investor: Investor) => {
    setCurrentInvestor(investor)
    setIsLoggedIn(true)
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setCurrentInvestor(null)
  }

  if (!isLoggedIn || !currentInvestor) {
    return <InvestorLogin onLogin={handleLogin} />
  }

  return <InvestorDashboard investor={currentInvestor} onLogout={handleLogout} />
}
