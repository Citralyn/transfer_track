export function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-gradient-to-br from-white via-pink-50 to-orange-50 px-4 text-slate-900">
      <div className="rounded-3xl border border-pink-100 bg-white/90 p-8 shadow-xl shadow-pink-200/40 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-pink-300 border-t-orange-500" />
          <div>
            <p className="text-lg font-semibold text-slate-900">Loading your onboarding flow</p>
            <p className="mt-2 text-sm text-slate-600">We are preparing your transfer-ready path.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
