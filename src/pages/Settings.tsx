import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { makeProfilePayload, uploadProfileImage, upsertProfile } from '@/lib/supabaseHelpers'
import { Bell, Camera, Check, Loader2, Shield, User } from 'lucide-react'
import { clsx } from 'clsx'

export default function Settings() {
  const { profile, setProfile } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState(() => makeForm(profile))
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  useEffect(() => {
    setFormData(makeForm(profile))
  }, [profile?.id])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    setLoading(true)
    setSuccess(false)
    setError(null)

    try {
      const avatarUrl = avatarFile ? await uploadProfileImage(profile.id, avatarFile) : formData.avatar_url
      const profileData = makeProfilePayload({
        id: profile.id,
        email: profile.email,
        role: profile.role,
        full_name: formData.full_name,
        username: formData.username,
        school_name: formData.school_name,
        school_type: formData.school_type,
        academic_year: profile.role === 'student' ? formData.academic_year : null,
        department: formData.department,
        bio: formData.bio,
        interests: splitTags(formData.interestsText),
        transfer_goals: profile.role === 'student' ? formData.transfer_goals : null,
        avatar_url: avatarUrl,
        gender: formData.gender,
      })

      const { data, error } = await upsertProfile(profileData)
      if (error || !data) {
        console.warn('Profile update failed:', error)
        setError('We could not save your profile. Please check your Supabase profile permissions.')
        return
      }
      setProfile(data)
      if (avatarFile) {
        setAvatarFile(null)
        setAvatarPreview(null)
        setFormData((current) => ({ ...current, avatar_url: avatarUrl }))
      }
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (error) {
      console.warn('Profile update failed:', error)
      setError('We could not save your profile just now.')
    } finally {
      setLoading(false)
    }
  }

  if (!profile) return <div className="py-20 text-center">Profile not found</div>

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-bold text-brand-900">Settings</h1>
        <p className="text-brand-500 mt-1 font-medium">Manage your account and profile preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-2">
          <SettingsTab icon={<User className="w-5 h-5" />} label="Profile" active />
          <SettingsTab icon={<Bell className="w-5 h-5" />} label="Notifications" />
          <SettingsTab icon={<Shield className="w-5 h-5" />} label="Privacy & Security" />
        </div>

        <div className="lg:col-span-3 space-y-8">
          <div className="bg-white rounded-[2.5rem] border border-brand-100 shadow-sm p-8 md:p-12">
            <h2 className="text-xl font-bold text-brand-900 mb-8">Profile Information</h2>

            {error && <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100">{error}</div>}

            <form onSubmit={handleUpdateProfile} className="space-y-8">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="w-28 h-28 rounded-[2rem] gradient-soft flex items-center justify-center border-4 border-white shadow-lg overflow-hidden shrink-0">
                  {avatarPreview || formData.avatar_url ? <img src={avatarPreview || formData.avatar_url} alt="" className="w-full h-full object-cover" /> : <User className="w-12 h-12 text-brand-300" />}
                </div>
                <div className="w-full">
                  <label className="block text-sm font-semibold text-brand-900 mb-2">Profile Image</label>
                  <label className="cursor-pointer bg-white border border-brand-100 text-brand-800 px-6 py-3 rounded-2xl font-bold shadow-sm hover:shadow-md transition-all inline-flex items-center gap-2">
                    <Camera className="w-5 h-5" />
                    Choose Image
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0]
                        if (!file) return
                        setAvatarFile(file)
                        const reader = new FileReader()
                        reader.onloadend = () => setAvatarPreview(reader.result as string)
                        reader.readAsDataURL(file)
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TextField label="Full Name" value={formData.full_name} onChange={(full_name) => setFormData({ ...formData, full_name })} />
                <TextField label="Username" value={formData.username} onChange={(username) => setFormData({ ...formData, username })} />
                <TextField label="College" value={formData.school_name} onChange={(school_name) => setFormData({ ...formData, school_name })} />
                {profile.role === 'student' ? (
                  <>
                    <TextField label="Major" value={formData.department} onChange={(department) => setFormData({ ...formData, department })} />
                    <TextField label="Academic Year" value={formData.academic_year} onChange={(academic_year) => setFormData({ ...formData, academic_year })} />
                  </>
                ) : (
                  <TextField label="Department" value={formData.department} onChange={(department) => setFormData({ ...formData, department })} />
                )}
              </div>

              <TextArea label="Biography" value={formData.bio} onChange={(bio) => setFormData({ ...formData, bio })} placeholder="Tell your story..." />
              <TextArea label="Interests" value={formData.interestsText} onChange={(interestsText) => setFormData({ ...formData, interestsText })} placeholder="Separate interests with commas." />
              {profile.role === 'student' && (
                <TextArea label="Transfer Goals" value={formData.transfer_goals} onChange={(transfer_goals) => setFormData({ ...formData, transfer_goals })} placeholder="Target schools, target majors, and academic goals." />
              )}

              <div className="flex items-center gap-4 pt-4">
                <button
                  type="submit"
                  disabled={loading || !formData.full_name || !formData.username || !formData.school_name}
                  className="bg-brand-900 text-white px-8 py-3.5 rounded-2xl font-bold shadow-lg hover:bg-black transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (success ? <Check className="w-5 h-5" /> : 'Save Changes')}
                </button>
                {success && <span className="text-green-600 font-bold text-sm animate-in fade-in duration-300">Profile updated successfully!</span>}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-brand-900 mb-2">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-xl border border-brand-200 focus:ring-2 focus:ring-brand-500 outline-none transition-all"
      />
    </div>
  )
}

function TextArea({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-brand-900 mb-2">{label}</label>
      <textarea
        rows={4}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-xl border border-brand-200 focus:ring-2 focus:ring-brand-500 outline-none transition-all resize-none"
        placeholder={placeholder}
      />
    </div>
  )
}

function SettingsTab({ icon, label, active }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <button className={clsx(
      'w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all text-left',
      active ? 'bg-brand-900 text-white shadow-lg' : 'text-brand-500 hover:bg-white hover:text-brand-900'
    )}>
      {icon}
      <span>{label}</span>
    </button>
  )
}

function makeForm(profile: any) {
  return {
    full_name: profile?.full_name || '',
    username: profile?.username || '',
    school_name: profile?.school_name || '',
    school_type: profile?.school_type || (profile?.role === 'professor' ? 'university' : 'community_college'),
    academic_year: profile?.academic_year || '',
    department: profile?.department || '',
    bio: profile?.bio || '',
    interestsText: Array.isArray(profile?.interests) ? profile.interests.join(', ') : '',
    transfer_goals: profile?.transfer_goals || '',
    avatar_url: profile?.avatar_url || '',
    gender: profile?.gender || 'prefer-not-to-say',
  }
}

function splitTags(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean)
}
