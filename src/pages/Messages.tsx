import { Sparkles, MessageCircle } from 'lucide-react'

export default function Messages() {
  return (
    <div className="bg-white rounded-[3rem] border border-brand-100 shadow-sm min-h-[600px] flex flex-col items-center justify-center p-12 text-center">
      <div className="w-24 h-24 gradient-soft rounded-[2rem] flex items-center justify-center text-accent-500 mb-8 shadow-inner">
        <MessageCircle className="w-12 h-12" />
      </div>
      <h2 className="text-3xl font-extrabold text-brand-900 mb-4">Your Conversations</h2>
      <p className="text-brand-500 max-w-sm mx-auto mb-10 font-medium">
        Connect with professors and peers. Messaging functionality is coming soon to help you build your academic network.
      </p>
      <div className="flex items-center gap-2 text-accent-600 font-bold bg-accent-50 px-6 py-3 rounded-2xl border border-accent-100 shadow-sm">
        <Sparkles className="w-5 h-5" /> Beta Feature
      </div>
    </div>
  )
}
