import { supabase, isSupabaseConfigured } from './supabase'
import { withTimeout, isUuid } from './supabaseHelpers'

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
}

export interface Conversation {
  id: string
  created_at: string
  participants: {
    user_id: string
    profiles: {
      full_name: string
      username: string
      avatar_url: string | null
      role: string
    }
  }[]
  last_message?: Message
  messageCount?: number
}

/**
 * Get or create a conversation between two users
 */
export async function getOrCreateConversation(currentUserId: string, otherUserId: string) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured.')
  }

  // VALIDATION: Messaging requires real Supabase Auth IDs (UUIDs)
  if (!isUuid(currentUserId) || !isUuid(otherUserId)) {
    throw new Error('Messaging is only available for accounts with live database IDs. Please sign up with a real email.')
  }

  try {
    // 1. Check if a conversation already exists between these two users
    const { data: existingConvs, error: findError } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', currentUserId)

    if (findError) throw findError

    if (existingConvs && existingConvs.length > 0) {
      const convIds = existingConvs.map(c => c.conversation_id)
      
      const { data: commonConvs, error: commonError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .in('conversation_id', convIds)
        .eq('user_id', otherUserId)
        .maybeSingle()

      if (commonError) throw commonError
      if (commonConvs) return commonConvs.conversation_id
    }

    // 2. Create new conversation if none exists
    const { data: newConv, error: createError } = await supabase
      .from('conversations')
      .insert([{}]) // Using array syntax is often more reliable for blank inserts
      .select()
      .single()

    if (createError) {
      console.error('Error creating conversation record:', createError)
      throw createError
    }

    // 3. Add participants
    const { error: partError } = await supabase
      .from('conversation_participants')
      .insert([
        { conversation_id: newConv.id, user_id: currentUserId },
        { conversation_id: newConv.id, user_id: otherUserId }
      ])

    if (partError) throw partError

    return newConv.id
  } catch (err) {
    console.error('Messaging System Error:', err)
    throw err
  }
}

/**
 * Fetch all conversations for a user
 */
export async function fetchConversations(userId: string) {
  if (!isSupabaseConfigured()) return []

  const { data, error } = await supabase
    .from('conversation_participants')
    .select(`
      conversation_id,
      conversations (
        id,
        created_at,
        conversation_participants (
          user_id,
          profiles (
            full_name,
            username,
            avatar_url,
            role
          )
        ),
        messages (
          id
        )
      )
    `)
    .eq('user_id', userId)

  if (error) {
    console.error('Error fetching conversations:', error)
    return []
  }

  return data.map((item: any) => {
    const conv = item.conversations
    return {
      id: conv.id,
      created_at: conv.created_at,
      participants: conv.conversation_participants.filter((p: any) => p.user_id !== userId),
      messageCount: conv.messages?.length || 0
    }
  })
}

/**
 * Fetch messages for a conversation
 */
export async function fetchMessages(conversationId: string) {
  if (!isSupabaseConfigured()) return []

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching messages:', error)
    return []
  }

  return data
}

/**
 * Send a message
 */
export async function sendMessage(conversationId: string, senderId: string, content: string) {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('messages')
    .insert([
      { conversation_id: conversationId, sender_id: senderId, content }
    ])
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Subscribe to new messages in a conversation
 */
export function subscribeToMessages(conversationId: string, onMessage: (message: Message) => void) {
  return supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      (payload) => {
        onMessage(payload.new as Message)
      }
    )
    .subscribe()
}
