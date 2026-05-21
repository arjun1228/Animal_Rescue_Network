import { Link } from 'react-router-dom'

export default function DonationCard({ campaign }) {
  const pct = Math.min(100, Math.round((campaign.collectedAmount / campaign.targetAmount) * 100))

  // Calculate days left
  let daysLeftText = ''
  if (campaign.deadline) {
    const diffTime = new Date(campaign.deadline) - new Date()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    if (diffDays > 0) {
      daysLeftText = `${diffDays} day${diffDays !== 1 ? 's' : ''} left`
    } else {
      daysLeftText = 'Ended'
    }
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-5 transition-shadow flex flex-col ${!campaign.isActive ? 'opacity-80' : 'hover:shadow-md'}`}>
      <div className="flex justify-between items-start mb-1">
        <h3 className="font-bold text-gray-900 text-base">{campaign.title}</h3>
        {daysLeftText && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-md ${daysLeftText === 'Ended' ? 'bg-red-100 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
            {daysLeftText}
          </span>
        )}
      </div>
      <p className="text-gray-500 text-sm mb-2">🐾 {campaign.animal}</p>
      <p className="text-gray-600 text-sm mb-4 flex-1">
        {campaign.description.length > 100
          ? campaign.description.slice(0, 97) + '...'
          : campaign.description}
      </p>
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
        <div
          className={`h-2.5 rounded-full transition-all duration-500 ${campaign.isActive ? 'bg-green-600' : 'bg-gray-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center justify-between mb-4">
        <span className="font-bold text-green-700 text-sm">₹{campaign.collectedAmount.toLocaleString()}</span>
        <span className="text-gray-400 text-xs">Goal: ₹{campaign.targetAmount.toLocaleString()}</span>
      </div>
      <div className="flex items-center justify-between mt-auto">
        <span className="text-gray-400 text-xs font-medium">{pct}% funded</span>
        
        {campaign.isActive ? (
          <Link
            to={`/donate/${campaign._id}`}
            className="px-3 py-1.5 bg-amber-500 text-white text-xs font-semibold rounded-lg hover:bg-amber-600 transition-colors"
          >
            Donate Now
          </Link>
        ) : (
          <span className="px-3 py-1.5 bg-gray-100 text-gray-500 text-xs font-semibold rounded-lg border border-gray-200">
            {campaign.closedReason === 'completed' ? 'Goal Reached 🎉' : 'Campaign Ended'}
          </span>
        )}
      </div>
    </div>
  )
}
