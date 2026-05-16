import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { Session, User } from '@supabase/supabase-js'

export interface Profile {
  id: string
  role: 'student' | 'professor'
  full_name: string
  username: string
  email: string
  avatar_url?: string
  school_name?: string
  school_type?: string
  academic_year?: string
  department?: string
  bio?: string
  transfer_goals?: string
  research_areas?: string[]
  interests?: string[]
  skills?: string[]
}

interface AuthState {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  setSession: (session: Session | null) => void
  setUser: (user: User | null) => void
  setProfile: (profile: Profile | null) => void
  setLoading: (loading: boolean) => void
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  profile: null,
  loading: true,
  setSession: (session) => set({ session }),
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  signOut: async () => {
    await supabase.auth.signOut()
    set({ session: null, user: null, profile: null, loading: false })
  },
}))
