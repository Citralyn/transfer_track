import { useEffect, useState } from 'react'
import {
  Check,
  Loader2,
  Send,
  UserRoundCheck,
  Users,
  X,
} from 'lucide-react'
import { clsx } from 'clsx'
import { useAuthStore } from '@/store/useAuthStore'
import {
  fetchIncomingRequests,
  fetchSentRequests,
  loadLocalConnectionRequests,
  updateConnectionStatus,
} from '@/lib/supabaseHelpers'

type Tab = 'connections' | 'received' | 'sent'

export default function Connections() {
  const { profile } = useAuthStore()
  const [activeTab, setActiveTab] = useState<Tab>('connections')
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
    const [incoming, sent] = await Promise.all([
      fetchIncomingRequests(profile.id),
      fetchSentRequests(profile.id),
    ])
    const local = loadLocalConnectionRequests()

    setIncomingRequests(
      incoming.length > 0
        ? incoming
        : local.filter((request) => request.receiverId === profile.id || request.receiverUsername === profile.username)
    )
    setSentRequests(
      sent.length > 0
        ? sent
        : local.filter((request) => request.requesterId === profile.id)
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

  const acceptedConnections = [...incomingRequests, ...sentRequests].filter((request) => request.status === 'accepted')
  const tabs = [
    { id: 'connections' as const, label: 'Connections', icon: <Users className="w-4 h-4" />, count: acceptedConnections.length },
    { id: 'received' as const, label: 'Requests Received', icon: <UserRoundCheck className="w-4 h-4" />, count: incomingRequests.length },
    { id: 'sent' as const, label: 'Requests Sent', icon: <Send className="w-4 h-4" />, count: sentRequests.length },
  ]

  const visibleRequests = activeTab === 'connections'
    ? acceptedConnections
    : activeTab === 'received'
      ? incomingRequests
      : sentRequests

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-bold text-brand-900">Connections</h1>
        <p className="text-brand-500 mt-1 font-medium">Manage your network requests and accepted connections.</p>
      </div>

      {message && (
        <div className="rounded-3xl border border-brand-100 bg-brand-50 px-5 py-4 text-brand-700 shadow-sm">
          {message}
        </div>
      )}

      <div className="flex flex-wrap bg-white p-1.5 rounded-2xl border border-brand-100 shadow-sm w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              'px-5 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2',
              activeTab === tab.id ? 'gradient-brand text-white shadow-md' : 'text-brand-500 hover:text-brand-800'
            )}
          >
            {tab.icon}
            {tab.label}
            <span className={clsx(
              'px-2 py-0.5 rounded-full text-xs',
              activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-brand-50 text-brand-500'
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
}: {
  currentProfileId: string
  mode: Tab
  requests: any[]
  loading: boolean
  actionLoadingId: string | null
  onUpdateStatus: (connectionId: string, status: 'accepted' | 'declined') => void
}) {
  if (loading) {
    return (
      <div className="rounded-3xl border border-brand-100 bg-white shadow-sm p-8 text-center">
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-500" />
      </div>
    )
  }

  if (requests.length === 0) {
    return (
      <div className="rounded-[2.5rem] border border-brand-100 bg-white shadow-sm p-10 text-center">
        <div className="w-16 h-16 gradient-soft rounded-3xl flex items-center justify-center text-brand-300 mx-auto mb-5">
          <Users className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-brand-900">Nothing here yet</h3>
        <p className="text-brand-500 mt-2">
          {mode === 'connections'
            ? 'Accepted connections will appear here.'
            : mode === 'received'
              ? 'Incoming requests will appear here.'
              : 'Requests you send will appear here.'}
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-[2.5rem] border border-brand-100 shadow-sm p-8">
      <div className="space-y-4">
        {requests.map((request: any) => {
          const isSentByCurrentUser = request.requester_id === currentProfileId || request.requesterId === currentProfileId
          const otherProfile = isSentByCurrentUser ? request.receiver : request.requester
          const name = otherProfile?.full_name || (isSentByCurrentUser ? request.receiverName : request.requesterName) || 'Unknown'
          const email = otherProfile?.email || (isSentByCurrentUser ? request.receiverEmail : request.requesterEmail) || 'No email'
          const createdAt = request.created_at || request.requestedAt

          return (
            <div
              key={request.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-brand-100 bg-brand-50 group hover:shadow-md transition-all"
            >
              <div>
                <p className="font-bold text-brand-900">{name}</p>
                <p className="text-sm text-brand-600">
                  {email} - {request.status} - {createdAt ? new Date(createdAt).toLocaleDateString() : 'No date'}
                </p>
              </div>
              {mode === 'received' && request.status === 'pending' && request.created_at && (
                <div className="flex gap-2">
                  <button
                    onClick={() => onUpdateStatus(request.id, 'accepted')}
                    disabled={actionLoadingId === request.id}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl font-bold text-sm transition-all"
                  >
                    {actionLoadingId === request.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => onUpdateStatus(request.id, 'declined')}
                    disabled={actionLoadingId === request.id}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-bold text-sm transition-all"
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
