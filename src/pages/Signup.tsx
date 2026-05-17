import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { makeProfilePayload, signInOrSignUpDemo, upsertProfile } from '@/lib/supabaseHelpers'
import { useAuthStore } from '@/store/useAuthStore'
import { 
  GraduationCap, 
  BookOpen, 
  User, 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  Loader2, 
  Mail,
  AtSign,
  Lock,
} from 'lucide-react'
import { clsx } from 'clsx'
import logo from '@/assets/red_train.png'

export default function Signup() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { setSession, setUser, setProfile } = useAuthStore()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    role: '' as 'student' | 'professor' | '',
    full_name: '',
    username: '',
    email: '',
    password: '',
  })

  const handleNext = () => {
    setError(null)
    setStep(step + 1)
  }
  const handleBack = () => {
    setError(null)
    setStep(step - 1)
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!formData.role) {
        setError('Choose student or professor first.')
        return
      }

      const { data: authData, error: authError } = await signInOrSignUpDemo({
        email: formData.email,
        password: formData.password,
        name: formData.full_name,
        role: formData.role,
        mode: 'signup',
      })

      if (authError) {
        setError(authError.message)
        return
      }

      if (!authData?.user) {
        setError('Unable to create a demo account. Try again with an email address.')
        return
      }

      setSession(authData.session ?? null)
      setUser(authData.user)

      const profileData = makeProfilePayload({
        id: authData.user.id,
        role: formData.role,
        full_name: formData.full_name,
        username: formData.username,
        email: formData.email,
      })

      const { data: profile, error: profileError } = await upsertProfile(profileData)

      if (profileError || !profile) {
        console.warn('Profile save failed:', (profileError as Error).message)
        setError('Account created, but we could not create your profile. Please check your Supabase profile permissions.')
        return
      }
      setProfile(profile)
      navigate('/onboarding/about')
    } catch (error) {
      console.warn('Signup failed:', error)
      setError('Sign-up hit a snag. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] px-6 py-12 flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-3 mb-6 group">
            <img src={logo} alt="Transfer Track" className="w-16 h-16 object-contain group-hover:scale-105 transition-transform" />
            <span className="text-3xl font-logo text-[#ff3b30] tracking-tighter">Transfer Track</span>
          </Link>
          <div className="flex items-center justify-center gap-3 mb-2">
             {[1, 2].map(s => (
               <div key={s} className={clsx(
                 "h-4 border border-black/5 rounded-xl transition-all duration-300 shadow-xl",
                 step === s ? "w-12 bg-[#ffcc00]" : "w-4 bg-white"
               )} />
             ))}
          </div>
        </div>

        <div className="bg-white p-10 rounded-xl shadow-xl border border-black/5 min-h-[500px] flex flex-col">
          {error && (
            <div className="mb-6 bg-[#ff3b30] text-white p-4 rounded-full font-semibold border border-black/5 shadow-xl animate-in fade-in zoom-in-95">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1 flex flex-col">
              <h2 className="text-3xl font-semibold text-[#1d1d1f] mb-2 text-center">Join the Community</h2>
              <p className="text-[#1d1d1f] mb-10 text-center">Are you a student or a professor?</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 flex-1">
                <RoleCard 
                  active={formData.role === 'student'}
                  onClick={() => setFormData({ ...formData, role: 'student' })}
                  icon={<BookOpen className="w-10 h-10" />}
                  title="Community College Student"
                  description="I'm preparing to transfer to a 4-year university."
                />
                <RoleCard 
                  active={formData.role === 'professor'}
                  onClick={() => setFormData({ ...formData, role: 'professor' })}
                  icon={<GraduationCap className="w-10 h-10" />}
                  title="University Professor"
                  description="I'm teaching at a 4-year university and want to connect."
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1 flex flex-col">
              <h2 className="text-3xl font-semibold text-[#1d1d1f] mb-2 text-center">Account Details</h2>
              <p className="text-[#1d1d1f] mb-8 text-center">Create your login information</p>
              
              <form onSubmit={handleSignup} className="space-y-4 max-w-lg mx-auto w-full">
                <div className="grid grid-cols-2 gap-4">
                  <InputWithIcon 
                    icon={<User className="w-5 h-5" />}
                    label="Full Name"
                    placeholder="Jane Doe"
                    value={formData.full_name}
                    onChange={v => setFormData({...formData, full_name: v})}
                  />
                  <InputWithIcon 
                    icon={<AtSign className="w-5 h-5" />}
                    label="Username"
                    placeholder="janedoe"
                    value={formData.username}
                    onChange={v => setFormData({...formData, username: v})}
                  />
                </div>

                <InputWithIcon 
                  icon={<Mail className="w-5 h-5" />}
                  label="Email Address"
                  type="email"
                  placeholder="jane@example.com"
                  value={formData.email}
                  onChange={v => setFormData({...formData, email: v})}
                />

                <InputWithIcon
                  icon={<Lock className="w-5 h-5" />}
                  label="Password"
                  type="password"
                  placeholder="Use a password or leave blank for demo"
                  value={formData.password}
                  onChange={v => setFormData({...formData, password: v})}
                />

              </form>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-auto pt-10 flex items-center justify-between gap-4">
            {step > 1 ? (
              <button
                onClick={handleBack}
                className="px-8 py-4 rounded-xl font-semibold text-[#1d1d1f] hover:bg-white transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" /> Back
              </button>
            ) : (
              <Link to="/login" className="text-[#1d1d1f] font-semibold hover:text-[#1d1d1f] px-4">
                Login instead
              </Link>
            )}

            {step < 2 ? (
              <button
                disabled={!formData.role}
                onClick={handleNext}
                className="px-10 py-4 bg-[#ffcc00] text-[#1d1d1f] border border-black/5 rounded-xl font-semibold shadow-xl hover:translate-x-1 hover:translate-y-1 hover:shadow-xl transition-all flex items-center gap-2 disabled:opacity-50 uppercase tracking-widest"
              >
                Next Step <ArrowRight className="w-5 h-5 stroke-[3]" />
              </button>
            ) : (
              <button
                onClick={handleSignup}
                disabled={loading || !formData.email || !formData.full_name || !formData.username}
                className="px-10 py-4 bg-[#34c759] text-[#1d1d1f] border border-black/5 rounded-full font-semibold shadow-xl hover:translate-x-1 hover:translate-y-1 hover:shadow-xl transition-all flex items-center gap-2 disabled:opacity-50 uppercase tracking-widest"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <span className="flex items-center gap-2">Create Account <Check className="w-5 h-5 stroke-[3]" /></span>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function RoleCard({ active, onClick, icon, title, description }: any) {
  const colorClass = title.includes('Student') ? 'bg-[#ffcc00]' : 'bg-[#af52de]'
  const textColor = title.includes('Student') ? 'text-[#1d1d1f]' : 'text-white'
  
  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex flex-col items-center text-center p-8 rounded-xl border-4 transition-all duration-100 group",
        active 
          ? `border-black ${colorClass} shadow-xl translate-x-[-4px] translate-y-[-4px]` 
          : "border-black bg-white hover:bg-white"
      )}
    >
      <div className={clsx(
        "w-20 h-20 rounded-xl flex items-center justify-center mb-6 border border-black/5 shadow-xl transition-transform group-hover:scale-110",
        active ? "bg-white text-[#1d1d1f]" : `${colorClass} ${textColor}`
      )}>
        {icon}
      </div>
      <h3 className={clsx("text-xl font-semibold uppercase tracking-tighter mb-3", active ? "text-[#1d1d1f]" : "text-[#1d1d1f]")}>{title}</h3>
      <p className="text-sm font-semibold leading-relaxed">{description}</p>
    </button>
  )
}

function InputWithIcon({
  icon,
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  icon: React.ReactNode
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  type?: string
}) {
  return (
    <div className="w-full">
      <label className="block text-xs font-semibold text-[#1d1d1f] uppercase tracking-widest mb-2 ml-1">{label}</label>
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1d1d1f]">
          {icon}
        </div>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-black/5 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all shadow-xl text-[#1d1d1f] placeholder:text-[#1d1d1f]"
        />
      </div>
    </div>
  )
}
