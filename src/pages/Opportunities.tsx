import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/useAuthStore'
import { 
  Plus, 
  Search, 
  Filter, 
  Bookmark, 
  MapPin, 
  Building2, 
  Calendar, 
  ArrowRight,
  Sparkles,
  Tag
} from 'lucide-react'
import { clsx } from 'clsx'

export default function Opportunities() {
  const [opportunities, setOpportunities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const { profile } = useAuthStore()

  useEffect(() => {
    fetchOpportunities()
  }, [])

  const fetchOpportunities = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('opportunities')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) setOpportunities(data)
    if (error) console.error('Error fetching opportunities:', error)
    setLoading(false)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-brand-900">Academic Opportunities</h1>
          <p className="text-brand-500 mt-1 font-medium">Find research labs, mentorships, and workshops.</p>
        </div>
        {profile?.role === 'professor' && (
          <button 
            onClick={() => setShowCreateModal(true)}
            className="gradient-brand text-white px-6 py-3 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" /> Post Opportunity
          </button>
        )}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-400" />
          <input 
            type="text" 
            placeholder="Search titles, majors, or universities..."
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white border border-brand-100 focus:ring-2 focus:ring-brand-500 outline-none transition-all shadow-sm"
          />
        </div>
        <button className="flex items-center gap-2 bg-white border border-brand-100 px-6 py-3.5 rounded-2xl font-bold text-brand-600 hover:bg-brand-50 transition-all shadow-sm">
          <Filter className="w-5 h-5" /> Filters
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
        {loading ? (
          [1, 2, 3, 4].map(i => <OpportunitySkeleton key={i} />)
        ) : opportunities.length > 0 ? (
          opportunities.map(opp => <OpportunityCard key={opp.id} opportunity={opp} />)
        ) : (
          <div className="col-span-full py-20 text-center">
             <div className="w-20 h-20 gradient-soft rounded-3xl flex items-center justify-center text-brand-300 mx-auto mb-6">
                <Sparkles className="w-10 h-10" />
             </div>
             <h3 className="text-xl font-bold text-brand-900">No opportunities yet</h3>
             <p className="text-brand-500 mt-2">Check back later or try a different search.</p>
          </div>
        )}
      </div>

      {showCreateModal && <CreateOpportunityModal onClose={() => setShowCreateModal(false)} onCreated={fetchOpportunities} />}
    </div>
  )
}

function OpportunityCard({ opportunity }: { opportunity: any }) {
  return (
    <div className="bg-white rounded-[2rem] border border-brand-100 shadow-sm hover:shadow-md transition-all p-8 flex flex-col group relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 gradient-soft rounded-bl-[4rem] -z-0 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className="w-14 h-14 rounded-2xl gradient-brand flex items-center justify-center text-white font-bold text-xl shadow-md">
          {opportunity.university?.charAt(0)}
        </div>
        <button className="text-brand-300 hover:text-accent-600 transition-colors p-2">
          <Bookmark className="w-6 h-6" />
        </button>
      </div>

      <div className="relative z-10 flex-1">
        <h3 className="text-xl font-bold text-brand-900 mb-2 group-hover:text-accent-600 transition-colors">{opportunity.title}</h3>
        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-2 text-brand-500 font-medium text-sm">
            <Building2 className="w-4 h-4" /> {opportunity.university}
          </div>
          <div className="flex items-center gap-2 text-brand-500 font-medium text-sm">
            <Tag className="w-4 h-4" /> {opportunity.department}
          </div>
          {opportunity.deadline && (
            <div className="flex items-center gap-2 text-brand-400 font-medium text-xs">
              <Calendar className="w-4 h-4" /> Deadline: {new Date(opportunity.deadline).toLocaleDateString()}
            </div>
          )}
        </div>

        <p className="text-brand-600 text-sm line-clamp-3 mb-6 leading-relaxed">
          {opportunity.description}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-8 relative z-10">
        {opportunity.tags?.map((tag: string) => (
          <span key={tag} className="bg-brand-50 text-brand-600 px-3 py-1 rounded-full text-xs font-bold">
            {tag}
          </span>
        ))}
      </div>

      <button className="w-full bg-brand-50 text-brand-800 font-bold py-3.5 rounded-2xl hover:gradient-brand hover:text-white transition-all duration-300 flex items-center justify-center gap-2 group/btn">
        View Details <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
      </button>
    </div>
  )
}

function OpportunitySkeleton() {
  return (
    <div className="bg-white rounded-[2rem] border border-brand-100 p-8 h-[400px] animate-pulse">
      <div className="w-14 h-14 bg-brand-50 rounded-2xl mb-6" />
      <div className="h-6 bg-brand-50 rounded-full w-3/4 mb-4" />
      <div className="space-y-2 mb-6">
        <div className="h-4 bg-brand-50 rounded-full w-1/2" />
        <div className="h-4 bg-brand-50 rounded-full w-1/3" />
      </div>
      <div className="h-20 bg-brand-50 rounded-2xl mb-6" />
      <div className="flex gap-2 mb-8">
        <div className="h-6 bg-brand-50 rounded-full w-16" />
        <div className="h-6 bg-brand-50 rounded-full w-16" />
      </div>
      <div className="h-12 bg-brand-50 rounded-2xl" />
    </div>
  )
}

function CreateOpportunityModal({ onClose, onCreated }: any) {
  const [loading, setLoading] = useState(false)
  const { profile } = useAuthStore()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    university: profile?.school_name || '',
    department: profile?.department || '',
    tags: '',
    requirements: '',
    contact_method: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const { error } = await supabase
      .from('opportunities')
      .insert([{
        ...formData,
        professor_id: profile?.id,
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t)
      }])

    if (!error) {
      onCreated()
      onClose()
    } else {
      alert('Error creating opportunity: ' + error.message)
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-brand-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl p-8 md:p-12 animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
        <h2 className="text-3xl font-bold text-brand-900 mb-2">Post an Opportunity</h2>
        <p className="text-brand-500 mb-8 font-medium">Share research labs, mentorships, or events with students.</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-brand-900 mb-2">Title</label>
            <input 
              required
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-brand-200 focus:ring-2 focus:ring-brand-500 outline-none transition-all"
              placeholder="e.g. Undergraduate Research Assistant - AI Lab"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-brand-900 mb-2">University</label>
              <input 
                required
                value={formData.university}
                onChange={e => setFormData({...formData, university: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-brand-200 focus:ring-2 focus:ring-brand-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand-900 mb-2">Department</label>
              <input 
                required
                value={formData.department}
                onChange={e => setFormData({...formData, department: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-brand-200 focus:ring-2 focus:ring-brand-500 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-brand-900 mb-2">Description</label>
            <textarea 
              required
              rows={4}
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-brand-200 focus:ring-2 focus:ring-brand-500 outline-none transition-all resize-none"
              placeholder="Describe the opportunity, responsibilities, and learning outcomes..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-brand-900 mb-2">Tags (comma separated)</label>
            <input 
              value={formData.tags}
              onChange={e => setFormData({...formData, tags: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-brand-200 focus:ring-2 focus:ring-brand-500 outline-none transition-all"
              placeholder="Research, AI, CS, STEM..."
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-4 rounded-xl font-bold text-brand-600 hover:bg-brand-50 transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex-1 gradient-brand text-white py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
            >
              {loading ? 'Posting...' : 'Post Opportunity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
