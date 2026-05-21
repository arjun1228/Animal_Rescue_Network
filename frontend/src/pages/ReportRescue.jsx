import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import LocationPicker from '../components/LocationPicker'
import toast from 'react-hot-toast'

const inputCls = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition bg-white'
const labelCls = 'block text-sm font-semibold text-gray-700 mb-1'

const MAX_PHOTOS = 3
const MAX_SIZE_MB = 5

export default function ReportRescue() {
  const [form, setForm] = useState({
    animalType: '',
    description: '',
    address: '',
    lat: '',
    lng: '',
  })
  // Each entry: { file: File, preview: string }
  const [photoItems, setPhotoItems] = useState([])
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleLocationChange = useCallback(({ lat, lng, address }) => {
    setForm((prev) => ({ ...prev, address, lat, lng }))
  }, [])

  const handlePhotos = (e) => {
    const selected = Array.from(e.target.files)
    const remaining = MAX_PHOTOS - photoItems.length

    if (remaining <= 0) {
      setError(`Maximum ${MAX_PHOTOS} photos allowed.`)
      e.target.value = ''
      return
    }

    const toAdd = selected.slice(0, remaining)
    const oversized = toAdd.filter((f) => f.size > MAX_SIZE_MB * 1024 * 1024)
    if (oversized.length > 0) {
      setError(`File "${oversized[0].name}" exceeds 5 MB. Please choose a smaller image.`)
      e.target.value = ''
      return
    }

    setError('')
    const newItems = toAdd.map((file) => ({ file, preview: URL.createObjectURL(file) }))
    setPhotoItems((prev) => [...prev, ...newItems])
    e.target.value = '' // reset input so same file can be re-added after removal
  }

  const removePhoto = (index) => {
    setPhotoItems((prev) => {
      // Revoke the object URL to avoid memory leaks
      URL.revokeObjectURL(prev[index].preview)
      return prev.filter((_, i) => i !== index)
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.address) {
      setError('Please select a location on the map.')
      return
    }
    
    const formData = new FormData()
    formData.append('animalType', form.animalType)
    formData.append('description', form.description)
    formData.append('address', form.address)
    if (form.lat) formData.append('lat', form.lat)
    if (form.lng) formData.append('lng', form.lng)
    photoItems.forEach(({ file }) => formData.append('photos', file))

    const promise = axios.post('/api/rescue', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })

    toast.promise(promise, {
      loading: 'Submitting rescue report...',
      success: 'Rescue report submitted!',
      error: 'Failed to submit. Please try again.'
    })

    try {
      await promise
      setTimeout(() => navigate('/dashboard'), 2500)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 pt-24">
      <h1 className="text-3xl font-bold text-green-900 mb-6">Report a Stray Animal</h1>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>
      )}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className={labelCls}>Animal Type *</label>
            <input type="text" name="animalType" placeholder="e.g. Dog, Cat, Bird..." value={form.animalType} onChange={handleChange} required className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Description of Condition *</label>
            <textarea name="description" placeholder="Describe the animal's condition, injuries, behavior..." value={form.description} onChange={handleChange} required rows={4} className={inputCls + ' resize-y'} />
          </div>
          <div>
            <label className={labelCls}>
              Location *
              <span className="ml-1 text-gray-400 font-normal text-xs">(click or drag the pin)</span>
            </label>
            <LocationPicker onLocationChange={handleLocationChange} />
            {form.address && (
              <input type="hidden" name="address" value={form.address} />
            )}
          </div>

          {/* ── Photo Upload ─────────────────────────────────────────────── */}
          <div>
            <label className={labelCls}>
              Upload Photos
              <span className="ml-1 text-gray-400 font-normal">({photoItems.length}/{MAX_PHOTOS} selected · max 5 MB each · JPG, PNG, WebP)</span>
            </label>

            {photoItems.length < MAX_PHOTOS && (
              <label className="flex items-center gap-2 cursor-pointer mt-1 w-fit px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 text-sm font-semibold rounded-lg border border-green-200 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Photo
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handlePhotos}
                />
              </label>
            )}

            {/* Thumbnails with remove button */}
            {photoItems.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-3">
                {photoItems.map((item, i) => (
                  <div key={i} className="relative group">
                    <img
                      src={item.preview}
                      alt={`preview-${i}`}
                      className="w-24 h-20 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow transition-colors"
                      aria-label={`Remove photo ${i + 1}`}
                    >
                      ✕
                    </button>
                    <span className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1 rounded">
                      {(item.file.size / (1024 * 1024)).toFixed(1)} MB
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="submit" className="w-full py-3 bg-green-800 hover:bg-green-900 text-white font-semibold rounded-lg transition-colors">
            Submit Rescue Request
          </button>
        </form>
      </div>
    </div>
  )
}
