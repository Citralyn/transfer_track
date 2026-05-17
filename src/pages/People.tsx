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
        <h1 className="text-3xl font-black text-black">Network</h1>
        <p className="text-black mt-1 font-bold">Discover students and professors in your academic field.</p>
      </div>

      {message && (
        <div className="rounded-none border-4 border-black bg-white px-5 py-4 text-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          {message}
        </div>
      )}

      {/* Tabs & Search */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex bg-white p-1.5 rounded-none border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] shrink-0">
          {([
            { id: 'connections', label: 'Connections' },
            { id: 'student', label: 'Students' },
            { id: 'professor', label: 'Professors' },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={clsx(
                "px-6 py-2 rounded-none font-black text-sm transition-all",
                filter === tab.id ? "bg-[#ff0000] text-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]" : "text-black hover:text-black"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, school, or department..."
            className="w-full pl-12 pr-4 py-3.5 rounded-none bg-white border-4 border-black focus:ring-2 focus:ring-brand-500 outline-none transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
        {loading || (filter === 'connections' && relationshipsLoading) ? (
          [1, 2, 3, 4, 5, 6].map(i => <div key={i} className="bg-white rounded-none border-4 border-black p-8 h-[280px] animate-pulse" />)
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
                      "w-full rounded-none py-3.5 font-black transition-all flex items-center justify-center gap-2",
                      isDisabled
                        ? 'bg-white border-4 border-black text-black cursor-default shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]'
                        : 'bg-[#ff0000] text-white hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]'
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
             <div className="w-20 h-20 bg-[#00ff00] rounded-none flex items-center justify-center text-black mx-auto mb-6">
                <Sparkles className="w-10 h-10" />
             </div>
             <h3 className="text-xl font-black text-black">No one found</h3>
             <p className="text-black mt-2">
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
      className="bg-white rounded-none border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all p-8 flex flex-col items-center text-center group cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500"
    >
      <div className="relative mb-6">
        <ProfileAvatar
          profile={person}
          className="w-24 h-24 rounded-none bg-[#ff0000] text-white font-black text-3xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] group-hover:scale-105 transition-transform duration-300"
        />
        <div className={clsx(
          "absolute -bottom-2 -right-2 w-10 h-10 rounded-none border-4 border-black flex items-center justify-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]",
          isProfessor ? "bg-[#ff00ff] text-white" : "bg-white0 text-white"
        )}>
          {isProfessor ? <GraduationCap className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
        </div>
      </div>

      <h3 className="text-lg font-black text-black mb-1 group-hover:text-[#4f46e5] transition-colors">{person.full_name}</h3>
      <p className="text-xs font-black text-black uppercase tracking-widest mb-4">{person.role}</p>
      
      <div className="space-y-2 mb-8 flex-1">
        <div className="flex items-center justify-center gap-2 text-black text-sm font-bold">
          <MapPin className="w-4 h-4 text-black" /> {person.school_name}
        </div>
        <p className="text-black text-sm line-clamp-2 leading-relaxed">
          {person.bio || (isProfessor ? `Professor in ${person.department}` : `${person.academic_year} Student`)}
        </p>
      </div>

      {actionButton ? actionButton : (
        <button className="w-full bg-white border-4 border-black text-black font-black py-3.5 rounded-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          View Profile
        </button>
      )}
    </div>
  )
}
