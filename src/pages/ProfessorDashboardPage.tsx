import { loadInterestRequests } from '../lib/storage'
import type { InterestRequest } from '../types'

const sampleRequests: InterestRequest[] = [
  {
    id: 'sample-1',
    professorId: 'prof-2',
    studentName: 'Jordan Lee',
    communityCollege: 'Riverbend Community College',
    intendedMajor: 'Information Science',
    careerGoal: 'Support inclusive learning technology projects.',
    message: 'I want to support HCI research that improves transfer student success.',
    date: 'Apr 25, 2026',
  },
  {
    id: 'sample-2',
    professorId: 'prof-5',
    studentName: 'Aisha Khan',
    communityCollege: 'Bayview College',
    intendedMajor: 'Cybersecurity',
    careerGoal: 'Prepare for applied security research roles.',
    message: 'I am interested in beginner-friendly cybersecurity labs.',
    date: 'May 1, 2026',
  },
]

export function ProfessorDashboardPage() {
  const requests = loadInterestRequests()
  const displayRequests = requests.length ? requests : sampleRequests

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-950">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Professor dashboard</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">Interested students</h1>
            <p className="mt-3 text-slate-600 dark:text-slate-300">Local interest requests are saved here for professors to review.</p>
          </div>
          <div className="rounded-3xl bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:bg-slate-900 dark:text-slate-300">
            {requests.length ? 'Saved interest requests from your students.' : 'Showing mock interest requests until a real student expresses interest.'}
          </div>
        </div>

        <div className="mt-8 space-y-4">
          {displayRequests.map((request) => (
            <div key={request.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-900">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">{request.studentName}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{request.communityCollege} • {request.intendedMajor}</p>
                </div>
                <p className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white">{request.date}</p>
              </div>
              <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">{request.message}</p>
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Career goal: {request.careerGoal}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
