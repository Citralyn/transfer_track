import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/useAuthStore'
import { Image, Send, Heart, MessageCircle, Share2, MoreHorizontal, Sparkles, Plus } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default function Feed() {
  const [posts, setPosts] = useState<any[]>([])
  const [newPostContent, setNewPostContent] = useState('')
  const [loading, setLoading] = useState(false)
  const { profile } = useAuthStore()

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
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
        post_likes (id),
        post_comments (id)
      `)
      .order('created_at', { ascending: false })

    if (data) setPosts(data)
    if (error) console.error('Error fetching posts:', error)
  }

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPostContent.trim() || !profile) return
    setLoading(true)

    const { error } = await supabase
      .from('posts')
      .insert([{ 
        user_id: profile.id, 
        content: newPostContent 
      }])

    if (!error) {
      setNewPostContent('')
      fetchPosts()
    }
    setLoading(false)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        {/* Create Post Card */}
        <div className="bg-white p-6 rounded-[2rem] border border-brand-100 shadow-sm transition-all hover:shadow-md">
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-2xl gradient-brand flex items-center justify-center text-white font-bold text-xl shadow-md shrink-0">
              {profile?.full_name?.charAt(0)}
            </div>
            <form onSubmit={handleCreatePost} className="flex-1">
              <textarea 
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="Share an update, ask for advice, or post an opportunity..."
                className="w-full bg-brand-50 rounded-2xl p-4 text-brand-900 placeholder:text-brand-400 outline-none border border-transparent focus:border-brand-200 transition-all resize-none min-h-[100px]"
              />
              <div className="flex items-center justify-between mt-4">
                <div className="flex gap-2">
                  <button type="button" className="p-2.5 rounded-xl bg-brand-50 text-brand-500 hover:text-brand-800 transition-all">
                    <Image className="w-5 h-5" />
                  </button>
                  <button type="button" className="p-2.5 rounded-xl bg-brand-50 text-brand-500 hover:text-brand-800 transition-all">
                    <Sparkles className="w-5 h-5" />
                  </button>
                </div>
                <button 
                  type="submit"
                  disabled={loading || !newPostContent.trim()}
                  className="gradient-brand text-white px-6 py-2.5 rounded-xl font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  Post <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Posts List */}
        <div className="space-y-6 pb-20 md:pb-10">
          {posts.length > 0 ? (
            posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))
          ) : (
            <div className="py-20 text-center bg-white rounded-[2rem] border border-brand-100">
               <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-300 mx-auto mb-4">
                  <Sparkles className="w-8 h-8" />
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
          <h3 className="font-bold text-brand-900 mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent-500" /> Suggested Connections
          </h3>
          <div className="space-y-4">
            <SuggestionItem name="Dr. Sarah Chen" role="Professor" school="UC Berkeley" />
            <SuggestionItem name="Marcus Rivera" role="Student" school="Santa Monica College" />
            <SuggestionItem name="Dr. Emily Watts" role="Professor" school="UCLA" />
          </div>
          <button className="w-full mt-6 text-sm font-bold text-accent-600 hover:underline">View all suggestions</button>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-brand-100 shadow-sm">
          <h3 className="font-bold text-brand-900 mb-4">Trending Topics</h3>
          <div className="space-y-3">
            <TrendingItem tag="#UCApplications" count="1.2k posts" />
            <TrendingItem tag="#STEMResearch" count="850 posts" />
            <TrendingItem tag="#TransferTips" count="640 posts" />
            <TrendingItem tag="#UCLAOpenHouse" count="420 posts" />
          </div>
        </div>
      </div>
    </div>
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
  const { profiles, content, created_at, post_likes, post_comments } = post
  const isProfessor = profiles?.role === 'professor'

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
        
        <p className="text-brand-800 leading-relaxed whitespace-pre-wrap mb-4">
          {content}
        </p>
      </div>

      {post.image_url && (
        <div className="px-6 mb-4">
          <img 
            src={post.image_url} 
            alt="Post content" 
            className="w-full h-auto rounded-3xl object-cover border border-brand-50"
          />
        </div>
      )}

      <div className="px-6 py-4 bg-brand-50/50 border-t border-brand-50 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button className="flex items-center gap-2 text-brand-500 hover:text-accent-600 transition-colors group">
            <div className="p-2 rounded-xl group-hover:bg-accent-50 transition-colors">
              <Heart className="w-5 h-5" />
            </div>
            <span className="text-sm font-bold">{post_likes?.length || 0}</span>
          </button>
          <button className="flex items-center gap-2 text-brand-500 hover:text-brand-900 transition-colors group">
            <div className="p-2 rounded-xl group-hover:bg-brand-100 transition-colors">
              <MessageCircle className="w-5 h-5" />
            </div>
            <span className="text-sm font-bold">{post_comments?.length || 0}</span>
          </button>
        </div>
        <button className="text-brand-500 hover:text-brand-900 transition-colors p-2 rounded-xl hover:bg-brand-100">
          <Share2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
