import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, ArrowLeft, ShieldCheck, CreditCard, Lock, Clock, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'
import Skeleton from '../components/Skeleton'

export default function DonationDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [campaign, setCampaign] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Form State
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')
  const [donorName, setDonorName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  
  // Submission State
  const [error, setError] = useState('')

  const fetchCampaign = async () => {
    try {
      const { data } = await axios.get(`/api/donation/${id}`)
      setCampaign(data)
    } catch (err) {
      setError('Failed to fetch campaign details.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCampaign()
  }, [id])

  const handleDonate = async (e) => {
    e.preventDefault()
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount.')
      return
    }
    setError('')
    
    const payload = { donorName, email, phone, isAnonymous, amount: Number(amount), message }
    const promise = axios.post(`/api/donation/${id}/donate`, payload)

    toast.promise(promise, {
      loading: 'Processing donation...',
      success: 'Thank you for your donation!',
      error: 'Donation failed. Please try again.'
    })

    try {
      await promise
      setAmount('')
      setMessage('')
      setDonorName('')
      setEmail('')
      setPhone('')
      setIsAnonymous(false)
      fetchCampaign()
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-cream to-amber-50 pt-24 pb-20 relative">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <Skeleton className="h-6 w-48 mb-8" />
          <div className="flex flex-col lg:flex-row gap-10">
            <div className="lg:w-[55%]">
              <div className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-gray-100">
                <div className="flex items-start gap-4 mb-8">
                  <Skeleton className="w-16 h-16 rounded-2xl" />
                  <div className="flex-1">
                    <Skeleton className="h-8 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
                <div className="space-y-6 mt-8">
                  <Skeleton className="h-10 w-full rounded-xl" />
                  <Skeleton className="h-24 w-full rounded-xl" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                </div>
              </div>
            </div>
            <div className="lg:w-[45%] space-y-8">
              <div className="bg-white rounded-3xl overflow-hidden border border-gray-100">
                <Skeleton className="h-48 w-full rounded-none" />
                <div className="p-6">
                  <Skeleton className="h-24 w-full mb-6 rounded-xl" />
                  <Skeleton className="h-8 w-full mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-cream pt-24 pb-20 text-center flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-4">Campaign Not Found</h2>
        <Link to="/donate" className="text-primary hover:underline">Return to Campaigns</Link>
      </div>
    )
  }

  const pct = Math.min(100, Math.round((campaign.collectedAmount / campaign.targetAmount) * 100))
  const inputCls = 'w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-sm'
  const labelCls = 'block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2'

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-cream to-amber-50 pt-24 pb-20 relative">
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")' }}></div>
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Top Nav */}
        <Link to="/donate" className="inline-flex items-center gap-2 text-gray-500 hover:text-primary transition-colors mb-8 font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Campaigns
        </Link>

        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* Left Column: Donation Form */}
          <div className="lg:w-[55%]">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-3xl p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 relative overflow-hidden"
            >
              {/* Decorative top bar */}
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-amber-400"></div>
              
              <div className="flex items-start gap-4 mb-8">
                <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 shadow-md">
                  <img src={campaign.animal.toLowerCase().includes('cat') ? 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?auto=format&fit=crop&q=80&w=200' : 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=200'} alt="Cute animal" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h1 className="text-3xl font-extrabold text-dark mb-1">Complete Your Donation</h1>
                  <p className="text-gray-500">You are supporting: <span className="font-semibold text-primary">{campaign.title}</span></p>
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-4 mb-6 text-sm font-medium">
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleDonate} className="space-y-6">
                
                {/* Personal Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-dark border-b border-gray-100 pb-2">1. Your Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Full Name *</label>
                      <input type="text" placeholder="John Doe" value={donorName} onChange={(e) => setDonorName(e.target.value)} required className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Email Address (Optional)</label>
                      <input type="email" placeholder="john@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Phone Number (Optional)</label>
                    <input type="tel" placeholder="+91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} />
                  </div>
                  <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <input type="checkbox" id="anon" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} className="w-5 h-5 text-primary rounded focus:ring-primary accent-primary" />
                    <div>
                      <label htmlFor="anon" className="text-sm font-bold text-dark cursor-pointer">Make my donation anonymous</label>
                      <p className="text-xs text-gray-500">Your name will be hidden from the public timeline.</p>
                    </div>
                  </div>
                </div>

                {/* Donation Amount */}
                <div className="space-y-4 pt-4">
                  <h3 className="text-lg font-bold text-dark border-b border-gray-100 pb-2">2. Donation Amount</h3>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[1000, 2000, 3000, 5000].map((preset) => (
                      <motion.button
                        key={preset}
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setAmount(preset)}
                        className={`py-3 rounded-xl font-bold transition-all ${
                          Number(amount) === preset 
                            ? 'bg-primary text-white shadow-lg shadow-primary/30 ring-2 ring-primary ring-offset-2' 
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                        }`}
                      >
                        ₹{preset.toLocaleString()}
                      </motion.button>
                    ))}
                  </div>

                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">₹</span>
                    <input 
                      type="number" 
                      min="1" 
                      placeholder="Enter custom amount" 
                      value={amount} 
                      onChange={(e) => setAmount(e.target.value)} 
                      required 
                      className={`${inputCls} pl-8 text-lg font-bold`} 
                    />
                  </div>
                </div>

                {/* Message */}
                <div className="space-y-4 pt-4">
                  <h3 className="text-lg font-bold text-dark border-b border-gray-100 pb-2">3. Leave a Message (Optional)</h3>
                  <textarea 
                    placeholder="Send some love and encouragement..." 
                    value={message} 
                    onChange={(e) => setMessage(e.target.value)} 
                    rows={3} 
                    className={`${inputCls} resize-none`} 
                  />
                </div>

                {/* Submit */}
                <div className="pt-6">
                  <motion.button 
                    type="submit" 
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 bg-gradient-to-r from-primary to-primary-light hover:from-primary-dark hover:to-primary text-white font-extrabold text-lg rounded-xl shadow-xl shadow-primary/30 transition-all flex items-center justify-center gap-3 relative overflow-hidden"
                  >
                    <>
                      <Heart className="w-5 h-5 fill-white" /> Donate ₹{amount || '0'} Now
                    </>
                  </motion.button>
                  <p className="text-center text-xs text-gray-400 mt-4 flex items-center justify-center gap-1">
                    <Lock className="w-3 h-3" /> Secure 256-bit encrypted transaction
                  </p>
                </div>
              </form>
            </motion.div>
          </div>

          {/* Right Column: Campaign Info & Timeline */}
          <div className="lg:w-[45%] space-y-8">
            
            {/* Campaign Summary Card */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100"
            >
              <div className="h-48 relative">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
                <img src={campaign.animal.toLowerCase().includes('cat') ? 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=800' : 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=800'} alt="Rescue" className="w-full h-full object-cover" />
                <div className="absolute bottom-4 left-4 z-20">
                  <span className="bg-amber-400 text-dark text-xs font-bold px-3 py-1 rounded-full mb-2 inline-block shadow-sm">
                    {campaign.animal}
                  </span>
                  <h2 className="text-xl font-bold text-white line-clamp-1">{campaign.title}</h2>
                </div>
              </div>
              
              <div className="p-6">
                <p className="text-gray-600 text-sm mb-6 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
                  {campaign.description}
                </p>

                <div className="mb-2 flex justify-between items-end">
                  <div>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Funds Raised</p>
                    <p className="text-2xl font-black text-primary">₹{campaign.collectedAmount.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Goal</p>
                    <p className="text-sm font-bold text-gray-600">₹{campaign.targetAmount.toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="w-full bg-gray-100 rounded-full h-3 mb-2 overflow-hidden relative">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="bg-gradient-to-r from-primary to-amber-400 h-full rounded-full relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite] w-full" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }}></div>
                  </motion.div>
                </div>
                <p className="text-right text-xs font-bold text-primary mb-6">{pct}% Funded</p>

                <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
                      <Heart className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Donors</p>
                      <p className="text-sm font-bold text-dark">{campaign.transactions?.length || 0}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Status</p>
                      <p className="text-sm font-bold text-dark">{campaign.isActive ? 'Active' : 'Closed'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Why Donate Trust Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-green-900 to-green-800 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 opacity-20 transform translate-x-4 -translate-y-4">
                <img src="/images/why_donate.png" alt="Puppy" className="w-full h-full object-contain" />
              </div>
              <h3 className="text-xl font-bold mb-4 relative z-10">Why Give?</h3>
              <ul className="space-y-3 relative z-10 text-sm">
                <li className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-amber-400" /> 100% Transparency
                </li>
                <li className="flex items-center gap-3">
                  <Heart className="w-5 h-5 text-amber-400" /> Directly Funds Medical Bills
                </li>
                <li className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-amber-400" /> Secure Payment Gateway
                </li>
              </ul>
            </motion.div>

            {/* Recent Donations */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100"
            >
              <h3 className="text-lg font-bold text-dark mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary fill-primary/20" /> Recent Heroes
              </h3>
              
              {campaign.transactions?.length > 0 ? (
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {campaign.transactions.map((t, i) => (
                    <motion.div 
                      key={t._id || i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-start gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0">
                        {t.donorName === 'Anonymous' ? '👻' : t.donorName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-grow">
                        <div className="flex justify-between items-start mb-0.5">
                          <p className="font-bold text-sm text-dark">{t.donorName}</p>
                          <p className="text-sm font-black text-primary">₹{t.amount?.toLocaleString()}</p>
                        </div>
                        <p className="text-xs text-gray-400 flex items-center gap-1 mb-1">
                          <Calendar className="w-3 h-3" /> {new Date(t.donatedAt || t.date).toLocaleDateString()}
                        </p>
                        {t.message && (
                          <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded-lg mt-1 italic border border-gray-100">"{t.message}"</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <p className="text-gray-500 text-sm">Be the first hero to donate to this cause!</p>
                </div>
              )}
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  )
}
