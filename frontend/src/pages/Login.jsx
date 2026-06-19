import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const isGoogleConfigured = import.meta.env.VITE_GOOGLE_CLIENT_ID && 
    import.meta.env.VITE_GOOGLE_CLIENT_ID !== 'your_google_client_id.apps.googleusercontent.com';

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleGoogleSuccess = async (response) => {
    const idToken = response.credential;
    const promise = axios.post('/api/auth/google', { idToken });
    
    toast.promise(promise, {
      loading: 'Logging in with Google...',
      success: 'Logged in with Google successfully!',
      error: 'Google login failed. Please try again.'
    });

    try {
      const { data } = await promise;
      login(data);
      navigate('/');
    } catch (err) {
      console.error('Google login error:', err);
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
          document.getElementById('googleSignInDiv'),
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
    
    const promise = axios.post('/api/auth/login', form)
    
    toast.promise(promise, {
      loading: 'Logging in...',
      success: 'Logged in successfully!',
      error: 'Login failed. Please check your credentials.'
    })

    try {
      const { data } = await promise
      login(data)
      navigate('/')
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-100 to-lime-50 px-4 py-12 pt-24">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h2 className="text-3xl font-bold text-green-900 text-center mb-1">🐾 Welcome Back</h2>
        <p className="text-gray-500 text-sm text-center mb-6">Sign in to your Animal Rescue Network account</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              placeholder="your@email.com"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition pr-16"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 text-sm font-medium focus:outline-none"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <div className="flex justify-end mt-1">
              <Link to="/forgot-password" className="text-xs text-green-700 hover:underline font-semibold">
                Forgot password?
              </Link>
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-2.5 bg-green-800 hover:bg-green-900 text-white font-semibold rounded-lg transition-colors mt-2"
          >
            Login
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
            <div id="googleSignInDiv" className="w-full flex justify-center"></div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-3 text-xs text-center font-medium">
            ⚠️ Google Sign-In is not configured. Add your Client ID in `frontend/.env`.
          </div>
        )}

        <p className="text-center text-sm text-gray-500 mt-5">
          Don't have an account?{' '}
          <Link to="/register" className="text-green-700 font-semibold hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  )
}

