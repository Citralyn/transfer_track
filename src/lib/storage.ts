import type { AuthUser, InterestRequest, OnboardingDraft, StudentProfile } from '../types'

const STORAGE_KEYS = {
  profile: 'transfer-track-student-profile',
  interests: 'transfer-track-interest-requests',
  authUser: 'transfer-track-auth-user',
  onboardingDraft: 'transfer-track-onboarding-draft',
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

export function loadAuthUser(): AuthUser | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(STORAGE_KEYS.authUser)
  return raw ? (JSON.parse(raw) as AuthUser) : null
}

export function saveAuthUser(user: AuthUser) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEYS.authUser, JSON.stringify(user))
}

export function clearAuthUser() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(STORAGE_KEYS.authUser)
}

export function loadOnboardingDraft(): OnboardingDraft | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(STORAGE_KEYS.onboardingDraft)
  return raw ? (JSON.parse(raw) as OnboardingDraft) : null
}

export function saveOnboardingDraft(draft: OnboardingDraft) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEYS.onboardingDraft, JSON.stringify(draft))
}

export function clearOnboardingDraft() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(STORAGE_KEYS.onboardingDraft)
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
