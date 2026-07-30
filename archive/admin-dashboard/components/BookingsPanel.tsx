'use client'

import { useEffect, useState } from 'react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://darman.onrender.com/api/v1'

interface Booking {
  id: string; patientName: string; doctorName: string; dateTime: any
  status: string; amount: number; type: string
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'text-yellow-700 bg-yellow-50',
  approved: 'text-green-700 bg-green-50',
  completed: 'text-blue-700 bg-blue-50',
  cancelled: 'text-red-700 bg-red-50',
}

export default function BookingsPanel() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetch(`${API_BASE}/bookings/all`)
      .then(r => r.json())
      .then(data => setBookings(data.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
          <p className="text-gray-500 mt-1">{bookings.length} total appointments</p>
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none">
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Patient</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Doctor</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Date</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Type</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Amount</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>{[...Array(6)].map((_, j) => (
                  <td key={j} className="px-6 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                ))}</tr>
              ))
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">No bookings found</td></tr>
            ) : filtered.map(b => (
              <tr key={b.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{b.patientName || '—'}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{b.doctorName || '—'}</td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {b.dateTime?.seconds ? new Date(b.dateTime.seconds * 1000).toLocaleDateString() : '—'}
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 capitalize">{b.type || 'clinic'}</span>
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{b.amount ? `${b.amount} AFN` : '—'}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${STATUS_COLORS[b.status] ?? 'text-gray-600 bg-gray-100'}`}>
                    {b.status || 'unknown'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
