import { Link } from 'react-router-dom'
import { matchOpportunities, matchProfessors } from '../lib/matching'
import { loadStudentProfile } from '../lib/storage'
import { OpportunityCard } from '../components/OpportunityCard'
import { ProfessorCard } from '../components/ProfessorCard'
import { ReadinessChecklist } from '../components/ReadinessChecklist'
import { ResourceCard } from '../components/ResourceCard'
import { opportunities } from '../data/opportunities'
import { professors } from '../data/professors'
import { resources } from '../data/resources'

export function DashboardPage() {
  const profile = loadStudentProfile()
  const professorMatches = profile ? matchProfessors(profile, professors).slice(0, 4) : []
  const opportunityMatches = profile ? matchOpportunities(profile, opportunities).slice(0, 4) : []
  const nextSteps = profile
    ? Array.from(
        new Set([
          'Review professor research areas that match your interests',
          'Share your profile with a transfer-focused professor',
          ...professorMatches.flatMap((result) => result.missingPrerequisites.map((prereq) => `Prepare for ${prereq}`)),
          ...opportunityMatches.flatMap((result) => result.missingPrerequisites.map((prereq) => `Study ${prereq}`)),
        ]),
      )
    : []

  if (!profile) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-10 shadow-sm dark:border-slate-700 dark:bg-slate-950">
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="mt-4 text-slate-600 dark:text-slate-300">Create a student profile first so Transfer Track can recommend professors and opportunities.</p>
          <Link
            to="/onboarding"
            className="mt-8 inline-flex rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Start onboarding
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-8 xl:grid-cols-[1.4fr_0.8fr]">
        <section className="space-y-8">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-950">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">Welcome back, {profile.name}</p>
                <h1 className="mt-4 text-3xl font-semibold text-slate-900 dark:text-white">Your transfer plan</h1>
                <p className="mt-3 text-slate-600 dark:text-slate-300">Based on your major, interests, and completed coursework.</p>
              </div>
              <Link
                to="/professor-dashboard"
                className="inline-flex rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Professor dashboard
              </Link>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-slate-50 p-5 dark:bg-slate-900">
                <p className="text-sm text-slate-500 dark:text-slate-400">Community college</p>
                <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">{profile.communityCollege}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-5 dark:bg-slate-900">
                <p className="text-sm text-slate-500 dark:text-slate-400">Transfer goal</p>
                <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">{profile.transferGoal}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Recommended professors</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">Top matches</h2>
              </div>
              <Link to="/onboarding" className="text-sm font-semibold text-sky-700 hover:text-sky-900 dark:text-sky-300">
                Update profile
              </Link>
            </div>
            <div className="grid gap-6 xl:grid-cols-2">
              {professorMatches.map((result) => (
                <ProfessorCard key={result.item.id} result={result} />
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Research opportunities</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">Explore relevant roles</h2>
              </div>
            </div>
            <div className="grid gap-6 xl:grid-cols-2">
              {opportunityMatches.map((result) => (
                <OpportunityCard key={result.item.id} result={result} />
              ))}
            </div>
          </div>
        </section>

        <aside className="space-y-8">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-950">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Course prep resources</h2>
            <div className="mt-6 grid gap-4">
              {resources.slice(0, 4).map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </div>
          </div>

          <ReadinessChecklist steps={nextSteps.slice(0, 5)} />
        </aside>
      </div>
    </main>
  )
}
