import { Loader2 } from 'lucide-react'
import logo from '@/assets/red_train.png'

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-brand-200 rounded-xl blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-100 rounded-xl blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="flex flex-col items-center">
        <div className="relative mb-8">
          <img src={logo} alt="Transfer Track" className="w-24 h-24 object-contain animate-bounce" />
        </div>
        
        <h2 className="text-3xl font-logo text-[#ff3b30] mb-2 tracking-tight">Transfer Track</h2>
        <div className="flex items-center gap-2 text-[#1d1d1f] font-bold">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Restoring your session...</span>
        </div>
      </div>
    </div>
  )
}
