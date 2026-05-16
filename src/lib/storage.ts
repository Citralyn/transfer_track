import type { InterestRequest, StudentProfile } from '../types'

const STORAGE_KEYS = {
  profile: 'transfer-track-student-profile',
  interests: 'transfer-track-interest-requests',
}

export function loadStudentProfile(): StudentProfile | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(STORAGE_KEYS.profile)
  return raw ? (JSON.parse(raw) as StudentProfile) : null
}

export function saveStudentProfile(profile: StudentProfile) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(profile))
}

export function loadInterestRequests(): InterestRequest[] {
  if (typeof window === 'undefined') return []
  const raw = window.localStorage.getItem(STORAGE_KEYS.interests)
  return raw ? (JSON.parse(raw) as InterestRequest[]) : []
}

export function saveInterestRequest(request: InterestRequest) {
  if (typeof window === 'undefined') return
  const existing = loadInterestRequests()
  const updated = [request, ...existing]
  window.localStorage.setItem(STORAGE_KEYS.interests, JSON.stringify(updated))
}
