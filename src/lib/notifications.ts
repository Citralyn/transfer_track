import { supabase, isSupabaseConfigured } from '@/lib/supabase'

const SEEN_NOTIFICATIONS_KEY = 'transfer-track-seen-notifications'

export type AppNotification = {
  id: string
  type: 'message' | 'reaction' | 'connection_request' | 'connection_accepted'
  actorName: string
  text: string
  createdAt?: string | null
  href: string
}

export async function fetchNotifications(profileId: string): Promise<AppNotification[]> {
  if (!profileId || !isSupabaseConfigured()) return []

  const [messages, reactions, requests, acceptedConnections] = await Promise.all([
    fetchMessageNotifications(profileId),
    fetchReactionNotifications(profileId),
    fetchConnectionRequestNotifications(profileId),
    fetchAcceptedConnectionNotifications(profileId),
  ])

  return [...messages, ...reactions, ...requests, ...acceptedConnections]
    .sort((a, b) => getTimeValue(b.createdAt) - getTimeValue(a.createdAt))
    .slice(0, 20)
}

export function loadSeenNotificationIds(profileId: string) {
  try {
    const raw = window.localStorage.getItem(getSeenKey(profileId))
    return new Set(raw ? JSON.parse(raw) as string[] : [])
  } catch {
    return new Set<string>()
  }
}

export function saveSeenNotificationIds(profileId: string, ids: string[]) {
  const existing = loadSeenNotificationIds(profileId)
  ids.forEach((id) => existing.add(id))
  window.localStorage.setItem(getSeenKey(profileId), JSON.stringify(Array.from(existing)))
}

async function fetchMessageNotifications(profileId: string): Promise<AppNotification[]> {
  const { data: participants, error: participantsError } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', profileId)

  if (participantsError || !participants?.length) return []

  const conversationIds = participants.map((item: any) => item.conversation_id)
  const { data, error } = await supabase
    .from('messages')
    .select(`
      id,
      conversation_id,
      sender_id,
      content,
      created_at,
      profiles:sender_id (
        full_name,
        username
      )
    `)
    .in('conversation_id', conversationIds)
    .neq('sender_id', profileId)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error || !data) return []

  return data.map((message: any) => {
    const actorName = message.profiles?.full_name || 'Someone'
    return {
      id: `message:${message.id}`,
      type: 'message',
      actorName,
      text: `${actorName} sent you a message.`,
      createdAt: message.created_at,
      href: `/messages/${message.conversation_id}`,
    }
  })
}

async function fetchReactionNotifications(profileId: string): Promise<AppNotification[]> {
  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select('id, content')
    .eq('user_id', profileId)

  if (postsError || !posts?.length) return []

  const postsById = new Map(posts.map((post: any) => [post.id, post]))
  const { data, error } = await supabase
    .from('post_likes')
    .select(`
      id,
      post_id,
      user_id,
      created_at,
      profiles:user_id (
        full_name,
        username
      )
    `)
    .in('post_id', Array.from(postsById.keys()))
    .neq('user_id', profileId)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error || !data) return []

  return data.map((like: any) => {
    const actorName = like.profiles?.full_name || 'Someone'
    return {
      id: `reaction:${like.id}`,
      type: 'reaction',
      actorName,
      text: `${actorName} liked your post.`,
      createdAt: like.created_at,
      href: '/feed',
    }
  })
}

async function fetchConnectionRequestNotifications(profileId: string): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from('connections')
    .select(`
      id,
      requester_id,
      created_at,
      profiles:requester_id (
        full_name,
        username
      )
    `)
    .eq('receiver_id', profileId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error || !data) return []

  return data.map((connection: any) => {
    const actorName = connection.profiles?.full_name || 'Someone'
    return {
      id: `connection-request:${connection.id}`,
      type: 'connection_request',
      actorName,
      text: `${actorName} sent you a connection request.`,
      createdAt: connection.created_at,
      href: '/connections',
    }
  })
}

async function fetchAcceptedConnectionNotifications(profileId: string): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from('connections')
    .select(`
      id,
      receiver_id,
      updated_at,
      created_at,
      profiles:receiver_id (
        full_name,
        username
      )
    `)
    .eq('requester_id', profileId)
    .eq('status', 'accepted')
    .order('updated_at', { ascending: false })
    .limit(10)

  if (error || !data) return []

  return data.map((connection: any) => {
    const actorName = connection.profiles?.full_name || 'Someone'
    return {
      id: `connection-accepted:${connection.id}`,
      type: 'connection_accepted',
      actorName,
      text: `${actorName} accepted your connection request.`,
      createdAt: connection.updated_at || connection.created_at,
      href: '/connections',
    }
  })
}

function getSeenKey(profileId: string) {
  return `${SEEN_NOTIFICATIONS_KEY}-${profileId}`
}

function getTimeValue(value?: string | null) {
  return value ? new Date(value).getTime() : 0
}
