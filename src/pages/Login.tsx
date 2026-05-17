import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { loadLocalProfile, makeProfilePayload, signInOrSignUpDemo, upsertProfile, withTimeout } from '@/lib/supabaseHelpers'
import { useAuthStore } from '@/store/useAuthStore'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { ArrowRight, Loader2, Lock } from 'lucide-react'
import logo from '@/assets/red_train.png'

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
    setSession(null)
    setUser(null)
    setProfile(null)

    try {
      const { data, error: authError } = await signInOrSignUpDemo({ email, password, role: 'student', mode: 'login' })

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
          console.warn('Supabase profile lookup failed:', error)
        }
      }

      if (!profile) {
        // Try to load a previously saved local profile for THIS specific user
        profile = loadLocalProfile(data.user.id)
      }

      if (!profile) {
        const profilePayload = makeProfilePayload({
          id: data.user.id,
          role: 'student',
          email: data.user.email || email,
        })
        const { data: upsertedProfile, error: profileError } = await upsertProfile(profilePayload)
        if (profileError || !upsertedProfile) {
          setError('Signed in, but we could not create your profile. Please check your Supabase profile permissions.')
          return
        }
        profile = upsertedProfile
      }

      setProfile(profile)
      navigate(profile?.role === 'professor' ? '/professor-dashboard' : from, { replace: true })
    } catch (error) {
      console.warn('Login failed:', error)
      setError('Sign-in hit a snag. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-3 mb-6 group">
            <img src={logo} alt="Transfer Track" className="w-16 h-16 object-contain group-hover:scale-105 transition-transform" />
            <span className="text-3xl font-logo text-[#ff3b30] tracking-tighter">Transfer Track</span>
          </Link>
          <h2 className="text-4xl font-semibold text-[#1d1d1f] uppercase tracking-tighter">Welcome back</h2>
          <p className="text-[#1d1d1f] font-semibold mt-2 uppercase text-sm tracking-widest">Access your academic hub</p>
        </div>

        <div className="bg-white p-10 rounded-xl shadow-xl border border-black/5">
          <form onSubmit={handleLogin} className="space-y-8">
            {error && (
              <div className="bg-[#ff3b30] text-white p-4 rounded-full font-semibold border border-black/5 shadow-xl">
                {error}
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-[#1d1d1f] uppercase tracking-[0.2em] mb-3 ml-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-4 rounded-xl border border-black/5 bg-white focus:bg-[#ffcc00] transition-colors outline-none font-semibold text-[#1d1d1f]"
                placeholder="YOU@EXAMPLE.COM"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-3 ml-1">
                <label className="block text-xs font-semibold text-[#1d1d1f] uppercase tracking-[0.2em]">Password</label>
                <a href="#" className="text-xs font-semibold text-[#1d1d1f] hover:underline uppercase">Forgot?</a>
              </div>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1d1d1f]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-14 pr-5 py-4 rounded-xl border border-black/5 bg-white focus:bg-[#34c759] transition-colors outline-none font-semibold text-[#1d1d1f]"
                  placeholder="DEMO MODE"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#af52de] text-white py-5 rounded-full font-semibold text-xl border border-black/5 shadow-xl hover:shadow-xl hover:translate-x-1 hover:translate-y-1 transition-all uppercase tracking-widest disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-8 h-8 animate-spin mx-auto" />
              ) : (
                <span className="flex items-center justify-center gap-3">Log In <ArrowRight className="w-6 h-6 stroke-[3]" /></span>
              )}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-black/5 text-center">
            <p className="text-[#1d1d1f] font-semibold uppercase text-sm">
              New here?{' '}
              <Link to="/signup" className="text-[#1d1d1f] font-semibold hover:underline">
                Sign Up Now
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
