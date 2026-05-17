import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Briefcase, Calendar, Tag } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useAuthStore } from '@/store/useAuthStore'
import { withTimeout } from '@/lib/supabaseHelpers'
import { LoadingScreen } from '@/components/ui/LoadingScreen'

export default function ProfessorOpportunities() {
  const { username } = useParams()
  const { profile: loggedInProfile } = useAuthStore()
  const [professor, setProfessor] = useState<any>(null)
  const [opportunities, setOpportunities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProfessorOpportunities()
  }, [username, loggedInProfile?.id])

  const loadProfessorOpportunities = async () => {
    setLoading(true)
    const targetUsername = username || loggedInProfile?.username

    if (!targetUsername) {
      setLoading(false)
      return
    }

    if (!isSupabaseConfigured()) {
      const isOwnProfile = loggedInProfile?.username === targetUsername
      setProfessor(isOwnProfile ? loggedInProfile : null)
      setOpportunities([])
      setLoading(false)
      return
    }

    try {
      const { data: profileData, error: profileError } = await withTimeout(
        supabase
          .from('profiles')
          .select('*')
          .eq('username', targetUsername)
          .maybeSingle(),
        'Supabase professor profile lookup'
      )

      if (profileError || !profileData) {
        setProfessor(null)
        setOpportunities([])
        setLoading(false)
        return
      }

      setProfessor(profileData)

      const { data, error } = await withTimeout(
        supabase
          .from('opportunities')
          .select('*')
          .eq('professor_id', profileData.id)
          .order('created_at', { ascending: false }),
        'Supabase professor opportunities page lookup'
      )

      if (error) {
        console.warn('Professor opportunities lookup failed:', error.message)
        setOpportunities([])
      } else {
        setOpportunities(data || [])
      }
    } catch (error) {
      console.warn('Professor opportunities page unavailable:', error)
      setProfessor(null)
      setOpportunities([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingScreen />
  if (!professor) return <div className="py-20 text-center">Professor not found</div>

  return (
    <div className="space-y-8 pb-20">
      <div>
        <Link to={`/profile/${professor.username}`} className="inline-flex items-center gap-2 text-brand-500 hover:text-brand-900 font-bold text-sm mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to profile
        </Link>
        <h1 className="text-3xl font-bold text-brand-900">Posted Opportunities</h1>
        <p className="text-brand-500 mt-1 font-medium">All opportunities posted by {professor.full_name}.</p>
      </div>

      {opportunities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {opportunities.map((opportunity) => (
            <div key={opportunity.id} className="bg-white rounded-[2rem] border border-brand-100 shadow-sm p-7">
              <div className="w-12 h-12 rounded-2xl gradient-brand text-white flex items-center justify-center mb-5">
                <Briefcase className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-brand-900">{opportunity.title}</h2>
              <div className="flex flex-wrap gap-3 text-sm text-brand-500 font-medium mt-3">
                <span className="flex items-center gap-1.5"><Tag className="w-4 h-4" /> {opportunity.department}</span>
                {opportunity.deadline && (
                  <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {new Date(opportunity.deadline).toLocaleDateString()}</span>
                )}
              </div>
              <p className="text-brand-600 mt-5 leading-relaxed whitespace-pre-wrap">{opportunity.description}</p>
              {opportunity.requirements && (
                <div className="mt-5 p-4 rounded-2xl bg-brand-50 border border-brand-100">
                  <p className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-2">Requirements</p>
                  <p className="text-sm text-brand-600">{opportunity.requirements}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-[2.5rem] border border-brand-100 bg-white p-10 text-center shadow-sm">
          <div className="w-16 h-16 gradient-soft rounded-3xl flex items-center justify-center text-brand-300 mx-auto mb-5">
            <Briefcase className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-brand-900">No opportunities posted yet.</h3>
          <p className="text-brand-500 mt-2">When this professor posts opportunities, they will appear here.</p>
        </div>
      )}
    </div>
  )
}
