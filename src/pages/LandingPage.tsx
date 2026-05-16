import { Link } from 'react-router-dom'

export function LandingPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <p className="inline-flex rounded-full bg-sky-100 px-4 py-1 text-sm font-semibold text-sky-800 dark:bg-sky-900/15 dark:text-sky-200">
            Demo-ready transfer planning
          </p>
          <h1 className="mt-8 text-4xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
            Discover research mentors, prep resources, and next steps before you transfer.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
            Transfer Track helps community college students build a clear research-ready path for their university transfer goals.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              to="/onboarding"
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-base font-semibold text-white transition hover:bg-slate-700"
            >
              Start your plan
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-900 transition hover:border-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            >
              View dashboard
            </Link>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-8 shadow-sm dark:border-slate-700 dark:bg-slate-950">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-600 dark:text-slate-400">Transfer Track Preview</p>
          <div className="mt-6 space-y-5">
            <div className="rounded-3xl bg-white p-5 shadow-sm dark:bg-slate-900">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Recommended mentors</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Find professors with research areas that match your interests and transfer goals.</p>
            </div>
            <div className="rounded-3xl bg-white p-5 shadow-sm dark:bg-slate-900">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Course prep resources</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Get the right resources for missing prerequisites and career readiness.</p>
            </div>
            <div className="rounded-3xl bg-white p-5 shadow-sm dark:bg-slate-900">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Express interest</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Save a local profile and tell professors you want to join their research project.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
