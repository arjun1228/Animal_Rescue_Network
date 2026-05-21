import { Link } from 'react-router-dom'

// ── Unified status colors ────────────────────────────────────────────────────
export const statusColors = {
  'Pending Review': 'bg-gray-100 text-gray-700',
  'Approved':       'bg-blue-100 text-blue-800',
  'Claimed':        'bg-amber-100 text-amber-800',
  'In Progress':    'bg-purple-100 text-purple-800',
  'Completed':      'bg-green-100 text-green-800',
  'Rejected':       'bg-red-100 text-red-800',
}

export default function RescueCard({ rescue }) {
  const isRejected = rescue.status === 'Rejected'

  return (
    <div className={`bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow ${isRejected ? 'border-red-300' : 'border-gray-200'}`}>
      {rescue.photos && rescue.photos.length > 0 && (
        <img
          src={rescue.photos[0]}
          alt="animal"
          className={`w-full h-44 object-cover ${isRejected ? 'opacity-60 grayscale' : ''}`}
        />
      )}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-gray-900 text-base">{rescue.animalType}</span>
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase ${statusColors[rescue.status] || 'bg-gray-100 text-gray-700'}`}>
            {rescue.status}
          </span>
        </div>
        <p className="text-gray-500 text-sm mb-1">📍 {rescue.location?.address}</p>
        <p className="text-gray-600 text-sm mb-3">
          {rescue.description.length > 100
            ? rescue.description.slice(0, 97) + '...'
            : rescue.description}
        </p>

        {/* Rejection reason banner */}
        {isRejected && rescue.rejectionReason && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
            <p className="text-xs font-semibold text-red-700 mb-0.5">❌ Rejected by Admin</p>
            <p className="text-xs text-red-600">{rescue.rejectionReason}</p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-xs">By: {rescue.reporter?.name}</span>
          <Link
            to={`/rescues/${rescue._id}`}
            className="px-3 py-1.5 bg-green-800 text-white text-xs font-semibold rounded-lg hover:bg-green-900 transition-colors"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  )
}
