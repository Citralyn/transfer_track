import { useState, useRef } from 'react'
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

export default function Feed() {
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
            profiles (full_name, username)
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    }
  })

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        {/* Simple Trigger Input */}
        <div 
          onClick={() => setIsEditorOpen(true)}
          className="bg-white p-6 rounded-[2rem] border border-brand-100 shadow-sm cursor-pointer hover:shadow-md transition-all group"
        >
          <div className="flex gap-4 items-center">
            <div className="w-12 h-12 rounded-2xl gradient-brand flex items-center justify-center text-white font-bold text-xl shadow-md shrink-0">
              {profile?.full_name?.charAt(0)}
            </div>
            <div className="flex-1 bg-brand-50 rounded-2xl px-6 py-3.5 text-brand-400 font-medium group-hover:bg-brand-100 transition-colors">
              What's on your mind, {profile?.full_name?.split(' ')[0]}?
            </div>
          </div>
        </div>

        {/* Posts List */}
        <div className="space-y-6 pb-20 md:pb-10">
          {isLoading ? (
            <div className="flex justify-center py-20">
               <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
            </div>
          ) : posts && posts.length > 0 ? (
            posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))
          ) : (
            <div className="py-20 text-center bg-white rounded-[2rem] border border-brand-100">
               <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-300 mx-auto mb-4">
                  <Type className="w-8 h-8" />
               </div>
               <h3 className="font-bold text-brand-900">Your feed is empty</h3>
               <p className="text-brand-500 text-sm">Be the first to share an update!</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="hidden lg:block space-y-6">
        <div className="bg-white p-6 rounded-[2rem] border border-brand-100 shadow-sm">
          <h3 className="font-bold text-brand-900 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
            Suggested Connections
          </h3>
          <div className="space-y-4">
            <SuggestionItem name="Dr. Sarah Chen" role="Professor" school="UC Berkeley" />
            <SuggestionItem name="Marcus Rivera" role="Student" school="Santa Monica College" />
            <SuggestionItem name="Dr. Emily Watts" role="Professor" school="UCLA" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-brand-100 shadow-sm">
          <h3 className="font-bold text-brand-900 mb-4 text-sm uppercase tracking-wider">Trending</h3>
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
        className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="px-8 py-6 border-b border-brand-50 flex items-center justify-between bg-brand-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center text-white font-bold text-lg shadow-sm">
              {profile?.full_name?.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-brand-900 leading-tight">Create Post</h3>
              <p className="text-[10px] text-brand-400 font-bold uppercase tracking-wider">Post to Academic Feed</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white border border-brand-100 flex items-center justify-center text-brand-400 hover:text-brand-900 transition-all shadow-sm"
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
            className="w-full min-h-[200px] text-xl text-brand-900 placeholder:text-brand-300 outline-none resize-none bg-transparent"
            autoFocus
          />

          {imagePreview && (
            <div className="relative group">
              <img src={imagePreview} className="w-full h-auto rounded-3xl border border-brand-100 shadow-sm" alt="Preview" />
              <button 
                onClick={() => { setImage(null); setImagePreview(null); }}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          )}
        </div>

        <div className="p-6 bg-brand-50/50 border-t border-brand-50">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl border border-brand-100 shadow-sm">
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
                  <div className="absolute bottom-full mb-4 left-0 bg-white border border-brand-100 p-3 rounded-2xl shadow-xl grid grid-cols-4 gap-2 z-10 animate-in fade-in slide-in-from-bottom-2">
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
              className="gradient-brand text-white px-8 py-3.5 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center gap-2 disabled:opacity-50"
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
      className="p-2.5 rounded-xl hover:bg-brand-50 text-brand-500 hover:text-brand-900 transition-all"
    >
      {icon}
    </button>
  )
}

function SuggestionItem({ name, role, school }: any) {
  return (
    <div className="flex items-center justify-between group">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl gradient-soft border border-brand-50 flex items-center justify-center text-brand-400 font-bold">
          {name.charAt(0)}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-brand-900 leading-tight group-hover:text-accent-600 transition-colors">{name}</span>
          <span className="text-[10px] text-brand-400 font-medium">{role} • {school}</span>
        </div>
      </div>
      <button className="p-1.5 rounded-lg bg-brand-50 text-brand-500 hover:bg-brand-900 hover:text-white transition-all">
        <Plus className="w-4 h-4" />
      </button>
    </div>
  )
}

function TrendingItem({ tag, count }: any) {
  return (
    <div className="flex flex-col hover:bg-brand-50 p-2 rounded-xl transition-colors cursor-pointer group">
      <span className="text-sm font-bold text-brand-900 group-hover:text-accent-600 transition-colors">{tag}</span>
      <span className="text-[10px] text-brand-400 font-medium">{count}</span>
    </div>
  )
}

function PostCard({ post }: { post: any }) {
  const { profiles, content, created_at, post_comments, image_url } = post
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
    <div className="bg-white rounded-[2rem] border border-brand-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl gradient-brand flex items-center justify-center text-white font-bold text-xl shadow-sm shrink-0">
              {profiles?.full_name?.charAt(0)}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-bold text-brand-900 leading-tight">{profiles?.full_name}</span>
                {isProfessor && (
                  <span className="bg-accent-100 text-accent-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Professor
                  </span>
                )}
              </div>
              <span className="text-xs text-brand-400 font-medium">{profiles?.school_name} • {formatDistanceToNow(new Date(created_at))} ago</span>
            </div>
          </div>
          <button className="text-brand-300 hover:text-brand-600 transition-colors">
            <MoreHorizontal className="w-6 h-6" />
          </button>
        </div>
        
        <div className="prose prose-brand max-w-none text-brand-800 leading-relaxed mb-4">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>

      {image_url && (
        <div className="px-6 mb-4">
          <img 
            src={image_url} 
            alt="Post content" 
            className="w-full h-auto rounded-3xl object-cover border border-brand-50 shadow-sm"
          />
        </div>
      )}

      <div className="px-6 py-4 bg-brand-50/50 border-t border-brand-50 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button 
            onClick={toggleLike}
            className={clsx(
              "flex items-center gap-2 transition-colors group",
              isLiked ? "text-accent-600" : "text-brand-500 hover:text-accent-600"
            )}
          >
            <div className={clsx(
              "p-2 rounded-xl transition-colors",
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
              showComments ? "text-brand-900" : "text-brand-500 hover:text-brand-900"
            )}
          >
            <div className={clsx(
              "p-2 rounded-xl transition-colors",
              showComments ? "bg-brand-100" : "group-hover:bg-brand-100"
            )}>
              <MessageCircle className="w-5 h-5" />
            </div>
            <span className="text-sm font-bold">{commentCount}</span>
          </button>
        </div>
        <button className="text-brand-500 hover:text-brand-900 transition-colors p-2 rounded-xl hover:bg-brand-100">
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      {showComments && (
        <div className="px-6 py-6 bg-white border-t border-brand-50 animate-in slide-in-from-top duration-300">
          <form onSubmit={handleComment} className="flex gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center text-white font-bold text-xs shrink-0 mt-1">
              {profiles?.full_name?.charAt(0)}
            </div>
            <div className="flex-1 relative">
              <input 
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="w-full bg-brand-50 rounded-xl px-4 py-2 text-sm outline-none border border-transparent focus:border-brand-200 transition-all pr-10"
              />
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-brand-400 hover:text-accent-600">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>

          <div className="space-y-4">
            {post_comments?.map((comment: any) => (
              <div key={comment.id} className="flex gap-3 group">
                <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-xs shrink-0">
                  {comment.profiles?.full_name?.charAt(0)}
                </div>
                <div className="flex-1 bg-brand-50/50 p-3 rounded-2xl rounded-tl-none border border-brand-50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-brand-900">{comment.profiles?.full_name}</span>
                    <span className="text-[10px] text-brand-400">{formatDistanceToNow(new Date(comment.created_at))} ago</span>
                  </div>
                  <p className="text-sm text-brand-700 leading-snug">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
