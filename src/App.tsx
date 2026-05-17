import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useAuthStore } from '@/store/useAuthStore'
import { 
  loadLocalProfile, 
  withTimeout, 
  LOCAL_USER_KEY
} from '@/lib/supabaseHelpers'

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
import SearchResults from '@/pages/SearchResults'
import ProfessorOpportunities from '@/pages/ProfessorOpportunities'

// Layouts
import MainLayout from '@/layouts/MainLayout'
import { LoadingScreen } from '@/components/ui/LoadingScreen'

const queryClient = new QueryClient()

function App() {
  const { loading, setSession, setUser, setProfile, setLoading } = useAuthStore()

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true)
      try {
        // 1. Try to restore local demo user/profile immediately
        const rawUser = window.localStorage.getItem(LOCAL_USER_KEY)
        const localUser = rawUser ? JSON.parse(rawUser) : null

        if (localUser) {
          setUser(localUser)
          const profile = loadLocalProfile(localUser.id)
          if (profile) setProfile(profile)
        }

        if (!isSupabaseConfigured()) {
          setSession(null)
          return
        }

        // 2. Check for a live Supabase session
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          setSession(session)
          setUser(session.user)
          await fetchProfile(session.user.id)
        } else if (!localUser) {
          setSession(null)
          setUser(null)
          setProfile(null)
        }
      } catch (error) {
        console.warn('Auth initialization encountered an error:', error)
      } finally {
        // Minimum delay to ensure the loading screen is visible and session is settled
        setTimeout(() => setLoading(false), 800)
      }
    }

    initAuth()

    if (!isSupabaseConfigured()) return

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (session?.user) {
          setSession(session)
          setUser(session.user)
          await fetchProfile(session.user.id)
        }
      } else if (event === 'SIGNED_OUT') {
        if (window.localStorage.getItem(LOCAL_USER_KEY)) return
        setSession(null)
        setUser(null)
        setProfile(null)
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
        console.warn('Supabase profile lookup failed, falling back to local:', error.message)
      }

      if (data) {
        setProfile(data)
      } else {
        const local = loadLocalProfile(userId)
        if (local) setProfile(local)
      }
    } catch (error) {
      console.warn('Supabase profile lookup unavailable, falling back to local:', error)
      const local = loadLocalProfile(userId)
      if (local) setProfile(local)
    }
  }

  // GLOBAL LOADING STATE
  // Shows while we determine if you are logged in
  if (loading) {
    return <LoadingScreen />
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
              <Route path="/search" element={<SearchResults />} />
              <Route path="/connections" element={<Connections />} />
              <Route path="/profile/:username/opportunities" element={<ProfessorOpportunities />} />
              <Route path="/profile/:username?" element={<Profile />} />
              <Route path="/professor-dashboard" element={<Profile />} />
              <Route path="/messages/:conversationId?" element={<Messages />} />
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
  const { user } = useAuthStore()
  const location = useLocation()

  // Case: No user = not logged in
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />

  return <Outlet />
}

export default App
