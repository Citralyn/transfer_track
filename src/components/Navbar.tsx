import { Link } from 'react-router-dom'

export function Navbar() {
  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
          Transfer Track
        </Link>
        <nav className="flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
          <Link to="/onboarding" className="transition hover:text-slate-950 dark:hover:text-white">
            Onboarding
          </Link>
          <Link to="/dashboard" className="transition hover:text-slate-950 dark:hover:text-white">
            Dashboard
          </Link>
          <Link to="/professor-dashboard" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
            Professor Dashboard
          </Link>
        </nav>
      </div>
    </header>
  )
}
