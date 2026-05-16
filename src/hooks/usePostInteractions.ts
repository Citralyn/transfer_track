import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/useAuthStore'
import { useQueryClient } from '@tanstack/react-query'

export function usePostInteractions(post: any) {
  const { profile } = useAuthStore()
  const queryClient = useQueryClient()
  const [isLiking, setIsLiking] = useState(false)

  const isLiked = post.post_likes?.some((like: any) => like.user_id === profile?.id)

  const toggleLike = async () => {
    if (!profile || isLiking) return
    setIsLiking(true)

    if (isLiked) {
      const { error } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', post.id)
        .eq('user_id', profile.id)
      
      if (error) console.error('Error unliking:', error)
    } else {
      const { error } = await supabase
        .from('post_likes')
        .insert([{ post_id: post.id, user_id: profile.id }])
      
      if (error) console.error('Error liking:', error)
    }

    // Refresh feed
    queryClient.invalidateQueries({ queryKey: ['posts'] })
    setIsLiking(false)
  }

  const addComment = async (content: string) => {
    if (!profile || !content.trim()) return
    
    const { error } = await supabase
      .from('post_comments')
      .insert([{
        post_id: post.id,
        user_id: profile.id,
        content: content.trim()
      }])

    if (error) {
      console.error('Error commenting:', error)
      return { error }
    }

    queryClient.invalidateQueries({ queryKey: ['posts'] })
    return { success: true }
  }

  return {
    toggleLike,
    addComment,
    isLiked,
    likeCount: post.post_likes?.length || 0,
    commentCount: post.post_comments?.length || 0
  }
}
