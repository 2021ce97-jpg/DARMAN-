'use client'

import { useEffect, useState } from 'react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'

interface Doctor {
  id: string
  fullName: string
  specialty: string
  province: string
  city: string
  hospital: string
  fee: number
  rating: number
  reviewCount: number
  status: string
  experience: number
}

export default function DoctorsPanel() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetch(`${API_BASE}/doctors`)
      .then(r => r.json())
      .then(data => setDoctors(data.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = doctors.filter(d => {
    const matchSearch = d.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      d.specialty?.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || d.status === filter
    return matchSearch && matchFilter
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Doctors</h1>
          <p className="text-gray-500 mt-1">{doctors.length} registered doctors</p>
        </div>
        <button className="px-4 py-2 text-white rounded-xl text-sm font-medium"
                style={{ backgroundColor: '#1AAB97' }}>
          + Add Doctor
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Search doctors..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none"
        >
          <option value="all">All Status</option>
          <option value="verified">Verified</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Doctor</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Specialty</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fee</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rating</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  {[...Array(7)].map((_, j) => (
                    <td key={j} className="px-6 py-4">
                      <div className="h-4 bg-gray-100 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                  No doctors found
                </td>
              </tr>
            ) : (
              filtered.map(doctor => (
                <tr key={doctor.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-semibold text-sm">
                        {doctor.fullName?.[0] ?? 'D'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{doctor.fullName}</p>
                        <p className="text-xs text-gray-500">{doctor.experience}y exp</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{doctor.specialty}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{doctor.city}, {doctor.province}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{doctor.fee} AFN</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-400">★</span>
                      <span className="text-sm font-medium">{doctor.rating}</span>
                      <span className="text-xs text-gray-400">({doctor.reviewCount})</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      doctor.status === 'verified'
                        ? 'text-green-700 bg-green-50'
                        : doctor.status === 'pending'
                        ? 'text-yellow-700 bg-yellow-50'
                        : 'text-red-700 bg-red-50'
                    }`}>
                      {doctor.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button className="text-xs text-blue-600 hover:underline">View</button>
                      {doctor.status === 'pending' && (
                        <button className="text-xs text-green-600 hover:underline">Verify</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
