'use client'

import { ActivePanel } from '@/app/page'

const navItems = [
  { id: 'overview',   label: 'Overview',    icon: '📊' },
  { id: 'doctors',    label: 'Doctors',     icon: '👨‍⚕️' },
  { id: 'patients',   label: 'Patients',    icon: '🧑‍🤝‍🧑' },
  { id: 'bookings',   label: 'Bookings',    icon: '📅' },
  { id: 'analytics',  label: 'Analytics',   icon: '📈' },
]

interface SidebarProps {
  activePanel: ActivePanel
  onNavigate: (panel: ActivePanel) => void
}

export default function Sidebar({ activePanel, onNavigate }: SidebarProps) {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center text-white font-bold text-lg"
               style={{ backgroundColor: '#1AAB97' }}>
            M
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">MediConnect</p>
            <p className="text-xs text-gray-500">DARMAN Admin</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id as ActivePanel)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activePanel === item.id
                ? 'text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
            style={activePanel === item.id ? { backgroundColor: '#1AAB97' } : {}}
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600">
            A
          </div>
          <div>
            <p className="text-xs font-medium text-gray-900">Admin</p>
            <p className="text-xs text-gray-500">admin@mediconnect.af</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
