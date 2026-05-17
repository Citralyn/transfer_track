import { Loader2 } from 'lucide-react'

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-brand-50 overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-brand-200 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-100 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="flex flex-col items-center">
        <div className="relative mb-8">
          <div className="w-20 h-20 gradient-brand rounded-3xl flex items-center justify-center text-white font-bold text-3xl shadow-xl animate-bounce">
            TT
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-brand-900 mb-2 tracking-tight">Transfer Track</h2>
        <div className="flex items-center gap-2 text-brand-400 font-medium">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Restoring your session...</span>
        </div>
      </div>
    </div>
  )
}
