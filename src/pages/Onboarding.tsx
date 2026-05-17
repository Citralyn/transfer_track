import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useAuthStore } from '@/store/useAuthStore'
import { FALLBACK_SCHOOLS, makeProfilePayload, uploadProfileImage, upsertProfile, withTimeout } from '@/lib/supabaseHelpers'
import { ArrowLeft, ArrowRight, Camera, Check, Loader2, User } from 'lucide-react'
import { clsx } from 'clsx'

const STUDENT_STEPS = ['about', 'biography', 'interests', 'transfer-goals', 'image'] as const
type OnboardingStep = typeof STUDENT_STEPS[number]
const PROFESSOR_STEPS: readonly OnboardingStep[] = ['about', 'biography', 'interests', 'image']

type FormData = {
  role: 'student' | 'professor' | ''
  full_name: string
  username: string
  school_name: string
  school_type: string
  academic_year: string
  department: string
  bio: string
  interestsText: string
  transfer_goals: string
  avatar_url: string
  gender: string
}

export default function Onboarding() {
  const { step = 'about' } = useParams()
  const navigate = useNavigate()
  const { user, profile, setProfile } = useAuthStore()
  const [schools, setSchools] = useState<any[]>(FALLBACK_SCHOOLS)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>(() => makeInitialForm(profile, user?.email))
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  useEffect(() => {
    setFormData(makeInitialForm(profile, user?.email))
  }, [profile?.id])

  useEffect(() => {
    const fetchSchools = async () => {
      if (!isSupabaseConfigured()) return

      try {
        const { data, error } = await withTimeout(
          supabase.from('schools').select('*'),
          'Supabase schools lookup'
        )
        if (error) {
          console.warn('Supabase schools lookup failed, using fallback schools:', error.message)
          return
        }
        if (data?.length) setSchools(data)
      } catch (error) {
        console.warn('Supabase schools unavailable, using fallback schools:', error)
      }
    }
    fetchSchools()
  }, [])

  const steps = useMemo(() => formData.role === 'professor' ? PROFESSOR_STEPS : STUDENT_STEPS, [formData.role])
  const stepIndex = steps.indexOf(step as OnboardingStep)

  if (!user) return <Navigate to="/login" replace />
  if (!STUDENT_STEPS.includes(step as OnboardingStep)) return <Navigate to="/onboarding/about" replace />
  if (formData.role === 'professor' && step === 'transfer-goals') return <Navigate to="/onboarding/image" replace />
  if (stepIndex === -1) return <Navigate to="/onboarding/about" replace />

  const currentStep = steps[stepIndex]
  const isFirstStep = stepIndex === 0
  const isFinalStep = stepIndex === steps.length - 1

  const saveCurrentStep = async () => {
    setError(null)
    if (!formData.role) {
      setError('Your profile type is missing. Please return to signup.')
      return false
    }
    if (currentStep === 'about' && !formData.school_name.trim()) {
      setError('College or university is required.')
      return false
    }
    if (currentStep === 'about' && formData.role === 'student' && !formData.department.trim()) {
      setError('Major is required for students.')
      return false
    }
    if (currentStep === 'about' && formData.role === 'student' && !formData.academic_year.trim()) {
      setError('Academic year is required for students.')
      return false
    }
    if (currentStep === 'about' && formData.role === 'professor' && !formData.department.trim()) {
      setError('Department is required for professors.')
      return false
    }

    setLoading(true)
    try {
      const avatarUrl = avatarFile ? await uploadProfileImage(user.id, avatarFile) : formData.avatar_url
      const profileData = makeProfilePayload({
        id: user.id,
        email: user.email || profile?.email || '',
        role: formData.role,
        full_name: formData.full_name,
        username: formData.username,
        school_name: formData.school_name,
        school_type: formData.school_type || (formData.role === 'student' ? 'community_college' : 'university'),
        academic_year: formData.role === 'student' ? formData.academic_year : null,
        department: formData.department,
        bio: formData.bio,
        interests: splitTags(formData.interestsText),
        transfer_goals: formData.role === 'student' ? formData.transfer_goals : null,
        avatar_url: avatarUrl,
        gender: formData.gender,
      })

      const { data, error } = await upsertProfile(profileData)
      if (error || !data) {
        console.warn('Onboarding save failed:', error)
        setError('We could not save your profile. Please check your Supabase profile permissions.')
        return false
      }
      setProfile(data)
      if (avatarFile) {
        setAvatarFile(null)
        setAvatarPreview(null)
        setFormData((current) => ({ ...current, avatar_url: avatarUrl }))
      }
      return true
    } catch (error) {
      console.warn('Onboarding save failed:', error)
      setError('We could not save just now. Please try again.')
      return false
    } finally {
      setLoading(false)
    }
  }

  const handleNext = async () => {
    const saved = await saveCurrentStep()
    if (!saved) return
    if (isFinalStep) {
      navigate('/profile', { replace: true })
      return
    }
    navigate(`/onboarding/${steps[stepIndex + 1]}`)
  }

  const handleBack = () => {
    if (isFirstStep) return
    navigate(`/onboarding/${steps[stepIndex - 1]}`)
  }

  const handleSkip = () => {
    if (isFinalStep) {
      navigate('/profile', { replace: true })
      return
    }
    navigate(`/onboarding/${steps[stepIndex + 1]}`)
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] px-6 py-12 flex flex-col items-center justify-center">
      <div className="w-full max-w-3xl">
        <div className="mb-10">
          <p className="text-xs font-semibold text-[#1d1d1f] uppercase tracking-widest mb-3">Profile setup</p>
          <div className="flex items-center gap-3">
            {steps.map((item, index) => (
              <div key={item} className="flex items-center flex-1 last:flex-none">
                <div className={clsx(
                  'w-10 h-10 rounded-xl flex items-center justify-center font-semibold transition-all',
                  index <= stepIndex ? 'bg-[#ff3b30] text-white shadow-xl' : 'bg-white text-[#1d1d1f] border border-black/5'
                )}>
                  {index < stepIndex ? <Check className="w-5 h-5" /> : index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div className={clsx('h-1 flex-1 mx-3 rounded-xl', index < stepIndex ? 'bg-[#ff3b30]' : 'bg-[#ffcc00]')} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 md:p-12 rounded-xl shadow-xl border border-black/5 min-h-[520px] flex flex-col">
          {error && <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-black/5">{error}</div>}

          <StepContent
            step={currentStep}
            schools={schools}
            formData={formData}
            setFormData={setFormData}
            avatarPreview={avatarPreview}
            onAvatarSelected={(file, preview) => {
              setAvatarFile(file)
              setAvatarPreview(preview)
            }}
          />

          <div className="mt-12 flex items-center justify-between gap-4">
            {!isFirstStep ? (
              <button
                onClick={handleBack}
                className="px-8 py-4 rounded-xl font-semibold text-[#1d1d1f] hover:bg-white transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" /> Back
              </button>
            ) : <div />}

            <div className="flex items-center gap-3">
              {currentStep !== 'about' && (
                <button
                  onClick={handleSkip}
                  disabled={loading}
                  className="px-6 py-4 rounded-xl font-semibold text-[#1d1d1f] hover:bg-white transition-colors disabled:opacity-50"
                >
                  Skip
                </button>
              )}
              <button
                onClick={handleNext}
                disabled={loading}
                className="px-10 py-4 bg-[#ff3b30] text-white rounded-full font-semibold shadow-xl hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center gap-2 disabled:opacity-50 disabled:transform-none"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : isFinalStep ? <>Finish <Check className="w-5 h-5" /></> : <>Next <ArrowRight className="w-5 h-5" /></>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StepContent({
  step,
  schools,
  formData,
  setFormData,
  avatarPreview,
  onAvatarSelected,
}: {
  step: OnboardingStep
  schools: any[]
  formData: FormData
  setFormData: (data: FormData) => void
  avatarPreview: string | null
  onAvatarSelected: (file: File, preview: string) => void
}) {
  if (step === 'about') {
    return (
      <div className="space-y-8 flex-1">
        <div>
          <h2 className="text-3xl font-semibold text-[#1d1d1f] mb-2">Academic details</h2>
          <p className="text-[#1d1d1f]">Add your school and role-specific academic information.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-[#1d1d1f] mb-2">{formData.role === 'professor' ? 'University' : 'College'}</label>
            <select
              value={formData.school_name}
              onChange={(event) => setFormData({ ...formData, school_name: event.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-black/5 focus:ring-2 focus:ring-brand-500 outline-none transition-all bg-white"
            >
              <option value="">Select a school...</option>
              {schools
                .filter((school) => !formData.school_type || school.type === formData.school_type)
                .map((school) => <option key={school.id} value={school.name}>{school.name}</option>)}
            </select>
          </div>
          {formData.role === 'student' ? (
            <>
              <TextField label="Major" value={formData.department} onChange={(department) => setFormData({ ...formData, department })} placeholder="Computer Science" />
              <TextField label="Academic Year" value={formData.academic_year} onChange={(academic_year) => setFormData({ ...formData, academic_year })} placeholder="Sophomore" />
            </>
          ) : (
            <TextField label="Department" value={formData.department} onChange={(department) => setFormData({ ...formData, department })} placeholder="Computer Science" />
          )}
        </div>
      </div>
    )
  }

  if (step === 'biography') {
    return (
      <div className="space-y-8 flex-1">
        <div>
          <h2 className="text-3xl font-semibold text-[#1d1d1f] mb-2">Write your biography</h2>
          <p className="text-[#1d1d1f]">Share a short introduction for people who visit your profile.</p>
        </div>
        <textarea
          rows={9}
          value={formData.bio}
          onChange={(event) => setFormData({ ...formData, bio: event.target.value })}
          className="w-full px-5 py-4 rounded-xl border border-black/5 focus:ring-2 focus:ring-brand-500 outline-none transition-all resize-none text-[#1d1d1f]"
          placeholder="Tell your story, what you're studying, and what kinds of academic connections you're looking for."
        />
      </div>
    )
  }

  if (step === 'interests') {
    return (
      <div className="space-y-8 flex-1">
        <div>
          <h2 className="text-3xl font-semibold text-[#1d1d1f] mb-2">Add your interests</h2>
          <p className="text-[#1d1d1f]">Separate interests with commas.</p>
        </div>
        <textarea
          rows={7}
          value={formData.interestsText}
          onChange={(event) => setFormData({ ...formData, interestsText: event.target.value })}
          className="w-full px-5 py-4 rounded-xl border border-black/5 focus:ring-2 focus:ring-brand-500 outline-none transition-all resize-none text-[#1d1d1f]"
          placeholder="Machine learning, biology, robotics, transfer advising"
        />
      </div>
    )
  }

  if (step === 'transfer-goals') {
    return (
      <div className="space-y-8 flex-1">
        <div>
          <h2 className="text-3xl font-semibold text-[#1d1d1f] mb-2">Transfer goals</h2>
          <p className="text-[#1d1d1f]">Add target schools, target majors, and academic or career goals.</p>
        </div>
        <textarea
          rows={9}
          value={formData.transfer_goals}
          onChange={(event) => setFormData({ ...formData, transfer_goals: event.target.value })}
          className="w-full px-5 py-4 rounded-xl border border-black/5 focus:ring-2 focus:ring-brand-500 outline-none transition-all resize-none text-[#1d1d1f]"
          placeholder="UC Berkeley or UCLA for Computer Science; research in human-centered AI; prepare for graduate school."
        />
      </div>
    )
  }

  return (
    <div className="space-y-8 flex-1">
      <div>
        <h2 className="text-3xl font-semibold text-[#1d1d1f] mb-2">Add a profile image</h2>
        <p className="text-[#1d1d1f]">Choose an image from your files.</p>
      </div>
      <div className="flex flex-col items-center gap-6">
        <div className="w-36 h-36 rounded-xl bg-[#34c759] flex items-center justify-center border border-black/5 shadow-xl overflow-hidden">
          {avatarPreview || formData.avatar_url ? <img src={avatarPreview || formData.avatar_url} alt="" className="w-full h-full object-cover" /> : <User className="w-16 h-16 text-[#1d1d1f]" />}
        </div>
        <label className="cursor-pointer bg-white border border-black/5 text-[#1d1d1f] px-6 py-3 rounded-xl font-semibold shadow-xl hover:shadow-xl transition-all flex items-center gap-2">
          <Camera className="w-5 h-5" />
          Choose Image
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (!file) return
              const reader = new FileReader()
              reader.onloadend = () => onAvatarSelected(file, reader.result as string)
              reader.readAsDataURL(file)
            }}
          />
        </label>
      </div>
    </div>
  )
}

function TextField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-[#1d1d1f] mb-2">{label}</label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full px-4 py-3 rounded-xl border border-black/5 focus:ring-2 focus:ring-brand-500 outline-none transition-all"
        placeholder={placeholder}
      />
    </div>
  )
}

function makeInitialForm(profile: any, email?: string | null): FormData {
  return {
    role: profile?.role || '',
    full_name: profile?.full_name || '',
    username: profile?.username || (email ? email.split('@')[0].replace(/[^a-z0-9]/gi, '').toLowerCase() : ''),
    school_name: profile?.school_name || '',
    school_type: profile?.school_type || (profile?.role === 'professor' ? 'university' : 'community_college'),
    academic_year: profile?.academic_year || '',
    department: profile?.department || '',
    bio: profile?.bio || '',
    interestsText: Array.isArray(profile?.interests) ? profile.interests.join(', ') : '',
    transfer_goals: profile?.transfer_goals || '',
    avatar_url: profile?.avatar_url || '',
    gender: profile?.gender || 'prefer-not-to-say',
  }
}

function splitTags(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean)
}
