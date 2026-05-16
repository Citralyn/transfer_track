import { useState } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { supabase } from '@/lib/supabase'
import { User, Bell, Shield, LogOut, Check, Loader2 } from 'lucide-react'
import { clsx } from 'clsx'

export default function Settings() {
  const { profile, setProfile } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    bio: profile?.bio || '',
    username: profile?.username || ''
  })
  const [success, setSuccess] = useState(false)

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSuccess(false)

    const { data, error } = await supabase
      .from('profiles')
      .update(formData)
      .eq('id', profile?.id)
      .select()
      .single()

    if (data) {
      setProfile(data)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }
    setLoading(false)
  }

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
            <h2 className="text-xl font-bold text-brand-900 mb-8">Personal Information</h2>
            
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-brand-900 mb-2">Full Name</label>
                  <input 
                    value={formData.full_name}
                    onChange={e => setFormData({...formData, full_name: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-brand-200 focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-brand-900 mb-2">Username</label>
                  <input 
                    value={formData.username}
                    onChange={e => setFormData({...formData, username: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-brand-200 focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-brand-900 mb-2">Bio</label>
                <textarea 
                  rows={4}
                  value={formData.bio}
                  onChange={e => setFormData({...formData, bio: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-brand-200 focus:ring-2 focus:ring-brand-500 outline-none transition-all resize-none"
                  placeholder="Tell your story..."
                />
              </div>

              <div className="flex items-center gap-4 pt-4">
                <button 
                  type="submit"
                  disabled={loading}
                  className="bg-brand-900 text-white px-8 py-3.5 rounded-2xl font-bold shadow-lg hover:bg-black transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (success ? <Check className="w-5 h-5" /> : 'Save Changes')}
                </button>
                {success && <span className="text-green-600 font-bold text-sm animate-in fade-in duration-300">Profile updated successfully!</span>}
              </div>
            </form>
          </div>

          <div className="bg-red-50/50 rounded-[2.5rem] border border-red-100 p-8 md:p-12">
            <h2 className="text-xl font-bold text-red-900 mb-2">Danger Zone</h2>
            <p className="text-red-600/70 text-sm mb-8 font-medium">Once you delete your account, there is no going back. Please be certain.</p>
            <button className="bg-white text-red-600 border border-red-200 px-8 py-3.5 rounded-2xl font-bold shadow-sm hover:bg-red-600 hover:text-white transition-all">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function SettingsTab({ icon, label, active }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <button className={clsx(
      "w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all text-left",
      active ? "bg-brand-900 text-white shadow-lg" : "text-brand-500 hover:bg-white hover:text-brand-900"
    )}>
      {icon}
      <span>{label}</span>
    </button>
  )
}
