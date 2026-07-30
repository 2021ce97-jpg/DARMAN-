'use client'

export default function AnalyticsPanel() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
  const bookings = [12, 19, 15, 28, 35, 42]
  const maxVal = Math.max(...bookings)

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500 mt-1">Platform performance metrics</p>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Bookings Over Time</h2>
        <div className="flex items-end gap-4 h-40">
          {bookings.map((val, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <span className="text-xs text-gray-500">{val}</span>
              <div
                className="w-full rounded-t-lg transition-all"
                style={{
                  height: `${(val / maxVal) * 120}px`,
                  backgroundColor: '#1AAB97',
                  opacity: 0.7 + (i / bookings.length) * 0.3,
                }}
              />
              <span className="text-xs text-gray-400">{months[i]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-6">
        {[
          { label: 'Avg. Consultation Fee', value: '650 AFN', icon: '💰' },
          { label: 'Patient Satisfaction', value: '4.7 / 5', icon: '⭐' },
          { label: 'Avg. Wait Time', value: '2.3 days', icon: '⏱️' },
          { label: 'Online Consultations', value: '34%', icon: '📹' },
        ].map((metric) => (
          <div key={metric.label} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <span className="text-3xl">{metric.icon}</span>
            <p className="text-2xl font-bold text-gray-900 mt-3">{metric.value}</p>
            <p className="text-sm text-gray-500 mt-1">{metric.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
