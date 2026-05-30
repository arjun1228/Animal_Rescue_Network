import { Link } from 'react-router-dom'
import { PawPrint, Mail, Phone, MapPin, Heart } from 'lucide-react'
import { FaFacebookF, FaTwitter, FaInstagram } from 'react-icons/fa'

export default function Footer() {
  return (
    <footer className="bg-[#112a14] text-gray-300 pt-16 pb-8 px-6 mt-auto">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 mb-12 border-b border-gray-700 pb-12">
        <div className="md:col-span-1">
          <Link to="/" className="flex items-center gap-2 mb-6 group">
            <div className="p-2 bg-primary/20 rounded-xl group-hover:bg-primary transition-colors">
              <PawPrint className="w-6 h-6 text-primary group-hover:text-white transition-colors" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">
              Animal Rescue
            </span>
          </Link>
          <p className="text-sm leading-relaxed mb-6">
            Connecting citizens, volunteers, and donors to build a compassionate community. Every life matters, and together we can save them.
          </p>
          <div className="flex gap-4">
            <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary hover:text-white transition-all hover:-translate-y-1">
              <FaFacebookF className="w-4 h-4" />
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary hover:text-white transition-all hover:-translate-y-1">
              <FaTwitter className="w-4 h-4" />
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary hover:text-white transition-all hover:-translate-y-1">
              <FaInstagram className="w-4 h-4" />
            </a>
          </div>
        </div>
        
        <div>
          <h4 className="text-lg font-semibold mb-6 text-white">Quick Links</h4>
          <ul className="space-y-3 text-sm">
            <li><Link to="/" className="hover:text-primary transition-colors flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary/50"></div> Home</Link></li>
            <li><Link to="/rescues" className="hover:text-primary transition-colors flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary/50"></div> Active Rescues</Link></li>
            <li><Link to="/donate" className="hover:text-primary transition-colors flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary/50"></div> Donation Campaigns</Link></li>
            <li><Link to="/register" className="hover:text-primary transition-colors flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary/50"></div> Join as Volunteer</Link></li>
          </ul>
        </div>
        
        <div>
          <h4 className="text-lg font-semibold mb-6 text-white">Contact Us</h4>
          <ul className="space-y-4 text-sm">
            <li className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
              <span>123 Rescue Avenue,<br />Compassion City, 45678</span>
            </li>
            <li className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-primary flex-shrink-0" />
              <span>+1 (800) 555-PAWS</span>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-primary flex-shrink-0" />
              <span>helpanimalrescuenetwork@gmail.com</span>
            </li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm opacity-60">
        <p>&copy; {new Date().getFullYear()} Animal Rescue Network. All rights reserved.</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
        </div>
      </div>
    </footer>
  )
}
