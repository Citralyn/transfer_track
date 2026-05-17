import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { loadAuthUser, saveAuthUser } from '../lib/storage'
import type { AuthUser } from '../types'

const roles = ['Student', 'Professor'] as const

export function LandingPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<typeof roles[number]>('Student')
  const [signedInUser, setSignedInUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    const user = loadAuthUser()
    if (user) {
      setSignedInUser(user)
    }
  }, [])

  const handleSignIn = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const user: AuthUser = { name, email, role }
    saveAuthUser(user)
    setSignedInUser(user)
    if (role === 'Professor') {
      navigate('/professor-dashboard')
    } else {
      navigate('/onboarding/profile')
    }
  }

  const handleContinue = () => {
    if (!signedInUser) return
    if (signedInUser.role === 'Professor') {
      navigate('/professor-dashboard')
    } else {
      navigate('/onboarding/profile')
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-12 xl:grid-cols-[1.2fr_0.8fr] xl:items-start">
        <section className="space-y-10 rounded-none border border-pink-100 bg-white p-10 shadow-[0_30px_60px_rgba(249,207,232,0.25)]">
          <div className="space-y-6">
            <span className="inline-flex rounded-none bg-orange-100 px-4 py-2 text-sm font-black uppercase tracking-[0.24em] text-orange-700">
              Transfer-ready research discovery
            </span>
            <h1 className="max-w-3xl text-5xl font-black tracking-tight text-slate-900 sm:text-6xl">
              Discover professors, research-ready coursework, and transfer next steps.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-600">
              Transfer Track brings students closer to faculty mentors and opportunity pathways with mock sign-in, onboarding, and recommendation matching.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              to="/onboarding/profile"
              className="inline-flex items-center justify-center rounded-none bg-gradient-to-r from-orange-400 to-pink-500 px-6 py-3 text-base font-black text-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] shadow-orange-200/50 transition hover:opacity-95"
            >
              Start your plan
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center rounded-none border border-pink-200 bg-white px-6 py-3 text-base font-black text-pink-700 transition hover:bg-pink-50"
            >
              Explore the dashboard
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-none border border-pink-100 bg-pink-50 p-6">
              <p className="text-sm font-black text-orange-700">Match confidently</p>
              <p className="mt-3 text-sm text-slate-600">See why professors and opportunities fit your transfer goals.</p>
            </div>
            <div className="rounded-none border border-pink-100 bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-sm font-black text-orange-700">Prepare with clarity</p>
              <p className="mt-3 text-sm text-slate-600">Review your coursework and possible next steps in one place.</p>
            </div>
            <div className="rounded-none border border-pink-100 bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-sm font-black text-orange-700">Mock sign-in</p>
              <p className="mt-3 text-sm text-slate-600">Student and professor paths are simulated with localStorage only.</p>
            </div>
          </div>
        </section>

        <section className="rounded-none border border-pink-100 bg-gradient-to-br from-white via-pink-50 to-orange-50 p-8 shadow-[0_20px_50px_rgba(249,207,232,0.35)]">
          <div className="space-y-4">
            <h2 className="text-2xl font-black text-slate-900">Mock sign-in</h2>
            <p className="text-sm text-slate-600">Use a simple student or professor profile to continue the demo flow.</p>
          </div>

          {signedInUser ? (
            <div className="mt-6 rounded-none border border-pink-100 bg-white p-6">
              <p className="text-sm text-slate-500">Signed in as</p>
              <p className="mt-2 text-lg font-black text-slate-900">{signedInUser.name}</p>
              <p className="text-sm text-slate-600">{signedInUser.email} • {signedInUser.role}</p>
              <button
                type="button"
                onClick={handleContinue}
                className="mt-6 inline-flex w-full items-center justify-center rounded-none bg-orange-500 px-5 py-3 text-sm font-black text-white transition hover:bg-orange-600"
              >
                Continue as {signedInUser.role}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSignIn} className="mt-6 space-y-4">
              <label className="block text-sm font-bold text-slate-700">Name</label>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-none border border-pink-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-orange-400"
                placeholder="Your name"
              />
              <label className="block text-sm font-bold text-slate-700">Email</label>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-none border border-pink-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-orange-400"
                placeholder="you@example.com"
              />
              <label className="block text-sm font-bold text-slate-700">Role</label>
              <select
                value={role}
                onChange={(event) => setRole(event.target.value as typeof roles[number])}
                className="w-full rounded-none border border-pink-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-orange-400"
              >
                {roles.map((roleOption) => (
                  <option key={roleOption} value={roleOption}>{roleOption}</option>
                ))}
              </select>
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-none bg-gradient-to-r from-orange-400 to-pink-500 px-5 py-3 text-sm font-black text-white transition hover:opacity-95"
              >
                Sign in and continue
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  )
}
