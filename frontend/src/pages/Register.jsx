import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'citizen' })
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const isGoogleConfigured = import.meta.env.VITE_GOOGLE_CLIENT_ID && 
    import.meta.env.VITE_GOOGLE_CLIENT_ID !== 'your_google_client_id.apps.googleusercontent.com';

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleGoogleSuccess = async (response) => {
    const idToken = response.credential;
    const promise = axios.post('/api/auth/google', { idToken });
    
    toast.promise(promise, {
      loading: 'Registering with Google...',
      success: 'Registered and logged in successfully!',
      error: 'Google registration failed. Please try again.'
    });

    try {
      const { data } = await promise;
      login(data);
      navigate('/dashboard');
    } catch (err) {
      console.error('Google register error:', err);
    }
  };

  useEffect(() => {
    if (!isGoogleConfigured) return;
    const initializeGoogle = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: handleGoogleSuccess,
        });
        window.google.accounts.id.renderButton(
          document.getElementById('googleSignUpDiv'),
          { theme: 'outline', size: 'large' }
        );
      }
    };

    if (window.google) {
      initializeGoogle();
    } else {
      const interval = setInterval(() => {
        if (window.google) {
          initializeGoogle();
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isGoogleConfigured]);

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password.length < 6) {
      return setError('Password must be at least 6 characters')
    }
    
    const promise = axios.post('/api/auth/register', form)

    toast.promise(promise, {
      loading: 'Creating Account...',
      success: 'Account created successfully!',
      error: 'Registration failed. Please try again.'
    })

    try {
      const { data } = await promise
      login(data)
      navigate('/dashboard')
    } catch (err) {
      console.error(err)
    }
  }

  const inputCls = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition'
  const labelCls = 'block text-sm font-semibold text-gray-700 mb-1'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-100 to-lime-50 px-4 py-12 pt-24">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h2 className="text-3xl font-bold text-green-900 text-center mb-1">🐾 Join Us</h2>
        <p className="text-gray-500 text-sm text-center mb-6">Create your Animal Rescue Network account</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelCls}>Full Name</label>
            <input
              type="text"
              name="name"
              placeholder="John Doe"
              value={form.name}
              onChange={handleChange}
              required
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input
              type="email"
              name="email"
              placeholder="your@email.com"
              value={form.email}
              onChange={handleChange}
              required
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Phone Number</label>
            <input
              type="tel"
              name="phone"
              placeholder="+91 9876543210"
              value={form.phone}
              onChange={handleChange}
              required
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Password</label>
            <input
              type="password"
              name="password"
              placeholder="Min. 6 characters"
              value={form.password}
              onChange={handleChange}
              required
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Register As</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className={inputCls}
            >
              <option value="citizen">Citizen / Reporter</option>
              <option value="volunteer">Volunteer</option>
              <option value="donor">Donor</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full py-2.5 bg-green-800 hover:bg-green-900 text-white font-semibold rounded-lg transition-colors mt-2"
          >
            Register
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        {isGoogleConfigured ? (
          <div className="flex justify-center w-full">
            <div id="googleSignUpDiv" className="w-full flex justify-center"></div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-3 text-xs text-center font-medium">
            ⚠️ Google Sign-In is not configured. Add your Client ID in `frontend/.env`.
          </div>
        )}

        <p className="text-center text-sm text-gray-500 mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-green-700 font-semibold hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  )
}

