import { useState, useEffect } from 'react'
import axios from 'axios'
import RescueCard from '../components/RescueCard'
import RescueMapView from '../components/RescueMapView'
import Skeleton from '../components/Skeleton'
import { motion } from 'framer-motion'

export default function RescueRequests() {
  const [rescues, setRescues] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState('list') // 'list' | 'map'

  useEffect(() => {
    const fetchRescues = async () => {
      try {
        const { data } = await axios.get('/api/rescue')
        setRescues(data)
        setFiltered(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchRescues()
  }, [])

  useEffect(() => {
    let result = rescues
    if (statusFilter !== 'All') result = result.filter((r) => r.status === statusFilter)
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (r) =>
          r.animalType.toLowerCase().includes(q) ||
          r.location?.address?.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q)
      )
    }
    setFiltered(result)
  }, [statusFilter, search, rescues])



  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pt-24">
      <h1 className="text-3xl font-bold text-green-900 mb-6">Rescue Requests</h1>

      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <input
            type="text"
            placeholder="Search by animal, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-48 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="All">All</option>
            <option value="Approved">Approved</option>
            <option value="Claimed">Claimed</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
          {/* View mode toggle */}
          <div className="flex gap-1 flex-shrink-0">
            <button
              onClick={() => setViewMode('list')}
              title="List view"
              className={`px-3 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                viewMode === 'list'
                  ? 'bg-green-800 border-green-800 text-white'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              📋 List
            </button>
            <button
              onClick={() => setViewMode('map')}
              title="Map view"
              className={`px-3 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                viewMode === 'map'
                  ? 'bg-green-800 border-green-800 text-white'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              🗺️ Map
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
             <div key={i} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm p-4 h-56 flex flex-col">
                <Skeleton className="h-5 w-20 mb-3 rounded-full" />
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <div className="bg-gray-50 rounded-xl p-3 mb-4 mt-auto">
                  <Skeleton className="h-3 w-1/3 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
             </div>
          ))}
        </div>
      ) : viewMode === 'map' ? (
        <RescueMapView rescues={filtered} />
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
          <p className="text-gray-400">No rescue requests found.</p>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {filtered.map((r, i) => (
            <motion.div key={r._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <RescueCard rescue={r} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}

