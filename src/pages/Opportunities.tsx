import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/useAuthStore'
import { useQuery } from '@tanstack/react-query'
import { 
  Plus, 
  Search, 
  Filter, 
  Bookmark, 
  Building2, 
  Calendar, 
  ArrowRight,
  Sparkles,
  Tag,
  X,
  Loader2,
  User,
  Mail,
  ClipboardCheck
} from 'lucide-react'
import { clsx } from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'
import { ProfileAvatar } from '@/components/ui/ProfileAvatar'

export default function Opportunities() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedOpportunity, setSelectedOpportunity] = useState<any>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    department: '',
    university: '',
    professor: ''
  })
  
  const { profile } = useAuthStore()

  const { data: opportunities, isLoading, refetch } = useQuery({
    queryKey: ['opportunities', searchQuery, filters],
    queryFn: async () => {
      let query = supabase
        .from('opportunities')
        .select(`
          *,
          profiles:professor_id (
            full_name,
            username,
            avatar_url,
            department
          )
        `)
      
      if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`)
      }

      if (filters.department) {
        query = query.ilike('department', `%${filters.department}%`)
      }

      if (filters.university) {
        query = query.ilike('university', `%${filters.university}%`)
      }

      const { data, error } = await query.order('created_at', { ascending: false })
      
      if (error) throw error

      if (filters.professor && data) {
        return data.filter(opp => 
          opp.profiles?.full_name.toLowerCase().includes(filters.professor.toLowerCase())
        )
      }

      return data
    }
  })

  const clearFilters = () => {
    setFilters({ department: '', university: '', professor: '' })
    setSearchQuery('')
  }

  const activeFilterCount = Object.values(filters).filter(Boolean).length + (searchQuery ? 1 : 0)

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
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search titles..."
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white border border-brand-100 focus:ring-2 focus:ring-brand-500 outline-none transition-all shadow-sm"
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={clsx(
              "flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold transition-all shadow-sm border",
              showFilters || activeFilterCount > 0 
                ? "bg-brand-900 text-white border-brand-900" 
                : "bg-white text-brand-600 border-brand-100 hover:bg-brand-50"
            )}
          >
            <Filter className="w-5 h-5" /> 
            Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-white border border-brand-100 rounded-[2rem] p-6 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold text-brand-400 uppercase tracking-widest mb-2 ml-1">Department</label>
                  <input 
                    value={filters.department}
                    onChange={e => setFilters({...filters, department: e.target.value})}
                    placeholder="e.g. Computer Science"
                    className="w-full px-4 py-2.5 rounded-xl bg-brand-50 border border-transparent focus:border-brand-200 outline-none transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-400 uppercase tracking-widest mb-2 ml-1">University</label>
                  <input 
                    value={filters.university}
                    onChange={e => setFilters({...filters, university: e.target.value})}
                    placeholder="e.g. UCLA"
                    className="w-full px-4 py-2.5 rounded-xl bg-brand-50 border border-transparent focus:border-brand-200 outline-none transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-400 uppercase tracking-widest mb-2 ml-1">Professor</label>
                  <input 
                    value={filters.professor}
                    onChange={e => setFilters({...filters, professor: e.target.value})}
                    placeholder="Search by name"
                    className="w-full px-4 py-2.5 rounded-xl bg-brand-50 border border-transparent focus:border-brand-200 outline-none transition-all text-sm"
                  />
                </div>
                <div className="md:col-span-3 flex justify-end gap-3">
                   <button 
                    onClick={clearFilters}
                    className="text-brand-500 font-bold text-sm hover:text-brand-900 px-4 py-2"
                   >
                     Clear All
                   </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
        {isLoading ? (
          [1, 2, 3, 4].map(i => <OpportunitySkeleton key={i} />)
        ) : opportunities && opportunities.length > 0 ? (
          opportunities.map(opp => <OpportunityCard key={opp.id} opportunity={opp} onClick={() => setSelectedOpportunity(opp)} />)
        ) : (
          <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border border-brand-100">
             <div className="w-20 h-20 gradient-soft rounded-3xl flex items-center justify-center text-brand-300 mx-auto mb-6">
                <Sparkles className="w-10 h-10" />
             </div>
             <h3 className="text-xl font-bold text-brand-900">No opportunities found</h3>
             <p className="text-brand-500 mt-2">Try adjusting your search or filters.</p>
             <button onClick={clearFilters} className="mt-6 text-accent-600 font-bold hover:underline">
               Reset all filters
             </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showCreateModal && (
          <CreateOpportunityModal 
            onClose={() => setShowCreateModal(false)} 
            onCreated={() => {
              setShowCreateModal(false)
              refetch()
            }} 
          />
        )}
        {selectedOpportunity && (
          <OpportunityDetailModal 
            opportunity={selectedOpportunity} 
            onClose={() => setSelectedOpportunity(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function OpportunityCard({ opportunity, onClick }: { opportunity: any, onClick: () => void }) {
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
          <div className="flex items-center gap-2 text-brand-500 font-medium text-sm">
            <User className="w-4 h-4" /> {opportunity.profiles?.full_name}
          </div>
        </div>

        <p className="text-brand-600 text-sm line-clamp-3 mb-6 leading-relaxed">
          {opportunity.description}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-8 relative z-10">
        {opportunity.tags?.slice(0, 3).map((tag: string) => (
          <span key={tag} className="bg-brand-50 text-brand-600 px-3 py-1 rounded-full text-xs font-bold border border-brand-100">
            {tag}
          </span>
        ))}
      </div>

      <button 
        onClick={onClick}
        className="w-full bg-brand-50 text-brand-800 font-bold py-3.5 rounded-2xl hover:gradient-brand hover:text-white transition-all duration-300 flex items-center justify-center gap-2 group/btn"
      >
        View Details <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
      </button>
    </div>
  )
}

function OpportunityDetailModal({ opportunity, onClose }: { opportunity: any, onClose: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-brand-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 md:p-6"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white w-full max-w-3xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="relative h-48 gradient-brand flex items-center px-12 overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
          <div className="relative z-10 flex items-center gap-6">
             <div className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white font-extrabold text-4xl shadow-xl">
               {opportunity.university?.charAt(0)}
             </div>
             <div>
               <h2 className="text-3xl font-extrabold text-white leading-tight mb-2">{opportunity.title}</h2>
               <div className="flex items-center gap-4 text-white/90 text-sm font-bold">
                 <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4" /> {opportunity.university}</span>
                 <span className="flex items-center gap-1.5"><Tag className="w-4 h-4" /> {opportunity.department}</span>
               </div>
             </div>
          </div>
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-md transition-all border border-white/20 shadow-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-10 md:p-12 space-y-10">
          {/* Main Description */}
          <section>
            <h3 className="text-xl font-bold text-brand-900 mb-4 flex items-center gap-2">
              <ClipboardCheck className="w-6 h-6 text-accent-500" /> About this opportunity
            </h3>
            <p className="text-brand-700 leading-relaxed text-lg whitespace-pre-wrap">
              {opportunity.description}
            </p>
          </section>

          {/* Requirements & Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 border-t border-brand-50 pt-10">
             <section className="space-y-4">
               <h4 className="font-bold text-brand-900 uppercase tracking-widest text-xs">Requirements</h4>
               <p className="text-brand-600 leading-relaxed italic">
                 {opportunity.requirements || "No specific requirements listed. Open to all interested students in the department."}
               </p>
             </section>
             <section className="space-y-4">
               <h4 className="font-bold text-brand-900 uppercase tracking-widest text-xs">Important Dates</h4>
               <div className="flex items-center gap-3 text-brand-600">
                  <Calendar className="w-5 h-5 text-brand-300" />
                  <span className="font-medium">Deadline: {opportunity.deadline ? new Date(opportunity.deadline).toLocaleDateString() : 'Rolling basis'}</span>
               </div>
             </section>
          </div>

          {/* Professor Profile */}
          <div className="bg-brand-50 p-8 rounded-3xl border border-brand-100 flex flex-col md:flex-row items-center gap-6">
             <ProfileAvatar
                profile={opportunity.profiles}
                className="w-20 h-20 rounded-2xl gradient-soft text-brand-400 font-bold text-3xl shadow-sm border border-white"
             />
             <div className="flex-1 text-center md:text-left">
                <h4 className="text-xl font-bold text-brand-900">{opportunity.profiles?.full_name}</h4>
                <p className="text-brand-500 text-sm font-medium">Professor in {opportunity.profiles?.department || opportunity.department}</p>
             </div>
             <button className="bg-white border border-brand-100 text-brand-800 px-6 py-3 rounded-2xl font-bold hover:shadow-md transition-all flex items-center gap-2">
                <User className="w-5 h-5" /> View Profile
             </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-8 border-t border-brand-50 bg-brand-50/30 flex items-center gap-4">
           <button className="flex-1 gradient-brand text-white py-4 rounded-2xl font-extrabold shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2">
              <Mail className="w-5 h-5" /> Apply Now / Contact
           </button>
           <button className="w-16 h-14 bg-white border border-brand-100 rounded-2xl flex items-center justify-center text-brand-400 hover:text-accent-600 hover:border-accent-100 transition-all shadow-sm">
              <Bookmark className="w-6 h-6" />
           </button>
        </div>
      </motion.div>
    </motion.div>
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
    } else {
      alert('Error creating opportunity: ' + error.message)
    }
    setLoading(false)
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-brand-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
    >
      <motion.div 
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl p-8 md:p-12 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-start mb-2">
          <h2 className="text-3xl font-bold text-brand-900">Post an Opportunity</h2>
          <button onClick={onClose} className="p-2 hover:bg-brand-50 rounded-full transition-colors">
             <X className="w-6 h-6 text-brand-400" />
          </button>
        </div>
        <p className="text-brand-500 mb-8 font-medium">Share research labs, mentorships, or events with students.</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-brand-900 mb-2">Title</label>
            <input 
              required
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-brand-200 focus:ring-2 focus:ring-brand-500 outline-none transition-all shadow-sm"
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
                className="w-full px-4 py-3 rounded-xl border border-brand-200 focus:ring-2 focus:ring-brand-500 outline-none transition-all shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand-900 mb-2">Department</label>
              <input 
                required
                value={formData.department}
                onChange={e => setFormData({...formData, department: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-brand-200 focus:ring-2 focus:ring-brand-500 outline-none transition-all shadow-sm"
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
              className="w-full px-4 py-3 rounded-xl border border-brand-200 focus:ring-2 focus:ring-brand-500 outline-none transition-all resize-none shadow-sm"
              placeholder="Describe the opportunity, responsibilities, and learning outcomes..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-brand-900 mb-2">Tags (comma separated)</label>
            <input 
              value={formData.tags}
              onChange={e => setFormData({...formData, tags: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-brand-200 focus:ring-2 focus:ring-brand-500 outline-none transition-all shadow-sm"
              placeholder="Research, AI, CS, STEM..."
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-4 rounded-xl font-bold text-brand-600 hover:bg-brand-50 transition-all border border-brand-100 shadow-sm"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex-1 gradient-brand text-white py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Post Opportunity'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
