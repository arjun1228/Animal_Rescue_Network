import { useState, useEffect, useRef, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'

// Fix Leaflet's broken default icon paths in Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const DEFAULT_POS = [19.076, 72.877] // Mumbai

// Pans map to a position once (used after geolocation resolves)
function PanOnce({ target }) {
  const map = useMap()
  const panned = useRef(false)
  useEffect(() => {
    if (target && !panned.current) {
      map.flyTo(target, 15)
      panned.current = true
    }
  }, [target, map])
  return null
}

// Handles both click-on-map and drag-marker
function InteractiveMarker({ position, onMove }) {
  const markerRef = useRef(null)
  useMapEvents({
    click(e) { onMove([e.latlng.lat, e.latlng.lng]) },
  })
  return (
    <Marker
      position={position}
      draggable
      ref={markerRef}
      eventHandlers={{
        dragend() {
          const m = markerRef.current
          if (m) {
            const { lat, lng } = m.getLatLng()
            onMove([lat, lng])
          }
        },
      }}
    />
  )
}

export default function LocationPicker({ onLocationChange }) {
  const [pos, setPos] = useState(DEFAULT_POS)
  const [address, setAddress] = useState('')
  const [geocoding, setGeocoding] = useState(false)
  const [geoTarget, setGeoTarget] = useState(null) // triggers PanOnce

  const reverseGeocode = useCallback(async ([lat, lng]) => {
    setGeocoding(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        { headers: { 'Accept-Language': 'en' } }
      )
      const data = await res.json()
      const addr = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`
      setAddress(addr)
      onLocationChange({ lat, lng, address: addr })
    } catch {
      const addr = `${lat.toFixed(5)}, ${lng.toFixed(5)}`
      setAddress(addr)
      onLocationChange({ lat, lng, address: addr })
    } finally {
      setGeocoding(false)
    }
  }, [onLocationChange])

  const handleMove = useCallback((newPos) => {
    setPos(newPos)
    reverseGeocode(newPos)
  }, [reverseGeocode])

  // Ask for browser geolocation once on mount
  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const p = [coords.latitude, coords.longitude]
        setPos(p)
        setGeoTarget(p)
        reverseGeocode(p)
      },
      () => {}, // silently fall back to Mumbai
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 30000 }
    )
  }, [reverseGeocode])

  const fetchCurrentLocation = () => {
    if (!navigator.geolocation) return alert('Geolocation is not supported by your browser')
    setGeocoding(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const p = [coords.latitude, coords.longitude]
        setPos(p)
        setGeoTarget(p)
        reverseGeocode(p)
      },
      (err) => {
        setGeocoding(false)
        alert('Could not fetch location: ' + err.message)
      },
      { enableHighAccuracy: false, timeout: 20000, maximumAge: 30000 }
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-end mb-2">
        <button
          type="button"
          onClick={fetchCurrentLocation}
          className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-lg transition-colors border border-gray-300 shadow-sm"
        >
          <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.242-4.243a8 8 0 1111.314 0z" />
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Use current GPS
        </button>
      </div>
      <div
        className="rounded-xl overflow-hidden border-2 border-green-200 shadow-sm"
        style={{ height: 360 }}
      >
        <MapContainer
          center={DEFAULT_POS}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <PanOnce target={geoTarget} />
          <InteractiveMarker position={pos} onMove={handleMove} />
        </MapContainer>
      </div>

      {/* Address display strip */}
      <div className="flex items-start gap-2 px-3 py-2.5 bg-green-50 border border-green-200 rounded-lg min-h-[2.75rem]">
        <span className="text-green-600 flex-shrink-0 mt-0.5">📍</span>
        {geocoding ? (
          <span className="text-sm text-gray-400 italic animate-pulse">Finding address…</span>
        ) : address ? (
          <span className="text-sm text-gray-700 leading-snug">{address}</span>
        ) : (
          <span className="text-sm text-gray-400">Click the map or drag the pin to set location</span>
        )}
      </div>
      <p className="text-xs text-gray-400">Tip: allow location access for auto-detection, or click/drag the pin manually.</p>
    </div>
  )
}
