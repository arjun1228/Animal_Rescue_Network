import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { motion } from 'framer-motion'
import { Heart, Search, ArrowRight } from 'lucide-react'

export default function DonationPortal() {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await axios.get('/api/donation')
        setCampaigns(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, type: 'spring' } }
  }

  return (
    <div className="min-h-screen bg-cream pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16 max-w-2xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-full text-sm font-bold mb-6">
            <Heart className="w-4 h-4" /> Save a Life Today
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-dark mb-6">Support Our Rescues</h1>
          <p className="text-gray-500 text-lg">
            Every contribution directly funds medical treatments, surgeries, food, and shelter for animals in critical condition. Choose a campaign and become their hero.
          </p>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-white rounded-3xl h-96 animate-pulse"></div>
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-gray-100 shadow-sm">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">No Active Campaigns</h3>
            <p className="text-gray-500">Check back later or register as a volunteer to help in other ways!</p>
          </div>
        ) : (
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {campaigns.map((campaign) => {
              const pct = Math.min(100, Math.round((campaign.collectedAmount / campaign.targetAmount) * 100))
              return (
                <motion.div 
                  key={campaign._id}
                  variants={item}
                  whileHover={{ y: -10 }}
                  className="bg-white rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-shadow border border-gray-100 flex flex-col h-full group"
                >
                  <div className="h-56 bg-gray-200 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
                    <img 
                      src={campaign.animal.toLowerCase().includes('cat') ? 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=800' : 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=800'} 
                      alt={campaign.animal} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                    />
                    <div className="absolute top-4 right-4 z-20 flex gap-2">
                      <span className="bg-white/90 backdrop-blur text-primary text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                        {campaign.animal}
                      </span>
                    </div>
                  </div>
                  <div className="p-6 flex flex-col flex-grow">
                    <h3 className="text-xl font-bold text-dark mb-3 line-clamp-1 group-hover:text-primary transition-colors">{campaign.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed mb-6 line-clamp-3 flex-grow">
                      {campaign.description}
                    </p>
                    
                    <div className="mt-auto">
                      <div className="flex justify-between items-end mb-2">
                        <div>
                          <p className="text-xs text-gray-400 font-medium mb-1">Raised</p>
                          <p className="text-lg font-black text-primary">₹{campaign.collectedAmount.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400 font-medium mb-1">Goal</p>
                          <p className="text-sm font-bold text-gray-600">₹{campaign.targetAmount.toLocaleString()}</p>
                        </div>
                      </div>
                      
                      <div className="w-full bg-gray-100 rounded-full h-2.5 mb-6 overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                          className="bg-gradient-to-r from-primary to-primary-light h-full rounded-full"
                        />
                      </div>
                      
                      <Link to={`/donate/${campaign._id}`}>
                        <button className="w-full py-3.5 bg-primary/10 hover:bg-primary text-primary hover:text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2">
                          View Details <ArrowRight className="w-4 h-4" />
                        </button>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </div>
    </div>
  )
}
