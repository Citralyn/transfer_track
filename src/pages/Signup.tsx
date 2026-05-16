import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
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
  Lock,
  AtSign,
  Calendar,
  Building2
} from 'lucide-react'
import { clsx } from 'clsx'

export default function Signup() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [schools, setSchools] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const { setProfile } = useAuthStore()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    role: '' as 'student' | 'professor' | '',
    school_name: '',
    school_type: '',
    full_name: '',
    username: '',
    email: '',
    password: '',
    academic_year: '',
    department: '',
    gender: 'prefer-not-to-say'
  })

  useEffect(() => {
    const fetchSchools = async () => {
      const { data } = await supabase.from('schools').select('*')
      if (data) setSchools(data)
    }
    fetchSchools()
  }, [])

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

    // 1. Create Auth User
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    if (authData.user) {
      // 2. Create Profile
      const profileData = {
        id: authData.user.id,
        role: formData.role,
        full_name: formData.full_name,
        username: formData.username,
        email: formData.email,
        school_name: formData.school_name,
        school_type: formData.school_type,
        academic_year: formData.academic_year || null,
        department: formData.department || null,
        gender: formData.gender
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert([profileData])
        .select()
        .single()

      if (profileError) {
        setError("Account created but profile failed: " + profileError.message)
      } else {
        setProfile(profile)
        navigate('/feed')
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-brand-50 px-6 py-12 flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 gradient-brand rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
              TT
            </div>
            <span className="text-2xl font-bold text-brand-900 tracking-tight">Transfer Track</span>
          </Link>
          <div className="flex items-center justify-center gap-2 mb-2">
             {[1, 2, 3].map(s => (
               <div key={s} className={clsx(
                 "h-1.5 rounded-full transition-all duration-300",
                 step === s ? "w-8 gradient-brand" : "w-2 bg-brand-200"
               )} />
             ))}
          </div>
        </div>

        <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl border border-brand-100 min-h-[500px] flex flex-col">
          {error && (
            <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100 animate-in fade-in zoom-in-95">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1 flex flex-col">
              <h2 className="text-3xl font-bold text-brand-900 mb-2 text-center">Join the Community</h2>
              <p className="text-brand-600 mb-10 text-center">Are you a student or a professor?</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 flex-1">
                <RoleCard 
                  active={formData.role === 'student'}
                  onClick={() => setFormData({ ...formData, role: 'student', school_type: 'community_college' })}
                  icon={<BookOpen className="w-10 h-10" />}
                  title="Community College Student"
                  description="I'm preparing to transfer to a 4-year university."
                />
                <RoleCard 
                  active={formData.role === 'professor'}
                  onClick={() => setFormData({ ...formData, role: 'professor', school_type: 'university' })}
                  icon={<GraduationCap className="w-10 h-10" />}
                  title="University Professor"
                  description="I'm teaching at a 4-year university and want to connect."
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1 flex flex-col">
              <h2 className="text-3xl font-bold text-brand-900 mb-2 text-center">School Selection</h2>
              <p className="text-brand-600 mb-8 text-center">Where are you currently {formData.role === 'student' ? 'studying' : 'teaching'}?</p>
              
              <div className="space-y-6 flex-1 max-w-md mx-auto w-full">
                <div>
                  <label className="block text-sm font-semibold text-brand-900 mb-3">
                    California {formData.role === 'student' ? 'Community College' : 'University'}
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-400" />
                    <select 
                      value={formData.school_name}
                      onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
                      className="w-full pl-12 pr-4 py-4 rounded-2xl border border-brand-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all bg-white appearance-none text-lg text-brand-900 shadow-sm"
                    >
                      <option value="">Select a school...</option>
                      {schools
                        .filter(s => s.type === formData.school_type)
                        .map(s => (
                          <option key={s.id} value={s.name}>{s.name}</option>
                        ))
                      }
                    </select>
                  </div>
                </div>

                {formData.role === 'student' && (
                  <div>
                    <label className="block text-sm font-semibold text-brand-900 mb-3 text-center">Academic Year</label>
                    <div className="grid grid-cols-2 gap-3">
                      {['Freshman', 'Sophomore', 'Junior', 'Senior'].map(year => (
                        <button
                          key={year}
                          onClick={() => setFormData({ ...formData, academic_year: year })}
                          className={clsx(
                            "px-4 py-3 rounded-xl border font-bold text-sm transition-all",
                            formData.academic_year === year 
                              ? "bg-accent-50 border-accent-200 text-accent-700 shadow-sm" 
                              : "border-brand-100 text-brand-500 hover:border-brand-200 hover:bg-brand-50"
                          )}
                        >
                          {year}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1 flex flex-col">
              <h2 className="text-3xl font-bold text-brand-900 mb-2 text-center">Account Details</h2>
              <p className="text-brand-600 mb-8 text-center">Create your login information</p>
              
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
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={v => setFormData({...formData, password: v})}
                />

                {formData.role === 'professor' && (
                  <InputWithIcon 
                    icon={<GraduationCap className="w-5 h-5" />}
                    label="Department"
                    placeholder="e.g. Computer Science"
                    value={formData.department}
                    onChange={v => setFormData({...formData, department: v})}
                  />
                )}
              </form>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-auto pt-10 flex items-center justify-between gap-4">
            {step > 1 ? (
              <button
                onClick={handleBack}
                className="px-8 py-4 rounded-2xl font-bold text-brand-600 hover:bg-brand-50 transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" /> Back
              </button>
            ) : (
              <Link to="/login" className="text-brand-600 font-bold hover:text-brand-900 px-4">
                Login instead
              </Link>
            )}

            {step < 3 ? (
              <button
                disabled={step === 1 ? !formData.role : !formData.school_name}
                onClick={handleNext}
                className="px-10 py-4 gradient-brand text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center gap-2 disabled:opacity-50 disabled:transform-none"
              >
                Next Step <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSignup}
                disabled={loading || !formData.email || !formData.password || !formData.full_name || !formData.username}
                className="px-10 py-4 gradient-brand text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center gap-2 disabled:opacity-50 disabled:transform-none"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Create Account <Check className="w-5 h-5" /></>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function RoleCard({ active, onClick, icon, title, description }: any) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex flex-col items-center text-center p-8 rounded-[2rem] border-2 transition-all duration-300 group",
        active 
          ? "border-accent-400 bg-accent-50 shadow-md ring-4 ring-accent-100" 
          : "border-brand-50 hover:border-brand-200 hover:bg-brand-50"
      )}
    >
      <div className={clsx(
        "w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-sm transition-transform group-hover:scale-110 duration-300",
        active ? "gradient-brand text-white" : "bg-brand-50 text-brand-400"
      )}>
        {icon}
      </div>
      <h3 className={clsx("text-xl font-bold mb-3", active ? "text-brand-900" : "text-brand-700")}>{title}</h3>
      <p className="text-sm text-brand-500 leading-relaxed">{description}</p>
    </button>
  )
}

function InputWithIcon({ icon, label, value, onChange, placeholder, type = "text" }: any) {
  return (
    <div className="w-full">
      <label className="block text-xs font-bold text-brand-400 uppercase tracking-widest mb-2 ml-1">{label}</label>
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-400">
          {icon}
        </div>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-brand-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all shadow-sm text-brand-900 placeholder:text-brand-300"
        />
      </div>
    </div>
  )
}
