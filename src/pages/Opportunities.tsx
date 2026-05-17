import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/useAuthStore'
import { useQuery } from '@tanstack/react-query'
import { 
  Plus, 
  Search,
  Filter,
  Building2,  Calendar, 
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
import { filterBySearchQuery } from '@/lib/search'
import { getOrCreateConversation } from '@/lib/messaging'

export default function Opportunities() {
  const { opportunityId } = useParams()
  const navigate = useNavigate()
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
    queryKey: ['opportunities', filters],
    queryFn: async () => {
      let query = supabase
        .from('opportunities')
        .select(`
          *,
          profiles:professor_id (
            id,
            full_name,
            username,
            avatar_url,
            department
          )
        `)
      
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

  const visibleOpportunities = filterBySearchQuery(opportunities, searchQuery)
  const selectedRouteOpportunity = opportunities?.find((opportunity) => opportunity.id === opportunityId)
  const missingRouteOpportunity = Boolean(opportunityId && !isLoading && opportunities && !selectedRouteOpportunity)

  useEffect(() => {
    if (!opportunityId || isLoading) return
    setSelectedOpportunity(selectedRouteOpportunity || null)
  }, [opportunityId, isLoading, selectedRouteOpportunity])

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
          <h1 className="text-3xl font-semibold text-[#1d1d1f]">Academic Opportunities</h1>
          <p className="text-[#1d1d1f] mt-1 font-bold">Find research labs, mentorships, and workshops.</p>
        </div>
        {profile?.role === 'professor' && (
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-[#ff3b30] text-white px-6 py-3 rounded-full font-semibold shadow-xl hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" /> Post Opportunity
          </button>
        )}
      </div>

      {/* Search & Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1d1d1f]" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search opportunities..."
              className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white border border-black/5 focus:ring-2 focus:ring-brand-500 outline-none transition-all shadow-xl"
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={clsx(
              "flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold transition-all shadow-xl border",
              showFilters || activeFilterCount > 0 
                ? "bg-[#ff3b30] text-white border-brand-900" 
                : "bg-white text-[#1d1d1f] border-black hover:bg-white"
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
              <div className="bg-white border border-black/5 rounded-xl p-6 shadow-xl grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-[#1d1d1f] uppercase tracking-widest mb-2 ml-1">Department</label>
                  <input 
                    value={filters.department}
                    onChange={e => setFilters({...filters, department: e.target.value})}
                    placeholder="e.g. Computer Science"
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-transparent focus:border-black outline-none transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1d1d1f] uppercase tracking-widest mb-2 ml-1">University</label>
                  <input 
                    value={filters.university}
                    onChange={e => setFilters({...filters, university: e.target.value})}
                    placeholder="e.g. UCLA"
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-transparent focus:border-black outline-none transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1d1d1f] uppercase tracking-widest mb-2 ml-1">Professor</label>
                  <input 
                    value={filters.professor}
                    onChange={e => setFilters({...filters, professor: e.target.value})}
                    placeholder="Search by name"
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-transparent focus:border-black outline-none transition-all text-sm"
                  />
                </div>
                <div className="md:col-span-3 flex justify-end gap-3">
                   <button 
                    onClick={clearFilters}
                    className="text-[#1d1d1f] font-semibold text-sm hover:text-[#1d1d1f] px-4 py-2"
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
      {missingRouteOpportunity && (
        <div className="rounded-xl border border-black/5 bg-amber-50 px-5 py-4 font-semibold text-amber-800">
          This opportunity could not be found.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
        {isLoading ? (
          [1, 2, 3, 4].map(i => <OpportunitySkeleton key={i} />)
        ) : visibleOpportunities.length > 0 ? (
          visibleOpportunities.map(opp => (
            <OpportunityCard
              key={opp.id}
              opportunity={opp}
              onClick={() => navigate(`/opportunities/${opp.id}`)}
            />
          ))
        ) : (
          <div className="col-span-full py-20 text-center bg-white rounded-xl border border-black/5">
             <div className="w-20 h-20 bg-[#34c759] rounded-full flex items-center justify-center text-[#1d1d1f] mx-auto mb-6">
                <Sparkles className="w-10 h-10" />
             </div>
             <h3 className="text-xl font-semibold text-[#1d1d1f]">No opportunities found</h3>
             <p className="text-[#1d1d1f] mt-2">Try adjusting your search or filters.</p>
             <button onClick={clearFilters} className="mt-6 text-[#4f46e5] font-semibold hover:underline">
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
            onClose={() => {
              setSelectedOpportunity(null)
              if (opportunityId) navigate('/opportunities')
            }} 
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function OpportunityCard({ opportunity, onClick }: { opportunity: any, onClick: () => void }) {
  return (
    <div className="bg-white rounded-xl border border-black/5 shadow-xl hover:shadow-xl transition-all p-8 flex flex-col group relative overflow-hidden">
      
      <div className="flex justify-between items-start mb-6 relative z-10">
        <ProfileAvatar 
          profile={opportunity.profiles} 
          className="w-14 h-14 rounded-full bg-[#ff3b30] text-white font-semibold text-xl shadow-xl border-2 border-white" 
        />
      </div>

      <div className="relative z-10 flex-1">
        <h3 className="text-xl font-semibold text-[#1d1d1f] mb-2 group-hover:text-[#4f46e5] transition-colors">{opportunity.title}</h3>
        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-2 text-[#1d1d1f] font-bold text-sm">
            <Building2 className="w-4 h-4" /> {opportunity.university}
          </div>
          <div className="flex items-center gap-2 text-[#1d1d1f] font-bold text-sm">
            <Tag className="w-4 h-4" /> {opportunity.department}
          </div>
          <div className="flex items-center gap-2 text-[#1d1d1f] font-bold text-sm">
            <User className="w-4 h-4" /> 
            <Link to={`/profile/${opportunity.profiles?.username}`} className="hover:text-[#4f46e5] transition-colors">
              {opportunity.profiles?.full_name}
            </Link>
          </div>
        </div>

        <p className="text-[#1d1d1f] text-sm line-clamp-3 mb-6 leading-relaxed">
          {opportunity.description}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-8 relative z-10">
        {opportunity.tags?.slice(0, 3).map((tag: string) => (
          <span key={tag} className="bg-white text-[#1d1d1f] px-3 py-1 rounded-xl text-xs font-semibold border border-black/5">
            {tag}
          </span>
        ))}
      </div>

      <button 
        onClick={onClick}
        className="w-full bg-white text-[#1d1d1f] font-semibold py-3.5 rounded-xl hover:bg-[#ff3b30] hover:text-white transition-all duration-300 flex items-center justify-center gap-2 group/btn"
      >
        View Details <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
      </button>
    </div>
  )
}

function OpportunityDetailModal({ opportunity, onClose }: { opportunity: any, onClose: () => void }) {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const handleContact = async () => {
    if (!user || !opportunity.profiles?.id) return
    setLoading(true)
    try {
      const conversationId = await getOrCreateConversation(user.id, opportunity.profiles.id)
      navigate(`/messages/${conversationId}`)
    } catch (error) {
      console.error('Error starting conversation:', error)
      alert('Could not start conversation. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-[#ff3b30]/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 md:p-6"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white w-full max-w-3xl rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="relative h-48 bg-[#ff3b30] flex items-center px-12 overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
          <div className="relative z-10 flex items-center gap-6">
             <ProfileAvatar 
               profile={opportunity.profiles} 
               className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white font-extrabold text-4xl shadow-xl" 
             />
             <div>
               <h2 className="text-3xl font-extrabold text-white leading-tight mb-2">{opportunity.title}</h2>
               <div className="flex items-center gap-4 text-white/90 text-sm font-semibold">
                 <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4" /> {opportunity.university}</span>
                 <span className="flex items-center gap-1.5"><Tag className="w-4 h-4" /> {opportunity.department}</span>
               </div>
             </div>
          </div>
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-md transition-all border border-black/5/20 shadow-xl"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-10 md:p-12 space-y-10">
          {/* Main Description */}
          <section>
            <h3 className="text-xl font-semibold text-[#1d1d1f] mb-4 flex items-center gap-2">
              <ClipboardCheck className="w-6 h-6 text-accent-500" /> About this opportunity
            </h3>
            <p className="text-[#1d1d1f] leading-relaxed text-lg whitespace-pre-wrap">
              {opportunity.description}
            </p>
          </section>

          {/* Requirements & Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 border-t border-brand-50 pt-10">
             <section className="space-y-4">
               <h4 className="font-semibold text-[#1d1d1f] uppercase tracking-widest text-xs">Requirements</h4>
               <p className="text-[#1d1d1f] leading-relaxed italic">
                 {opportunity.requirements || "No specific requirements listed. Open to all interested students in the department."}
               </p>
             </section>
             <section className="space-y-4">
               <h4 className="font-semibold text-[#1d1d1f] uppercase tracking-widest text-xs">Important Dates</h4>
               <div className="flex items-center gap-3 text-[#1d1d1f]">
                  <Calendar className="w-5 h-5 text-[#1d1d1f]" />
                  <span className="font-bold">Deadline: {opportunity.deadline ? new Date(opportunity.deadline).toLocaleDateString() : 'Rolling basis'}</span>
               </div>
             </section>
          </div>

          {/* Professor Profile */}
          <div className="bg-white p-8 rounded-xl border border-black/5 flex flex-col md:flex-row items-center gap-6">
             <Link to={`/profile/${opportunity.profiles?.username}`} className="hover:scale-105 transition-transform shrink-0">
                <ProfileAvatar 
                  profile={opportunity.profiles} 
                  className="w-20 h-20 rounded-xl bg-[#34c759] text-[#1d1d1f] font-semibold text-3xl shadow-xl border border-black/5" 
                />
             </Link>
             <div className="flex-1 text-center md:text-left">
                <Link to={`/profile/${opportunity.profiles?.username}`} className="text-xl font-semibold text-[#1d1d1f] hover:text-[#4f46e5] transition-colors">
                  {opportunity.profiles?.full_name}
                </Link>
                <p className="text-[#1d1d1f] text-sm font-bold">Professor in {opportunity.profiles?.department || opportunity.department}</p>
             </div>
             <Link to={`/profile/${opportunity.profiles?.username}`} className="bg-white border border-black/5 text-[#1d1d1f] px-6 py-3 rounded-xl font-semibold hover:shadow-xl transition-all flex items-center gap-2">
                <User className="w-5 h-5" /> View Profile
             </Link>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-8 border-t border-brand-50 bg-white/30 flex items-center gap-4">
           <button 
             onClick={handleContact}
             disabled={loading}
             className="flex-1 bg-[#ff3b30] text-white py-4 rounded-full font-extrabold shadow-xl hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-50"
           >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Mail className="w-5 h-5" /> Apply Now / Contact</>}
           </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function OpportunitySkeleton() {
  return (
    <div className="bg-white rounded-xl border border-black/5 p-8 h-[400px] animate-pulse">
      <div className="w-14 h-14 bg-white rounded-xl mb-6" />
      <div className="h-6 bg-white rounded-xl w-3/4 mb-4" />
      <div className="space-y-2 mb-6">
        <div className="h-4 bg-white rounded-xl w-1/2" />
        <div className="h-4 bg-white rounded-xl w-1/3" />
      </div>
      <div className="h-20 bg-white rounded-xl mb-6" />
      <div className="flex gap-2 mb-8">
        <div className="h-6 bg-white rounded-xl w-16" />
        <div className="h-6 bg-white rounded-xl w-16" />
      </div>
      <div className="h-12 bg-white rounded-xl" />
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
      className="fixed inset-0 bg-[#ff3b30]/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
    >
      <motion.div 
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="bg-white w-full max-w-2xl rounded-xl shadow-xl p-8 md:p-12 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-start mb-2">
          <h2 className="text-3xl font-semibold text-[#1d1d1f]">Post an Opportunity</h2>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-colors">
             <X className="w-6 h-6 text-[#1d1d1f]" />
          </button>
        </div>
        <p className="text-[#1d1d1f] mb-8 font-bold">Share research labs, mentorships, or events with students.</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-[#1d1d1f] mb-2">Title</label>
            <input 
              required
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-black/5 focus:ring-2 focus:ring-brand-500 outline-none transition-all shadow-xl"
              placeholder="e.g. Undergraduate Research Assistant - AI Lab"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-[#1d1d1f] mb-2">University</label>
              <input 
                required
                value={formData.university}
                onChange={e => setFormData({...formData, university: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-black/5 focus:ring-2 focus:ring-brand-500 outline-none transition-all shadow-xl"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#1d1d1f] mb-2">Department</label>
              <input 
                required
                value={formData.department}
                onChange={e => setFormData({...formData, department: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-black/5 focus:ring-2 focus:ring-brand-500 outline-none transition-all shadow-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#1d1d1f] mb-2">Description</label>
            <textarea 
              required
              rows={4}
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-black/5 focus:ring-2 focus:ring-brand-500 outline-none transition-all resize-none shadow-xl"
              placeholder="Describe the opportunity, responsibilities, and learning outcomes..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#1d1d1f] mb-2">Tags (comma separated)</label>
            <input 
              value={formData.tags}
              onChange={e => setFormData({...formData, tags: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-black/5 focus:ring-2 focus:ring-brand-500 outline-none transition-all shadow-xl"
              placeholder="Research, AI, CS, STEM..."
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-4 rounded-xl font-semibold text-[#1d1d1f] hover:bg-white transition-all border border-black/5 shadow-xl"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#ff3b30] text-white py-4 rounded-full font-semibold shadow-xl hover:shadow-xl transition-all transform hover:-translate-y-0.5 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Post Opportunity'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
