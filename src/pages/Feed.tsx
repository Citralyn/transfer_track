import { useEffect, useState, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/useAuthStore'
import { useQuery } from '@tanstack/react-query'
import { 
  Send, 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreHorizontal, 
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

export default function Feed() {
  const { postId } = useParams()
  const [isEditorOpen, setIsEditorOpen] = useState(false)
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
            <div className="flex-1 bg-white rounded-xl px-6 py-3.5 text-[#1d1d1f] font-bold group-hover:bg-[#ffcc00] transition-colors">
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
            <div className="py-20 text-center bg-white rounded-xl border border-black/5">
               <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center text-[#1d1d1f] mx-auto mb-4">
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
            <SuggestionItem name="Dr. Sarah Chen" role="Professor" school="UC Berkeley" />
            <SuggestionItem name="Marcus Rivera" role="Student" school="Santa Monica College" />
            <SuggestionItem name="Dr. Emily Watts" role="Professor" school="UCLA" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-black/5 shadow-xl">
          <h3 className="font-semibold text-[#1d1d1f] mb-4 text-sm uppercase tracking-wider">Trending</h3>
          <div className="space-y-3">
            <TrendingItem tag="#UCApplications" count="1.2k posts" />
            <TrendingItem tag="#STEMResearch" count="850 posts" />
            <TrendingItem tag="#TransferTips" count="640 posts" />
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
        <div className="px-8 py-6 border-b border-brand-50 flex items-center justify-between bg-white/30">
          <div className="flex items-center gap-3">
            <ProfileAvatar profile={profile} className="w-10 h-10 rounded-full bg-[#ff3b30] text-white font-semibold text-lg shadow-xl" />
            <div>
              <h3 className="font-semibold text-[#1d1d1f] leading-tight">Create Post</h3>
              <p className="text-[10px] text-[#1d1d1f] font-semibold uppercase tracking-wider">Post to Academic Feed</p>
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
            className="w-full min-h-[200px] text-xl text-[#1d1d1f] placeholder:text-[#1d1d1f] outline-none resize-none bg-transparent"
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

        <div className="p-6 bg-white/70 backdrop-blur-md border-t border-brand-50">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-1 bg-white p-1.5 rounded-xl border border-black/5 shadow-xl">
              <ToolbarButton onClick={() => insertText('**', '**')} icon={<Bold className="w-4 h-4" />} title="Bold" />
              <ToolbarButton onClick={() => insertText('*', '*')} icon={<Italic className="w-4 h-4" />} title="Italic" />
              <ToolbarButton onClick={() => insertText('# ')} icon={<Heading1 className="w-4 h-4" />} title="H1" />
              <ToolbarButton onClick={() => insertText('## ')} icon={<Heading2 className="w-4 h-4" />} title="H2" />
              <ToolbarButton onClick={() => insertText('- ')} icon={<List className="w-4 h-4" />} title="List" />
              <div className="w-px h-6 bg-[#ffcc00] mx-1" />
              
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
              className="bg-[#4f46e5] text-white px-8 py-4 rounded-xl font-semibold border border-black/5 shadow-xl hover:translate-x-1 hover:translate-y-1 hover:shadow-xl transition-all flex items-center gap-3 disabled:opacity-50 uppercase tracking-widest"
            >
              {isPosting ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Publish <Send className="w-5 h-5 stroke-[3]" /></>}
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
      className="p-2.5 rounded-xl hover:bg-white text-[#1d1d1f] hover:text-[#1d1d1f] transition-all"
    >
      {icon}
    </button>
  )
}

function SuggestionItem({ name, role, school }: any) {
  const colors = ['bg-[#ff3b30]', 'bg-[#34c759]', 'bg-[#ffcc00]', 'bg-[#af52de]']
  const randomColor = colors[Math.floor(Math.random() * colors.length)]
  
  return (
    <div className="flex items-center justify-between group">
      <div className="flex items-center gap-3">
        <div className={clsx("w-10 h-10 rounded-xl border border-black/5 shadow-xl", randomColor)} />
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-[#1d1d1f] leading-tight group-hover:text-[#1d1d1f] transition-colors">{name}</span>
          <span className="text-[10px] text-[#1d1d1f] font-semibold uppercase">{role} • {school}</span>
        </div>
      </div>
      <button className="p-1.5 rounded-xl bg-[#34c759] border border-black/5 text-[#1d1d1f] hover:bg-black hover:text-white transition-all shadow-xl">
        <Plus className="w-4 h-4" />
      </button>
    </div>
  )
}

function TrendingItem({ tag, count }: any) {
  return (
    <div className="flex flex-col hover:bg-[#ffcc00] p-2 rounded-xl border-4 border-transparent hover:border-black transition-all cursor-pointer group shadow-xl hover:shadow-xl">
      <span className="text-sm font-semibold text-[#1d1d1f] group-hover:text-[#1d1d1f]">#{tag.replace('#', '')}</span>
      <span className="text-[10px] text-[#1d1d1f] font-semibold uppercase">{count}</span>
    </div>
  )
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
        "bg-white rounded-xl border shadow-xl hover:shadow-xl transition-all overflow-hidden scroll-mt-24",
        isHighlighted ? "border-accent-300 ring-4 ring-accent-100" : "border-black"
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
                <Link to={`/profile/${profiles?.username}`} className="font-semibold text-[#1d1d1f] leading-tight hover:text-[#4f46e5] transition-colors">
                  {profiles?.full_name}
                </Link>
                {isProfessor && (
                  <span className="bg-accent-100 text-accent-700 text-[10px] font-semibold px-2 py-0.5 rounded-xl uppercase tracking-wider">
                    Professor
                  </span>
                )}
              </div>
              <span className="text-xs text-[#1d1d1f] font-bold">{profiles?.school_name} • {formatDistanceToNow(new Date(created_at))} ago</span>
            </div>
          </div>
          <button className="text-[#1d1d1f] hover:text-[#1d1d1f] transition-colors">
            <MoreHorizontal className="w-6 h-6" />
          </button>
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
            className="w-full h-auto rounded-xl object-cover border border-black/5 shadow-xl"
          />
        </div>
      )}

      <div className="px-6 py-4 bg-white/70 backdrop-blur-md border-t border-brand-50 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button 
            onClick={toggleLike}
            className={clsx(
              "flex items-center gap-2 transition-colors group",
              isLiked ? "text-[#4f46e5]" : "text-[#1d1d1f] hover:text-[#4f46e5]"
            )}
          >
            <div className={clsx(
              "p-2 rounded-xl transition-colors",
              isLiked ? "bg-[#af52de]" : "group-hover:bg-[#af52de]"
            )}>
              <Heart className={clsx("w-5 h-5", isLiked && "fill-current")} />
            </div>
            <span className="text-sm font-semibold">{likeCount}</span>
          </button>
          <button 
            onClick={() => setShowComments(!showComments)}
            className={clsx(
              "flex items-center gap-2 transition-colors group",
              showComments ? "text-[#1d1d1f]" : "text-[#1d1d1f] hover:text-[#1d1d1f]"
            )}
          >
            <div className={clsx(
              "p-2 rounded-xl transition-colors",
              showComments ? "bg-[#ffcc00]" : "group-hover:bg-[#ffcc00]"
            )}>
              <MessageCircle className="w-5 h-5" />
            </div>
            <span className="text-sm font-semibold">{commentCount}</span>
          </button>
        </div>
        <button className="text-[#1d1d1f] hover:text-[#1d1d1f] transition-colors p-2 rounded-xl hover:bg-[#ffcc00]">
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      {showComments && (
        <div className="px-6 py-6 bg-white border-t border-brand-50 animate-in slide-in-from-top duration-300">
          <form onSubmit={handleComment} className="flex gap-3 mb-6">
            <ProfileAvatar profile={currentProfile} className="w-8 h-8 rounded-full bg-[#ff3b30] text-white font-semibold text-xs shrink-0 mt-1" />
            <div className="flex-1 relative">
              <input 
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="w-full bg-white rounded-xl px-4 py-2 text-sm outline-none border border-transparent focus:border-black transition-all pr-10"
              />
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-[#1d1d1f] hover:text-[#4f46e5]">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>

          <div className="space-y-4">
            {post_comments?.map((comment: any) => (
              <div key={comment.id} className="flex gap-3 group">
                <ProfileAvatar profile={comment.profiles} className="w-8 h-8 rounded-full bg-[#ffcc00] text-[#1d1d1f] font-semibold text-xs shrink-0" />
                <div className="flex-1 bg-white/70 backdrop-blur-md p-3 rounded-xl rounded-xl border border-black/5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-[#1d1d1f]">{comment.profiles?.full_name}</span>
                    <span className="text-[10px] text-[#1d1d1f]">{formatDistanceToNow(new Date(comment.created_at))} ago</span>
                  </div>
                  <p className="text-sm text-[#1d1d1f] leading-snug">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
