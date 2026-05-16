import { Link } from 'react-router-dom'

export function Navbar() {
  return (
    <header className="border-b border-pink-100 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="text-xl font-semibold tracking-tight text-orange-600">
          Transfer Track
        </Link>
        <nav className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
          <Link to="/onboarding/profile" className="transition hover:text-orange-700">
            Onboarding
          </Link>
          <Link to="/dashboard" className="transition hover:text-orange-700">
            Dashboard
          </Link>
          <Link to="/professor-dashboard" className="rounded-full bg-gradient-to-r from-orange-400 to-pink-500 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95">
            Professor Dashboard
          </Link>
        </nav>
      </div>
    </header>
  )
}
