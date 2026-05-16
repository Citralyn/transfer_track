import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/useAuthStore'

// Pages
import Landing from '@/pages/Landing'
import Login from '@/pages/Login'
import Signup from '@/pages/Signup'
import Onboarding from '@/pages/Onboarding'
import Feed from '@/pages/Feed'
import Opportunities from '@/pages/Opportunities'
import People from '@/pages/People'
import Profile from '@/pages/Profile'
import Messages from '@/pages/Messages'
import Settings from '@/pages/Settings'

// Layouts
import MainLayout from '@/layouts/MainLayout'

const queryClient = new QueryClient()

function App() {
  const { setSession, setUser, setProfile, setLoading } = useAuthStore((state: any) => ({
    setSession: state.setSession,
    setUser: state.setUser,
    setProfile: state.setProfile,
    setLoading: (loading: boolean) => useAuthStore.setState({ loading })
  }))

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        useAuthStore.setState({ loading: false })
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        setProfile(null)
        useAuthStore.setState({ loading: false })
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (data) {
      setProfile(data)
    } else {
      setProfile(null)
    }
    useAuthStore.setState({ loading: false })
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          <Route element={<ProtectedRoute />}>
            <Route path="/onboarding" element={<Onboarding />} />
            <Route element={<MainLayout />}>
              <Route path="/feed" element={<Feed />} />
              <Route path="/opportunities" element={<Opportunities />} />
              <Route path="/people" element={<People />} />
              <Route path="/profile/:username?" element={<Profile />} />
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

  if (!session) return <Navigate to="/login" state={{ from: location }} replace />
  
  const isOnboardingPath = location.pathname === '/onboarding'
  
  if (!profile && !isOnboardingPath) {
    return <Navigate to="/onboarding" replace />
  }

  if (profile && isOnboardingPath) {
    return <Navigate to="/feed" replace />
  }

  return <Outlet />
}

export default App
