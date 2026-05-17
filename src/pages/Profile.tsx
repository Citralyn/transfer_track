import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useAuthStore } from '@/store/useAuthStore'
import {
  getRelationshipStatus,
  sendConnectionRequest,
  getConnectionCount,
  upsertProfile,
  withTimeout,
  type RelationshipStatus,
} from '@/lib/supabaseHelpers'
import {
  MapPin,
  Building2,
  GraduationCap,
  BookOpen,
  Settings,
  Users,
  MessageSquare,
  Sparkles,
  ChevronRight,
  Loader2,
  Check,
} from 'lucide-react'
import { clsx } from 'clsx'
import { LoadingScreen } from '@/components/ui/LoadingScreen'

export default function Profile() {
  const { username } = useParams()
  const { profile: loggedInProfile } = useAuthStore()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [connectionCount, setConnectionCount] = useState(0)
  const [relationshipStatus, setRelationshipStatus] = useState<RelationshipStatus | 'sending' | 'error'>('none')
  const [requestMessage, setRequestMessage] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchProfile()
  }, [username, loggedInProfile])

  useEffect(() => {
    if (!profile?.id) return

    loadConnectionCount(profile.id)

    if (
      loggedInProfile?.id &&
      profile.id !== loggedInProfile.id
    ) {
      checkRelationshipStatus()
    }
  }, [profile?.id, loggedInProfile?.id])

  const fetchProfile = async () => {
    setLoading(true)
    const targetUsername = username || loggedInProfile?.username

    if (!targetUsername) {
      setProfile(loggedInProfile)
      setLoading(false)
      return
    }

    if (!isSupabaseConfigured()) {
      setProfile(!username || loggedInProfile?.username === username ? loggedInProfile : null)
      setLoading(false)
      return
    }

    try {
      const { data, error } = await withTimeout(
        supabase
          .from('profiles')
          .select('*')
          .eq('username', targetUsername)
          .maybeSingle(),
        'Supabase profile page lookup'
      )

      setProfile(data || (!username ? loggedInProfile : null))
      if (error) console.warn('Error fetching profile:', error.message)
    } catch (error) {
      console.warn('Profile lookup unavailable, using local profile if possible:', error)
      setProfile(!username || loggedInProfile?.username === username ? loggedInProfile : null)
    }
    setLoading(false)
  }

  const loadConnectionCount = async (profileId: string) => {
    const count = await getConnectionCount(profileId)
    setConnectionCount(count)
  }

  const checkRelationshipStatus = async () => {
    if (!loggedInProfile?.id || !profile?.id) return

    const status = await getRelationshipStatus(loggedInProfile.id, profile.id)
    setRelationshipStatus(status)
    setRequestMessage(null)
  }

  const handleConnect = async () => {
    if (!loggedInProfile || !profile?.id) return

    setRelationshipStatus('sending')
    setRequestMessage(null)

    await upsertProfile(loggedInProfile)

    const result = await sendConnectionRequest(loggedInProfile, {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      username: profile.username,
    })

    if (result.message === 'Already connected.') {
      setRelationshipStatus('connected')
      setRequestMessage(null)
    } else if (result.success || result.duplicate || result.fallback) {
      const nextStatus = await getRelationshipStatus(loggedInProfile.id, profile.id)
      setRelationshipStatus(nextStatus === 'connected' ? 'connected' : 'pending_outgoing')
      setRequestMessage(nextStatus === 'connected' ? null : result.message)
    } else {
      const nextStatus = await getRelationshipStatus(loggedInProfile.id, profile.id)
      setRelationshipStatus(nextStatus === 'none' ? 'error' : nextStatus)
      setRequestMessage(result.message)
    }
  }

  if (loading) {
    return <LoadingScreen />
  }

  if (!profile) return <div className="py-20 text-center">Profile not found</div>

  const isOwnProfile = loggedInProfile?.id === profile.id
  const isProfessor = profile.role === 'professor'
  return (
    <div className="space-y-8 pb-20">
      <div className="bg-white rounded-[3rem] border border-brand-100 shadow-sm overflow-hidden">
        <div className="h-40 gradient-brand relative">
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
        </div>
        <div className="px-8 pb-8 flex flex-col md:flex-row items-end gap-6 -mt-16 relative z-10">
          <div className="w-40 h-40 rounded-[3rem] border-8 border-white gradient-brand flex items-center justify-center text-white font-bold text-6xl shadow-xl">
            {profile.full_name?.charAt(0)}
          </div>
          <div className="flex-1 pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-extrabold text-brand-900 leading-tight">{profile.full_name}</h1>
                <p className="text-brand-500 font-bold tracking-wide uppercase text-xs mt-1">@{profile.username} • {profile.role}</p>
              </div>
              <div className="flex gap-3">
                {isOwnProfile ? (
                  <Link 
                    to="/settings"
                    className="bg-brand-50 text-brand-800 px-6 py-3 rounded-2xl font-bold shadow-sm hover:shadow-md transition-all flex items-center gap-2 border border-brand-100"
                  >
                    <Settings className="w-5 h-5" /> Edit Profile
                  </Link>
                ) : (
                  <>
                    <button 
                      onClick={handleConnect}
                      disabled={relationshipStatus === 'sending' || relationshipStatus === 'connected'}
                      className={clsx(
                        "px-8 py-3 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2",
                        relationshipStatus === 'connected' ? "bg-brand-100 text-brand-700 shadow-none hover:shadow-none" : "gradient-brand text-white"
                      )}
                    >
                      {relationshipStatus === 'sending' ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /> Sending...</>
                      ) : relationshipStatus === 'connected' ? (
                        <><Check className="w-5 h-5" /> Connected</>
                      ) : relationshipStatus === 'pending_outgoing' ? (
                        'Request Sent'
                      ) : (
                        'Connect'
                      )}
                    </button>
                    <button className="bg-white border border-brand-100 text-brand-800 px-4 py-3 rounded-2xl font-bold shadow-sm hover:shadow-md transition-all">
                      <MessageSquare className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {requestMessage && (
        <div className="bg-brand-50 border border-brand-100 text-brand-700 px-6 py-4 rounded-3xl shadow-sm">
          {requestMessage}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-8">
          <div className="bg-white rounded-[2.5rem] border border-brand-100 shadow-sm p-8">
            <h3 className="text-lg font-bold text-brand-900 mb-6 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent-500" /> About
            </h3>
            <div className="space-y-5">
              <InfoItem icon={<Building2 className="w-5 h-5" />} label="Institution" value={profile.school_name} />
              {isProfessor ? (
                <InfoItem icon={<GraduationCap className="w-5 h-5" />} label="Department" value={profile.department} />
              ) : (
                <InfoItem icon={<BookOpen className="w-5 h-5" />} label="Year" value={profile.academic_year} />
              )}
              <InfoItem icon={<MapPin className="w-5 h-5" />} label="Location" value="California, USA" />
              <InfoItem icon={<Users className="w-5 h-5" />} label="Connections" value={connectionCount.toString()} />
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-brand-100 shadow-sm p-8">
            <h3 className="text-lg font-bold text-brand-900 mb-6">Interests</h3>
            <div className="flex flex-wrap gap-2">
              {(profile.interests || ['STEM', 'Research', 'Transfer Prep', 'Networking']).map((tag: string) => (
                <span key={tag} className="bg-accent-50 text-accent-700 px-4 py-2 rounded-xl text-sm font-bold border border-accent-100">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-8">
          <div className="bg-white rounded-[2.5rem] border border-brand-100 shadow-sm p-10">
            <h3 className="text-2xl font-bold text-brand-900 mb-6">Biography</h3>
            <p className="text-brand-700 leading-relaxed text-lg whitespace-pre-wrap">
              {profile.bio || `Welcome to ${profile.full_name}'s profile. This user is a ${profile.role} at ${profile.school_name}.`}
            </p>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-brand-100 shadow-sm p-10 overflow-hidden relative">
             <div className="absolute top-0 right-0 w-32 h-32 gradient-soft rounded-bl-full -z-0" />
             
             <h3 className="text-2xl font-bold text-brand-900 mb-8 relative z-10">
               {isProfessor ? 'Academic Collaboration' : 'Transfer Goals'}
             </h3>
             
             {isProfessor ? (
               <div className="space-y-6 relative z-10">
                 <ProfileLink title="Open Research Positions" count="2" color="accent" />
                 <ProfileLink title="Suggested Preparation Materials" count="5" color="brand" />
                 <ProfileLink title="Lab Website" color="brand" />
               </div>
             ) : (
               <div className="space-y-6 relative z-10">
                 <div className="p-6 bg-brand-50 rounded-3xl border border-brand-100">
                   <h4 className="font-bold text-brand-900 mb-2">Target Universities</h4>
                   <p className="text-brand-600">{profile.transfer_goals || 'UC Berkeley, UCLA, Stanford University'}</p>
                 </div>
                 <div className="p-6 bg-accent-50/50 rounded-3xl border border-accent-100">
                   <h4 className="font-bold text-accent-800 mb-2">Academic Interests</h4>
                   <p className="text-accent-700">{(profile.interests || ['Machine Learning', 'Physics', 'Mathematical Modeling']).join(', ')}</p>
                 </div>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode, label: string, value?: string }) {
  return (
    <div className="flex items-center gap-4 group">
      <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-400 group-hover:bg-brand-100 transition-colors">
        {icon}
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-widest font-bold text-brand-300 leading-none mb-1">{label}</p>
        <p className="text-brand-900 font-bold">{value || 'Not specified'}</p>
      </div>
    </div>
  )
}

function ProfileLink({ title, count, color }: { title: string, count?: string, color: 'brand' | 'accent' }) {
  return (
    <button className={clsx(
      "w-full flex items-center justify-between p-6 rounded-3xl border transition-all hover:scale-[1.02] active:scale-95 group",
      color === 'brand' ? "bg-white border-brand-100 hover:border-brand-300" : "bg-white border-accent-100 hover:border-accent-300"
    )}>
      <div className="flex items-center gap-4">
        <div className={clsx(
          "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm",
          color === 'brand' ? "bg-brand-50 text-brand-600" : "bg-accent-50 text-accent-600"
        )}>
          <ChevronRight className="w-6 h-6" />
        </div>
        <span className="font-bold text-brand-900">{title}</span>
      </div>
      {count && (
        <span className={clsx(
          "px-3 py-1 rounded-full text-xs font-bold",
          color === 'brand' ? "bg-brand-100 text-brand-800" : "bg-accent-100 text-accent-800"
        )}>
          {count}
        </span>
      )}
    </button>
  )
}
