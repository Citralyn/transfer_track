import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/useAuthStore'
import { useQuery } from '@tanstack/react-query'
import { 
  Send, 
  Heart, 
  MessageCircle, 
  Plus, 
  Loader2, 
  Bold, 
  Italic, 
  Heading1, 
  Heading2, 
  List, 
  Smile, 
  Image as ImageIcon,
  X,
  Type
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { usePostInteractions } from '@/hooks/usePostInteractions'
import { clsx } from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import { ProfileAvatar } from '@/components/ui/ProfileAvatar'
import { opportunities as fallbackOpportunities } from '@/data/opportunities'
import { professors } from '@/data/professors'
import {
  getRelationshipStatusMap,
  sendConnectionRequest,
  upsertProfile,
  withTimeout,
  type RelationshipStatus,
} from '@/lib/supabaseHelpers'

const EMPTY_LIST: any[] = []

export default function Feed() {
  const { postId } = useParams()
  const navigate = useNavigate()
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [connectionStatuses, setConnectionStatuses] = useState<Record<string, RelationshipStatus | 'sending'>>({})
  const { profile } = useAuthStore()

  const { data: posts, isLoading, refetch } = useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles (
            full_name,
            username,
            avatar_url,
            role,
            school_name
          ),
          post_likes (user_id),
          post_comments (
            id,
            content,
            created_at,
            user_id,
            profiles (full_name, username, avatar_url)
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    }
  })

  const { data: suggestedProfilesData } = useQuery({
    queryKey: ['feed-suggested-profiles', profile?.id],
    queryFn: async () => {
      if (!profile) return []
      if (!isSupabaseConfigured()) return getFallbackProfiles(profile)

      try {
        const { data, error } = await withTimeout(
          supabase
            .from('profiles')
            .select('id, role, full_name, username, email, avatar_url, school_name, academic_year, department, bio')
            .neq('id', profile.id)
            .order('full_name', { ascending: true })
            .limit(8),
          'Supabase feed profile suggestions'
        )

        if (error) throw error
        return data && data.length > 0 ? data : getFallbackProfiles(profile)
      } catch (error) {
        console.warn('Feed profile suggestions unavailable:', error)
        return getFallbackProfiles(profile)
      }
    },
    enabled: Boolean(profile?.id),
  })

  const { data: sidebarOpportunitiesData } = useQuery({
    queryKey: ['feed-sidebar-opportunities'],
    queryFn: async () => {
      if (!isSupabaseConfigured()) return getFallbackOpportunities()

      try {
        const { data, error } = await withTimeout(
          supabase
            .from('opportunities')
            .select('id, title, description, university, department, tags')
            .order('created_at', { ascending: false })
            .limit(4),
          'Supabase feed opportunities'
        )

        if (error) throw error
        return data && data.length > 0 ? data : getFallbackOpportunities()
      } catch (error) {
        console.warn('Feed opportunities unavailable:', error)
        return getFallbackOpportunities()
      }
    },
  })

  const suggestedProfiles = suggestedProfilesData ?? EMPTY_LIST
  const sidebarOpportunities = sidebarOpportunitiesData ?? EMPTY_LIST

  useEffect(() => {
    let isMounted = true

    async function loadConnectionStatuses() {
      if (!profile?.id || suggestedProfiles.length === 0) {
        setConnectionStatuses({})
        return
      }

      const statusMap = await getRelationshipStatusMap(
        profile.id,
        suggestedProfiles.map((person: any) => person.id)
      )

      if (!isMounted) return
      setConnectionStatuses((prev) => ({ ...statusMap, ...pickSendingStatuses(prev) }))
    }

    loadConnectionStatuses()

    return () => {
      isMounted = false
    }
  }, [profile?.id, suggestedProfiles])

  const handleConnect = async (person: any) => {
    if (!profile) return

    setConnectionStatuses((prev) => ({ ...prev, [person.id]: 'sending' }))

    try {
      await upsertProfile(profile)
      const result = await sendConnectionRequest(profile, {
        id: person.id,
        email: person.email,
        full_name: person.full_name,
        username: person.username,
      })

      setConnectionStatuses((prev) => ({
        ...prev,
        [person.id]: result.message === 'Already connected.' ? 'connected' : 'pending_outgoing',
      }))
    } catch (error) {
      console.warn('Feed connection request failed:', error)
      setConnectionStatuses((prev) => ({ ...prev, [person.id]: 'none' }))
    }
  }

  const visibleSuggestedProfiles = suggestedProfiles
    .filter((person: any) => !isSameProfile(profile, person))
    .filter((person: any) => {
      const status = connectionStatuses[person.id] ?? 'none'
      return status === 'none' || status === 'sending'
    })
    .slice(0, 3)

  const selectedPostExists = posts?.some((post) => post.id === postId)
  const missingRoutePost = Boolean(postId && !isLoading && posts && !selectedPostExists)

  useEffect(() => {
    if (!postId || isLoading || !selectedPostExists) return
    document.getElementById(`post-${postId}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
  }, [postId, isLoading, selectedPostExists])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        {/* Simple Trigger Input */}
        <div 
          onClick={() => setIsEditorOpen(true)}
          className="bg-white p-6 rounded-xl border border-black/5 shadow-xl cursor-pointer hover:shadow-xl transition-all group"
        >
          <div className="flex gap-4 items-center">
            <Link to={`/profile/${profile?.username}`} className="hover:scale-105 transition-transform shrink-0">
              <ProfileAvatar profile={profile} className="w-12 h-12 rounded-full bg-[#ff3b30] text-white font-semibold text-xl shadow-xl" />
            </Link>
            <div className="flex-1 bg-[#f5f5f7] rounded-full px-6 py-3.5 text-[#1d1d1f] font-bold group-hover:bg-[#ffcc00] transition-colors">
              What's on your mind, {profile?.full_name?.split(' ')[0]}?
            </div>
          </div>
        </div>

        {/* Posts List */}
        <div className="space-y-6 pb-20 md:pb-10">
          {missingRoutePost && (
            <div className="rounded-xl border border-black/5 bg-amber-50 px-5 py-4 font-semibold text-amber-800">
              This post could not be found.
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-20">
               <Loader2 className="w-8 h-8 animate-spin text-[#1d1d1f]" />
            </div>
          ) : posts && posts.length > 0 ? (
            posts.map((post) => (
              <PostCard key={post.id} post={post} isHighlighted={post.id === postId} />
            ))
          ) : (
            <div className="py-20 text-center bg-white rounded-xl border border-black/5 shadow-xl">
               <div className="w-16 h-16 bg-[#f5f5f7] rounded-xl flex items-center justify-center text-[#1d1d1f] mx-auto mb-4">
                  <Type className="w-8 h-8" />
               </div>
               <h3 className="font-semibold text-[#1d1d1f]">Your feed is empty</h3>
               <p className="text-[#1d1d1f] text-sm">Be the first to share an update!</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="hidden lg:block space-y-6">
        <div className="bg-white p-6 rounded-xl border border-black/5 shadow-xl">
          <h3 className="font-semibold text-[#1d1d1f] mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
            Suggested Connections
          </h3>
          <div className="space-y-4">
            {visibleSuggestedProfiles.length > 0 ? (
              visibleSuggestedProfiles.map((person: any) => (
                <SuggestionItem
                  key={person.id}
                  profile={person}
                  status={connectionStatuses[person.id] ?? 'none'}
                  onConnect={() => handleConnect(person)}
                />
              ))
            ) : (
              <p className="text-sm text-[#86868b] leading-relaxed">No new profile suggestions right now.</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-black/5 shadow-xl">
          <h3 className="font-semibold text-[#1d1d1f] mb-4 text-sm uppercase tracking-wider">Opportunities For You</h3>
          <div className="space-y-3">
            {sidebarOpportunities.slice(0, 4).map((opportunity: any) => (
              <OpportunitySidebarItem
                key={opportunity.id}
                opportunity={opportunity}
                onClick={() => navigate(`/opportunities/${opportunity.id}`)}
              />
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isEditorOpen && (
          <RichPostEditor 
            onClose={() => setIsEditorOpen(false)} 
            onPostCreated={() => {
              setIsEditorOpen(false)
              refetch()
            }} 
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function RichPostEditor({ onClose, onPostCreated }: { onClose: () => void, onPostCreated: () => void }) {
  const [content, setContent] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isPosting, setIsPosting] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { profile } = useAuthStore()

  const emojis = ['🎓', '🔬', '📚', '🌟', '🤝', '💡', '📝', '✨', '🔥', '🚀', '🙌', '🙏']

  const insertText = (before: string, after: string = '') => {
    if (!textareaRef.current) return
    const start = textareaRef.current.selectionStart
    const end = textareaRef.current.selectionEnd
    const text = textareaRef.current.value
    const selectedText = text.substring(start, end)
    const newText = text.substring(0, start) + before + selectedText + after + text.substring(end)
    setContent(newText)
    
    setTimeout(() => {
      textareaRef.current?.focus()
      textareaRef.current?.setSelectionRange(start + before.length, end + before.length)
    }, 0)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImage(file)
      const reader = new FileReader()
      reader.onloadend = () => setImagePreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handlePost = async () => {
    if (!content.trim() && !image) return
    setIsPosting(true)

    let imageUrl = null

    try {
      if (image && profile) {
        const fileExt = image.name.split('.').pop()
        const fileName = `${profile.id}-${Date.now()}.${fileExt}`
        
        const { data, error: uploadError } = await supabase.storage
          .from('post_images')
          .upload(fileName, image)

        if (uploadError) throw uploadError

        if (data) {
          const { data: { publicUrl } } = supabase.storage
            .from('post_images')
            .getPublicUrl(data.path)
          imageUrl = publicUrl
        }
      }

      const { error: postError } = await supabase
        .from('posts')
        .insert([{
          user_id: profile?.id,
          content,
          image_url: imageUrl
        }])

      if (postError) throw postError
      onPostCreated()
    } catch (err: any) {
      alert('Error creating post: ' + (err.message || 'Unknown error'))
      console.error(err)
    } finally {
      setIsPosting(false)
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
        className="bg-white w-full max-w-2xl rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="px-8 py-6 border-b border-black/5 flex items-center justify-between bg-[#f5f5f7]">
          <div className="flex items-center gap-3">
            <ProfileAvatar profile={profile} className="w-10 h-10 rounded-full bg-[#ff3b30] text-white font-semibold text-lg shadow-xl" />
            <div>
              <h3 className="font-semibold text-[#1d1d1f] leading-tight">Create Post</h3>
              <p className="text-[10px] text-[#86868b] font-semibold uppercase tracking-wider">Post to Academic Feed</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white border border-black/5 flex items-center justify-center text-[#1d1d1f] hover:text-[#1d1d1f] transition-all shadow-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full min-h-[200px] text-xl text-[#1d1d1f] placeholder:text-[#86868b] outline-none resize-none bg-transparent"
            autoFocus
          />

          {imagePreview && (
            <div className="relative group">
              <img src={imagePreview} className="w-full h-auto rounded-xl border border-black/5 shadow-xl" alt="Preview" />
              <button 
                onClick={() => { setImage(null); setImagePreview(null); }}
                className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-black/50 text-white flex items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          )}
        </div>

        <div className="p-6 bg-[#f5f5f7] backdrop-blur-md border-t border-black/5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-1 bg-white p-1.5 rounded-xl border border-black/5 shadow-xl">
              <ToolbarButton onClick={() => insertText('**', '**')} icon={<Bold className="w-4 h-4" />} title="Bold" />
              <ToolbarButton onClick={() => insertText('*', '*')} icon={<Italic className="w-4 h-4" />} title="Italic" />
              <ToolbarButton onClick={() => insertText('# ')} icon={<Heading1 className="w-4 h-4" />} title="H1" />
              <ToolbarButton onClick={() => insertText('## ')} icon={<Heading2 className="w-4 h-4" />} title="H2" />
              <ToolbarButton onClick={() => insertText('- ')} icon={<List className="w-4 h-4" />} title="List" />
              <div className="w-px h-6 bg-black/10 mx-1" />
              
              <div className="relative">
                <ToolbarButton 
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)} 
                  icon={<Smile className="w-4 h-4" />} 
                  title="Emoji" 
                />
                {showEmojiPicker && (
                  <div className="absolute bottom-full mb-4 left-0 bg-white border border-black/5 p-3 rounded-xl shadow-xl grid grid-cols-4 gap-2 z-10 animate-in fade-in slide-in-from-bottom-2">
                    {emojis.map(e => (
                      <button 
                        key={e} 
                        onClick={() => { insertText(e); setShowEmojiPicker(false); }}
                        className="text-xl hover:scale-125 transition-transform"
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <ToolbarButton 
                onClick={() => fileInputRef.current?.click()} 
                icon={<ImageIcon className="w-4 h-4" />} 
                title="Add Image" 
              />
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageChange} 
                accept="image/*" 
                className="hidden" 
              />
            </div>

            <button 
              onClick={handlePost}
              disabled={isPosting || (!content.trim() && !image)}
              className="bg-[#0066cc] text-white px-8 py-4 rounded-full font-semibold shadow-xl hover:bg-[#0044bb] transition-all flex items-center gap-3 disabled:opacity-50"
            >
              {isPosting ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Publish Post <Send className="w-5 h-5" /></>}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

function ToolbarButton({ onClick, icon, title }: { onClick: () => void, icon: React.ReactNode, title: string }) {
  return (
    <button 
      onClick={onClick}
      title={title}
      className="p-2.5 rounded-xl hover:bg-[#f5f5f7] text-[#1d1d1f] transition-all"
    >
      {icon}
    </button>
  )
}

function SuggestionItem({ profile, status, onConnect }: { profile: any; status: RelationshipStatus | 'sending'; onConnect: () => void }) {
  const roleLabel = profile.role === 'professor' ? 'Professor' : 'Student'
  const isSending = status === 'sending'

  return (
    <div className="flex items-center justify-between gap-3 group">
      <Link to={`/profile/${profile.username}`} className="min-w-0 flex items-center gap-3">
        <ProfileAvatar profile={profile} className="w-10 h-10 rounded-full bg-[#ff3b30] text-white font-semibold text-sm shrink-0 shadow-md" />
        <div className="min-w-0 flex flex-col">
          <span className="text-sm font-bold text-[#1d1d1f] leading-tight group-hover:text-[#0066cc] transition-colors truncate">{profile.full_name}</span>
          <span className="text-[10px] text-[#86868b] font-medium truncate uppercase tracking-wider">{roleLabel} • {profile.school_name}</span>
        </div>
      </Link>
      <button
        onClick={onConnect}
        disabled={isSending}
        aria-label={`Connect with ${profile.full_name}`}
        className="p-1.5 rounded-full bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#34c759] hover:text-white transition-all disabled:opacity-50 shrink-0 border border-black/5 shadow-sm"
      >
        {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
      </button>
    </div>
  )
}

function OpportunitySidebarItem({ opportunity, onClick }: { opportunity: any; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left flex flex-col hover:bg-[#f5f5f7] p-3 rounded-xl transition-all border border-transparent hover:border-black/5 group"
    >
      <span className="text-sm font-bold text-[#1d1d1f] group-hover:text-[#0066cc] transition-colors line-clamp-2">{opportunity.title}</span>
      <span className="text-[10px] text-[#86868b] font-semibold mt-1 uppercase tracking-wider">
        {[opportunity.university, opportunity.department].filter(Boolean).join(' • ')}
      </span>
    </button>
  )
}

function pickSendingStatuses(statusMap: Record<string, RelationshipStatus | 'sending'>) {
  return Object.fromEntries(Object.entries(statusMap).filter(([, status]) => status === 'sending'))
}

function isSameProfile(currentProfile: any, person: any) {
  return Boolean(
    currentProfile?.id === person.id ||
    (currentProfile?.email && person.email && currentProfile.email.toLowerCase() === person.email.toLowerCase()) ||
    (currentProfile?.username && person.username && currentProfile.username.toLowerCase() === person.username.toLowerCase())
  )
}

function getFallbackProfiles(currentProfile: any) {
  return [
    ...professors.slice(0, 5).map((professor) => ({
      id: professor.id,
      role: 'professor',
      full_name: professor.name,
      username: professor.name.toLowerCase().replace(/^dr\.\s*/, '').replace(/\s+/g, '-'),
      email: `${professor.name.toLowerCase().replace(/^dr\.\s*/, '').replace(/\s+/g, '.')}@example.edu`,
      school_name: professor.university,
      department: professor.department,
      bio: professor.bio,
    })),
    {
      id: 'mock-student-jane-doe',
      role: 'student',
      full_name: 'Jane Doe',
      username: 'jane-doe',
      email: 'jane@example.com',
      school_name: 'Santa Monica College',
      academic_year: 'Sophomore',
      bio: 'Preparing to transfer into computer science.',
    },
  ].filter((person) => !isSameProfile(currentProfile, person))
}

function getFallbackOpportunities() {
  return fallbackOpportunities.slice(0, 4).map((opportunity) => {
    const professor = professors.find((item) => item.id === opportunity.professorId)

    return {
      id: opportunity.id,
      title: opportunity.title,
      description: opportunity.description,
      university: professor?.university,
      department: professor?.department,
      tags: opportunity.tags,
    }
  })
}

function PostCard({ post, isHighlighted = false }: { post: any; isHighlighted?: boolean }) {
  const { profiles, content, created_at, post_comments, image_url } = post
  const { profile: currentProfile } = useAuthStore()
  const { toggleLike, addComment, isLiked, likeCount, commentCount } = usePostInteractions(post)
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const isProfessor = profiles?.role === 'professor'

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim()) return
    await addComment(commentText)
    setCommentText('')
  }

  return (
    <div
      id={`post-${post.id}`}
      className={clsx(
        "bg-white rounded-xl border border-black/5 shadow-xl hover:shadow-xl transition-all overflow-hidden scroll-mt-24",
        isHighlighted && "ring-4 ring-[#ffcc00]/30 border-[#ffcc00]"
      )}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Link to={`/profile/${profiles?.username}`} className="hover:scale-105 transition-transform shrink-0">
              <ProfileAvatar profile={profiles} className="w-12 h-12 rounded-full bg-[#ff3b30] text-white font-semibold text-xl shadow-xl" />
            </Link>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <Link to={`/profile/${profiles?.username}`} className="font-bold text-[#1d1d1f] leading-tight hover:text-[#0066cc] transition-colors">
                  {profiles?.full_name}
                </Link>
                {isProfessor && (
                  <span className="bg-[#ffcc00]/10 text-[#ffcc00] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-[#ffcc00]/20">
                    Professor
                  </span>
                )}
              </div>
              <span className="text-xs text-[#86868b] font-semibold">{profiles?.school_name} • {formatDistanceToNow(new Date(created_at))} ago</span>
            </div>
          </div>
        </div>
        
        <div className="prose prose-brand max-w-none text-[#1d1d1f] leading-relaxed mb-4">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>

      {image_url && (
        <div className="px-6 mb-4">
          <img 
            src={image_url} 
            alt="Post content" 
            className="w-full h-auto rounded-xl object-cover border border-black/5 shadow-md"
          />
        </div>
      )}

      <div className="px-6 py-4 bg-[#f5f5f7] border-t border-black/5 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button 
            onClick={toggleLike}
            className={clsx(
              "flex items-center gap-2 transition-colors group",
              isLiked ? "text-[#ff3b30]" : "text-[#86868b] hover:text-[#ff3b30]"
            )}
          >
            <div className={clsx(
              "p-2 rounded-xl transition-colors",
              isLiked ? "bg-[#ff3b30]/10" : "group-hover:bg-[#ff3b30]/10"
            )}>
              <Heart className={clsx("w-5 h-5", isLiked && "fill-current")} />
            </div>
            <span className="text-sm font-bold">{likeCount}</span>
          </button>
          <button 
            onClick={() => setShowComments(!showComments)}
            className={clsx(
              "flex items-center gap-2 transition-colors group",
              showComments ? "text-[#1d1d1f]" : "text-[#86868b] hover:text-[#1d1d1f]"
            )}
          >
            <div className={clsx(
              "p-2 rounded-xl transition-colors",
              showComments ? "bg-[#34c759]/10" : "group-hover:bg-[#34c759]/10"
            )}>
              <MessageCircle className="w-5 h-5" />
            </div>
            <span className="text-sm font-bold">{commentCount}</span>
          </button>
        </div>
      </div>

      {showComments && (
        <div className="px-6 py-6 bg-white border-t border-black/5 animate-in slide-in-from-top duration-300">
          <form onSubmit={handleComment} className="flex gap-3 mb-6">
            <ProfileAvatar profile={currentProfile} className="w-8 h-8 rounded-full bg-[#ff3b30] text-white font-semibold text-xs shrink-0 mt-1 shadow-sm" />
            <div className="flex-1 relative">
              <input 
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="w-full bg-[#f5f5f7] rounded-full px-4 py-2 text-sm outline-none border border-transparent focus:border-black/10 transition-all pr-10 text-[#1d1d1f]"
              />
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-[#0066cc] hover:text-[#0044bb]">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>

          <div className="space-y-4">
            {post_comments?.map((comment: any) => (
              <div key={comment.id} className="flex gap-3 group">
                <ProfileAvatar profile={comment.profiles} className="w-8 h-8 rounded-full bg-[#ffcc00] text-[#1d1d1f] font-semibold text-xs shrink-0 shadow-sm" />
                <div className="flex-1 bg-[#f5f5f7] p-4 rounded-2xl border border-black/5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-[#1d1d1f]">{comment.profiles?.full_name}</span>
                    <span className="text-[10px] text-[#86868b] font-semibold">{formatDistanceToNow(new Date(comment.created_at))} ago</span>
                  </div>
                  <p className="text-sm text-[#1d1d1f] leading-relaxed">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
