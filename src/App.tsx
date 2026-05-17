import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useAuthStore } from '@/store/useAuthStore'
import { loadLocalProfile, withTimeout } from '@/lib/supabaseHelpers'

// Pages
import Landing from '@/pages/Landing'
import Login from '@/pages/Login'
import Signup from '@/pages/Signup'
import Onboarding from '@/pages/Onboarding'
import Feed from '@/pages/Feed'
import Opportunities from '@/pages/Opportunities'
import People from '@/pages/People'
import Profile from '@/pages/Profile'
import Connections from '@/pages/Connections'
import Messages from '@/pages/Messages'
import Settings from '@/pages/Settings'

// Layouts
import MainLayout from '@/layouts/MainLayout'

const queryClient = new QueryClient()

function App() {
  const { setSession, setUser, setProfile, setLoading } = useAuthStore((state) => ({
    setSession: state.setSession,
    setUser: state.setUser,
    setProfile: state.setProfile,
    setLoading: state.setLoading,
  }))

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (!isSupabaseConfigured()) {
          const localProfile = loadLocalProfile()
          setProfile(localProfile)
          setUser(localProfile ? { id: localProfile.id, email: localProfile.email } : null)
          setSession(null)
          return
        }

        const { data: { session } } = await withTimeout(supabase.auth.getSession(), 'Supabase session lookup')
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }
      } catch (error) {
        console.warn('Auth initialization fell back to local profile:', error)
        const localProfile = loadLocalProfile()
        if (localProfile) {
          setProfile(localProfile)
          setUser({ id: localProfile.id, email: localProfile.email })
        }
        setSession(null)
      } finally {
        setLoading(false)
      }
    }

    initAuth()

    if (!isSupabaseConfigured()) return

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await withTimeout(
        supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle(),
        'Supabase profile lookup'
      )

      if (error) {
        console.warn('Supabase profile lookup failed, trying local profile:', error.message)
      }

      setProfile(data || loadLocalProfile(userId))
    } catch (error) {
      console.warn('Supabase profile lookup unavailable, trying local profile:', error)
      setProfile(loadLocalProfile(userId))
    } finally {
      setLoading(false)
    }
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          <Route element={<ProtectedRoute />}>
            <Route path="/onboarding" element={<Navigate to="/onboarding/about" replace />} />
            <Route path="/onboarding/:step" element={<Onboarding />} />
            <Route element={<MainLayout />}>
              <Route path="/feed" element={<Feed />} />
              <Route path="/opportunities" element={<Opportunities />} />
              <Route path="/people" element={<People />} />
              <Route path="/connections" element={<Connections />} />
              <Route path="/profile/:username?" element={<Profile />} />
              <Route path="/professor-dashboard" element={<Profile />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

function ProtectedRoute() {
  const { session, profile, loading } = useAuthStore()
  const location = useLocation()

  if (loading) return <div className="h-screen w-screen flex items-center justify-center bg-brand-50">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500"></div>
  </div>

  if (!session && !profile) return <Navigate to="/login" state={{ from: location }} replace />
  
  const isOnboardingPath = location.pathname.startsWith('/onboarding')
  
  if (!profile && !isOnboardingPath) {
    return <Navigate to="/onboarding" replace />
  }

  return <Outlet />
}

export default App
