import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import RescueCard from '../components/RescueCard'
import { motion } from 'framer-motion'

export default function Dashboard() {
  const { user } = useAuth()
  const [myRescues, setMyRescues] = useState([])
  const [claimedRescues, setClaimedRescues] = useState([])
  const [volunteerStats, setVolunteerStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('my')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const myRes = await axios.get('/api/rescue/my')
        setMyRescues(myRes.data)
        if (user.role === 'volunteer' || user.role === 'admin') {
          const claimedRes = await axios.get('/api/rescue/claimed')
          setClaimedRescues(claimedRes.data)
        }
        if (user.role === 'volunteer') {
          const statsRes = await axios.get('/api/volunteer/stats')
          setVolunteerStats(statsRes.data)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [user])

  const toggleAvailability = async () => {
    try {
      const { data } = await axios.patch('/api/volunteer/availability')
      setVolunteerStats((prev) => ({ ...prev, isAvailable: data.isAvailable }))
    } catch (err) {
      console.error('Failed to toggle availability')
    }
  }

  if (loading)
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-lg">
        Loading dashboard...
      </div>
    )

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 pt-24">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4"
      >
        <h1 className="text-3xl font-bold text-green-900">Dashboard</h1>
        <Link
          to="/report"
          className="px-4 py-2 bg-green-800 hover:bg-green-900 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          + Report Animal
        </Link>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-r from-green-50 to-lime-50 border border-green-100 rounded-xl p-5 mb-6"
      >
        <p className="text-gray-700">
          Welcome back, <strong>{user.name}</strong>! You are registered as a{' '}
          <strong className="capitalize">{user.role}</strong>.
        </p>
        {user.role === 'citizen' && (
          <p className="text-gray-500 text-sm mt-1">
            You can report stray animals and track your rescue requests below.
          </p>
        )}
        {user.role === 'volunteer' && (
          <>
            <p className="text-gray-500 text-sm mt-1 mb-4">
              View open rescue requests and claim tasks to help animals in need.
            </p>
            {volunteerStats && (
              <div className="flex flex-col sm:flex-row gap-6 p-4 bg-white rounded-lg border border-green-100 shadow-sm mt-4">
                <div className="flex-1">
                  <p className="text-sm text-gray-500 font-medium mb-1">Active Rescues</p>
                  <p className="text-lg font-bold text-gray-800">
                    <span className={volunteerStats.activeClaims >= volunteerStats.maxClaims ? 'text-red-600' : 'text-green-700'}>
                      {volunteerStats.activeClaims}
                    </span>{' '}
                    / {volunteerStats.maxClaims}
                  </p>
                  {volunteerStats.activeClaims >= volunteerStats.maxClaims && (
                    <p className="text-xs text-red-500 mt-1">Complete a rescue before claiming another.</p>
                  )}
                </div>
                
                <div className="flex-1">
                  <p className="text-sm text-gray-500 font-medium mb-1">Rating</p>
                  <p className="text-lg font-bold text-gray-800">
                    {volunteerStats.rating?.toFixed(1)} ⭐ <span className="text-sm text-gray-400 font-normal">({volunteerStats.ratingCount} reviews)</span>
                  </p>
                </div>

                <div className="flex-1 flex flex-col justify-center">
                  <label className="flex items-center cursor-pointer">
                    <div className="relative">
                      <input type="checkbox" className="sr-only" checked={volunteerStats.isAvailable} onChange={toggleAvailability} />
                      <div className={`block w-10 h-6 rounded-full transition-colors ${volunteerStats.isAvailable ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${volunteerStats.isAvailable ? 'transform translate-x-4' : ''}`}></div>
                    </div>
                    <div className="ml-3 text-sm font-medium text-gray-700">
                      {volunteerStats.isAvailable ? 'Available for rescues' : 'Unavailable'}
                    </div>
                  </label>
                </div>
              </div>
            )}
          </>
        )}
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setActiveTab('my')}
          className={`px-5 py-2 rounded-lg text-sm font-semibold border-2 transition-colors ${
            activeTab === 'my'
              ? 'bg-green-800 border-green-800 text-white'
              : 'border-green-800 text-green-800 hover:bg-green-50'
          }`}
        >
          My Reports ({myRescues.length})
        </button>
        {(user.role === 'volunteer' || user.role === 'admin') && (
          <button
            onClick={() => setActiveTab('claimed')}
            className={`px-5 py-2 rounded-lg text-sm font-semibold border-2 transition-colors ${
              activeTab === 'claimed'
                ? 'bg-green-800 border-green-800 text-white'
                : 'border-green-800 text-green-800 hover:bg-green-50'
            }`}
          >
            My Claimed Rescues ({claimedRescues.length})
          </button>
        )}
      </div>

      {activeTab === 'my' && (
        myRescues.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
            <p className="text-gray-400 mb-4">You haven't reported any rescues yet.</p>
            <Link
              to="/report"
              className="inline-block px-5 py-2.5 bg-green-800 text-white text-sm font-semibold rounded-lg hover:bg-green-900 transition-colors"
            >
              Report an Animal
            </Link>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {myRescues.map((r, i) => (
              <motion.div key={r._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <RescueCard rescue={r} />
              </motion.div>
            ))}
          </motion.div>
        )
      )}

      {activeTab === 'claimed' && (
        claimedRescues.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
            <p className="text-gray-400 mb-4">You haven't claimed any rescues yet.</p>
            <Link
              to="/rescues"
              className="inline-block px-5 py-2.5 bg-green-800 text-white text-sm font-semibold rounded-lg hover:bg-green-900 transition-colors"
            >
              View Open Rescues
            </Link>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {claimedRescues.map((r, i) => (
              <motion.div key={r._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <RescueCard rescue={r} />
              </motion.div>
            ))}
          </motion.div>
        )
      )}
    </div>
  )
}
