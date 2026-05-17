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
          className="bg-card p-6 rounded-none border-4 border-brand-200 shadow-lg shadow-sm cursor-pointer hover:shadow-md transition-all group"
        >
          <div className="flex gap-4 items-center">
            <Link to={`/profile/${profile?.username}`} className="hover:scale-105 transition-transform shrink-0">
              <ProfileAvatar profile={profile} className="w-12 h-12 rounded-none gradient-brand text-white font-bold text-xl shadow-md" />
            </Link>
            <div className="flex-1 bg-white rounded-none px-6 py-3.5 text-brand-400 font-medium group-hover:bg-brand-100 transition-colors">
              What's on your mind, {profile?.full_name?.split(' ')[0]}?
            </div>
          </div>
        </div>

        {/* Posts List */}
        <div className="space-y-6 pb-20 md:pb-10">
          {missingRoutePost && (
            <div className="rounded-none border-4 border-brand-200 shadow-lg bg-amber-50 px-5 py-4 font-semibold text-amber-800">
              This post could not be found.
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-20">
               <Loader2 className="w-8 h-8 animate-spin text-slate-900" />
            </div>
          ) : posts && posts.length > 0 ? (
            posts.map((post) => (
              <PostCard key={post.id} post={post} isHighlighted={post.id === postId} />
            ))
          ) : (
            <div className="py-20 text-center bg-card rounded-none border-4 border-brand-200 shadow-lg">
               <div className="w-16 h-16 bg-white rounded-none flex items-center justify-center text-brand-300 mx-auto mb-4">
                  <Type className="w-8 h-8" />
               </div>
               <h3 className="font-bold text-black">Your feed is empty</h3>
               <p className="text-slate-900 text-sm">Be the first to share an update!</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="hidden lg:block space-y-6">
        <div className="bg-card p-6 rounded-none border-4 border-brand-200 shadow-lg shadow-sm">
          <h3 className="font-bold text-black mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
            Suggested Connections
          </h3>
          <div className="space-y-4">
            <SuggestionItem name="Dr. Sarah Chen" role="Professor" school="UC Berkeley" />
            <SuggestionItem name="Marcus Rivera" role="Student" school="Santa Monica College" />
            <SuggestionItem name="Dr. Emily Watts" role="Professor" school="UCLA" />
          </div>
        </div>

        <div className="bg-card p-6 rounded-none border-4 border-brand-200 shadow-lg shadow-sm">
          <h3 className="font-bold text-black mb-4 text-sm uppercase tracking-wider">Trending</h3>
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
      className="fixed inset-0 bg-brand-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 md:p-6"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-card w-full max-w-2xl rounded-none shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="px-8 py-6 border-b-4 border-brand-200 flex items-center justify-between bg-white/30">
          <div className="flex items-center gap-3">
            <ProfileAvatar profile={profile} className="w-10 h-10 rounded-none gradient-brand text-white font-bold text-lg shadow-sm" />
            <div>
              <h3 className="font-bold text-black leading-tight">Create Post</h3>
              <p className="text-[10px] text-brand-400 font-bold uppercase tracking-wider">Post to Academic Feed</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-none bg-card border-4 border-brand-200 shadow-lg flex items-center justify-center text-brand-400 hover:text-black transition-all shadow-sm"
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
            className="w-full min-h-[200px] text-xl text-black placeholder:text-brand-300 outline-none resize-none bg-transparent"
            autoFocus
          />

          {imagePreview && (
            <div className="relative group">
              <img src={imagePreview} className="w-full h-auto rounded-none border-4 border-brand-200 shadow-lg shadow-sm" alt="Preview" />
              <button 
                onClick={() => { setImage(null); setImagePreview(null); }}
                className="absolute top-4 right-4 w-10 h-10 rounded-none bg-black/50 text-white flex items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          )}
        </div>

        <div className="p-6 bg-white/50 border-t-4 border-brand-200">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-1 bg-card p-1.5 rounded-none border-4 border-brand-200 shadow-lg shadow-sm">
              <ToolbarButton onClick={() => insertText('**', '**')} icon={<Bold className="w-4 h-4" />} title="Bold" />
              <ToolbarButton onClick={() => insertText('*', '*')} icon={<Italic className="w-4 h-4" />} title="Italic" />
              <ToolbarButton onClick={() => insertText('# ')} icon={<Heading1 className="w-4 h-4" />} title="H1" />
              <ToolbarButton onClick={() => insertText('## ')} icon={<Heading2 className="w-4 h-4" />} title="H2" />
              <ToolbarButton onClick={() => insertText('- ')} icon={<List className="w-4 h-4" />} title="List" />
              <div className="w-px h-6 bg-brand-100 mx-1" />
              
              <div className="relative">
                <ToolbarButton 
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)} 
                  icon={<Smile className="w-4 h-4" />} 
                  title="Emoji" 
                />
                {showEmojiPicker && (
                  <div className="absolute bottom-full mb-4 left-0 bg-card border-4 border-brand-200 shadow-lg p-3 rounded-none shadow-xl grid grid-cols-4 gap-2 z-10 animate-in fade-in slide-in-from-bottom-2">
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
              className="gradient-brand text-white px-8 py-3.5 rounded-none font-bold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center gap-2 disabled:opacity-50"
            >
              {isPosting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Publish Post <Send className="w-4 h-4" /></>}
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
      className="p-2.5 rounded-none hover:bg-white text-slate-900 hover:text-black transition-all"
    >
      {icon}
    </button>
  )
}

function SuggestionItem({ name, role, school }: any) {
  return (
    <div className="flex items-center justify-between group">
      <div className="flex items-center gap-3">
        <ProfileAvatar name={name} className="w-10 h-10 rounded-none gradient-soft border-4 border-brand-200 shadow-lg text-brand-400 font-bold text-sm" />
        <div className="flex flex-col">
          <span className="text-sm font-bold text-black leading-tight group-hover:text-accent-600 transition-colors">{name}</span>
          <span className="text-[10px] text-brand-400 font-medium">{role} • {school}</span>
        </div>
      </div>
      <button className="p-1.5 rounded-none bg-white text-slate-900 hover:bg-brand-900 hover:text-white transition-all">
        <Plus className="w-4 h-4" />
      </button>
    </div>
  )
}

function TrendingItem({ tag, count }: any) {
  return (
    <div className="flex flex-col hover:bg-white p-2 rounded-none transition-colors cursor-pointer group">
      <span className="text-sm font-bold text-black group-hover:text-accent-600 transition-colors">{tag}</span>
      <span className="text-[10px] text-brand-400 font-medium">{count}</span>
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
        "bg-card rounded-none border shadow-sm hover:shadow-md transition-all overflow-hidden scroll-mt-24",
        isHighlighted ? "border-accent-300 ring-4 ring-accent-100" : "border-brand-200"
      )}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Link to={`/profile/${profiles?.username}`} className="hover:scale-105 transition-transform shrink-0">
              <ProfileAvatar profile={profiles} className="w-12 h-12 rounded-none gradient-brand text-white font-bold text-xl shadow-sm" />
            </Link>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <Link to={`/profile/${profiles?.username}`} className="font-bold text-black leading-tight hover:text-accent-600 transition-colors">
                  {profiles?.full_name}
                </Link>
                {isProfessor && (
                  <span className="bg-accent-100 text-accent-700 text-[10px] font-bold px-2 py-0.5 rounded-none uppercase tracking-wider">
                    Professor
                  </span>
                )}
              </div>
              <span className="text-xs text-brand-400 font-medium">{profiles?.school_name} • {formatDistanceToNow(new Date(created_at))} ago</span>
            </div>
          </div>
          <button className="text-brand-300 hover:text-black transition-colors">
            <MoreHorizontal className="w-6 h-6" />
          </button>
        </div>
        
        <div className="prose prose-brand max-w-none text-black leading-relaxed mb-4 bg-white p-4 border-2 border-brand-200 shadow-inner">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>

      {image_url && (
        <div className="px-6 mb-4">
          <img 
            src={image_url} 
            alt="Post content" 
            className="w-full h-auto rounded-none object-cover border-4 border-brand-200 shadow-lg shadow-sm"
          />
        </div>
      )}

      <div className="px-6 py-4 bg-white/50 border-t-4 border-brand-200 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button 
            onClick={toggleLike}
            className={clsx(
              "flex items-center gap-2 transition-colors group",
              isLiked ? "text-accent-600" : "text-slate-900 hover:text-accent-600"
            )}
          >
            <div className={clsx(
              "p-2 rounded-none transition-colors",
              isLiked ? "bg-accent-50" : "group-hover:bg-accent-50"
            )}>
              <Heart className={clsx("w-5 h-5", isLiked && "fill-current")} />
            </div>
            <span className="text-sm font-bold">{likeCount}</span>
          </button>
          <button 
            onClick={() => setShowComments(!showComments)}
            className={clsx(
              "flex items-center gap-2 transition-colors group",
              showComments ? "text-black" : "text-slate-900 hover:text-black"
            )}
          >
            <div className={clsx(
              "p-2 rounded-none transition-colors",
              showComments ? "bg-brand-100" : "group-hover:bg-brand-100"
            )}>
              <MessageCircle className="w-5 h-5" />
            </div>
            <span className="text-sm font-bold">{commentCount}</span>
          </button>
        </div>
        <button className="text-slate-900 hover:text-black transition-colors p-2 rounded-none hover:bg-brand-100">
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      {showComments && (
        <div className="px-6 py-6 bg-white border-t-4 border-brand-200 animate-in slide-in-from-top duration-300">
          <form onSubmit={handleComment} className="flex gap-3 mb-6">
            <ProfileAvatar profile={currentProfile} className="w-8 h-8 rounded-none gradient-brand text-white font-bold text-xs shrink-0 mt-1" />
            <div className="flex-1 relative">
              <input
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="w-full bg-white rounded-none px-4 py-2 text-sm outline-none border-2 border-brand-200 focus:border-brand-200 transition-all pr-10 text-black"
              />
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-brand-400 hover:text-accent-600">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>

          <div className="space-y-4">
            {post_comments?.map((comment: any) => (
              <div key={comment.id} className="flex gap-3 group">
                <ProfileAvatar profile={comment.profiles} className="w-8 h-8 rounded-none bg-brand-100 text-black font-bold text-xs shrink-0" />
                <div className="flex-1 bg-white/50 p-3 rounded-none rounded-none border-4 border-brand-200 shadow-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-black">{comment.profiles?.full_name}</span>
                    <span className="text-[10px] text-brand-400">{formatDistanceToNow(new Date(comment.created_at))} ago</span>
                  </div>
                  <p className="text-sm text-black leading-snug">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
