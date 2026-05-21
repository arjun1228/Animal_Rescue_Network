import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { Link } from 'react-router-dom'
import L from 'leaflet'

// Fix default icons
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const statusColors = {
  'Approved':    'bg-blue-100 text-blue-800',
  'Claimed':     'bg-amber-100 text-amber-800',
  'In Progress': 'bg-purple-100 text-purple-800',
  'Completed':   'bg-green-100 text-green-800',
}

const DEFAULT_CENTER = [19.076, 72.877] // Mumbai fallback

export default function RescueMapView({ rescues }) {
  const withCoords = rescues.filter(
    (r) => r.geoLocation?.coordinates?.length === 2
  )

  if (withCoords.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
        <p className="text-4xl mb-3">🗺️</p>
        <p className="text-gray-500 font-medium">No rescues with map coordinates yet.</p>
        <p className="text-gray-400 text-sm mt-1">New reports submitted via the map picker will appear here.</p>
      </div>
    )
  }

  // Center on first rescue with coords
  const center = [
    withCoords[0].geoLocation.coordinates[1], // lat
    withCoords[0].geoLocation.coordinates[0], // lng
  ]

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm" style={{ height: 560 }}>
      <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {withCoords.map((r) => (
          <Marker
            key={r._id}
            position={[r.geoLocation.coordinates[1], r.geoLocation.coordinates[0]]}
          >
            <Popup minWidth={180}>
              <div className="py-1">
                <p className="font-bold text-gray-900 text-sm mb-1">🐾 {r.animalType}</p>
                {r.location?.address && (
                  <p className="text-xs text-gray-500 mb-2 leading-snug">📍 {r.location.address}</p>
                )}
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full uppercase ${statusColors[r.status] || 'bg-gray-100 text-gray-700'}`}>
                  {r.status}
                </span>
                <div className="mt-3 pt-2 border-t border-gray-100">
                  <Link
                    to={`/rescues/${r._id}`}
                    className="text-xs font-semibold text-green-700 hover:text-green-900"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
