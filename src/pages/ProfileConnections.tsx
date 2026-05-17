import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Building2, GraduationCap, Users } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useAuthStore } from '@/store/useAuthStore'
import {
  fetchAcceptedConnections,
  fetchProfilesByIds,
  loadLocalConnectionRequests,
  type ProfilePayload,
  withTimeout,
} from '@/lib/supabaseHelpers'
import { ProfileAvatar } from '@/components/ui/ProfileAvatar'
import { LoadingScreen } from '@/components/ui/LoadingScreen'

type ConnectionProfile = Partial<ProfilePayload> & {
  id: string
  full_name?: string | null
  username?: string | null
  avatar_url?: string | null
  school_name?: string | null
  academic_year?: string | null
  department?: string | null
}

type DisplayConnection = {
  id: string
  profile: ConnectionProfile
}

export default function ProfileConnections() {
  const { username } = useParams()
  const { profile: loggedInProfile } = useAuthStore()
  const [profile, setProfile] = useState<ProfilePayload | null>(null)
  const [connections, setConnections] = useState<DisplayConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadProfileConnections()
  }, [username, loggedInProfile?.id])

  const loadProfileConnections = async () => {
    setLoading(true)
    setError(null)

    const targetUsername = username || loggedInProfile?.username
    if (!targetUsername) {
      setProfile(null)
      setConnections([])
      setLoading(false)
      return
    }

    try {
      const targetProfile = await fetchProfileByUsername(targetUsername)
      setProfile(targetProfile)

      if (!targetProfile?.id) {
        setConnections([])
        setError('Profile not found.')
        return
      }

      const acceptedConnections = isSupabaseConfigured()
        ? await loadSupabaseConnections(targetProfile.id)
        : loadLocalConnections(targetProfile.id)

      setConnections(acceptedConnections)
    } catch (loadError) {
      console.warn('Profile connections lookup failed:', loadError)
      setError('Connections are unavailable right now.')
      setConnections([])
    } finally {
      setLoading(false)
    }
  }

  const fetchProfileByUsername = async (targetUsername: string) => {
    if (!isSupabaseConfigured()) {
      return loggedInProfile?.username === targetUsername ? loggedInProfile as ProfilePayload : null
    }

    const { data, error: profileError } = await withTimeout(
      supabase
        .from('profiles')
        .select('*')
        .eq('username', targetUsername)
        .maybeSingle(),
      'Supabase profile connections profile lookup'
    )

    if (profileError) {
      console.warn('Profile connections profile lookup failed:', profileError.message)
    }

    return (data || (loggedInProfile?.username === targetUsername ? loggedInProfile : null)) as ProfilePayload | null
  }

  const loadSupabaseConnections = async (profileId: string) => {
    const accepted = await fetchAcceptedConnections(profileId)
    const profileIds = accepted.flatMap((connection: any) => [connection.requester_id, connection.receiver_id])
    const relatedProfiles = await fetchProfilesByIds(profileIds)
    const profilesById = new Map(relatedProfiles.map((item: any) => [item.id, item]))

    return accepted
      .map((connection: any) => {
        const otherId = connection.requester_id === profileId ? connection.receiver_id : connection.requester_id
        const otherProfile = profilesById.get(otherId)
        if (!otherProfile) return null
        return {
          id: connection.id,
          profile: otherProfile as ConnectionProfile,
        }
      })
      .filter(Boolean) as DisplayConnection[]
  }

  const loadLocalConnections = (profileId: string) => {
    return loadLocalConnectionRequests()
      .filter((request) =>
        request.status === 'accepted' &&
        (request.requesterId === profileId || request.receiverId === profileId)
      )
      .map((request) => {
        const isRequester = request.requesterId === profileId
        return {
          id: request.id,
          profile: {
            id: isRequester ? request.receiverId || request.receiverEmail || request.id : request.requesterId,
            full_name: isRequester ? request.receiverName || request.receiverEmail : request.requesterName,
            username: isRequester ? request.receiverUsername : request.requesterUsername,
            email: isRequester ? request.receiverEmail : request.requesterEmail,
          },
        }
      })
  }

  if (loading) return <LoadingScreen />

  if (!profile) {
    return (
      <div className="py-20 text-center">
        <p className="text-[#1d1d1f] font-semibold">{error || 'Profile not found.'}</p>
        <Link to="/people" className="inline-flex mt-4 text-[#4f46e5] font-semibold hover:underline">
          Browse people
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20">
      <Link
        to={`/profile/${profile.username}`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-[#1d1d1f] hover:text-[#1d1d1f]"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to profile
      </Link>

      <div className="bg-white border border-black/5 rounded-xl p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-[#4f46e5] uppercase tracking-wide">Connections</p>
            <h1 className="text-3xl font-extrabold text-[#1d1d1f] mt-1">
              {profile.full_name}'s connections
            </h1>
            <p className="text-[#1d1d1f] font-bold mt-2">
              {connections.length} accepted {connections.length === 1 ? 'connection' : 'connections'}
            </p>
          </div>
          <div className="w-14 h-14 rounded-xl bg-[#af52de] text-[#4f46e5] flex items-center justify-center">
            <Users className="w-7 h-7" />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-amber-50 border border-black/5 text-amber-800 rounded-xl px-5 py-4 font-semibold">
          {error}
        </div>
      )}

      {connections.length === 0 ? (
        <div className="bg-white border border-dashed border-black rounded-xl p-10 text-center">
          <Users className="w-10 h-10 text-[#1d1d1f] mx-auto mb-3" />
          <p className="text-[#1d1d1f] font-semibold">No accepted connections to show yet.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {connections.map((connection) => (
            <ConnectionCard key={connection.id} connection={connection} />
          ))}
        </div>
      )}
    </div>
  )
}

function ConnectionCard({ connection }: { connection: DisplayConnection }) {
  const profile = connection.profile
  const href = profile.username ? `/profile/${profile.username}` : undefined
  const subtitle = profile.role === 'professor'
    ? profile.department || profile.school_name || 'Professor'
    : profile.academic_year || profile.school_name || 'Student'

  const content = (
    <div className="bg-white border border-black/5 rounded-xl p-5 shadow-xl hover:shadow-xl transition-all flex items-center gap-4">
      <ProfileAvatar
        profile={profile}
        name={profile.full_name}
        className="w-16 h-16 rounded-xl bg-[#ff3b30] text-white font-semibold text-2xl shadow-xl shrink-0"
      />
      <div className="min-w-0">
        <h2 className="font-extrabold text-[#1d1d1f] truncate">{profile.full_name || 'Unknown Profile'}</h2>
        <p className="text-sm text-[#1d1d1f] font-semibold truncate">@{profile.username || 'profile'}</p>
        <p className="text-sm text-[#1d1d1f] mt-2 flex items-center gap-2">
          {profile.role === 'professor' ? <Building2 className="w-4 h-4" /> : <GraduationCap className="w-4 h-4" />}
          <span className="truncate">{subtitle}</span>
        </p>
      </div>
    </div>
  )

  if (!href) return content

  return (
    <Link to={href} className="block">
      {content}
    </Link>
  )
}
