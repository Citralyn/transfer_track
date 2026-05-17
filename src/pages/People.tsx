import { useState, useEffect, type ReactNode } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useAuthStore } from '@/store/useAuthStore'
import {
  getRelationshipStatusMap,
  sendConnectionRequest,
  upsertProfile,
  withTimeout,
  type RelationshipStatus,
} from '@/lib/supabaseHelpers'
import { Search, GraduationCap, BookOpen, MapPin, Sparkles } from 'lucide-react'
import { clsx } from 'clsx'
import { useNavigate } from 'react-router-dom'
import { ProfileAvatar } from '@/components/ui/ProfileAvatar'

export default function People() {
  const [people, setPeople] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'connections' | 'student' | 'professor'>('connections')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusMap, setStatusMap] = useState<Record<string, RelationshipStatus | 'sending'>>({})
  const [relationshipsLoading, setRelationshipsLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const { profile: currentProfile } = useAuthStore()

  useEffect(() => {
    fetchPeople()
  }, [filter])

  useEffect(() => {
    loadRelationshipStatuses()
  }, [people, currentProfile?.id])

  const fetchPeople = async () => {
    setLoading(true)
    try {
      if (!isSupabaseConfigured()) {
        setPeople(getFallbackPeople(filter))
        return
      }

      let query = supabase.from('profiles').select('*')

      if (filter !== 'connections') {
        query = query.eq('role', filter)
      }

      const { data, error } = await withTimeout(
        query.order('full_name', { ascending: true }),
        'Supabase people lookup'
      )

      if (error) {
        console.warn('Error fetching people from Supabase:', error.message)
        setPeople([])
        setMessage(`Unable to load people from Supabase: ${error.message}`)
        return
      }

      setPeople(data ?? [])
    } catch (error) {
      console.warn('People lookup unavailable:', error)
      if (isSupabaseConfigured()) {
        setPeople([])
        setMessage('Unable to load people from Supabase. Check your browser console for the exact error.')
      } else {
        setPeople(getFallbackPeople(filter))
      }
    } finally {
      setLoading(false)
    }
  }

  const loadRelationshipStatuses = async () => {
    if (!currentProfile?.id || people.length === 0) {
      setRelationshipsLoading(false)
      return
    }

    setRelationshipsLoading(true)
    const relationships = await getRelationshipStatusMap(
      currentProfile.id,
      people.map((person) => person.id)
    )
    setStatusMap((prev) => ({ ...relationships, ...pickSendingStatuses(prev) }))
    setRelationshipsLoading(false)
  }

  const handleConnect = async (person: any) => {
    if (!currentProfile) return
    setMessage(null)
    setStatusMap((prev) => ({ ...prev, [person.id]: 'sending' }))

    try {
      await upsertProfile(currentProfile)

      const result = await sendConnectionRequest(currentProfile, {
        id: person.id,
        email: person.email,
        full_name: person.full_name,
        username: person.username,
      })

      if (result.message === 'Already connected.') {
        setStatusMap((prev) => ({ ...prev, [person.id]: 'connected' }))
        setMessage(null)
      } else if (result.success || result.duplicate || result.fallback) {
        setStatusMap((prev) => ({ ...prev, [person.id]: 'pending_outgoing' }))
        setMessage(result.message)
      } else {
        setStatusMap((prev) => ({ ...prev, [person.id]: 'none' }))
        setMessage(result.message)
      }
    } catch (error) {
      console.warn('Connection request failed:', error)
      setStatusMap((prev) => ({ ...prev, [person.id]: 'none' }))
      setMessage('Demo request could not be saved. Please try again.')
    }
  }

  const filteredPeople = people.filter(person => {
    if (filter === 'connections' && statusMap[person.id] !== 'connected') return false

    const searchLower = searchQuery.toLowerCase()
    return (
      person.full_name?.toLowerCase().includes(searchLower) ||
      person.school_name?.toLowerCase().includes(searchLower) ||
      person.department?.toLowerCase().includes(searchLower) ||
      person.username?.toLowerCase().includes(searchLower)
    )
  })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-[#1d1d1f]">Network</h1>
        <p className="text-[#1d1d1f] mt-1 font-bold">Discover students and professors in your academic field.</p>
      </div>

      {message && (
        <div className="rounded-xl border border-black/5 bg-white px-5 py-4 text-[#1d1d1f] shadow-xl">
          {message}
        </div>
      )}

      {/* Tabs & Search */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex bg-white p-1.5 rounded-xl border border-black/5 shadow-xl shrink-0">
          {([
            { id: 'connections', label: 'Connections' },
            { id: 'student', label: 'Students' },
            { id: 'professor', label: 'Professors' },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={clsx(
                "px-6 py-2 rounded-xl font-semibold text-sm transition-all",
                filter === tab.id ? "bg-[#ff3b30] text-white shadow-xl" : "text-[#1d1d1f] hover:text-[#1d1d1f]"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1d1d1f]" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, school, or department..."
            className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white border border-black/5 focus:ring-2 focus:ring-brand-500 outline-none transition-all shadow-xl"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
        {loading || (filter === 'connections' && relationshipsLoading) ? (
          [1, 2, 3, 4, 5, 6].map(i => <div key={i} className="bg-white rounded-xl border border-black/5 p-8 h-[280px] animate-pulse" />)
        ) : filteredPeople.length > 0 ? (
          filteredPeople.map(person => {
            const canConnect = Boolean(currentProfile && !isSameProfile(currentProfile, person))
            const status = statusMap[person.id] ?? 'none'
            const isDisabled = status === 'sending' || status === 'pending_outgoing' || status === 'pending_incoming' || status === 'connected'
            const buttonLabel = status === 'sending'
              ? 'Sending...'
              : status === 'connected'
                ? 'Connected'
                : status === 'pending_outgoing'
                  ? 'Request Sent'
                  : status === 'pending_incoming'
                    ? 'Request Received'
                    : 'Connect'

            return (
              <UserCard
                key={person.id}
                person={person}
                actionButton={canConnect ? (
                  <button
                    onClick={(event) => {
                      event.stopPropagation()
                      if (isDisabled) return
                      handleConnect(person)
                    }}
                    disabled={isDisabled}
                    className={clsx(
                      "w-full rounded-xl py-3.5 font-semibold transition-all flex items-center justify-center gap-2",
                      isDisabled
                        ? 'bg-white border border-black/5 text-[#1d1d1f] cursor-default shadow-xl'
                        : 'bg-[#ff3b30] text-white hover:shadow-xl'
                    )}
                  >
                    {buttonLabel}
                  </button>
                ) : undefined}
              />
            )
          })
        ) : (
          <div className="col-span-full py-20 text-center">
             <div className="w-20 h-20 bg-[#34c759] rounded-full flex items-center justify-center text-[#1d1d1f] mx-auto mb-6">
                <Sparkles className="w-10 h-10" />
             </div>
             <h3 className="text-xl font-semibold text-[#1d1d1f]">No one found</h3>
             <p className="text-[#1d1d1f] mt-2">
              {filter === 'connections' ? 'Accepted connections will appear here.' : 'Try a different filter or search term.'}
             </p>
          </div>
        )}
      </div>
    </div>
  )
}

function pickSendingStatuses(statusMap: Record<string, RelationshipStatus | 'sending'>) {
  return Object.fromEntries(Object.entries(statusMap).filter(([, status]) => status === 'sending'))
}

function isSameProfile(currentProfile: any, person: any) {
  return Boolean(
    currentProfile.id === person.id ||
    (currentProfile.email && person.email && currentProfile.email.toLowerCase() === person.email.toLowerCase()) ||
    (currentProfile.username && person.username && currentProfile.username.toLowerCase() === person.username.toLowerCase())
  )
}

function getFallbackPeople(filter: 'connections' | 'student' | 'professor') {
  const people = [
    {
      id: 'mock-professor-maya-chen',
      role: 'professor',
      full_name: 'Dr. Maya Chen',
      username: 'maya-chen',
      email: 'maya.chen@example.edu',
      school_name: 'UC Irvine',
      department: 'Computer Science',
      bio: 'Mentors transfer students interested in human-centered AI and research.',
    },
    {
      id: 'mock-professor-daniel-rivera',
      role: 'professor',
      full_name: 'Dr. Daniel Rivera',
      username: 'daniel-rivera',
      email: 'daniel.rivera@example.edu',
      school_name: 'UCLA',
      department: 'Biology',
      bio: 'Runs undergraduate research projects in molecular biology.',
    },
    {
      id: 'mock-student-jane-doe',
      role: 'student',
      full_name: 'Jane Doe',
      username: 'jane-doe',
      email: 'jane@example.com',
      school_name: 'Santa Monica College',
      academic_year: 'Sophomore',
      bio: 'Preparing to transfer into computer science.',
    },
  ]

  return filter === 'connections' ? people : people.filter((person) => person.role === filter)
}

function UserCard({ person, actionButton }: { person: any; actionButton?: ReactNode }) {
  const isProfessor = person.role === 'professor'
  const navigate = useNavigate()
  const profilePath = `/profile/${person.username}`
  const openProfile = () => navigate(profilePath)

  return (
    <div
      onClick={openProfile}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          openProfile()
        }
      }}
      role="button"
      tabIndex={0}
      className="bg-white rounded-xl border border-black/5 shadow-xl hover:shadow-xl transition-all p-8 flex flex-col items-center text-center group cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500"
    >
      <div className="relative mb-6">
        <ProfileAvatar
          profile={person}
          className="w-24 h-24 rounded-xl bg-[#ff3b30] text-white font-semibold text-3xl shadow-xl group-hover:scale-105 transition-transform duration-300"
        />
        <div className={clsx(
          "absolute -bottom-2 -right-2 w-10 h-10 rounded-xl border border-black/5 flex items-center justify-center shadow-xl",
          isProfessor ? "bg-[#af52de] text-white" : "bg-white0 text-white"
        )}>
          {isProfessor ? <GraduationCap className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
        </div>
      </div>

      <h3 className="text-lg font-semibold text-[#1d1d1f] mb-1 group-hover:text-[#4f46e5] transition-colors">{person.full_name}</h3>
      <p className="text-xs font-semibold text-[#1d1d1f] uppercase tracking-widest mb-4">{person.role}</p>
      
      <div className="space-y-2 mb-8 flex-1">
        <div className="flex items-center justify-center gap-2 text-[#1d1d1f] text-sm font-bold">
          <MapPin className="w-4 h-4 text-[#1d1d1f]" /> {person.school_name}
        </div>
        <p className="text-[#1d1d1f] text-sm line-clamp-2 leading-relaxed">
          {person.bio || (isProfessor ? `Professor in ${person.department}` : `${person.academic_year} Student`)}
        </p>
      </div>

      {actionButton ? actionButton : (
        <button className="w-full bg-white border border-black/5 text-[#1d1d1f] font-semibold py-3.5 rounded-xl shadow-xl transition-all hover:shadow-xl">
          View Profile
        </button>
      )}
    </div>
  )
}
