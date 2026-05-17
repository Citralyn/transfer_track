import { useState, useEffect, useCallback } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useAuthStore } from '@/store/useAuthStore'
import {
  type CourseworkEntry,
  type ExperienceEntry,
  getRelationshipStatus,
  type ClassMaterialEntry,
  type ProjectEntry,
  type ResearchEntry,
  sendConnectionRequest,
  getConnectionCount,
  upsertProfile,
  withTimeout,
  type ProfilePayload,
  type RelationshipStatus,
} from '@/lib/supabaseHelpers'
import { getOrCreateConversation } from '@/lib/messaging'
import {
  MapPin,
  Building2,
  GraduationCap,
  BookOpen,
  Settings,
  MessageSquare,
  Sparkles,
  Loader2,
  Check,
  ExternalLink,
} from 'lucide-react'
import { clsx } from 'clsx'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { ProfileAvatar } from '@/components/ui/ProfileAvatar'

type ProfessorOpportunity = {
  id: string
  title?: string | null
  university?: string | null
  department?: string | null
  description?: string | null
  deadline?: string | null
}

export default function Profile() {
  const { username } = useParams()
  const { profile: loggedInProfile } = useAuthStore()
  const [profile, setProfile] = useState<ProfilePayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [connectionCount, setConnectionCount] = useState(0)
  const [professorOpportunities, setProfessorOpportunities] = useState<ProfessorOpportunity[]>([])
  const [relationshipStatus, setRelationshipStatus] = useState<RelationshipStatus | 'sending' | 'error'>('none')
  const [requestMessage, setRequestMessage] = useState<string | null>(null)
  const navigate = useNavigate()

  const fetchProfile = useCallback(async () => {
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
  }, [username, loggedInProfile])

  const loadConnectionCount = useCallback(async (profileId: string) => {
    const count = await getConnectionCount(profileId)
    setConnectionCount(count)
  }, [])

  const loadProfessorOpportunities = useCallback(async (profileId: string, role?: string) => {
    if (role !== 'professor' || !isSupabaseConfigured()) {
      setProfessorOpportunities([])
      return
    }

    try {
      const { data, error } = await withTimeout(
        supabase
          .from('opportunities')
          .select('*')
          .eq('professor_id', profileId)
          .order('created_at', { ascending: false }),
        'Supabase professor opportunities lookup'
      )

      if (error) {
        console.warn('Error fetching professor opportunities:', error.message)
        setProfessorOpportunities([])
        return
      }

      setProfessorOpportunities(data || [])
    } catch (error) {
      console.warn('Professor opportunities lookup unavailable:', error)
      setProfessorOpportunities([])
    }
  }, [])

  const checkRelationshipStatus = useCallback(async (currentProfileId: string, viewedProfileId: string) => {
    const status = await getRelationshipStatus(currentProfileId, viewedProfileId)
    setRelationshipStatus(status)
    setRequestMessage(null)
  }, [])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  useEffect(() => {
    if (!profile?.id) return

    loadConnectionCount(profile.id)
    loadProfessorOpportunities(profile.id, profile.role)

    if (loggedInProfile?.id && profile.id !== loggedInProfile.id) {
      checkRelationshipStatus(loggedInProfile.id, profile.id)
    } else {
      setRelationshipStatus('none')
      setRequestMessage(null)
    }
  }, [
    profile?.id,
    profile?.role,
    loggedInProfile?.id,
    loadConnectionCount,
    loadProfessorOpportunities,
    checkRelationshipStatus,
  ])

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

  const handleStartMessage = async () => {
    if (!loggedInProfile || !profile?.id) return
    try {
      const conversationId = await getOrCreateConversation(loggedInProfile.id, profile.id)
      navigate(`/messages/${conversationId}`)
    } catch (error) {
      console.error('Error starting conversation:', error)
      setRequestMessage('Could not start conversation. Please try again.')
    }
  }

  if (loading) {
    return <LoadingScreen />
  }

  if (!profile) return <div className="py-20 text-center">Profile not found</div>

  const isOwnProfile = loggedInProfile?.id === profile.id
  const isProfessor = profile.role === 'professor'
  const coursework = normalizeEntries<CourseworkEntry>(profile.coursework)
  const experience = normalizeEntries<ExperienceEntry>(profile.experience)
  const projects = normalizeEntries<ProjectEntry>(profile.projects)
  const classMaterials = normalizeEntries<ClassMaterialEntry>(profile.class_materials)
  const research = normalizeEntries<ResearchEntry>(profile.research)
  const opportunityPreview = professorOpportunities.slice(0, 3)
  return (
    <div className="space-y-8 pb-20">
      <div className="bg-white rounded-xl border border-black/5 shadow-xl overflow-hidden">
        <div className="h-40 bg-[#ff3b30] relative">
          {profile.banner_url ? (
            <img src={profile.banner_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
          )}
        </div>
        <div className="px-8 pb-8 flex flex-col md:flex-row items-end gap-6 -mt-10 relative z-10">
          <ProfileAvatar profile={profile} className="w-40 h-40 rounded-full border-8 border-white bg-[#ff3b30] text-white font-semibold text-6xl shadow-xl" />
          <div className="flex-1 pb-4 pt-14 md:pt-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-4xl font-bold text-[#1d1d1f] leading-tight">{profile.full_name}</h1>
                <Link
                  to={isOwnProfile ? '/connections' : `/profile/${profile.username}/connections`}
                  className="inline-flex items-center text-sm font-semibold text-[#0066cc] hover:underline mt-3"
                >
                  {connectionCount} connections
                </Link>
                <p className="text-[#86868b] font-semibold tracking-wide uppercase text-xs mt-1">@{profile.username} • {profile.role}</p>
              </div>
              <div className="flex gap-3">
                {isOwnProfile ? (
                  <Link 
                    to="/settings"
                    className="bg-white text-[#1d1d1f] px-6 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all flex items-center gap-2 border border-black/5"
                  >
                    <Settings className="w-5 h-5" /> Edit Profile
                  </Link>
                ) : (
                  <>
                    <button 
                      onClick={handleConnect}
                      disabled={relationshipStatus === 'sending' || relationshipStatus === 'connected'}
                      className={clsx(
                        "px-8 py-3 rounded-xl font-semibold shadow-lg transition-all flex items-center gap-2",
                        relationshipStatus === 'connected' ? "bg-[#ffcc00] text-[#1d1d1f]" : "bg-[#ff3b30] text-white"
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
                    <button 
                      onClick={handleStartMessage}
                      className="bg-white border border-black/5 text-[#1d1d1f] px-4 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all"
                    >
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
        <div className="bg-white border border-black/5 text-[#1d1d1f] px-6 py-4 rounded-xl shadow-xl">
          {requestMessage}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-8">
          <div className="bg-white rounded-xl border border-black/5 shadow-xl p-8">
            <h3 className="text-lg font-semibold text-[#1d1d1f] mb-6 flex items-center gap-2">
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
            </div>
          </div>

          <div className="bg-white rounded-xl border border-black/5 shadow-xl p-8">
            <h3 className="text-lg font-semibold text-[#1d1d1f] mb-6">Interests</h3>
            <div className="flex flex-wrap gap-2">
              {(profile.interests || ['STEM', 'Research', 'Transfer Prep', 'Networking']).map((tag: string) => (
                <span key={tag} className="bg-[#f5f5f7] text-[#1d1d1f] px-4 py-2 rounded-xl text-sm font-semibold border border-black/5">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-8">
          <div className="bg-white rounded-xl border border-black/5 shadow-xl p-10">
            <h3 className="text-2xl font-semibold text-[#1d1d1f] mb-6">Biography</h3>
            <p className="text-[#1d1d1f] leading-relaxed text-lg whitespace-pre-wrap">
              {profile.bio || `Welcome to ${profile.full_name}'s profile. This user is a ${profile.role} at ${profile.school_name}.`}
            </p>
          </div>

          {isProfessor ? (
            <>
              <ProfileSection
                title="Posted Opportunities"
                isOwnProfile
                emptyText="No opportunities posted yet."
                hasEntries={opportunityPreview.length > 0}
                action={(
                  <Link to={`/profile/${profile.username}/opportunities`} className="bg-white text-[#1d1d1f] px-4 py-2 rounded-xl font-semibold text-sm border border-black/5 hover:shadow-lg transition-all">
                    View all opportunities
                  </Link>
                )}
              >
                {opportunityPreview.map((opportunity) => (
                  <OpportunityPreview key={opportunity.id} opportunity={opportunity} />
                ))}
              </ProfileSection>

              <ProfileSection
                title="Class Material"
                isOwnProfile
                emptyText="No class materials shared yet."
                hasEntries={classMaterials.length > 0}
              >
                {classMaterials.map((item) => (
                  <div key={item.id} className="p-5 rounded-xl border border-black/5 bg-white shadow-sm">
                    <p className="text-sm font-semibold text-[#86868b] uppercase tracking-wider">
                      {[item.course_code, item.course_name].filter(Boolean).join(' - ') || 'Course material'}
                    </p>
                    <h4 className="font-semibold text-[#1d1d1f] mt-2">{item.title || 'Untitled material'}</h4>
                    {item.description && <p className="text-[#1d1d1f] mt-3 whitespace-pre-wrap">{item.description}</p>}
                    {item.link && <ExternalProfileLink href={item.link} label="Open material" />}
                  </div>
                ))}
              </ProfileSection>

              <ProfileSection
                title="Research"
                isOwnProfile
                emptyText="No research added yet."
                hasEntries={research.length > 0}
              >
                {research.map((item) => (
                  <div key={item.id} className="p-5 rounded-xl border border-black/5 bg-white shadow-sm">
                    <h4 className="font-semibold text-[#1d1d1f]">{item.title || 'Untitled research'}</h4>
                    {(item.publication || item.year) && (
                      <p className="text-sm font-semibold text-[#86868b] uppercase tracking-wider mt-2">
                        {[item.publication, item.year].filter(Boolean).join(' - ')}
                      </p>
                    )}
                    {item.description && <p className="text-[#1d1d1f] mt-3 whitespace-pre-wrap">{item.description}</p>}
                    {item.link && <ExternalProfileLink href={item.link} label="View research" />}
                  </div>
                ))}
              </ProfileSection>
            </>
          ) : (
            <>
              <div className="bg-white rounded-xl border border-black/5 shadow-xl p-10 overflow-hidden relative">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-[#34c759]/10 rounded-full -z-0" />
                 <h3 className="text-2xl font-semibold text-[#1d1d1f] mb-8 relative z-10">Transfer Goals</h3>
                 <div className="space-y-6 relative z-10">
                   <div className="p-6 bg-[#f5f5f7] rounded-xl border border-black/5">
                     <h4 className="font-semibold text-[#1d1d1f] mb-2">Target Universities</h4>
                     <p className="text-[#1d1d1f]">{profile.transfer_goals || 'UC Berkeley, UCLA, Stanford University'}</p>
                   </div>
                   <div className="p-6 bg-[#af52de]/10 rounded-xl border border-black/5">
                     <h4 className="font-semibold text-[#af52de] mb-2">Academic Interests</h4>
                     <p className="text-[#1d1d1f]">{(profile.interests || ['Machine Learning', 'Physics', 'Mathematical Modeling']).join(', ')}</p>
                   </div>
                 </div>
              </div>

              <ProfileSection
                title="Coursework"
                isOwnProfile={isOwnProfile}
                emptyText="Add coursework to highlight relevant classes."
                hasEntries={coursework.length > 0}
              >
                {coursework.map((course) => (
                  <div key={course.id} className="p-5 rounded-xl border border-black/5 bg-white/60">
                    <h4 className="font-semibold text-[#1d1d1f]">{course.course_name || 'Untitled course'}</h4>
                    {course.course_code && <p className="text-sm font-semibold text-[#1d1d1f] uppercase tracking-wider mt-1">{course.course_code}</p>}
                    {course.description && <p className="text-[#1d1d1f] mt-3 whitespace-pre-wrap">{course.description}</p>}
                  </div>
                ))}
              </ProfileSection>

              <ProfileSection
                title="Experience"
                isOwnProfile={isOwnProfile}
                emptyText="Add experience to show internships, work, research, or leadership."
                hasEntries={experience.length > 0}
              >
                {experience.map((item) => (
                  <div key={item.id} className="p-5 rounded-xl border border-black/5 bg-white/60">
                    <h4 className="font-semibold text-[#1d1d1f]">{item.title || 'Untitled role'}</h4>
                    <p className="text-[#1d1d1f] mt-1">{item.organization || 'Organization not specified'}</p>
                    {(item.start_date || item.end_date || item.is_present) && (
                      <p className="text-sm text-[#1d1d1f] font-semibold mt-2">
                        {item.start_date || 'Start'} - {item.is_present ? 'Present' : item.end_date || 'End'}
                      </p>
                    )}
                    {item.description && <p className="text-[#1d1d1f] mt-3 whitespace-pre-wrap">{item.description}</p>}
                  </div>
                ))}
              </ProfileSection>

              <ProfileSection
                title="Projects"
                isOwnProfile={isOwnProfile}
                emptyText="Add projects to showcase what you have built or researched."
                hasEntries={projects.length > 0}
              >
                {projects.map((project) => (
                  <div key={project.id} className="p-5 rounded-xl border border-black/5 bg-white/60">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <h4 className="font-semibold text-[#1d1d1f]">{project.project_name || 'Untitled project'}</h4>
                      {project.link && <a href={project.link} target="_blank" rel="noreferrer" className="text-sm font-semibold text-[#4f46e5] hover:underline">View Project</a>}
                    </div>
                    {project.tech_stack && <p className="text-sm font-semibold text-[#1d1d1f] uppercase tracking-wider mt-2">{project.tech_stack}</p>}
                    {project.description && <p className="text-[#1d1d1f] mt-3 whitespace-pre-wrap">{project.description}</p>}
                  </div>
                ))}
              </ProfileSection>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode, label: string, value?: string | null }) {
  return (
    <div className="flex items-center gap-4 group">
      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#1d1d1f] group-hover:bg-[#ffcc00] transition-colors">
        {icon}
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-widest font-semibold text-[#1d1d1f] leading-none mb-1">{label}</p>
        <p className="text-[#1d1d1f] font-semibold">{value || 'Not specified'}</p>
      </div>
    </div>
  )
}

function ProfileSection({
  title,
  isOwnProfile,
  emptyText,
  hasEntries,
  action,
  children,
}: {
  title: string
  isOwnProfile: boolean
  emptyText: string
  hasEntries: boolean
  action?: React.ReactNode
  children: React.ReactNode
}) {
  if (!hasEntries && !isOwnProfile) return null

  return (
    <div className="bg-white rounded-xl border border-black/5 shadow-xl p-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h3 className="text-2xl font-semibold text-[#1d1d1f]">{title}</h3>
        {action}
      </div>
      {hasEntries ? (
        <div className="space-y-4">{children}</div>
      ) : (
        <p className="text-[#1d1d1f]">{emptyText}</p>
      )}
    </div>
  )
}

function OpportunityPreview({ opportunity }: { opportunity: ProfessorOpportunity }) {
  return (
    <div className="p-5 rounded-xl border border-black/5 bg-white/60">
      <h4 className="font-semibold text-[#1d1d1f]">{opportunity.title}</h4>
      <p className="text-sm font-semibold text-[#1d1d1f] uppercase tracking-wider mt-2">
        {[opportunity.university, opportunity.department].filter(Boolean).join(' - ')}
      </p>
      {opportunity.description && <p className="text-[#1d1d1f] mt-3 line-clamp-3">{opportunity.description}</p>}
      {opportunity.deadline && (
        <p className="text-sm text-[#1d1d1f] mt-3">Deadline: {new Date(opportunity.deadline).toLocaleDateString()}</p>
      )}
    </div>
  )
}

function ExternalProfileLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#4f46e5] hover:underline"
    >
      {label}
      <ExternalLink className="w-4 h-4" />
    </a>
  )
}

function normalizeEntries<T>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : []
}
