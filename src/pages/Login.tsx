import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { isProfileOnboardingComplete, makeProfilePayload, signInOrSignUpDemo, upsertProfile, withTimeout } from '@/lib/supabaseHelpers'
import { useAuthStore } from '@/store/useAuthStore'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { ArrowRight, Loader2, Lock } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const { setSession, setUser, setProfile } = useAuthStore()

  const from = location.state?.from?.pathname || '/feed'

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error: authError } = await signInOrSignUpDemo({ email, password, role: 'student' })

      if (authError) {
        setError(authError.message)
        return
      }

      if (!data?.user) {
        setError('Unable to complete demo sign-in. Try again with an email address.')
        return
      }

      setSession(data.session ?? null)
      setUser(data.user)

      let profile = null
      if (isSupabaseConfigured()) {
        try {
          const { data: existingProfile } = await withTimeout(
            supabase
              .from('profiles')
              .select('*')
              .eq('id', data.user.id)
              .maybeSingle(),
            'Supabase profile lookup'
          )
          profile = existingProfile
        } catch (error) {
          console.warn('Supabase profile lookup failed, using local profile:', error)
        }
      }

      if (!profile) {
        const profilePayload = makeProfilePayload({
          id: data.user.id,
          role: 'student',
          email: data.user.email || email,
        })
        const { data: upsertedProfile } = await upsertProfile(profilePayload)
        profile = upsertedProfile
      }

      setProfile(profile)
      navigate(isProfileOnboardingComplete(profile) ? (profile?.role === 'professor' ? '/professor-dashboard' : from) : '/onboarding/about', { replace: true })
    } catch (error) {
      console.warn('Login failed:', error)
      setError('Sign-in hit a snag. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-50 px-6 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 gradient-brand rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
              TT
            </div>
            <span className="text-2xl font-bold text-brand-900 tracking-tight">Transfer Track</span>
          </Link>
          <h2 className="text-3xl font-bold text-brand-900">Welcome back</h2>
          <p className="text-brand-600 mt-2">Log in to your account</p>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-xl border border-brand-100">
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-brand-900 mb-2">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-brand-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-brand-900">Password</label>
                <a href="#" className="text-xs font-bold text-accent-600 hover:underline">Forgot password?</a>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-brand-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                  placeholder="Use your password or leave blank for demo"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full gradient-brand text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-70 disabled:transform-none"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>Log In <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-brand-50 text-center">
            <p className="text-brand-600">
              Don't have an account?{' '}
              <Link to="/signup" className="text-accent-600 font-bold hover:underline">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
