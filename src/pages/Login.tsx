import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { loadLocalProfile, makeProfilePayload, signInOrSignUpDemo, upsertProfile, withTimeout } from '@/lib/supabaseHelpers'
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
            <div className="w-14 h-14 bg-[#ff0000] border-4 border-black rounded-none flex items-center justify-center text-white font-black text-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] group-hover:translate-x-1 group-hover:translate-y-1 group-hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
              TT
            </div>
            <span className="text-3xl font-black text-black tracking-tighter uppercase">Transfer Track</span>
          </Link>
          <h2 className="text-4xl font-black text-black uppercase tracking-tighter">Welcome back</h2>
          <p className="text-black font-black mt-2 uppercase text-sm tracking-widest">Access your academic hub</p>
        </div>

        <div className="bg-white p-10 rounded-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] border-4 border-black">
          <form onSubmit={handleLogin} className="space-y-8">
            {error && (
              <div className="bg-[#ff0000] text-white p-4 rounded-none font-black border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                {error}
              </div>
            )}
            <div>
              <label className="block text-xs font-black text-black uppercase tracking-[0.2em] mb-3 ml-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-4 rounded-none border-4 border-black bg-white focus:bg-[#ffff00] transition-colors outline-none font-black text-black"
                placeholder="YOU@EXAMPLE.COM"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-3 ml-1">
                <label className="block text-xs font-black text-black uppercase tracking-[0.2em]">Password</label>
                <a href="#" className="text-xs font-black text-black hover:underline uppercase">Forgot?</a>
              </div>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-black" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-14 pr-5 py-4 rounded-none border-4 border-black bg-white focus:bg-[#00ff00] transition-colors outline-none font-black text-black"
                  placeholder="DEMO MODE"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#ff00ff] text-white py-5 rounded-none font-black text-xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 transition-all uppercase tracking-widest disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-8 h-8 animate-spin mx-auto" />
              ) : (
                <span className="flex items-center justify-center gap-3">Log In <ArrowRight className="w-6 h-6 stroke-[3]" /></span>
              )}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t-4 border-black text-center">
            <p className="text-black font-black uppercase text-sm">
              New here?{' '}
              <Link to="/signup" className="text-black font-black hover:underline">
                Sign Up Now
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
