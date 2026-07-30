'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    if (email === 'admin@darman.af' && password === 'Darman2026!') {
      if (typeof window !== 'undefined') {
        localStorage.setItem('darman_admin_auth', 'true')
      }
      router.push('/')
    } else {
      setError('Invalid credentials. Use admin@darman.af / Darman2026!')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4"
               style={{ backgroundColor: '#1AAB97' }}>D</div>
          <h1 className="text-2xl font-bold text-gray-900">DARMAN Admin</h1>
          <p className="text-gray-500 text-sm mt-1">Healthcare Platform Dashboard</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="admin@darman.af"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none text-sm" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none text-sm" required />
          </div>
          {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">{error}</div>}
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl text-white font-medium text-sm disabled:opacity-50"
            style={{ backgroundColor: '#1AAB97' }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <div className="mt-6 p-4 bg-gray-50 rounded-xl">
          <p className="text-xs text-gray-500 font-medium mb-2">Demo Credentials:</p>
          <p className="text-xs text-gray-600">Email: admin@darman.af</p>
          <p className="text-xs text-gray-600">Password: Darman2026!</p>
        </div>
      </div>
    </div>
  )
}
