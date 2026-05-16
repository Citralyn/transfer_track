import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  clearOnboardingDraft,
  loadOnboardingDraft,
  loadStudentProfile,
  saveOnboardingDraft,
  saveStudentProfile,
} from '../lib/storage'
import { parseListInput } from '../lib/utils'
import { Loading } from '../components/Loading'
import type { OnboardingDraft, StudentProfile } from '../types'

const steps = [
  { key: 'profile', label: 'Profile' },
  { key: 'academic', label: 'Academic' },
  { key: 'interests', label: 'Interests' },
  { key: 'career', label: 'Career' },
  { key: 'review', label: 'Review' },
] as const

const defaultDraft: OnboardingDraft = {
  name: '',
  communityCollege: '',
  intendedMajor: '',
  transferGoal: '',
  completedCoursesText: '',
  interestsText: '',
  skillsText: '',
  careerGoal: '',
  opportunityPreferencesText: '',
}

export function OnboardingPage() {
  const { step } = useParams()
  const navigate = useNavigate()
  const [draft, setDraft] = useState<OnboardingDraft>(defaultDraft)
  const [isLoading, setIsLoading] = useState(true)

  const stepIndex = useMemo(
    () => steps.findIndex((entry) => entry.key === step),
    [step],
  )

  const currentStep = stepIndex >= 0 ? steps[stepIndex] : steps[0]

  useEffect(() => {
    const savedDraft = loadOnboardingDraft()
    if (savedDraft) {
      setDraft(savedDraft)
    } else {
      const existingProfile = loadStudentProfile()
      if (existingProfile) {
        setDraft({
          ...defaultDraft,
          ...existingProfile,
          completedCoursesText: existingProfile.completedCourses.join(', '),
          interestsText: existingProfile.interests.join(', '),
          skillsText: existingProfile.skills.join(', '),
          opportunityPreferencesText: existingProfile.opportunityPreferences.join(', '),
        })
      }
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (!step) {
      navigate('/onboarding/profile', { replace: true })
    } else if (stepIndex < 0 && !isLoading) {
      navigate('/onboarding/profile', { replace: true })
    }
  }, [step, stepIndex, navigate, isLoading])

  const updateDraft = (changes: Partial<OnboardingDraft>) => {
    const nextDraft = { ...draft, ...changes }
    setDraft(nextDraft)
    saveOnboardingDraft(nextDraft)
  }

  const currentProgress = ((stepIndex >= 0 ? stepIndex : 0) / (steps.length - 1)) * 100

  const canProceed =
    currentStep.key === 'profile'
      ? draft.name.trim() !== '' && draft.communityCollege.trim() !== '' && draft.transferGoal.trim() !== ''
      : currentStep.key === 'academic'
      ? draft.intendedMajor.trim() !== '' && draft.completedCoursesText.trim() !== ''
      : currentStep.key === 'interests'
      ? draft.interestsText.trim() !== '' && draft.skillsText.trim() !== ''
      : currentStep.key === 'career'
      ? draft.careerGoal.trim() !== '' && draft.opportunityPreferencesText.trim() !== ''
      : true

  const handleNext = () => {
    if (!canProceed) return
    const nextStep = steps[stepIndex + 1]
    if (nextStep) {
      navigate(`/onboarding/${nextStep.key}`)
    }
  }

  const handleBack = () => {
    const previousStep = steps[stepIndex - 1]
    if (previousStep) {
      navigate(`/onboarding/${previousStep.key}`)
    } else {
      navigate('/')
    }
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const finalProfile: StudentProfile = {
      name: draft.name,
      communityCollege: draft.communityCollege,
      intendedMajor: draft.intendedMajor,
      transferGoal: draft.transferGoal,
      completedCourses: parseListInput(draft.completedCoursesText),
      interests: parseListInput(draft.interestsText),
      skills: parseListInput(draft.skillsText),
      careerGoal: draft.careerGoal,
      opportunityPreferences: parseListInput(draft.opportunityPreferencesText),
    }
    saveStudentProfile(finalProfile)
    clearOnboardingDraft()
    navigate('/dashboard')
  }

  if (isLoading) {
    return <Loading />
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-pink-100 bg-white p-8 shadow-[0_30px_60px_rgba(249,207,232,0.25)]">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-orange-600">Onboarding</p>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900">{currentStep.label} details</h1>
              <p className="mt-2 text-slate-600">Complete each step to build your transfer-ready student profile.</p>
            </div>
            <p className="rounded-full bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700">Step {stepIndex + 1} of {steps.length}</p>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-pink-100">
            <div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-pink-500" style={{ width: `${currentProgress}%` }} />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {currentStep.key === 'profile' && (
            <div className="grid gap-6 lg:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-700">
                <span>Name</span>
                <input
                  value={draft.name}
                  onChange={(event) => updateDraft({ name: event.target.value })}
                  className="w-full rounded-3xl border border-pink-200 bg-pink-50 px-4 py-3 text-slate-900 outline-none focus:border-orange-400"
                  placeholder="Your name"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-700">
                <span>Community college</span>
                <input
                  value={draft.communityCollege}
                  onChange={(event) => updateDraft({ communityCollege: event.target.value })}
                  className="w-full rounded-3xl border border-pink-200 bg-pink-50 px-4 py-3 text-slate-900 outline-none focus:border-orange-400"
                  placeholder="e.g. South Valley College"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-700 lg:col-span-2">
                <span>Transfer goal</span>
                <input
                  value={draft.transferGoal}
                  onChange={(event) => updateDraft({ transferGoal: event.target.value })}
                  className="w-full rounded-3xl border border-pink-200 bg-pink-50 px-4 py-3 text-slate-900 outline-none focus:border-orange-400"
                  placeholder="e.g. Transfer to a four-year research university"
                />
              </label>
            </div>
          )}

          {currentStep.key === 'academic' && (
            <div className="grid gap-6 lg:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-700">
                <span>Intended major</span>
                <input
                  value={draft.intendedMajor}
                  onChange={(event) => updateDraft({ intendedMajor: event.target.value })}
                  className="w-full rounded-3xl border border-pink-200 bg-pink-50 px-4 py-3 text-slate-900 outline-none focus:border-orange-400"
                  placeholder="e.g. Computer Science"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-700 lg:col-span-2">
                <span>Completed courses</span>
                <textarea
                  value={draft.completedCoursesText}
                  onChange={(event) => updateDraft({ completedCoursesText: event.target.value })}
                  className="min-h-[130px] w-full rounded-3xl border border-pink-200 bg-pink-50 px-4 py-3 text-slate-900 outline-none focus:border-orange-400"
                  placeholder="e.g. Intro to Python, Calculus I, Communication Studies"
                />
              </label>
            </div>
          )}

          {currentStep.key === 'interests' && (
            <div className="grid gap-6 lg:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-700">
                <span>Academic interests</span>
                <textarea
                  value={draft.interestsText}
                  onChange={(event) => updateDraft({ interestsText: event.target.value })}
                  className="min-h-[130px] w-full rounded-3xl border border-pink-200 bg-pink-50 px-4 py-3 text-slate-900 outline-none focus:border-orange-400"
                  placeholder="e.g. computer vision, public health, education technology"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-700">
                <span>Skills</span>
                <textarea
                  value={draft.skillsText}
                  onChange={(event) => updateDraft({ skillsText: event.target.value })}
                  className="min-h-[130px] w-full rounded-3xl border border-pink-200 bg-pink-50 px-4 py-3 text-slate-900 outline-none focus:border-orange-400"
                  placeholder="e.g. Python, teamwork, research writing"
                />
              </label>
            </div>
          )}

          {currentStep.key === 'career' && (
            <div className="grid gap-6">
              <label className="space-y-2 text-sm text-slate-700">
                <span>Career goal</span>
                <textarea
                  value={draft.careerGoal}
                  onChange={(event) => updateDraft({ careerGoal: event.target.value })}
                  className="min-h-[130px] w-full rounded-3xl border border-pink-200 bg-pink-50 px-4 py-3 text-slate-900 outline-none focus:border-orange-400"
                  placeholder="e.g. Work in research support for AI ethics teams"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-700">
                <span>Opportunity preferences</span>
                <textarea
                  value={draft.opportunityPreferencesText}
                  onChange={(event) => updateDraft({ opportunityPreferencesText: event.target.value })}
                  className="min-h-[130px] w-full rounded-3xl border border-pink-200 bg-pink-50 px-4 py-3 text-slate-900 outline-none focus:border-orange-400"
                  placeholder="e.g. beginner-friendly labs, applied health research, AI ethics"
                />
              </label>
            </div>
          )}

          {currentStep.key === 'review' && (
            <div className="space-y-6">
              <div className="rounded-3xl border border-pink-100 bg-pink-50 p-6">
                <h2 className="text-xl font-semibold text-slate-900">Review your responses</h2>
                <div className="mt-4 space-y-4 text-sm text-slate-700">
                  <div>
                    <p className="font-semibold text-slate-900">Profile</p>
                    <p>{draft.name}</p>
                    <p>{draft.communityCollege}</p>
                    <p>{draft.transferGoal}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Academic</p>
                    <p>{draft.intendedMajor}</p>
                    <p>{draft.completedCoursesText}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Interests</p>
                    <p>{draft.interestsText}</p>
                    <p>{draft.skillsText}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Career</p>
                    <p>{draft.careerGoal}</p>
                    <p>{draft.opportunityPreferencesText}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center justify-center rounded-full border border-pink-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-pink-50"
            >
              Back
            </button>
            {currentStep.key === 'review' ? (
              <button
                type="submit"
                disabled={!canProceed}
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-orange-400 to-pink-500 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Submit and view dashboard
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                disabled={!canProceed}
                className="inline-flex items-center justify-center rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-orange-200"
              >
                Continue
              </button>
            )}
          </div>
        </form>
      </div>
    </main>
  )
}
