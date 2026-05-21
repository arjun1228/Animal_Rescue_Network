import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import NotificationBell from './NotificationBell'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Heart, Home, PawPrint, LayoutDashboard, ShieldCheck, LogOut, LogIn, UserPlus } from 'lucide-react'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/')
    setMenuOpen(false)
  }

  const close = () => setMenuOpen(false)
  
  const navLinks = [
    { name: 'Home', path: '/', icon: Home, show: true },
    { name: 'Rescues', path: '/rescues', icon: PawPrint, show: !!user },
    { name: 'Donate', path: '/donate', icon: Heart, show: true },
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, show: !!user && user.role !== 'admin' },
    { name: 'Admin', path: '/admin', icon: ShieldCheck, show: user?.role === 'admin' },
  ].filter(link => link.show)

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, type: 'spring', stiffness: 100 }}
      className={`fixed top-0 w-full z-[9999] transition-all duration-300 ${
        scrolled 
          ? 'bg-white/80 backdrop-blur-md shadow-sm py-3 text-black' 
          : `bg-transparent py-5 ${location.pathname === '/' && !user ? 'text-white drop-shadow-lg' : 'text-black'}`
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className={`p-2 rounded-xl transition-colors ${scrolled ? 'bg-primary/10 text-primary' : 'bg-primary text-white'}`}>
            <PawPrint className="w-6 h-6" />
          </div>
          <span className="text-xl font-extrabold tracking-tight">
            Animal Rescue
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link 
              key={link.path} 
              to={link.path}
              className="relative text-lg font-extrabold hover:text-primary transition-colors flex items-center gap-1.5"
            >
              {((link.path === '/' && location.pathname === '/') || (link.path !== '/' && location.pathname.startsWith(link.path))) && (
                <motion.div
                  layoutId="underline"
                  className="absolute left-0 right-0 -bottom-1 h-[2px] bg-primary rounded-full"
                />
              )}
              {link.name}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <NotificationBell />
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <button 
                  onClick={handleLogout} 
                  className="p-2 text-gray-500 hover:text-red-500 transition-colors rounded-full hover:bg-red-50"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link 
                to="/login" 
                className="text-lg font-extrabold hover:text-primary transition-colors flex items-center gap-1"
              >
                <LogIn className="w-5 h-5" /> Login
              </Link>
              <Link 
                to="/register" 
                className="px-6 py-3 bg-primary hover:bg-primary-dark text-white text-lg font-extrabold rounded-full shadow-lg shadow-primary/30 transition-all hover:-translate-y-0.5 flex items-center gap-1"
              >
                <UserPlus className="w-5 h-5" /> Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden p-2 -mr-2 text-dark hover:text-primary transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-100 overflow-hidden shadow-xl"
          >
            <div className="px-6 py-4 flex flex-col gap-3">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.path}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link 
                    to={link.path} 
                    onClick={close} 
                    className={`flex items-center gap-3 p-3 rounded-xl text-sm font-medium transition-colors ${location.pathname === link.path ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    <link.icon className="w-5 h-5" />
                    {link.name}
                  </Link>
                </motion.div>
              ))}

              <hr className="border-gray-100 my-2" />

              {user ? (
                <>
                  <div className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{user.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                      </div>
                    </div>
                    <NotificationBell />
                  </div>
                  <button 
                    onClick={handleLogout} 
                    className="flex items-center justify-center gap-2 p-3 w-full rounded-xl text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <Link 
                    to="/login" 
                    onClick={close}
                    className="flex items-center justify-center gap-2 p-3 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50"
                  >
                    <LogIn className="w-4 h-4" /> Login
                  </Link>
                  <Link 
                    to="/register" 
                    onClick={close}
                    className="flex items-center justify-center gap-2 p-3 bg-primary text-white rounded-xl text-sm font-semibold shadow-md shadow-primary/20"
                  >
                    <UserPlus className="w-4 h-4" /> Sign Up
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
