import { useState, useEffect } from 'react'
import axios from 'axios'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList,
} from 'recharts'

// ── Metric card ──────────────────────────────────────────────────────────────
function MetricCard({ label, value, icon, color, sub }) {
  return (
    <div className={`bg-white rounded-xl border shadow-sm p-5 flex items-start gap-4 border-gray-200`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value ?? '—'}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ── Custom bar tooltip ───────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm">
      <p className="font-semibold text-gray-700">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="text-xs">
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  )
}

const MONTH_COLORS = ['#34d399','#10b981','#059669','#047857','#065f46','#064e3b']
const CAMPAIGN_COLORS = { collected: '#10b981', target: '#e5e7eb' }

export default function AnalyticsDashboard() {
  const [overview, setOverview] = useState(null)
  const [monthlyData, setMonthlyData] = useState([])
  const [campaignData, setCampaignData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const [o, m, c] = await Promise.all([
          axios.get('/api/admin/analytics/overview'),
          axios.get('/api/admin/analytics/rescues-by-month'),
          axios.get('/api/admin/analytics/donations-by-campaign'),
        ])
        setOverview(o.data)
        setMonthlyData(m.data)
        setCampaignData(c.data)
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load analytics')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // ── CSV download helper ─────────────────────────────────────────────────────
  const downloadCSV = (endpoint, filename) => {
    const stored = localStorage.getItem('arUser')
    const token = stored ? JSON.parse(stored).token : ''
    fetch(`/api/admin/${endpoint}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (!res.ok) throw new Error('Export failed')
        return res.blob()
      })
      .then((blob) => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        a.click()
        URL.revokeObjectURL(url)
      })
      .catch(() => alert('Export failed. Please try again.'))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Loading analytics…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-4 text-sm">{error}</div>
    )
  }

  return (
    <div className="space-y-8">

      {/* ── Metric Cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Rescues"    value={overview?.totalRescues}      icon="🐾" color="bg-green-50" />
        <MetricCard label="Completed"        value={overview?.completedRescues}   icon="✅" color="bg-emerald-50"
          sub={overview?.totalRescues ? `${Math.round((overview.completedRescues / overview.totalRescues) * 100)}% completion rate` : null}
        />
        <MetricCard label="Total Raised"     value={`₹${(overview?.totalAmountRaised || 0).toLocaleString('en-IN')}`}
          icon="💰" color="bg-amber-50"
          sub={`across ${overview?.totalDonations || 0} campaigns`}
        />
        <MetricCard label="Active Volunteers" value={overview?.activeVolunteers}  icon="🙋" color="bg-blue-50"
          sub={`of ${overview?.totalUsers} total users`}
        />
      </div>

      {/* ── Charts row ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Rescues per month bar chart */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="font-bold text-gray-800 mb-1">Rescues Submitted</h3>
          <p className="text-xs text-gray-400 mb-5">Last 6 months</p>
          {monthlyData.every((d) => d.count === 0) ? (
            <div className="flex items-center justify-center h-48 text-gray-300 text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f0fdf4' }} />
                <Bar dataKey="count" name="Rescues" radius={[6, 6, 0, 0]} maxBarSize={52}>
                  {monthlyData.map((_, i) => (
                    <Cell key={i} fill={MONTH_COLORS[i % MONTH_COLORS.length]} />
                  ))}
                  <LabelList dataKey="count" position="top" style={{ fontSize: 11, fill: '#374151', fontWeight: 600 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Donations by campaign horizontal bar */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="font-bold text-gray-800 mb-1">Donations by Campaign</h3>
          <p className="text-xs text-gray-400 mb-5">Collected vs Target (₹)</p>
          {campaignData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-300 text-sm">No campaigns yet</div>
          ) : (
            <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1">
              {campaignData.map((c) => {
                const pct = c.targetAmount > 0 ? Math.min(100, Math.round((c.collectedAmount / c.targetAmount) * 100)) : 0
                return (
                  <div key={c._id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-700 truncate max-w-[60%]">{c.title}</span>
                      <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                        ₹{(c.collectedAmount || 0).toLocaleString('en-IN')} / ₹{(c.targetAmount || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                      <div
                        className="h-2.5 rounded-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          background: pct >= 100 ? '#059669' : '#10b981',
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{pct}% funded · {c.donorCount} donor{c.donorCount !== 1 ? 's' : ''}</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Status breakdown ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="font-bold text-gray-800 mb-4">Rescue Status Breakdown</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Pending Review', value: overview?.pendingRescues, color: 'bg-gray-100 text-gray-700' },
            { label: 'Approved',       value: (overview?.totalRescues || 0) - (overview?.pendingRescues || 0) - (overview?.completedRescues || 0), color: 'bg-blue-100 text-blue-700' },
            { label: 'Completed',      value: overview?.completedRescues, color: 'bg-green-100 text-green-700' },
          ].map((s) => (
            <div key={s.label} className={`rounded-lg px-3 py-3 text-center ${s.color}`}>
              <p className="text-2xl font-bold">{s.value ?? 0}</p>
              <p className="text-xs font-medium mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── CSV Exports ──────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="font-bold text-gray-800 mb-1">Export Data</h3>
        <p className="text-xs text-gray-400 mb-4">Download full records as CSV files for offline analysis.</p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => downloadCSV('rescues/export', 'rescues.csv')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-800 hover:bg-green-900 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Rescues CSV
          </button>
          <button
            onClick={() => downloadCSV('donations/export', 'donations.csv')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Donations CSV
          </button>
        </div>
      </div>

    </div>
  )
}
