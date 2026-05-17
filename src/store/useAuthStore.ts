import { create } from 'zustand'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { clearLocalAuth } from '@/lib/supabaseHelpers'
import type { Session, User } from '@supabase/supabase-js'
import type { CourseworkEntry, ExperienceEntry, ProjectEntry } from '@/lib/supabaseHelpers'

export interface Profile {
  id: string
  role: 'student' | 'professor'
  full_name: string
  username: string
  email: string
  avatar_url?: string | null
  school_name?: string | null
  school_type?: string | null
  academic_year?: string | null
  department?: string | null
  bio?: string | null
  transfer_goals?: string | null
  research_areas?: string[] | null
  interests?: string[] | null
  skills?: string[] | null
  coursework?: CourseworkEntry[] | null
  experience?: ExperienceEntry[] | null
  projects?: ProjectEntry[] | null
  gender?: string | null
}

export interface LocalAuthUser {
  id: string
  email: string
}

interface AuthState {
  session: Session | null
  user: User | LocalAuthUser | null
  profile: Profile | null
  loading: boolean
  setSession: (session: Session | null) => void
  setUser: (user: User | LocalAuthUser | null) => void
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
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut()
    }
    clearLocalAuth()
    set({ session: null, user: null, profile: null, loading: false })
  },
}))
