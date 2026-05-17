import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen,
  Check,
  GraduationCap,
  Loader2,
  MapPin,
  Send,
  UserRoundCheck,
  Users,
  X,
} from 'lucide-react'
import { clsx } from 'clsx'
import { ProfileAvatar } from '@/components/ui/ProfileAvatar'
import { useAuthStore } from '@/store/useAuthStore'
import {
  fetchAcceptedConnections,
  fetchIncomingRequests,
  fetchProfilesByIds,
  fetchSentRequests,
  loadLocalConnectionRequests,
  updateConnectionStatus,
} from '@/lib/supabaseHelpers'

type Tab = 'connections' | 'received' | 'sent'

export default function Connections() {
  const { profile } = useAuthStore()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('connections')
  const [acceptedConnections, setAcceptedConnections] = useState<any[]>([])
  const [incomingRequests, setIncomingRequests] = useState<any[]>([])
  const [sentRequests, setSentRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    loadRequests()
  }, [profile?.id])

  const loadRequests = async () => {
    if (!profile?.id) return

    setLoading(true)
    const [accepted, incoming, sent] = await Promise.all([
      fetchAcceptedConnections(profile.id),
      fetchIncomingRequests(profile.id),
      fetchSentRequests(profile.id),
    ])
    const local = loadLocalConnectionRequests()
    const profileIds = [...accepted, ...incoming, ...sent].flatMap((request) => [
      request.requester_id,
      request.receiver_id,
    ])
    const relatedProfiles = await fetchProfilesByIds(profileIds)
    const profilesById = new Map(relatedProfiles.map((item: any) => [item.id, item]))
    const attachProfiles = (requests: any[]) => requests.map((request) => ({
      ...request,
      requester: request.requester || profilesById.get(request.requester_id),
      receiver: request.receiver || profilesById.get(request.receiver_id),
    }))
    const pendingOutgoing = (requests: any[]) => requests.filter((request) =>
      (request.requester_id === profile.id || request.requesterId === profile.id) && request.status === 'pending'
    )
    const pendingIncoming = (requests: any[]) => requests.filter((request) =>
      (request.receiver_id === profile.id || request.receiverId === profile.id || request.receiverUsername === profile.username) &&
      request.status === 'pending'
    )
    const acceptedForProfile = (requests: any[]) => requests.filter((request) =>
      (request.requester_id === profile.id ||
        request.receiver_id === profile.id ||
        request.requesterId === profile.id ||
        request.receiverId === profile.id ||
        request.receiverUsername === profile.username) &&
      request.status === 'accepted'
    )

    setAcceptedConnections(
      accepted.length > 0
        ? attachProfiles(accepted)
        : acceptedForProfile(local)
    )

    setIncomingRequests(
      incoming.length > 0
        ? pendingIncoming(attachProfiles(incoming))
        : pendingIncoming(local)
    )
    setSentRequests(
      sent.length > 0
        ? pendingOutgoing(attachProfiles(sent))
        : pendingOutgoing(local)
    )
    setLoading(false)
  }

  const handleUpdateStatus = async (connectionId: string, status: 'accepted' | 'declined') => {
    setActionLoadingId(connectionId)
    const { error } = await updateConnectionStatus(connectionId, status)
    setActionLoadingId(null)

    if (error) {
      setMessage('Unable to update request: ' + error.message)
      return
    }

    setMessage(status === 'accepted' ? 'Connection accepted.' : 'Request declined.')
    await loadRequests()
  }

  if (!profile) {
    return <div className="py-20 text-center">Profile not found</div>
  }

  const tabs = [
    { id: 'connections' as const, label: 'Connections', icon: <Users className="w-4 h-4" />, count: acceptedConnections.length },
    { id: 'received' as const, label: 'Requests Received', icon: <UserRoundCheck className="w-4 h-4" />, count: incomingRequests.length },
    { id: 'sent' as const, label: 'Pending Requests', icon: <Send className="w-4 h-4" />, count: sentRequests.length },
  ]

  const visibleRequests = activeTab === 'connections'
    ? acceptedConnections
    : activeTab === 'received'
      ? incomingRequests
      : sentRequests

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-bold text-black">Connections</h1>
        <p className="text-slate-900 mt-1 font-medium">Manage your network requests and accepted connections.</p>
      </div>

      {message && (
        <div className="rounded-none border-4 border-brand-200 shadow-lg bg-white px-5 py-4 text-black shadow-sm">
          {message}
        </div>
      )}

      <div className="flex flex-wrap bg-card p-1.5 rounded-none border-4 border-brand-200 shadow-lg shadow-sm w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              'px-5 py-2 rounded-none font-bold text-sm transition-all flex items-center gap-2',
              activeTab === tab.id ? 'gradient-brand text-white shadow-md' : 'text-slate-900 hover:text-black'
            )}
          >
            {tab.icon}
            {tab.label}
            <span className={clsx(
              'px-2 py-0.5 rounded-none text-xs',
              activeTab === tab.id ? 'bg-card/20 text-white' : 'bg-white text-slate-900'
            )}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      <RequestList
        currentProfileId={profile.id}
        mode={activeTab}
        requests={visibleRequests}
        loading={loading}
        actionLoadingId={actionLoadingId}
        onUpdateStatus={handleUpdateStatus}
        onOpenProfile={(username) => navigate(`/profile/${username}`)}
      />
    </div>
  )
}

function RequestList({
  currentProfileId,
  mode,
  requests,
  loading,
  actionLoadingId,
  onUpdateStatus,
  onOpenProfile,
}: {
  currentProfileId: string
  mode: Tab
  requests: any[]
  loading: boolean
  actionLoadingId: string | null
  onUpdateStatus: (connectionId: string, status: 'accepted' | 'declined') => void
  onOpenProfile: (username: string) => void
}) {
  if (loading) {
    return (
      <div className="rounded-none border-4 border-brand-200 shadow-lg bg-card shadow-sm p-8 text-center">
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-900" />
      </div>
    )
  }

  if (requests.length === 0) {
    return (
      <div className="rounded-none border-4 border-brand-200 shadow-lg bg-card shadow-sm p-10 text-center">
        <div className="w-16 h-16 gradient-soft rounded-none flex items-center justify-center text-brand-300 mx-auto mb-5">
          <Users className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-black">Nothing here yet</h3>
        <p className="text-slate-900 mt-2">
          {mode === 'connections'
            ? 'Accepted connections will appear here.'
            : mode === 'received'
              ? 'Incoming requests will appear here.'
              : 'Outgoing requests awaiting a response will appear here.'}
        </p>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-none border-4 border-brand-200 shadow-lg shadow-sm p-8">
      <div className="space-y-4">
        {requests.map((request: any) => {
          const isSentByCurrentUser = request.requester_id === currentProfileId || request.requesterId === currentProfileId
          const otherProfile = isSentByCurrentUser ? request.receiver : request.requester
          const fallbackName = isSentByCurrentUser ? request.receiverName : request.requesterName
          const fallbackEmail = isSentByCurrentUser ? request.receiverEmail : request.requesterEmail
          const fallbackUsername = isSentByCurrentUser ? request.receiverUsername : request.requesterUsername
          const name = otherProfile?.full_name || fallbackName || 'Unknown'
          const email = otherProfile?.email || fallbackEmail || 'No email'
          const username = otherProfile?.username || fallbackUsername
          const role = otherProfile?.role
          const school = otherProfile?.school_name
          const summary = otherProfile?.bio || (role === 'professor' ? otherProfile?.department : otherProfile?.academic_year)
          const createdAt = request.created_at || request.requestedAt
          const canOpenProfile = Boolean(username)
          const displayProfile = otherProfile || {
            full_name: fallbackName,
            username: fallbackUsername,
            email: fallbackEmail,
          }

          return (
            <div
              key={request.id}
              onClick={() => {
                if (username) onOpenProfile(username)
              }}
              onKeyDown={(event) => {
                if (!username) return
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onOpenProfile(username)
                }
              }}
              role={canOpenProfile ? 'button' : undefined}
              tabIndex={canOpenProfile ? 0 : undefined}
              className={clsx(
                'flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-none border-4 border-brand-200 shadow-lg bg-white group hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-brand-500',
                canOpenProfile && 'cursor-pointer'
              )}
            >
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <ProfileAvatar profile={displayProfile} name={name} className="w-14 h-14 rounded-none gradient-brand text-white font-bold text-xl shadow-sm" />
                  {role && (
                    <div className={clsx(
                      'absolute -bottom-1 -right-1 w-7 h-7 rounded-none border-4 border-brand-200 shadow-lg flex items-center justify-center shadow-sm',
                      role === 'professor' ? 'bg-accent-500 text-white' : 'bg-white0 text-white'
                    )}>
                      {role === 'professor' ? <GraduationCap className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-bold text-black group-hover:text-accent-600 transition-colors">{name}</p>
                  <p className="text-xs font-bold text-brand-400 uppercase tracking-widest">
                    {role || 'Profile'} - {request.status}
                  </p>
                  <p className="text-sm text-black mt-1">
                    {email} - {createdAt ? new Date(createdAt).toLocaleDateString() : 'No date'}
                  </p>
                  {(school || summary) && (
                    <p className="text-sm text-slate-900 mt-1 flex items-center gap-1">
                      {school && <><MapPin className="w-3.5 h-3.5 text-brand-300" /> {school}</>}
                      {school && summary ? ' - ' : ''}
                      {summary}
                    </p>
                  )}
                  {!canOpenProfile && (
                    <p className="text-xs text-brand-400 mt-1">Profile details are unavailable for this request.</p>
                  )}
                </div>
              </div>
              {mode === 'received' && request.status === 'pending' && request.created_at && (
                <div className="flex gap-2" onClick={(event) => event.stopPropagation()}>
                  <button
                    onClick={(event) => {
                      event.stopPropagation()
                      onUpdateStatus(request.id, 'accepted')
                    }}
                    disabled={actionLoadingId === request.id}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-none font-bold text-sm transition-all disabled:opacity-50"
                  >
                    {actionLoadingId === request.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={(event) => {
                      event.stopPropagation()
                      onUpdateStatus(request.id, 'declined')
                    }}
                    disabled={actionLoadingId === request.id}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-none font-bold text-sm transition-all disabled:opacity-50"
                  >
                    {actionLoadingId === request.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
