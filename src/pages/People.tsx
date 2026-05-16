import { useState, useEffect, type ReactNode } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useAuthStore } from '@/store/useAuthStore'
import { sendConnectionRequest, upsertProfile, withTimeout } from '@/lib/supabaseHelpers'
import { Search, Filter, UserPlus, GraduationCap, BookOpen, MapPin, Sparkles } from 'lucide-react'
import { clsx } from 'clsx'
import { Link } from 'react-router-dom'

export default function People() {
  const [people, setPeople] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'student' | 'professor'>('all')
  const [statusMap, setStatusMap] = useState<Record<string, 'idle' | 'sending' | 'sent'>>({})
  const [message, setMessage] = useState<string | null>(null)
  const { profile: currentProfile } = useAuthStore()

  useEffect(() => {
    fetchPeople()
  }, [filter])

  const fetchPeople = async () => {
    setLoading(true)
    try {
      if (!isSupabaseConfigured()) {
        setPeople(getFallbackPeople(filter))
        return
      }

      let query = supabase.from('profiles').select('*')

      if (filter !== 'all') {
        query = query.eq('role', filter)
      }

      const { data, error } = await withTimeout(
        query.order('full_name', { ascending: true }),
        'Supabase people lookup'
      )

      if (error) {
        console.warn('Error fetching people, using fallback people:', error.message)
        setPeople(getFallbackPeople(filter))
        return
      }

      setPeople(data?.length ? data : getFallbackPeople(filter))
    } catch (error) {
      console.warn('People lookup unavailable, using fallback people:', error)
      setPeople(getFallbackPeople(filter))
    } finally {
      setLoading(false)
    }
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

      if (result.success || result.duplicate || result.fallback) {
        setStatusMap((prev) => ({ ...prev, [person.id]: 'sent' }))
        setMessage(result.message)
      } else {
        setStatusMap((prev) => ({ ...prev, [person.id]: 'idle' }))
        setMessage(result.message)
      }
    } catch (error) {
      console.warn('Connection request failed:', error)
      setStatusMap((prev) => ({ ...prev, [person.id]: 'idle' }))
      setMessage('Demo request could not be saved. Please try again.')
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-brand-900">Network</h1>
        <p className="text-brand-500 mt-1 font-medium">Discover students and professors in your academic field.</p>
      </div>

      {message && (
        <div className="rounded-3xl border border-brand-100 bg-brand-50 px-5 py-4 text-brand-700 shadow-sm">
          {message}
        </div>
      )}

      {/* Tabs & Search */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex bg-white p-1.5 rounded-2xl border border-brand-100 shadow-sm shrink-0">
          {(['all', 'student', 'professor'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={clsx(
                "px-6 py-2 rounded-xl font-bold text-sm transition-all capitalize",
                filter === t ? "gradient-brand text-white shadow-md" : "text-brand-500 hover:text-brand-800"
              )}
            >
              {t}s
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-400" />
          <input 
            type="text" 
            placeholder="Search by name, school, or department..."
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white border border-brand-100 focus:ring-2 focus:ring-brand-500 outline-none transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
        {loading ? (
          [1, 2, 3, 4, 5, 6].map(i => <div key={i} className="bg-white rounded-[2rem] border border-brand-100 p-8 h-[280px] animate-pulse" />)
        ) : people.length > 0 ? (
          people.map(person => {
            const canExpressInterest = currentProfile?.role === 'student' && person.role === 'professor' && currentProfile.id !== person.id
            const status = statusMap[person.id] ?? 'idle'

            return (
              <UserCard
                key={person.id}
                person={person}
                actionButton={canExpressInterest ? (
                  <button
                    onClick={() => handleConnect(person)}
                    disabled={status === 'sending' || status === 'sent'}
                    className={clsx(
                      "w-full rounded-2xl py-3.5 font-bold transition-all flex items-center justify-center gap-2",
                      status === 'sent'
                        ? 'bg-brand-100 text-brand-700 cursor-default'
                        : 'gradient-brand text-white hover:shadow-lg'
                    )}
                  >
                    {status === 'sending' ? 'Sending...' : status === 'sent' ? 'Request Sent' : 'Express Interest'}
                  </button>
                ) : undefined}
              />
            )
          })
        ) : (
          <div className="col-span-full py-20 text-center">
             <div className="w-20 h-20 gradient-soft rounded-3xl flex items-center justify-center text-brand-300 mx-auto mb-6">
                <Sparkles className="w-10 h-10" />
             </div>
             <h3 className="text-xl font-bold text-brand-900">No one found</h3>
             <p className="text-brand-500 mt-2">Try a different filter or search term.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function getFallbackPeople(filter: 'all' | 'student' | 'professor') {
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

  return filter === 'all' ? people : people.filter((person) => person.role === filter)
}

function UserCard({ person, actionButton }: { person: any; actionButton?: ReactNode }) {
  const isProfessor = person.role === 'professor'

  return (
    <div className="bg-white rounded-[2rem] border border-brand-100 shadow-sm hover:shadow-md transition-all p-8 flex flex-col items-center text-center group">
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-[2rem] gradient-brand flex items-center justify-center text-white font-bold text-3xl shadow-lg group-hover:scale-105 transition-transform duration-300">
          {person.full_name?.charAt(0)}
        </div>
        <div className={clsx(
          "absolute -bottom-2 -right-2 w-10 h-10 rounded-xl border-4 border-white flex items-center justify-center shadow-md",
          isProfessor ? "bg-accent-500 text-white" : "bg-brand-500 text-white"
        )}>
          {isProfessor ? <GraduationCap className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
        </div>
      </div>

      <Link to={`/profile/${person.username}`} className="hover:text-accent-600 transition-colors">
        <h3 className="text-lg font-bold text-brand-900 mb-1">{person.full_name}</h3>
      </Link>
      <p className="text-xs font-bold text-brand-400 uppercase tracking-widest mb-4">{person.role}</p>
      
      <div className="space-y-2 mb-8 flex-1">
        <div className="flex items-center justify-center gap-2 text-brand-600 text-sm font-medium">
          <MapPin className="w-4 h-4 text-brand-300" /> {person.school_name}
        </div>
        <p className="text-brand-500 text-sm line-clamp-2 leading-relaxed">
          {person.bio || (isProfessor ? `Professor in ${person.department}` : `${person.academic_year} Student`)}
        </p>
      </div>

      {actionButton ? actionButton : (
        <button className="w-full bg-white border border-brand-100 text-brand-700 font-bold py-3.5 rounded-2xl shadow-sm transition-all hover:shadow-md">
          View Profile
        </button>
      )}
    </div>
  )
}
