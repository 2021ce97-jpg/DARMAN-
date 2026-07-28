'use client'

import { useEffect, useState } from 'react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'

interface Stats {
  doctors: number
  patients: number
  bookings: number
  hospitals: number
  labs: number
  pharmacies: number
}

const StatCard = ({ title, value, icon, color, change }: {
  title: string
  value: number | string
  icon: string
  color: string
  change?: string
}) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
    <div className="flex items-center justify-between mb-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl`}
           style={{ backgroundColor: `${color}20` }}>
        {icon}
      </div>
      {change && (
        <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
          {change}
        </span>
      )}
    </div>
    <p className="text-3xl font-bold text-gray-900">{value}</p>
    <p className="text-sm text-gray-500 mt-1">{title}</p>
  </div>
)

export default function DashboardOverview() {
  const [stats, setStats] = useState<Stats>({
    doctors: 0, patients: 0, bookings: 0,
    hospitals: 0, labs: 0, pharmacies: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [doctorsRes, hospitalsRes, labsRes, pharmaciesRes] = await Promise.all([
          fetch(`${API_BASE}/doctors`),
          fetch(`${API_BASE}/hospitals`),
          fetch(`${API_BASE}/labs`),
          fetch(`${API_BASE}/pharmacies`),
        ])

        const [doctors, hospitals, labs, pharmacies] = await Promise.all([
          doctorsRes.json(),
          hospitalsRes.json(),
          labsRes.json(),
          pharmaciesRes.json(),
        ])

        setStats({
          doctors: doctors.data?.length ?? 0,
          patients: 0,
          bookings: 0,
          hospitals: hospitals.data?.length ?? 0,
          labs: labs.data?.length ?? 0,
          pharmacies: pharmacies.data?.length ?? 0,
        })
      } catch (e) {
        console.error('Failed to fetch stats:', e)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-500 mt-1">Welcome to MediConnect Admin — DARMAN</p>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse">
              <div className="w-12 h-12 bg-gray-200 rounded-xl mb-4" />
              <div className="h-8 bg-gray-200 rounded w-16 mb-2" />
              <div className="h-4 bg-gray-100 rounded w-24" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard title="Total Doctors" value={stats.doctors} icon="👨‍⚕️" color="#1AAB97" change="+12%" />
          <StatCard title="Total Patients" value={stats.patients} icon="🧑‍🤝‍🧑" color="#3B82F6" change="+8%" />
          <StatCard title="Total Bookings" value={stats.bookings} icon="📅" color="#8B5CF6" change="+24%" />
          <StatCard title="Hospitals" value={stats.hospitals} icon="🏥" color="#F59E0B" />
          <StatCard title="Laboratories" value={stats.labs} icon="🔬" color="#EF4444" />
          <StatCard title="Pharmacies" value={stats.pharmacies} icon="💊" color="#10B981" />
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Verify Doctor', icon: '✅', color: '#1AAB97' },
            { label: 'View Bookings', icon: '📋', color: '#3B82F6' },
            { label: 'Send Notification', icon: '🔔', color: '#F59E0B' },
            { label: 'Generate Report', icon: '📊', color: '#8B5CF6' },
          ].map((action) => (
            <button
              key={action.label}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow text-left"
            >
              <span className="text-2xl">{action.icon}</span>
              <p className="text-sm font-medium text-gray-700 mt-2">{action.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* System Status */}
      <div className="mt-8 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">System Status</h2>
        <div className="space-y-3">
          {[
            { name: 'Backend API', status: 'Operational', color: 'green' },
            { name: 'Firebase Auth', status: 'Operational', color: 'green' },
            { name: 'Firestore Database', status: 'Operational', color: 'green' },
            { name: 'Firebase Storage', status: 'Pending Setup', color: 'yellow' },
            { name: 'AI Chatbot (Gemini)', status: 'Mock Mode', color: 'yellow' },
            { name: 'Video Consultation (Agora)', status: 'Mock Mode', color: 'yellow' },
            { name: 'Payment (HesabPay)', status: 'Mock Mode', color: 'yellow' },
          ].map((service) => (
            <div key={service.name} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <span className="text-sm text-gray-700">{service.name}</span>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                service.color === 'green'
                  ? 'text-green-700 bg-green-50'
                  : 'text-yellow-700 bg-yellow-50'
              }`}>
                {service.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

