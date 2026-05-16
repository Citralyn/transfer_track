import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { loadStudentProfile, saveInterestRequest } from '../lib/storage'
import { formatDate } from '../lib/utils'
import { opportunities } from '../data/opportunities'
import { professors } from '../data/professors'
import type { InterestRequest } from '../types'

export function ProfessorPage() {
  const params = useParams()
  const navigate = useNavigate()
  const professor = useMemo(
    () => professors.find((prof) => prof.id === params.id),
    [params.id],
  )
  const profile = loadStudentProfile()
  const [status, setStatus] = useState<string | null>(null)

  const relatedOpportunities = professor
    ? opportunities.filter((opportunity) => opportunity.professorId === professor.id)
    : []

  const handleInterest = () => {
    if (!professor) return
    if (!profile) {
      navigate('/onboarding')
      return
    }

    const request: InterestRequest = {
      id: `${professor.id}-${Date.now()}`,
      professorId: professor.id,
      studentName: profile.name,
      communityCollege: profile.communityCollege,
      intendedMajor: profile.intendedMajor,
      careerGoal: profile.careerGoal,
      message: `I am interested in research related to ${professor.researchAreas.slice(0, 2).join(', ')} and would like to learn more about opportunities.`,
      date: formatDate(new Date()),
    }
    saveInterestRequest(request)
    setStatus('Interest saved. Your professor dashboard has been updated.')
  }

  if (!professor) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-10 shadow-sm dark:border-slate-700 dark:bg-slate-950">
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Professor not found</h1>
          <p className="mt-4 text-slate-600 dark:text-slate-300">Please return to the dashboard and choose a different professor.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-pink-100 bg-white p-8 shadow-[0_30px_60px_rgba(249,207,232,0.25)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-orange-600">Professor profile</p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-900">{professor.name}</h1>
            <p className="mt-1 text-sm text-slate-500">{professor.title} • {professor.university}</p>
          </div>
          <button
            type="button"
            onClick={handleInterest}
            className="inline-flex rounded-full bg-gradient-to-r from-orange-400 to-pink-500 px-6 py-3 text-sm font-semibold text-white transition hover:opacity-95"
          >
            Express Interest
          </button>
        </div>

        {status ? (
          <div className="mt-6 rounded-3xl bg-orange-50 p-4 text-sm text-slate-900">
            {status}
          </div>
        ) : null}

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
          <div className="space-y-6">
            <section className="rounded-3xl border border-pink-100 bg-orange-50 p-6">
              <h2 className="text-xl font-semibold text-slate-900">About this professor</h2>
              <p className="mt-4 text-slate-600">{professor.bio}</p>
            </section>

            <section className="rounded-3xl border border-pink-100 bg-pink-50 p-6">
              <h2 className="text-xl font-semibold text-slate-900">Research areas</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {professor.researchAreas.map((area) => (
                  <span key={area} className="rounded-full bg-white px-3 py-1 text-sm text-orange-700 shadow-sm">{area}</span>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-pink-100 bg-white p-6">
              <h2 className="text-xl font-semibold text-slate-900">Prerequisites</h2>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                {professor.prerequisites.map((prerequisite) => (
                  <li key={prerequisite}>• {prerequisite}</li>
                ))}
              </ul>
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-3xl border border-pink-100 bg-pink-50 p-6">
              <h2 className="text-xl font-semibold text-slate-900">Support resources</h2>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                {professor.resources.map((resource) => (
                  <li key={resource}>• {resource}</li>
                ))}
              </ul>
            </section>

            <section className="rounded-3xl border border-pink-100 bg-white p-6">
              <h2 className="text-xl font-semibold text-slate-900">Related opportunities</h2>
              <div className="mt-4 space-y-4">
                {relatedOpportunities.map((opportunity) => (
                  <div key={opportunity.id} className="rounded-3xl bg-pink-50 p-4 shadow-sm">
                    <p className="font-semibold text-slate-900">{opportunity.title}</p>
                    <p className="mt-2 text-sm text-slate-600">{opportunity.description}</p>
                  </div>
                ))}
                {!relatedOpportunities.length ? <p className="text-sm text-slate-600">No related opportunities available yet.</p> : null}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}
