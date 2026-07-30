'use client'

import { useState } from 'react'
import Sidebar from '@/components/Sidebar'
import DashboardOverview from '@/components/DashboardOverview'
import DoctorsPanel from '@/components/DoctorsPanel'
import PatientsPanel from '@/components/PatientsPanel'
import BookingsPanel from '@/components/BookingsPanel'
import AnalyticsPanel from '@/components/AnalyticsPanel'

export type ActivePanel = 'overview' | 'doctors' | 'patients' | 'bookings' | 'analytics'

export default function AdminDashboard() {
  const [activePanel, setActivePanel] = useState<ActivePanel>('overview')

  const renderPanel = () => {
    switch (activePanel) {
      case 'overview':    return <DashboardOverview />
      case 'doctors':     return <DoctorsPanel />
      case 'patients':    return <PatientsPanel />
      case 'bookings':    return <BookingsPanel />
      case 'analytics':   return <AnalyticsPanel />
      default:            return <DashboardOverview />
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar activePanel={activePanel} onNavigate={setActivePanel} />
      <main className="flex-1 overflow-y-auto">
        {renderPanel()}
      </main>
    </div>
  )
}
