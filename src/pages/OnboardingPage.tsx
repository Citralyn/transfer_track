import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadStudentProfile, saveStudentProfile } from '../lib/storage'
import { parseListInput } from '../lib/utils'
import type { StudentProfile } from '../types'

export function OnboardingPage() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<StudentProfile>({
    name: '',
    communityCollege: '',
    intendedMajor: '',
    transferGoal: '',
    completedCourses: [],
    interests: [],
    skills: [],
    careerGoal: '',
  })

  const [completedCoursesText, setCompletedCoursesText] = useState('')
  const [interestsText, setInterestsText] = useState('')
  const [skillsText, setSkillsText] = useState('')

  useEffect(() => {
    const saved = loadStudentProfile()
    if (saved) {
      setProfile(saved)
      setCompletedCoursesText(saved.completedCourses.join(', '))
      setInterestsText(saved.interests.join(', '))
      setSkillsText(saved.skills.join(', '))
    }
  }, [])

  const canSubmit = profile.name && profile.communityCollege && profile.intendedMajor && profile.transferGoal && profile.careerGoal

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const finalProfile: StudentProfile = {
      ...profile,
      completedCourses: parseListInput(completedCoursesText),
      interests: parseListInput(interestsText),
      skills: parseListInput(skillsText),
    }
    saveStudentProfile(finalProfile)
    navigate('/dashboard')
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-950">
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Build your transfer-ready profile</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-300">Enter the details that help Transfer Track recommend professors, research paths, and resources.</p>

        <form onSubmit={handleSubmit} className="mt-10 space-y-8">
          <div className="grid gap-6 lg:grid-cols-2">
            <label className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
              <span>Name</span>
              <input
                value={profile.name}
                onChange={(event) => setProfile({ ...profile, name: event.target.value })}
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                placeholder="Your name"
              />
            </label>
            <label className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
              <span>Community college</span>
              <input
                value={profile.communityCollege}
                onChange={(event) => setProfile({ ...profile, communityCollege: event.target.value })}
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                placeholder="e.g. South Valley College"
              />
            </label>
            <label className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
              <span>Intended major</span>
              <input
                value={profile.intendedMajor}
                onChange={(event) => setProfile({ ...profile, intendedMajor: event.target.value })}
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                placeholder="e.g. Computer Science"
              />
            </label>
            <label className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
              <span>Transfer goal</span>
              <input
                value={profile.transferGoal}
                onChange={(event) => setProfile({ ...profile, transferGoal: event.target.value })}
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                placeholder="e.g. Transfer to a four-year research university"
              />
            </label>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <label className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
              <span>Completed courses</span>
              <textarea
                value={completedCoursesText}
                onChange={(event) => setCompletedCoursesText(event.target.value)}
                className="min-h-[110px] w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                placeholder="e.g. Intro to Python, Calculus I, Communication Studies"
              />
            </label>
            <label className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
              <span>Interests</span>
              <textarea
                value={interestsText}
                onChange={(event) => setInterestsText(event.target.value)}
                className="min-h-[110px] w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                placeholder="e.g. computer vision, public health, education technology"
              />
            </label>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <label className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
              <span>Skills</span>
              <textarea
                value={skillsText}
                onChange={(event) => setSkillsText(event.target.value)}
                className="min-h-[110px] w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                placeholder="e.g. Python, spreadsheet analysis, public speaking"
              />
            </label>
            <label className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
              <span>Career goal</span>
              <textarea
                value={profile.careerGoal}
                onChange={(event) => setProfile({ ...profile, careerGoal: event.target.value })}
                className="min-h-[110px] w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                placeholder="e.g. Work in research support for AI ethics teams"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-base font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-auto"
          >
            Save profile and continue
          </button>
        </form>
      </div>
    </main>
  )
}
