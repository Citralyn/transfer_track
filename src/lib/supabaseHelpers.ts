import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export const DEMO_PASSWORD = 'transfer-track-demo-password'
export const LOCAL_PROFILE_KEY = 'transfer-track-demo-profile'
export const LOCAL_USER_KEY = 'transfer-track-demo-auth-user'
const LOCAL_CONNECTION_REQUESTS_KEY = 'transfer-track-demo-connection-requests'
const SUPABASE_TIMEOUT_MS = 4000

export type Role = 'student' | 'professor'

export interface ProfilePayload {
  id: string
  role: Role
  full_name: string
  username: string
  email: string
  school_name?: string | null
  school_type?: string | null
  academic_year?: string | null
  department?: string | null
  bio?: string | null
  avatar_url?: string | null
  transfer_goals?: string | null
  research_areas?: string[] | null
  interests?: string[] | null
  skills?: string[] | null
  gender?: string | null
}

export interface LocalConnectionRequest {
  id: string
  requesterId: string
  requesterEmail: string
  requesterName: string
  requesterUsername?: string
  receiverId?: string
  receiverEmail?: string
  receiverName?: string
  receiverUsername?: string
  requestedAt: string
  status: 'pending' | 'accepted' | 'declined' | 'canceled'
  message: string
}

export interface ConnectionResult {
  success: boolean
  duplicate?: boolean
  fallback?: boolean
  message: string
  connection?: any
}

export type RelationshipStatus = 'none' | 'pending_outgoing' | 'pending_incoming' | 'connected' | 'declined'

export interface AuthBridgeInput {
  email: string
  password?: string
  name?: string
  role?: Role
  mode?: 'login' | 'signup'
}

export interface LocalAuthUser {
  id: string
  email: string
}

export const FALLBACK_SCHOOLS = [
  { id: 'fallback-smc', name: 'Santa Monica College', type: 'community_college' },
  { id: 'fallback-de-anza', name: 'De Anza College', type: 'community_college' },
  { id: 'fallback-occ', name: 'Orange Coast College', type: 'community_college' },
  { id: 'fallback-pcc', name: 'Pasadena City College', type: 'community_college' },
  { id: 'fallback-dvc', name: 'Diablo Valley College', type: 'community_college' },
  { id: 'fallback-uci', name: 'UC Irvine', type: 'university' },
  { id: 'fallback-ucla', name: 'UCLA', type: 'university' },
  { id: 'fallback-ucb', name: 'UC Berkeley', type: 'university' },
  { id: 'fallback-ucsd', name: 'UC San Diego', type: 'university' },
  { id: 'fallback-ucd', name: 'UC Davis', type: 'university' },
]

export async function withTimeout<T>(promise: PromiseLike<T>, label: string, timeoutMs = SUPABASE_TIMEOUT_MS): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${label} timed out`)), timeoutMs)
  })

  try {
    return await Promise.race([promise, timeout])
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }
}

export async function signInOrSignUpDemo(input: string | AuthBridgeInput) {
  const payload = typeof input === 'string' ? { email: input } : input
  const email = payload.email.trim().toLowerCase()
  const password = payload.password || DEMO_PASSWORD
  const mode = payload.mode || 'signup'

  if (!email) {
    return { data: null, error: new Error('Email is required for demo login.') }
  }

  if (!isSupabaseConfigured()) {
    return { data: makeLocalAuthData(email), error: null, fallback: true }
  }

  try {
    if (mode === 'signup') {
      const signUpResponse = await withTimeout(
        supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: payload.name,
              role: payload.role,
            },
          },
        }),
        'Supabase sign-up'
      )

      if (signUpResponse.data?.user) {
        return { data: signUpResponse.data, error: null }
      }

      return { data: null, error: signUpResponse.error || new Error('Unable to create account.') }
    }

    const signInResponse = await withTimeout(
      supabase.auth.signInWithPassword({ email, password }),
      'Supabase sign-in'
    )

    if (signInResponse.data?.user) {
      return { data: signInResponse.data, error: null }
    }

    return { data: null, error: signInResponse.error || new Error('Unable to sign in.') }
  } catch (error) {
    console.warn('Supabase auth unavailable:', error)
    return { data: null, error: error instanceof Error ? error : new Error('Supabase auth is unavailable.') }
  }
}

export async function upsertProfile(profile: ProfilePayload) {
  const normalizedProfile = {
    id: profile.id,
    role: profile.role,
    full_name: profile.full_name,
    username: profile.username || makeUsername(profile.email, profile.full_name),
    email: profile.email,
    school_name: profile.school_name || null,
    school_type: profile.school_type || null,
    academic_year: profile.academic_year || null,
    department: profile.department || null,
    research_areas: profile.research_areas || null,
    interests: profile.interests || null,
    skills: profile.skills || null,
    transfer_goals: profile.transfer_goals || null,
    bio: profile.bio || null,
    avatar_url: profile.avatar_url || null,
    gender: profile.gender || null,
  }

  if (!isSupabaseConfigured()) {
    saveLocalProfile(normalizedProfile)
    return { data: normalizedProfile, error: null, fallback: true }
  }

  try {
    const { data, error } = await withTimeout(
      supabase
        .from('profiles')
        .upsert([normalizedProfile], { onConflict: 'id' })
        .select()
        .single(),
      'Supabase profile upsert'
    )

    if (error) {
      console.warn('Supabase profile upsert failed:', error.message)
      return { data: null, error }
    }

    return { data: data || normalizedProfile, error: null }
  } catch (error) {
    console.warn('Supabase profile upsert unavailable:', error)
    return { data: null, error: error instanceof Error ? error : new Error('Profile save failed.') }
  }
}

export async function findProfileIdByEmailOrName(payload: {
  email?: string
  full_name?: string
  username?: string
}) {
  if (!isSupabaseConfigured()) return null

  if (payload.email) {
    const { data } = await withTimeout(
      supabase
        .from('profiles')
        .select('id')
        .eq('email', payload.email)
        .maybeSingle(),
      'Supabase professor email lookup'
    )
    if (isUuid(data?.id)) return data?.id ?? null
  }

  if (payload.username) {
    const { data } = await withTimeout(
      supabase
        .from('profiles')
        .select('id')
        .eq('username', payload.username)
        .maybeSingle(),
      'Supabase professor username lookup'
    )
    if (isUuid(data?.id)) return data?.id ?? null
  }

  if (payload.full_name) {
    const { data } = await withTimeout(
      supabase
        .from('profiles')
        .select('id')
        .eq('full_name', payload.full_name)
        .maybeSingle(),
      'Supabase professor name lookup'
    )
    if (isUuid(data?.id)) return data?.id ?? null
  }

  return null
}

export async function sendConnectionRequest(
  requester: { id: string; email?: string; full_name?: string; username?: string; role?: Role },
  target: { id?: string; email?: string; full_name?: string; username?: string }
) {
  const requesterId = requester.id

  if (!requesterId) {
    return { success: false, message: 'Missing requester id.' }
  }

  if (
    target.id === requesterId ||
    (requester.email && target.email && requester.email.toLowerCase() === target.email.toLowerCase()) ||
    (requester.username && target.username && requester.username.toLowerCase() === target.username.toLowerCase())
  ) {
    return { success: false, message: 'You cannot request a connection with yourself.' }
  }

  const requestPayload: LocalConnectionRequest = {
    id: `${requesterId}-${target.id || target.email || target.username}-${Date.now()}`,
    requesterId,
    requesterEmail: requester.email ?? 'unknown',
    requesterName: requester.full_name ?? requester.username ?? 'User',
    requesterUsername: requester.username,
    receiverId: target.id,
    receiverEmail: target.email,
    receiverName: target.full_name,
    receiverUsername: target.username,
    requestedAt: new Date().toISOString(),
    status: 'pending',
    message: 'Request saved locally while Supabase is unavailable.',
  }

  if (!isSupabaseConfigured()) {
    saveLocalConnectionRequest(requestPayload)
    return {
      success: false,
      fallback: true,
      message: 'Demo request saved locally. Supabase is not configured.',
    }
  }

  try {
    const { data: authData } = await withTimeout(supabase.auth.getUser(), 'Supabase user lookup')
    if (!authData.user || authData.user.id !== requesterId || !isUuid(requesterId)) {
      saveLocalConnectionRequest(requestPayload)
      return {
        success: false,
        fallback: true,
        message: 'Demo request saved locally. Supabase sign-in is not active for this user.',
      }
    }

    let receiverId = isUuid(target.id) ? target.id : undefined

    if (!receiverId) {
      receiverId = await findProfileIdByEmailOrName(target)
    }

    if (!receiverId) {
      saveLocalConnectionRequest(requestPayload)
      return {
        success: false,
        fallback: true,
        message: 'Demo request saved locally. This person has not joined the live database yet.',
      }
    }

    if (receiverId === requesterId) {
      return { success: false, message: 'You cannot request a connection with yourself.' }
    }

    const existingConnection = await getExistingConnection(requesterId, receiverId)
    const existingStatus = getRelationshipStatusFromConnection(existingConnection, requesterId)
    if (existingStatus === 'connected') {
      return { success: true, duplicate: true, message: 'Already connected.', connection: existingConnection }
    }
    if (existingStatus === 'pending_outgoing') {
      return { success: true, duplicate: true, message: 'Request Sent.', connection: existingConnection }
    }
    if (existingStatus === 'pending_incoming') {
      return { success: false, duplicate: true, message: 'This person already sent you a request.' }
    }
    if (existingStatus === 'declined') {
      const { data, error } = await withTimeout(
        supabase
          .from('connections')
          .update({
            requester_id: requesterId,
            receiver_id: receiverId,
            status: 'pending',
          })
          .eq('id', existingConnection.id)
          .select()
          .single(),
        'Supabase connection retry'
      )

      if (!error) {
        saveLocalConnectionRequest({ ...requestPayload, id: data.id || requestPayload.id })
        return { success: true, message: 'Request Sent.', connection: data }
      }
    }

    const { data, error } = await withTimeout(
      supabase
        .from('connections')
        .insert([
          {
            requester_id: requesterId,
            receiver_id: receiverId,
            status: 'pending',
          },
        ])
        .select()
        .single(),
      'Supabase connection insert'
    )

    if (error) {
      const message = error.message || 'Unable to send connection request.'
      const duplicate = error.code === '23505' || message.toLowerCase().includes('duplicate')
      if (duplicate) {
        const relationship = await getRelationshipStatus(requesterId, receiverId)
        if (relationship !== 'connected') saveLocalConnectionRequest(requestPayload)
        return {
          success: true,
          duplicate: true,
          message: relationship === 'connected' ? 'Already connected.' : 'Request Sent.',
          connection: data,
        }
      }

      console.warn('Supabase connection insert failed, saving locally:', message)
      saveLocalConnectionRequest(requestPayload)
      return {
        success: false,
        fallback: true,
        message: 'Demo request saved locally. Live connection could not be saved right now.',
      }
    }

    saveLocalConnectionRequest({ ...requestPayload, id: data.id || requestPayload.id })
    return { success: true, message: 'Request Sent.', connection: data }
  } catch (error) {
    console.warn('Supabase connection flow unavailable, saving locally:', error)
    saveLocalConnectionRequest(requestPayload)
    return {
      success: false,
      fallback: true,
      message: 'Demo request saved locally. Live connection could not be saved right now.',
    }
  }
}

export async function getExistingConnection(requesterId: string, receiverId: string) {
  if (!isSupabaseConfigured()) return null

  try {
    const { data, error } = await withTimeout(
      supabase
        .from('connections')
        .select('*')
        .or(`and(requester_id.eq.${requesterId},receiver_id.eq.${receiverId}),and(requester_id.eq.${receiverId},receiver_id.eq.${requesterId})`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      'Supabase existing connection lookup'
    )

    if (error) return null
    return data
  } catch (error) {
    console.warn('Existing connection lookup failed:', error)
    return null
  }
}

export async function uploadProfileImage(profileId: string, image: File) {
  if (!isSupabaseConfigured()) {
    return readFileAsDataUrl(image)
  }

  const fileExt = image.name.split('.').pop() || 'jpg'
  const fileName = `avatars/${profileId}-${Date.now()}.${fileExt}`
  const { data, error } = await supabase.storage
    .from('post_images')
    .upload(fileName, image)

  if (error) throw error

  const { data: { publicUrl } } = supabase.storage
    .from('post_images')
    .getPublicUrl(data.path)

  return publicUrl
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error || new Error('Unable to read image file.'))
    reader.readAsDataURL(file)
  })
}

export async function getRelationshipStatus(currentProfileId: string, otherProfileId: string): Promise<RelationshipStatus> {
  if (!currentProfileId || !otherProfileId || currentProfileId === otherProfileId) return 'none'

  const localStatus = getLocalRelationshipStatus(currentProfileId, otherProfileId)

  if (!isSupabaseConfigured()) return localStatus

  const connection = await getExistingConnection(currentProfileId, otherProfileId)
  const liveStatus = getRelationshipStatusFromConnection(connection, currentProfileId)
  return liveStatus === 'none' ? localStatus : liveStatus
}

export async function getRelationshipStatusMap(currentProfileId: string, otherProfileIds: string[]) {
  const uniqueIds = Array.from(new Set(otherProfileIds.filter((id) => id && id !== currentProfileId)))
  const statusMap: Record<string, RelationshipStatus> = {}

  uniqueIds.forEach((id) => {
    statusMap[id] = 'none'
  })

  if (!currentProfileId || uniqueIds.length === 0) return statusMap

  const applyLocalStatuses = () => {
    uniqueIds.forEach((id) => {
      const localStatus = getLocalRelationshipStatus(currentProfileId, id)
      if (localStatus !== 'none' && statusMap[id] === 'none') statusMap[id] = localStatus
    })
  }

  if (!isSupabaseConfigured()) {
    applyLocalStatuses()
    return statusMap
  }

  try {
    const { data, error } = await withTimeout(
      supabase
        .from('connections')
        .select('id, requester_id, receiver_id, status, created_at')
        .or(`requester_id.eq.${currentProfileId},receiver_id.eq.${currentProfileId}`)
        .order('created_at', { ascending: false }),
      'Supabase relationship status map'
    )

    if (error || !data) return statusMap

    data.forEach((connection: any) => {
      const otherId = connection.requester_id === currentProfileId ? connection.receiver_id : connection.requester_id
      if (!uniqueIds.includes(otherId) || statusMap[otherId] !== 'none') return
      statusMap[otherId] = getRelationshipStatusFromConnection(connection, currentProfileId)
    })
  } catch (error) {
    console.warn('Relationship status map lookup failed:', error)
  }

  applyLocalStatuses()
  return statusMap
}

export async function getConnectionCount(profileId: string) {
  if (!isSupabaseConfigured()) return 0

  try {
    const { count, error } = await withTimeout(
      supabase
        .from('connections')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'accepted')
        .or(`requester_id.eq.${profileId},receiver_id.eq.${profileId}`),
      'Supabase connection count'
    )

    if (error) return 0
    return count ?? 0
  } catch (error) {
    console.warn('Connection count failed:', error)
    return 0
  }
}

export async function fetchIncomingRequests(professorId: string) {
  if (!isSupabaseConfigured()) return []

  try {
    const { data, error } = await withTimeout(
      supabase
        .from('connections')
        .select('id, requester_id, receiver_id, status, created_at')
        .eq('receiver_id', professorId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false }),
      'Supabase pending incoming requests'
    )

    if (error || !data) return []
    return data
  } catch (error) {
    console.warn('Pending incoming requests lookup failed:', error)
    return []
  }
}

export async function fetchSentRequests(requesterId: string) {
  if (!isSupabaseConfigured()) return []

  try {
    const { data, error } = await withTimeout(
      supabase
        .from('connections')
        .select('id, requester_id, receiver_id, status, created_at')
        .eq('requester_id', requesterId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false }),
      'Supabase pending outgoing requests'
    )

    if (error || !data) return []
    return data
  } catch (error) {
    console.warn('Pending outgoing requests lookup failed:', error)
    return []
  }
}

export async function fetchAcceptedConnections(profileId: string) {
  if (!isSupabaseConfigured()) return []

  try {
    const { data, error } = await withTimeout(
      supabase
        .from('connections')
        .select('id, requester_id, receiver_id, status, created_at')
        .eq('status', 'accepted')
        .or(`requester_id.eq.${profileId},receiver_id.eq.${profileId}`)
        .order('created_at', { ascending: false }),
      'Supabase accepted connections'
    )

    if (error || !data) return []
    return data
  } catch (error) {
    console.warn('Accepted connections lookup failed:', error)
    return []
  }
}

export async function fetchProfilesByIds(profileIds: string[]) {
  const ids = Array.from(new Set(profileIds.filter(Boolean)))
  if (!isSupabaseConfigured() || ids.length === 0) return []

  try {
    const { data, error } = await withTimeout(
      supabase
        .from('profiles')
        .select('id, role, full_name, username, email, school_name, academic_year, department, bio')
        .in('id', ids),
      'Supabase connection profile lookup'
    )

    if (error || !data) return []
    return data
  } catch (error) {
    console.warn('Connection profile lookup failed:', error)
    return []
  }
}

export async function updateConnectionStatus(connectionId: string, status: 'accepted' | 'declined' | 'pending') {
  if (!isSupabaseConfigured()) {
    return { data: null, error: new Error('Supabase is not configured.') }
  }

  try {
    const { data, error } = await withTimeout(
      supabase
        .from('connections')
        .update({ status })
        .eq('id', connectionId)
        .select()
        .single(),
      'Supabase connection status update'
    )

    if (!error && data) updateLocalConnectionStatus(connectionId, status)
    return { data, error }
  } catch (error) {
    console.warn('Connection status update failed:', error)
    return { data: null, error: new Error('Live request update is unavailable right now.') }
  }
}

function getRelationshipStatusFromConnection(connection: any, currentProfileId: string): RelationshipStatus {
  if (!connection) return 'none'
  if (connection.status === 'accepted') return 'connected'
  if (connection.status === 'pending') {
    return connection.requester_id === currentProfileId ? 'pending_outgoing' : 'pending_incoming'
  }
  if (connection.status === 'declined' || connection.status === 'canceled') return 'declined'
  return 'none'
}

function getLocalRelationshipStatus(currentProfileId: string, otherProfileId: string): RelationshipStatus {
  const local = loadLocalConnectionRequests().find((request) =>
    (request.requesterId === currentProfileId && request.receiverId === otherProfileId) ||
    (request.requesterId === otherProfileId && request.receiverId === currentProfileId)
  )

  if (!local) return 'none'
  if (local.status === 'accepted') return 'connected'
  if (local.status === 'pending') {
    return local.requesterId === currentProfileId ? 'pending_outgoing' : 'pending_incoming'
  }
  if (local.status === 'declined' || local.status === 'canceled') return 'declined'
  return 'none'
}

export function saveLocalConnectionRequest(request: LocalConnectionRequest) {
  const current = loadLocalConnectionRequests()
  const existing = current.find((item) =>
    item.requesterId === request.requesterId &&
    (item.receiverId === request.receiverId ||
      item.receiverEmail === request.receiverEmail ||
      item.receiverUsername === request.receiverUsername)
  )
  const next = existing ? current : [...current, request]
  window.localStorage.setItem(LOCAL_CONNECTION_REQUESTS_KEY, JSON.stringify(next))
}

export function updateLocalConnectionStatus(connectionId: string, status: LocalConnectionRequest['status']) {
  const next = loadLocalConnectionRequests().map((request) =>
    request.id === connectionId ? { ...request, status } : request
  )
  window.localStorage.setItem(LOCAL_CONNECTION_REQUESTS_KEY, JSON.stringify(next))
}

export function loadLocalConnectionRequests(): LocalConnectionRequest[] {
  try {
    const raw = window.localStorage.getItem(LOCAL_CONNECTION_REQUESTS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as LocalConnectionRequest[]
  } catch {
    return []
  }
}

export function saveLocalProfile(profile: ProfilePayload) {
  window.localStorage.setItem(`${LOCAL_PROFILE_KEY}-${profile.id}`, JSON.stringify(profile))
  // Also keep a "current" pointer for App init
  window.localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(profile))
}

export function loadLocalProfile(id?: string): ProfilePayload | null {
  try {
    const key = id ? `${LOCAL_PROFILE_KEY}-${id}` : LOCAL_PROFILE_KEY
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) as ProfilePayload : null
  } catch {
    return null
  }
}

export function clearLocalAuth() {
  // We don't necessarily want to delete ALL saved profiles, 
  // just the current session indicators
  window.localStorage.removeItem(LOCAL_PROFILE_KEY)
  window.localStorage.removeItem(LOCAL_USER_KEY)
}

export function makeProfilePayload(input: {
  id: string
  role: Role
  full_name?: string
  username?: string
  email?: string
  school_name?: string | null
  school_type?: string | null
  academic_year?: string | null
  department?: string | null
  research_areas?: string[] | null
  interests?: string[] | null
  skills?: string[] | null
  transfer_goals?: string | null
  bio?: string | null
  avatar_url?: string | null
  gender?: string | null
}): ProfilePayload {
  const email = input.email || ''
  const fullName = input.full_name || nameFromEmail(email)

  return {
    id: input.id,
    role: input.role,
    full_name: fullName,
    username: input.username || makeUsername(email, fullName, input.id),
    email,
    school_name: input.school_name || null,
    school_type: input.school_type || (input.role === 'student' ? 'community_college' : null),
    academic_year: input.role === 'student' ? input.academic_year || null : null,
    department: input.department || null,
    research_areas: input.role === 'professor' ? input.research_areas || null : null,
    interests: input.role === 'student' ? input.interests || null : null,
    skills: input.role === 'student' ? input.skills || null : null,
    transfer_goals: input.role === 'student' ? input.transfer_goals || null : null,
    bio: input.bio || null,
    avatar_url: input.avatar_url || null,
    gender: input.gender || null,
  }
}

export function isProfileOnboardingComplete(profile?: Partial<ProfilePayload> | null) {
  if (!profile?.role || !profile.full_name || !profile.username || !profile.school_name) return false
  if (profile.role === 'professor' && !profile.department) return false
  return true
}

export function isUuid(value?: string | null) {
  return Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value))
}

export function makeUsername(email?: string, fullName?: string, id?: string) {
  if (email) {
    const fromEmail = email.split('@')[0].toLowerCase().replace(/[^a-z0-9._-]/gi, '')
    if (fromEmail) return fromEmail
  }

  if (fullName) {
    const fromName = fullName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .slice(0, 24)
    if (fromName) return fromName
  }

  return `user-${(id || Math.random().toString(36)).slice(0, 8)}`
}

function makeLocalAuthData(email: string) {
  const existing = loadLocalUser()
  // Use a simple hash-like string or just the full sanitized email to make the ID unique
  const uniqueId = `local-${email.toLowerCase().replace(/[^a-z0-9]/gi, '-')}`
  const user = existing?.email === email ? existing : { id: uniqueId, email }
  window.localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user))
  return { user, session: null }
}

function loadLocalUser(): LocalAuthUser | null {
  try {
    const raw = window.localStorage.getItem(LOCAL_USER_KEY)
    return raw ? JSON.parse(raw) as LocalAuthUser : null
  } catch {
    return null
  }
}

function nameFromEmail(email: string) {
  const localPart = email.split('@')[0] || 'Demo User'
  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ') || 'Demo User'
}
