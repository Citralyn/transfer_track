import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import {
  makeProfilePayload,
  uploadProfileBanner,
  uploadProfileImage,
  upsertProfile,
  type ClassMaterialEntry,
  type CourseworkEntry,
  type ExperienceEntry,
  type ProjectEntry,
  type ResearchEntry,
} from '@/lib/supabaseHelpers'
import { Bell, Camera, Check, Loader2, Plus, Shield, Trash2, User } from 'lucide-react'
import { clsx } from 'clsx'

export default function Settings() {
  const { profile, setProfile } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState(() => makeForm(profile))
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)

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
      const bannerUrl = bannerFile ? await uploadProfileBanner(profile.id, bannerFile) : formData.banner_url
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
        banner_url: bannerUrl,
        gender: formData.gender,
        coursework: formData.coursework,
        experience: formData.experience,
        projects: formData.projects,
        class_materials: formData.class_materials,
        research: formData.research,
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
      }
      if (bannerFile) {
        setBannerFile(null)
        setBannerPreview(null)
      }
      setFormData((current) => ({ ...current, avatar_url: avatarUrl, banner_url: bannerUrl }))
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

              <div>
                <label className="block text-sm font-semibold text-brand-900 mb-2">Profile Banner</label>
                <div className="h-40 rounded-[2rem] gradient-brand overflow-hidden border border-brand-100 shadow-sm mb-4">
                  {bannerPreview || formData.banner_url ? (
                    <img src={bannerPreview || formData.banner_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
                  )}
                </div>
                <label className="cursor-pointer bg-white border border-brand-100 text-brand-800 px-6 py-3 rounded-2xl font-bold shadow-sm hover:shadow-md transition-all inline-flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  Choose Banner
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      if (!file) return
                      setBannerFile(file)
                      const reader = new FileReader()
                      reader.onloadend = () => setBannerPreview(reader.result as string)
                      reader.readAsDataURL(file)
                    }}
                  />
                </label>
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

              {profile.role === 'student' ? (
                <>
                  <CourseworkEditor
                    entries={formData.coursework}
                    onChange={(coursework) => setFormData({ ...formData, coursework })}
                  />
                  <ExperienceEditor
                    entries={formData.experience}
                    onChange={(experience) => setFormData({ ...formData, experience })}
                  />
                  <ProjectsEditor
                    entries={formData.projects}
                    onChange={(projects) => setFormData({ ...formData, projects })}
                  />
                </>
              ) : (
                <>
                  <ClassMaterialsEditor
                    entries={formData.class_materials}
                    onChange={(class_materials) => setFormData({ ...formData, class_materials })}
                  />
                  <ResearchEditor
                    entries={formData.research}
                    onChange={(research) => setFormData({ ...formData, research })}
                  />
                </>
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

function CourseworkEditor({ entries, onChange }: { entries: CourseworkEntry[]; onChange: (entries: CourseworkEntry[]) => void }) {
  const addEntry = () => onChange([...entries, { id: makeEntryId(), course_name: '', course_code: '', description: '' }])

  return (
    <EntrySection title="Coursework" onAdd={addEntry}>
      {entries.map((entry, index) => (
        <EntryCard key={entry.id} onDelete={() => onChange(entries.filter((item) => item.id !== entry.id))}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField label="Course Name" value={entry.course_name} onChange={(course_name) => updateEntry(entries, index, { ...entry, course_name }, onChange)} />
            <TextField label="Course Code" value={entry.course_code || ''} onChange={(course_code) => updateEntry(entries, index, { ...entry, course_code }, onChange)} />
          </div>
          <TextArea label="Description / Topics" value={entry.description || ''} onChange={(description) => updateEntry(entries, index, { ...entry, description }, onChange)} placeholder="What did you learn?" />
        </EntryCard>
      ))}
    </EntrySection>
  )
}

function ExperienceEditor({ entries, onChange }: { entries: ExperienceEntry[]; onChange: (entries: ExperienceEntry[]) => void }) {
  const addEntry = () => onChange([...entries, { id: makeEntryId(), title: '', organization: '', start_date: '', end_date: '', is_present: false, description: '' }])

  return (
    <EntrySection title="Experience" onAdd={addEntry}>
      {entries.map((entry, index) => (
        <EntryCard key={entry.id} onDelete={() => onChange(entries.filter((item) => item.id !== entry.id))}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField label="Title / Role" value={entry.title} onChange={(title) => updateEntry(entries, index, { ...entry, title }, onChange)} />
            <TextField label="Organization" value={entry.organization} onChange={(organization) => updateEntry(entries, index, { ...entry, organization }, onChange)} />
            <TextField label="Start Date" value={entry.start_date || ''} onChange={(start_date) => updateEntry(entries, index, { ...entry, start_date }, onChange)} />
            <TextField label="End Date" value={entry.is_present ? '' : entry.end_date || ''} onChange={(end_date) => updateEntry(entries, index, { ...entry, end_date }, onChange)} />
          </div>
          <label className="flex items-center gap-2 text-sm font-bold text-brand-600">
            <input
              type="checkbox"
              checked={Boolean(entry.is_present)}
              onChange={(event) => updateEntry(entries, index, { ...entry, is_present: event.target.checked, end_date: event.target.checked ? '' : entry.end_date }, onChange)}
            />
            Present
          </label>
          <TextArea label="Description" value={entry.description || ''} onChange={(description) => updateEntry(entries, index, { ...entry, description }, onChange)} placeholder="Describe your responsibilities or impact." />
        </EntryCard>
      ))}
    </EntrySection>
  )
}

function ProjectsEditor({ entries, onChange }: { entries: ProjectEntry[]; onChange: (entries: ProjectEntry[]) => void }) {
  const addEntry = () => onChange([...entries, { id: makeEntryId(), project_name: '', description: '', tech_stack: '', link: '' }])

  return (
    <EntrySection title="Projects" onAdd={addEntry}>
      {entries.map((entry, index) => (
        <EntryCard key={entry.id} onDelete={() => onChange(entries.filter((item) => item.id !== entry.id))}>
          <TextField label="Project Name" value={entry.project_name} onChange={(project_name) => updateEntry(entries, index, { ...entry, project_name }, onChange)} />
          <TextArea label="Description" value={entry.description} onChange={(description) => updateEntry(entries, index, { ...entry, description }, onChange)} placeholder="What did you build or investigate?" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField label="Tech Stack" value={entry.tech_stack || ''} onChange={(tech_stack) => updateEntry(entries, index, { ...entry, tech_stack }, onChange)} />
            <TextField label="Link" value={entry.link || ''} onChange={(link) => updateEntry(entries, index, { ...entry, link }, onChange)} />
          </div>
        </EntryCard>
      ))}
    </EntrySection>
  )
}

function ClassMaterialsEditor({ entries, onChange }: { entries: ClassMaterialEntry[]; onChange: (entries: ClassMaterialEntry[]) => void }) {
  const addEntry = () => onChange([...entries, { id: makeEntryId(), course_name: '', course_code: '', title: '', description: '', link: '' }])

  return (
    <EntrySection title="Class Material" onAdd={addEntry}>
      {entries.map((entry, index) => (
        <EntryCard key={entry.id} onDelete={() => onChange(entries.filter((item) => item.id !== entry.id))}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField label="Course Name" value={entry.course_name} onChange={(course_name) => updateEntry(entries, index, { ...entry, course_name }, onChange)} />
            <TextField label="Course Code" value={entry.course_code || ''} onChange={(course_code) => updateEntry(entries, index, { ...entry, course_code }, onChange)} />
          </div>
          <TextField label="Material Title" value={entry.title} onChange={(title) => updateEntry(entries, index, { ...entry, title }, onChange)} />
          <TextArea label="Description" value={entry.description || ''} onChange={(description) => updateEntry(entries, index, { ...entry, description }, onChange)} placeholder="What should students know about this material?" />
          <TextField label="Link" value={entry.link || ''} onChange={(link) => updateEntry(entries, index, { ...entry, link }, onChange)} />
        </EntryCard>
      ))}
    </EntrySection>
  )
}

function ResearchEditor({ entries, onChange }: { entries: ResearchEntry[]; onChange: (entries: ResearchEntry[]) => void }) {
  const addEntry = () => onChange([...entries, { id: makeEntryId(), title: '', publication: '', year: '', description: '', link: '' }])

  return (
    <EntrySection title="Research" onAdd={addEntry}>
      {entries.map((entry, index) => (
        <EntryCard key={entry.id} onDelete={() => onChange(entries.filter((item) => item.id !== entry.id))}>
          <TextField label="Title" value={entry.title} onChange={(title) => updateEntry(entries, index, { ...entry, title }, onChange)} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField label="Publication / Venue" value={entry.publication || ''} onChange={(publication) => updateEntry(entries, index, { ...entry, publication }, onChange)} />
            <TextField label="Year" value={entry.year || ''} onChange={(year) => updateEntry(entries, index, { ...entry, year }, onChange)} />
          </div>
          <TextArea label="Description / Abstract" value={entry.description || ''} onChange={(description) => updateEntry(entries, index, { ...entry, description }, onChange)} placeholder="Summarize the research or publication." />
          <TextField label="Link / DOI" value={entry.link || ''} onChange={(link) => updateEntry(entries, index, { ...entry, link }, onChange)} />
        </EntryCard>
      ))}
    </EntrySection>
  )
}

function EntrySection({ title, onAdd, children }: { title: string; onAdd: () => void; children: React.ReactNode }) {
  return (
    <section className="border-t border-brand-50 pt-8 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-lg font-bold text-brand-900">{title}</h3>
        <button type="button" onClick={onAdd} className="bg-brand-50 text-brand-800 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 border border-brand-100">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

function EntryCard({ onDelete, children }: { onDelete: () => void; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-brand-100 bg-brand-50/50 p-5 space-y-4">
      <div className="flex justify-end">
        <button type="button" onClick={onDelete} className="text-red-500 hover:text-red-600 font-bold text-sm flex items-center gap-1">
          <Trash2 className="w-4 h-4" /> Delete
        </button>
      </div>
      {children}
    </div>
  )
}

function updateEntry<T>(entries: T[], index: number, nextEntry: T, onChange: (entries: T[]) => void) {
  onChange(entries.map((entry, entryIndex) => entryIndex === index ? nextEntry : entry))
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
    banner_url: profile?.banner_url || '',
    gender: profile?.gender || 'prefer-not-to-say',
    coursework: normalizeEntries<CourseworkEntry>(profile?.coursework),
    experience: normalizeEntries<ExperienceEntry>(profile?.experience),
    projects: normalizeEntries<ProjectEntry>(profile?.projects),
    class_materials: normalizeEntries<ClassMaterialEntry>(profile?.class_materials),
    research: normalizeEntries<ResearchEntry>(profile?.research),
  }
}

function splitTags(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean)
}

function normalizeEntries<T>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : []
}

function makeEntryId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`
}
