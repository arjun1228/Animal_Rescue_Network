import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import AnalyticsDashboard from '../components/AnalyticsDashboard'
import toast from 'react-hot-toast'

// ── Unified status colors ────────────────────────────────────────────────────
const statusColors = {
  'Pending Review': 'bg-gray-100 text-gray-700',
  'Approved':       'bg-blue-100 text-blue-800',
  'Claimed':        'bg-amber-100 text-amber-800',
  'In Progress':    'bg-purple-100 text-purple-800',
  'Completed':      'bg-green-100 text-green-800',
  'Rejected':       'bg-red-100 text-red-800',
}

const inputCls = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition bg-white'
const labelCls = 'block text-sm font-semibold text-gray-700 mb-1'

const Th = ({ children }) => (
  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide bg-gray-50 border-b border-gray-200">{children}</th>
)
const Td = ({ children, className = '' }) => (
  <td className={`px-4 py-3 text-sm text-gray-700 border-b border-gray-100 ${className}`}>{children}</td>
)

const ACTION_LABELS = {
  RESCUE_APPROVED: { label: 'Approved Rescue', color: 'bg-green-100 text-green-700' },
  RESCUE_REJECTED: { label: 'Rejected Rescue', color: 'bg-red-100 text-red-700' },
  RESCUE_DELETED:  { label: 'Deleted Rescue',  color: 'bg-gray-100 text-gray-700' },
  ROLE_CHANGED:    { label: 'Changed Role',    color: 'bg-purple-100 text-purple-700' },
  CAMPAIGN_CREATED:{ label: 'Created Campaign',color: 'bg-blue-100 text-blue-700' },
}

export default function AdminPanel() {
  const { user: currentAdmin } = useAuth()
  const [tab, setTab] = useState('rescues')
  const [rescues, setRescues] = useState([])
  const [users, setUsers] = useState([])
  const [donations, setDonations] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [newCampaign, setNewCampaign] = useState({ title: '', description: '', animal: '', targetAmount: '', deadline: '' })

  // Reject inline form
  const [rejectingId, setRejectingId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectLoading, setRejectLoading] = useState(false)

  const fetchData = async (section) => {
    setLoading(true)
    try {
      if (section === 'rescues') {
        const { data } = await axios.get('/api/admin/rescue')
        setRescues(data)
      } else if (section === 'users') {
        const { data } = await axios.get('/api/admin/users')
        setUsers(data)
      } else if (section === 'donations') {
        const { data } = await axios.get('/api/admin/donations')
        setDonations(data)
      } else if (section === 'audit-log') {
        const { data } = await axios.get('/api/admin/audit-logs')
        setAuditLogs(data)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData(tab) }, [tab])

  const notify = (text, error = false) => { 
    if (error) toast.error(text)
    else toast.success(text)
  }

  const approveRescue = async (id) => {
    try {
      await axios.put(`/api/admin/rescue/${id}/approve`)
      notify('Rescue approved ✅')
      fetchData('rescues')
    } catch (err) { notify(err.response?.data?.message || 'Failed to approve', true) }
  }

  const openRejectForm = (id) => { setRejectingId(id); setRejectReason('') }
  const cancelReject = () => { setRejectingId(null); setRejectReason('') }

  const confirmReject = async (id) => {
    if (!rejectReason.trim()) { notify('Please enter a rejection reason.', true); return }
    setRejectLoading(true)
    try {
      await axios.patch(`/api/admin/rescue/${id}/reject`, { reason: rejectReason.trim() })
      notify('Rescue rejected.')
      setRejectingId(null); setRejectReason('')
      fetchData('rescues')
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to reject', true)
    } finally { setRejectLoading(false) }
  }

  const deleteRescue = async (id) => {
    if (!window.confirm('Permanently delete this rescue request?')) return
    try {
      await axios.delete(`/api/admin/rescue/${id}`)
      notify('Rescue deleted.')
      if (rejectingId === id) cancelReject()
      fetchData('rescues')
    } catch (err) { notify(err.response?.data?.message || 'Failed', true) }
  }

  // ── Role change with confirmation ────────────────────────────────────────────
  const updateRole = async (user, newRole) => {
    const confirmed = window.confirm(
      `Change ${user.name}'s role from "${user.role}" to "${newRole}"?\n\nThis will immediately affect their access.`
    )
    if (!confirmed) return
    try {
      await axios.put(`/api/admin/users/${user._id}/role`, { role: newRole })
      notify(`${user.name}'s role updated to ${newRole} ✅`)
      fetchData('users')
    } catch (err) { notify(err.response?.data?.message || 'Failed', true) }
  }

  const createCampaign = async (e) => {
    e.preventDefault()
    try {
      await axios.post('/api/donation', newCampaign)
      notify('Donation campaign created!')
      setNewCampaign({ title: '', description: '', animal: '', targetAmount: '', deadline: '' })
      setTab('donations')
    } catch (err) { notify(err.response?.data?.message || 'Failed to create campaign', true) }
  }

  const closeCampaign = async (id) => {
    if (!window.confirm('Are you sure you want to close this campaign early?')) return
    try {
      await axios.patch(`/api/admin/campaigns/${id}/close`)
      notify('Campaign closed manually.')
      fetchData('donations')
    } catch (err) { notify(err.response?.data?.message || 'Failed to close campaign', true) }
  }

  const tabs = ['rescues', 'users', 'donations', 'create-campaign', 'analytics', 'audit-log']
  const tabLabel = (t) => {
    if (t === 'create-campaign') return 'Create Campaign'
    if (t === 'analytics') return '📊 Analytics'
    if (t === 'audit-log') return '🔒 Audit Log'
    return t.charAt(0).toUpperCase() + t.slice(1)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pt-24">
      <h1 className="text-2xl sm:text-3xl font-bold text-green-900 mb-6">Admin Panel</h1>

      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border-2 transition-colors ${tab === t ? 'bg-green-800 border-green-800 text-white' : 'border-green-800 text-green-800 hover:bg-green-50'}`}
          >
            {tabLabel(t)}
          </button>
        ))}
      </div>

      {loading && tab !== 'analytics' && <div className="flex items-center justify-center h-32 text-gray-400">Loading...</div>}

      {/* ── Analytics Tab ───────────────────────────────────────────────────── */}
      {tab === 'analytics' && <AnalyticsDashboard />}

      {/* ── Rescues Tab ─────────────────────────────────────────────────────── */}
      {tab === 'rescues' && !loading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-800">All Rescue Requests ({rescues.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr><Th>Animal</Th><Th>Reporter</Th><Th>Location</Th><Th>Volunteer</Th><Th>Status</Th><Th>Actions</Th></tr>
              </thead>
              <tbody>
                {rescues.map((r) => (
                  <>
                    <tr key={r._id} className={`hover:bg-gray-50 ${rejectingId === r._id ? 'bg-red-50' : ''}`}>
                      <Td>{r.animalType}</Td>
                      <Td>{r.reporter?.name}</Td>
                      <Td className="max-w-[180px] truncate">{r.location?.address}</Td>
                      <Td>
                        {r.volunteer ? (
                          <div className="flex flex-col">
                            <span>{r.volunteer.name}</span>
                            {r.volunteer.isAvailable === false && (
                              <span className="text-[10px] text-red-600 font-bold">Unavailable ❌</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">None</span>
                        )}
                      </Td>
                      <Td>
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase ${statusColors[r.status] || 'bg-gray-100 text-gray-700'}`}>
                          {r.status}
                        </span>
                        {r.status === 'Rejected' && r.rejectionReason && (
                          <p className="text-xs text-red-500 mt-1 max-w-[200px]">"{r.rejectionReason}"</p>
                        )}
                      </Td>
                      <Td>
                        <div className="flex gap-1.5 flex-wrap">
                          {r.status === 'Pending Review' && (
                            <>
                              <button onClick={() => approveRescue(r._id)} className="px-2.5 py-1 bg-green-700 hover:bg-green-800 text-white text-xs font-semibold rounded-lg transition-colors">Approve</button>
                              <button
                                onClick={() => rejectingId === r._id ? cancelReject() : openRejectForm(r._id)}
                                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${rejectingId === r._id ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-amber-500 hover:bg-amber-600 text-white'}`}
                              >
                                {rejectingId === r._id ? 'Cancel' : 'Reject'}
                              </button>
                            </>
                          )}
                          <button onClick={() => deleteRescue(r._id)} className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors">Delete</button>
                        </div>
                      </Td>
                    </tr>

                    {rejectingId === r._id && (
                      <tr key={`${r._id}-reject`} className="bg-red-50 border-b border-red-100">
                        <td colSpan={5} className="px-6 py-4">
                          <div className="flex flex-col sm:flex-row gap-3 items-start">
                            <div className="flex-1">
                              <label className="block text-xs font-semibold text-red-700 mb-1">Rejection Reason *</label>
                              <textarea
                                autoFocus rows={2}
                                placeholder="e.g. Duplicate report, insufficient details..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none bg-white"
                              />
                            </div>
                            <div className="flex gap-2 mt-4 sm:mt-5 flex-shrink-0">
                              <button onClick={() => confirmReject(r._id)} disabled={rejectLoading || !rejectReason.trim()} className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors">
                                {rejectLoading ? 'Rejecting...' : 'Confirm Reject'}
                              </button>
                              <button onClick={cancelReject} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-semibold rounded-lg transition-colors">Cancel</button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Users Tab ───────────────────────────────────────────────────────── */}
      {tab === 'users' && !loading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-800">All Users ({users.length})</h3>
            <p className="text-xs text-gray-400 mt-0.5">Role changes require confirmation. You cannot change your own role.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr><Th>Name</Th><Th>Email</Th><Th>Phone</Th><Th>Role</Th><Th>Change Role</Th></tr></thead>
              <tbody>
                {users.map((u) => {
                  const isSelf = u._id === currentAdmin?._id
                  return (
                    <tr key={u._id} className={`hover:bg-gray-50 ${isSelf ? 'bg-amber-50' : ''}`}>
                      <Td>
                        {u.name}
                        {isSelf && <span className="ml-2 text-xs text-amber-600 font-semibold">(you)</span>}
                      </Td>
                      <Td>{u.email}</Td>
                      <Td>{u.phone}</Td>
                      <Td>
                        {u.role === 'volunteer' ? (
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase bg-blue-100 text-blue-800 w-fit">
                              {u.role}
                            </span>
                            <span className="text-[11px] text-gray-500 font-medium">
                              {u.rating?.toFixed(1)} ⭐ ({u.ratingCount || 0})
                              {!u.isAvailable && <span className="ml-1 text-red-500 font-bold">❌</span>}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase bg-blue-100 text-blue-800">
                            {u.role}
                          </span>
                        )}
                      </Td>
                      <Td>
                        {isSelf ? (
                          <span className="text-xs text-gray-400 italic">Cannot change own role</span>
                        ) : (
                          <select
                            defaultValue={u.role}
                            onChange={(e) => updateRole(u, e.target.value)}
                            className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          >
                            <option value="citizen">citizen</option>
                            <option value="volunteer">volunteer</option>
                            <option value="donor">donor</option>
                            <option value="admin">admin</option>
                          </select>
                        )}
                      </Td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Donations Tab ────────────────────────────────────────────────────── */}
      {tab === 'donations' && !loading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-800">All Donation Campaigns ({donations.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr><Th>Title</Th><Th>Animal</Th><Th>Target</Th><Th>Collected</Th><Th>Donors</Th><Th>Status</Th><Th>Action</Th></tr></thead>
              <tbody>
                {donations.map((d) => (
                  <tr key={d._id} className="hover:bg-gray-50">
                    <Td>{d.title}</Td>
                    <Td>{d.animal}</Td>
                    <Td>Rs.{d.targetAmount?.toLocaleString()}</Td>
                    <Td className="font-semibold text-green-700">Rs.{d.collectedAmount?.toLocaleString()}</Td>
                    <Td>{d.transactions?.length || 0}</Td>
                    <Td>
                      {d.isActive ? (
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase bg-green-100 text-green-800">Active</span>
                      ) : (
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase bg-gray-100 text-gray-600">Closed</span>
                          {d.closedReason && <span className="text-[10px] text-gray-400 mt-1 uppercase">{d.closedReason.replace('_', ' ')}</span>}
                        </div>
                      )}
                    </Td>
                    <Td>
                      {d.isActive && (
                        <button onClick={() => closeCampaign(d._id)} className="text-xs text-red-600 hover:text-red-800 font-semibold border border-red-200 px-2 py-1 rounded bg-red-50 hover:bg-red-100 transition-colors">
                          Close
                        </button>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Create Campaign Tab ──────────────────────────────────────────────── */}
      {tab === 'create-campaign' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-lg">
          <h3 className="text-lg font-bold text-gray-800 mb-5">Create Donation Campaign</h3>
          <form onSubmit={createCampaign} className="space-y-4">
            <div>
              <label className={labelCls}>Campaign Title *</label>
              <input type="text" placeholder="e.g. Help Bruno recover" value={newCampaign.title} onChange={(e) => setNewCampaign({ ...newCampaign, title: e.target.value })} required className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Animal *</label>
              <input type="text" placeholder="e.g. Dog - Bruno" value={newCampaign.animal} onChange={(e) => setNewCampaign({ ...newCampaign, animal: e.target.value })} required className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Description *</label>
              <textarea placeholder="Describe the animal's medical needs..." value={newCampaign.description} onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })} required rows={4} className={inputCls + ' resize-y'} />
            </div>
            <div>
              <label className={labelCls}>Target Amount (Rs.) *</label>
              <input type="number" min="1" placeholder="e.g. 10000" value={newCampaign.targetAmount} onChange={(e) => setNewCampaign({ ...newCampaign, targetAmount: e.target.value })} required className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Deadline (Future Date) *</label>
              <input type="date" min={new Date().toISOString().split('T')[0]} value={newCampaign.deadline} onChange={(e) => setNewCampaign({ ...newCampaign, deadline: e.target.value })} required className={inputCls} />
            </div>
            <button type="submit" className="w-full py-3 bg-green-800 hover:bg-green-900 text-white font-semibold rounded-lg transition-colors">Create Campaign</button>
          </form>
        </div>
      )}

      {/* ── Audit Log Tab ────────────────────────────────────────────────────── */}
      {tab === 'audit-log' && !loading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <span className="text-lg">🔒</span>
            <div>
              <h3 className="font-bold text-gray-800">Audit Log</h3>
              <p className="text-xs text-gray-400">Last 50 sensitive admin actions</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            {auditLogs.length === 0 ? (
              <div className="p-12 text-center text-gray-400">No audit events recorded yet.</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr><Th>Date</Th><Th>Admin</Th><Th>Action</Th><Th>Target</Th><Th>Change</Th></tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => {
                    const a = ACTION_LABELS[log.action] || { label: log.action, color: 'bg-gray-100 text-gray-700' }
                    return (
                      <tr key={log._id} className="hover:bg-gray-50">
                        <Td className="whitespace-nowrap text-xs text-gray-500">
                          {new Date(log.createdAt).toLocaleString()}
                        </Td>
                        <Td className="font-medium">{log.adminId?.name || '—'}</Td>
                        <Td>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${a.color}`}>{a.label}</span>
                        </Td>
                        <Td className="max-w-[200px] truncate text-xs">{log.targetLabel || '—'}</Td>
                        <Td className="text-xs">
                          {log.oldValue && log.newValue
                            ? <span><span className="text-red-500 line-through">{log.oldValue}</span> → <span className="text-green-600 font-semibold">{log.newValue}</span></span>
                            : log.newValue || log.oldValue || '—'}
                        </Td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
