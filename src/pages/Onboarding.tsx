import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useAuthStore } from '@/store/useAuthStore'
import { FALLBACK_SCHOOLS, makeProfilePayload, upsertProfile, withTimeout } from '@/lib/supabaseHelpers'
import { GraduationCap, BookOpen, User, Check, ArrowRight, ArrowLeft, Loader2, Upload } from 'lucide-react'
import { clsx } from 'clsx'

export default function Onboarding() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [schools, setSchools] = useState<any[]>(FALLBACK_SCHOOLS)
  const { user, setProfile } = useAuthStore()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    role: '' as 'student' | 'professor' | '',
    full_name: '',
    username: '',
    gender: 'prefer-not-to-say',
    school_name: '',
    school_type: '',
    academic_year: '',
    department: '',
    avatar_url: ''
  })

  useEffect(() => {
    const fetchSchools = async () => {
      if (!isSupabaseConfigured()) return

      try {
        const { data, error } = await withTimeout(
          supabase.from('schools').select('*'),
          'Supabase schools lookup'
        )
        if (error) {
          console.warn('Supabase schools lookup failed, using fallback schools:', error.message)
          return
        }
        if (data?.length) setSchools(data)
      } catch (error) {
        console.warn('Supabase schools unavailable, using fallback schools:', error)
      }
    }
    fetchSchools()
  }, [])

  const handleNext = () => setStep(step + 1)
  const handleBack = () => setStep(step - 1)

  const handleSubmit = async () => {
    if (!user) return
    setLoading(true)

    try {
      if (!formData.role) {
        alert('Please choose student or professor.')
        return
      }

      const profileData = makeProfilePayload({
        id: user.id,
        email: user.email!,
        role: formData.role,
        full_name: formData.full_name,
        username: formData.username,
        school_name: formData.school_name,
        school_type: formData.school_type,
        academic_year: formData.academic_year,
        department: formData.department,
        gender: formData.gender,
      })

      const { data, error } = await upsertProfile(profileData)

      if (error) {
        console.warn('Profile save failed, continuing with local profile:', (error as Error).message)
        setProfile(profileData)
        navigate(profileData.role === 'professor' ? '/professor-dashboard' : '/feed')
      } else {
        setProfile(data)
        navigate(data?.role === 'professor' ? '/professor-dashboard' : '/feed')
      }
    } catch (error) {
      console.warn('Onboarding save failed:', error)
      alert('We could not save just now. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-brand-50 px-6 py-12 flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-12 px-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div className={clsx(
                "w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-500",
                step >= s ? "gradient-brand text-white shadow-lg" : "bg-white text-brand-300 border border-brand-100"
              )}>
                {step > s ? <Check className="w-6 h-6" /> : s}
              </div>
              {s < 3 && (
                <div className={clsx(
                  "h-1 flex-1 mx-4 rounded-full transition-all duration-500",
                  step > s ? "gradient-brand" : "bg-brand-100"
                )} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl border border-brand-100 min-h-[500px] flex flex-col">
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1 flex flex-col">
              <h2 className="text-3xl font-bold text-brand-900 mb-2">Choose your path</h2>
              <p className="text-brand-600 mb-10">Are you a student or a professor?</p>
              
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
              <h2 className="text-3xl font-bold text-brand-900 mb-2">Where do you {formData.role === 'student' ? 'study' : 'teach'}?</h2>
              <p className="text-brand-600 mb-8">Select your {formData.role === 'student' ? 'Community College' : 'University'}</p>
              
              <div className="space-y-6 flex-1">
                <div>
                  <label className="block text-sm font-semibold text-brand-900 mb-3">California {formData.role === 'student' ? 'Community College' : 'University'}</label>
                  <select 
                    value={formData.school_name}
                    onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
                    className="w-full px-5 py-4 rounded-2xl border border-brand-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all bg-white appearance-none text-lg"
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
                
                {formData.role === 'student' ? (
                  <div>
                    <label className="block text-sm font-semibold text-brand-900 mb-3">Academic Year</label>
                    <div className="grid grid-cols-2 gap-4">
                      {['Freshman', 'Sophomore', 'Junior', 'Senior'].map(year => (
                        <button
                          key={year}
                          onClick={() => setFormData({ ...formData, academic_year: year })}
                          className={clsx(
                            "px-4 py-3 rounded-xl border font-medium transition-all",
                            formData.academic_year === year 
                              ? "bg-accent-50 border-accent-200 text-accent-700 shadow-sm" 
                              : "border-brand-100 text-brand-600 hover:border-brand-200"
                          )}
                        >
                          {year}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-semibold text-brand-900 mb-3">Department</label>
                    <input
                      type="text"
                      placeholder="e.g. Computer Science, Biology..."
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full px-5 py-4 rounded-2xl border border-brand-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all text-lg"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1 flex flex-col">
              <h2 className="text-3xl font-bold text-brand-900 mb-2">Final touches</h2>
              <p className="text-brand-600 mb-8">Tell us a bit about yourself</p>
              
              <div className="space-y-6 flex-1">
                <div className="flex flex-col items-center mb-8">
                   <div className="w-32 h-32 rounded-full gradient-soft flex items-center justify-center border-4 border-white shadow-xl relative overflow-hidden group cursor-pointer">
                      <User className="w-16 h-16 text-brand-300" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Upload className="w-8 h-8 text-white" />
                      </div>
                   </div>
                   <p className="text-xs text-brand-500 mt-3 font-medium">Upload profile photo</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-brand-900 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-brand-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                      placeholder="Jane Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-brand-900 mb-2">Username</label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-brand-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                      placeholder="janedoe24"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-brand-900 mb-2">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-brand-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all bg-white"
                  >
                    <option value="prefer-not-to-say">Prefer not to say</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="non-binary">Non-binary</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-12 flex items-center justify-between gap-4">
            {step > 1 ? (
              <button
                onClick={handleBack}
                className="px-8 py-4 rounded-2xl font-bold text-brand-600 hover:bg-brand-50 transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" /> Back
              </button>
            ) : <div />}

            {step < 3 ? (
              <button
                disabled={step === 1 ? !formData.role : !formData.school_name}
                onClick={handleNext}
                className="px-10 py-4 gradient-brand text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center gap-2 disabled:opacity-50 disabled:transform-none"
              >
                Continue <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading || !formData.full_name || !formData.username}
                className="px-10 py-4 gradient-brand text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center gap-2 disabled:opacity-50 disabled:transform-none"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Finish <Check className="w-5 h-5" /></>}
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
