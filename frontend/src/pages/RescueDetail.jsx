  import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import L from 'leaflet'
import Skeleton from '../components/Skeleton'

// Fix Leaflet icon paths broken by Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const statusColors = {
  'Pending Review': 'bg-gray-100 text-gray-700',
  'Approved':       'bg-blue-100 text-blue-800',
  'Claimed':        'bg-amber-100 text-amber-800',
  'In Progress':    'bg-purple-100 text-purple-800',
  'Completed':      'bg-green-100 text-green-800',
  'Rejected':       'bg-red-100 text-red-800',
}

export default function RescueDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [rescue, setRescue] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newStatus, setNewStatus] = useState('')

  // Completion proof photo
  const [completionFile, setCompletionFile] = useState(null)
  const [completionPreview, setCompletionPreview] = useState('')

  // Lightbox
  const [lightbox, setLightbox] = useState(null)

  // Volunteer Rating
  const [rating, setRating] = useState(0)
  const [ratingHover, setRatingHover] = useState(0)
  const [ratingSubmitted, setRatingSubmitted] = useState(false)

  useEffect(() => {
    const fetchRescue = async () => {
      try {
        const { data } = await axios.get(`/api/rescue/${id}`)
        setRescue(data)
        setNewStatus(data.status)
      } catch {
        setError('Failed to load rescue request')
      } finally {
        setLoading(false)
      }
    }
    fetchRescue()
  }, [id])

  const handleClaim = async () => {
    const promise = axios.put(`/api/rescue/${id}/claim`)
    
    toast.promise(promise, {
      loading: 'Claiming rescue...',
      success: 'Rescue claimed successfully!',
      error: 'Failed to claim rescue.'
    })

    try {
      const { data } = await promise
      setRescue(data)
    } catch (err) {
      console.error(err)
    }
  }

  const handleCompletionPhoto = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError('Proof photo must be under 5 MB.')
      e.target.value = ''
      return
    }
    setError('')
    if (completionPreview) URL.revokeObjectURL(completionPreview)
    setCompletionFile(file)
    setCompletionPreview(URL.createObjectURL(file))
  }

  const removeCompletionPhoto = () => {
    URL.revokeObjectURL(completionPreview)
    setCompletionFile(null)
    setCompletionPreview('')
  }

  const handleStatusUpdate = async () => {
    setError('')
    try {
      let promise;
      if (completionFile && newStatus === 'Completed') {
        const formData = new FormData()
        formData.append('status', newStatus)
        formData.append('completionPhoto', completionFile)
        promise = axios.put(`/api/rescue/${id}/status`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      } else {
        promise = axios.put(`/api/rescue/${id}/status`, { status: newStatus })
      }

      toast.promise(promise, {
        loading: 'Updating status...',
        success: 'Status updated!',
        error: 'Failed to update status.'
      })

      const res = await promise
      setRescue(res.data)
      setCompletionFile(null)
      setCompletionPreview('')
    } catch (err) {
      console.error(err)
    }
  }

  const handleRateVolunteer = async () => {
    if (rating < 1) return
    setError('')
    
    const promise = axios.post(`/api/rescue/${id}/rate`, { rating })
    
    toast.promise(promise, {
      loading: 'Submitting rating...',
      success: 'Rating submitted!',
      error: 'Failed to submit rating.'
    })

    try {
      await promise
      setRatingSubmitted(true)
      setRescue({ ...rescue, ratedByReporter: true })
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 pt-24">
      <Skeleton className="h-8 w-24 rounded-lg mb-4" />
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between mb-4">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <Skeleton className="h-4 w-1/4 mb-2" />
        <Skeleton className="h-4 w-full mb-4" />
        <Skeleton className="h-48 w-full rounded-lg mb-4" />
        <Skeleton className="h-4 w-1/2 mb-2" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    </div>
  )
  if (error && !rescue) return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
    </div>
  )

  const isVolunteerAssigned = rescue.volunteer && rescue.volunteer._id === user._id
  const canClaim = (user.role === 'volunteer' || user.role === 'admin') && rescue.status === 'Approved'
  const canUpdateStatus = (isVolunteerAssigned || user.role === 'admin') && rescue.status !== 'Pending' && rescue.status !== 'Approved'

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 pt-24">
      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} alt="Full size" className="max-w-full max-h-full rounded-lg shadow-2xl" />
          <button className="absolute top-4 right-4 text-white text-2xl font-bold hover:text-gray-300">✕</button>
        </div>
      )}

      <button onClick={() => navigate(-1)} className="mb-4 px-4 py-2 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors">
        ← Back
      </button>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-2xl font-bold text-gray-900">{rescue.animalType} Rescue</h2>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full uppercase ${statusColors[rescue.status] || 'bg-gray-100 text-gray-700'}`}>
            {rescue.status}
          </span>
        </div>

        {/* ── Animal Photos Gallery ─────────────────────────────────────── */}
        {rescue.photos && rescue.photos.length > 0 && (
          <div className="mb-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">📷 Animal Photos</p>
            <div className="flex flex-wrap gap-2">
              {rescue.photos.map((p, i) => (
                <img
                  key={i}
                  src={p}
                  alt={`animal-photo-${i + 1}`}
                  onClick={() => setLightbox(p)}
                  className="w-32 h-24 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 hover:shadow-md transition-all"
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Completion Photo ──────────────────────────────────────────── */}
        {rescue.completionPhoto && (
          <div className="mb-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">✅ Rescue Completion Proof</p>
            <img
              src={rescue.completionPhoto}
              alt="completion-proof"
              onClick={() => setLightbox(rescue.completionPhoto)}
              className="w-full sm:w-64 h-44 object-cover rounded-lg border-2 border-green-300 cursor-pointer hover:opacity-90 hover:shadow-md transition-all"
            />
          </div>
        )}

        <div className="mb-4">
          <p className="font-semibold text-gray-700 mb-1">Description</p>
          <p className="text-gray-600 text-sm">{rescue.description}</p>
        </div>
        <div className="mb-4">
          <p className="text-gray-700 text-sm"><strong>Location:</strong> {rescue.location?.address}</p>
          {rescue.location?.lat && rescue.location?.lng && (
            <p className="text-gray-400 text-xs mt-0.5">Coordinates: {rescue.location.lat}, {rescue.location.lng}</p>
          )}
          {/* Mini read-only map */}
          {rescue.geoLocation?.coordinates?.length === 2 && (
            <div className="mt-3 rounded-lg overflow-hidden border border-gray-200 shadow-sm" style={{ height: 220 }}>
              <MapContainer
                center={[rescue.geoLocation.coordinates[1], rescue.geoLocation.coordinates[0]]}
                zoom={15}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
                dragging={false}
                scrollWheelZoom={false}
                doubleClickZoom={false}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[rescue.geoLocation.coordinates[1], rescue.geoLocation.coordinates[0]]} />
              </MapContainer>
            </div>
          )}
        </div>
        <div className="mb-4 text-sm text-gray-600">
          <p><strong>Reported by:</strong> {rescue.reporter?.name} ({rescue.reporter?.phone})</p>
          {rescue.volunteer && <p className="mt-1"><strong>Volunteer:</strong> {rescue.volunteer?.name} ({rescue.volunteer?.phone})</p>}
          <p className="text-gray-400 text-xs mt-1">Submitted: {new Date(rescue.createdAt).toLocaleString()}</p>
        </div>

        {/* ── Claim ────────────────────────────────────────────────────── */}
        {canClaim && (
          <div className="border-t border-gray-100 pt-4">
            <p className="text-sm text-gray-600 mb-3">This rescue is available. Claim it to respond.</p>
            <button onClick={handleClaim} className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-lg transition-colors">
              Claim This Rescue
            </button>
          </div>
        )}

        {/* ── Update Status ─────────────────────────────────────────────── */}
        {canUpdateStatus && (
          <div className="border-t border-gray-100 pt-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">Update Rescue Status:</p>
            <div className="flex gap-3 items-start flex-wrap flex-col sm:flex-row">
              <div className="flex gap-3 items-center flex-wrap">
                <select
                  value={newStatus}
                  onChange={(e) => {
                    setNewStatus(e.target.value)
                    // Clear proof photo if switching away from Completed
                    if (e.target.value !== 'Completed') removeCompletionPhoto()
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {/* Only volunteer-allowed transitions */}
                  <option value="Claimed">Claimed</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
                <button onClick={handleStatusUpdate} className="px-5 py-2 bg-green-800 hover:bg-green-900 text-white text-sm font-semibold rounded-lg transition-colors">
                  Update Status
                </button>
              </div>

              {/* Proof photo — only when Completed selected */}
              {newStatus === 'Completed' && (
                <div className="w-full mt-2">
                  <p className="text-xs text-gray-500 mb-2">📸 Upload proof of completion (optional, max 5 MB):</p>
                  {!completionFile ? (
                    <label className="flex items-center gap-2 cursor-pointer w-fit px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 text-sm font-medium rounded-lg border border-green-200 transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Attach Photo
                      <input type="file" accept="image/*" className="hidden" onChange={handleCompletionPhoto} />
                    </label>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img src={completionPreview} alt="proof-preview" className="w-24 h-20 object-cover rounded-lg border-2 border-green-300" />
                        <button
                          type="button"
                          onClick={removeCompletionPhoto}
                          className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow"
                        >
                          ✕
                        </button>
                      </div>
                      <p className="text-xs text-gray-500">{completionFile.name}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {rescue.status === 'Pending Review' && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg px-4 py-3 text-sm">
            ⏳ This rescue request is pending admin review before it appears publicly.
          </div>
        )}

        {/* ── Volunteer Rating (Reporter only) ────────────────────────────── */}
        {rescue.status === 'Completed' && rescue.reporter?._id === user?._id && rescue.volunteer && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            {rescue.ratedByReporter || ratingSubmitted ? (
              <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg px-4 py-3 text-sm flex items-center gap-2">
                <span>⭐</span> You have rated the volunteer for this rescue. Thank you!
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm font-bold text-blue-900 mb-1">Rate your volunteer</p>
                <p className="text-xs text-blue-700 mb-3">How was your experience with {rescue.volunteer.name}?</p>
                <div className="flex items-center gap-2 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setRatingHover(star)}
                      onMouseLeave={() => setRatingHover(0)}
                      className="text-2xl focus:outline-none transition-transform hover:scale-110"
                    >
                      <span className={star <= (ratingHover || rating) ? 'text-amber-400' : 'text-gray-300'}>
                        ★
                      </span>
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleRateVolunteer}
                  disabled={rating === 0}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors"
                >
                  Submit Rating
                </button>
              </div>
            )}
          </div>
        )}

        {rescue.status === 'Rejected' && (
          <div className="mt-4 bg-red-50 border border-red-300 rounded-lg px-4 py-4">
            <p className="text-sm font-bold text-red-700 mb-1">❌ This rescue report was rejected by the admin.</p>
            {rescue.rejectionReason && (
              <p className="text-sm text-red-600"><span className="font-semibold">Reason:</span> {rescue.rejectionReason}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
