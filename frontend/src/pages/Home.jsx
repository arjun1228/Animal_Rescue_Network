import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import { motion } from 'framer-motion'
import CountUp from 'react-countup'
import { useInView } from 'react-intersection-observer'
import { Heart, ShieldAlert, ArrowRight, Activity, MapPin, Syringe, Home as HomeIcon, Quote } from 'lucide-react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination, EffectCards } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/effect-cards'
import Skeleton from '../components/Skeleton'

const howItWorks = [
  { step: '01', title: 'Report', desc: 'Spot a stray animal in distress and submit a rescue request instantly.', icon: ShieldAlert, image: 'https://images.unsplash.com/photo-1548681528-6a5c45b66b42?auto=format&fit=crop&q=80&w=800' },
  { step: '02', title: 'Rescue', desc: 'Registered volunteers claim the request and arrive at the location.', icon: MapPin, image: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&q=80&w=800' },
  { step: '03', title: 'Rehab', desc: 'The animal is provided with medical treatment, food, and shelter.', icon: Syringe, image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=800' },
  { step: '04', title: 'Rehome', desc: 'Once healthy, the animal is put up for adoption to find a forever home.', icon: HomeIcon, image: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=800' },
]

const testimonials = [
  { name: 'Sarah Jenkins', role: 'Volunteer', text: 'Being part of this network has been the most fulfilling experience of my life. Seeing a scared dog wag its tail again is everything.' },
  { name: 'David Chen', role: 'Citizen Reporter', text: 'I found an injured cat and reported it here. Within an hour, a volunteer arrived. The cat is now safe and recovering!' },
  { name: 'Priya Patel', role: 'Donor', text: 'I love how transparent the donation system is. I can see exactly how my funds are helping with medical bills for specific animals.' },
]

export default function Home() {
  const { user } = useAuth()
  const [campaigns, setCampaigns] = useState([])
  const [statsRef, statsInView] = useInView({ triggerOnce: true, threshold: 0.1 })
  const [worksRef, worksInView] = useInView({ triggerOnce: true, threshold: 0.1 })

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const { data } = await axios.get('/api/donation')
        setCampaigns(data.slice(0, 3)) // Show only top 3 active
      } catch (err) {
        console.error(err)
      }
    }
    fetchCampaigns()
  }, [])

  return (
    <div className="min-h-screen bg-cream selection:bg-primary/30">
      
      {/* Welcome Banner */}
      {user && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-primary-dark text-white text-center py-2 px-6 text-sm font-medium tracking-wide mt-16"
        >
          Welcome back, <span className="font-bold">{user.name}</span>! Ready to make a difference today?
        </motion.div>
      )}

      {/* Hero Section */}
      <section className="relative h-[90vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        {/* Background Image & Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://plus.unsplash.com/premium_photo-1663127305918-a789d0f6bf21?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8Y3V0ZSUyMGRvZ3xlbnwwfHwwfHx8MA%3D%3D" 
            alt="Rescued Dog" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent"></div>
        </div>

        {/* Floating Particles (CSS Animation) */}
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary rounded-full mix-blend-screen filter blur-3xl animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-40 h-40 bg-amber-400 rounded-full mix-blend-screen filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-36 h-36 bg-green-300 rounded-full mix-blend-screen filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full text-white">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-2xl"
          >
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight tracking-tight">
              Together, We Can <br/><span className="text-amber-400">Save Lives.</span>
            </h1>
            <p className="text-lg md:text-xl mb-10 text-gray-200 font-light leading-relaxed">
              Every animal deserves a second chance. Join our community of compassionate citizens, dedicated volunteers, and generous donors to build a world where no animal suffers alone.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/donate">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-gradient-to-r from-primary to-primary-light text-white font-bold rounded-full shadow-[0_0_20px_rgba(76,175,80,0.5)] transition-all flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <Heart className="w-5 h-5" /> Donate Now
                </motion.button>
              </Link>
              {user?.role !== 'admin' && (
                <Link to="/report">
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-4 bg-white/10 backdrop-blur-md border border-white/30 text-white font-bold rounded-full hover:bg-white/20 transition-all flex items-center justify-center gap-2 w-full sm:w-auto"
                  >
                    <ShieldAlert className="w-5 h-5" /> Report Rescue
                  </motion.button>
                </Link>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Statistics Section */}
      <section ref={statsRef} className="relative -mt-16 z-20 max-w-6xl mx-auto px-6 mb-24">
        <div className="glass rounded-2xl p-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { label: 'Animals Rescued', end: 12450, suffix: '+' },
            { label: 'Active Volunteers', end: 850, suffix: '+' },
            { label: 'Ongoing Campaigns', end: 24, suffix: '' },
            { label: 'Funds Raised (₹)', end: 5.2, suffix: 'M' },
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={statsInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1 }}
            >
              <div className="text-4xl font-extrabold text-primary mb-2">
                {statsInView ? <CountUp end={stat.end} duration={2.5} decimals={stat.end % 1 !== 0 ? 1 : 0} suffix={stat.suffix} /> : '0'}
              </div>
              <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Active Campaigns Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-4xl font-extrabold text-dark mb-4">Urgent Campaigns</h2>
              <p className="text-gray-500 max-w-2xl text-lg">These animals need immediate medical attention. Your contribution can literally save their lives.</p>
            </div>
            <Link to="/donate" className="hidden sm:flex items-center gap-2 text-primary font-bold hover:text-primary-dark transition-colors group">
              View All <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {campaigns.length > 0 ? campaigns.map((campaign, i) => {
              const pct = Math.min(100, Math.round((campaign.collectedAmount / campaign.targetAmount) * 100))
              return (
                <motion.div 
                  key={campaign._id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -10 }}
                  className="bg-cream rounded-3xl overflow-hidden shadow-lg border border-gray-100 group"
                >
                  <div className="h-48 bg-gray-200 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
                    <img src={campaign.animal.toLowerCase().includes('cat') ? 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=800' : 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=800'} alt="Rescue" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <span className="absolute top-4 right-4 z-20 bg-white/90 backdrop-blur text-primary text-xs font-bold px-3 py-1.5 rounded-full">
                      {campaign.animal}
                    </span>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-dark mb-2 line-clamp-1">{campaign.title}</h3>
                    <p className="text-gray-500 text-sm mb-6 line-clamp-2">{campaign.description}</p>
                    
                    <div className="mb-2 flex justify-between text-sm font-semibold">
                      <span className="text-primary">₹{campaign.collectedAmount.toLocaleString()}</span>
                      <span className="text-gray-400">of ₹{campaign.targetAmount.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6 overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: `${pct}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="bg-primary h-2.5 rounded-full"
                      />
                    </div>
                    <Link to={`/donate/${campaign._id}`}>
                      <button className="w-full py-3 bg-white border-2 border-primary text-primary font-bold rounded-xl group-hover:bg-primary group-hover:text-white transition-colors">
                        Donate Now
                      </button>
                    </Link>
                  </div>
                </motion.div>
              )
            }) : (
              [...Array(3)].map((_, i) => (
                <div key={i} className="bg-cream rounded-3xl overflow-hidden shadow-lg border border-gray-100">
                  <Skeleton className="h-48 w-full rounded-none" />
                  <div className="p-6">
                    <Skeleton className="h-6 w-3/4 mb-4" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-5/6 mb-6" />
                    <div className="mb-2 flex justify-between">
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-4 w-1/4" />
                    </div>
                    <Skeleton className="h-2.5 w-full rounded-full mb-6" />
                    <Skeleton className="h-12 w-full rounded-xl" />
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="mt-8 text-center sm:hidden">
            <Link to="/donate" className="inline-flex items-center gap-2 text-primary font-bold hover:text-primary-dark transition-colors">
              View All Campaigns <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section ref={worksRef} className="py-24 bg-cream relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-dark mb-4">How It Works</h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg">A seamless pipeline of compassion from spotting to rehoming.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={worksInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: i * 0.15 }}
                className="bg-white rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow border border-gray-100 group flex flex-col"
              >
                <div className="h-48 overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10"></div>
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute bottom-4 left-4 z-20 flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white shadow-lg">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div className="text-xl font-black text-white">{item.step}</div>
                  </div>
                </div>
                <div className="p-6 text-left flex-grow">
                  <h3 className="text-xl font-bold text-dark mb-3 group-hover:text-primary transition-colors">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-primary text-white overflow-hidden relative">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        <div className="max-w-6xl mx-auto px-6 relative z-10 flex flex-col md:flex-row items-center gap-12">
          <div className="md:w-1/3">
            <h2 className="text-4xl font-extrabold mb-6 leading-tight">Voices of <br/>Compassion</h2>
            <p className="text-primary-light mb-8 text-lg">Hear from our community members who are on the frontlines of saving lives.</p>
            <div className="flex gap-2">
              <div className="w-12 h-1 bg-amber-400 rounded-full"></div>
              <div className="w-4 h-1 bg-primary-light rounded-full"></div>
            </div>
          </div>
          <div className="md:w-2/3 w-full">
            <Swiper
              effect={'cards'}
              grabCursor={true}
              modules={[EffectCards, Autoplay, Pagination]}
              autoplay={{ delay: 3000, disableOnInteraction: false }}
              pagination={{ clickable: true }}
              className="w-full max-w-sm mx-auto md:max-w-md"
            >
              {testimonials.map((t, i) => (
                <SwiperSlide key={i} className="bg-white rounded-3xl p-8 text-dark shadow-xl">
                  <Quote className="w-10 h-10 text-amber-400 mb-6 opacity-50" />
                  <p className="text-lg font-medium leading-relaxed mb-8">"{t.text}"</p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold text-xl">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-dark">{t.name}</h4>
                      <p className="text-sm text-primary font-semibold">{t.role}</p>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      </section>

    </div>
  )
}
