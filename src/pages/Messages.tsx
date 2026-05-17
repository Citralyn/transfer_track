import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'
import { 
  fetchConversations, 
  fetchMessages, 
  sendMessage, 
  subscribeToMessages,
  subscribeToAllUserMessages,
  fetchConversation,
  type Message,
  type Conversation
} from '@/lib/messaging'
import { 
  Send, 
  Search, 
  User, 
  MoreVertical, 
  MessageCircle,
  Loader2,
  ChevronLeft,
  Calendar
} from 'lucide-react'
import { clsx } from 'clsx'
import { format } from 'date-fns'
import { ProfileAvatar } from '@/components/ui/ProfileAvatar'

export default function Messages() {
  const { conversationId } = useParams()
  const { profile } = useAuthStore()
  const navigate = useNavigate()
  
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const activeConversation = conversations.find(c => c.id === conversationId)

  // 1. Fetch conversations list
  useEffect(() => {
    if (!profile?.id) return
    
    const loadConvs = async () => {
      const data = await fetchConversations(profile.id)
      setConversations(data)
      setLoading(false)
    }
    
    loadConvs()
  }, [profile?.id])

  // 1.5 Global message listener for sidebar updates
  useEffect(() => {
    if (!profile?.id) return

    const subscription = subscribeToAllUserMessages(async (msg) => {
      setConversations(prev => {
        const exists = prev.some(c => c.id === msg.conversation_id)
        
        if (exists) {
          // Update count for existing conversation
          return prev.map(c => 
            c.id === msg.conversation_id ? { ...c, messageCount: (c.messageCount || 0) + 1 } : c
          )
        } else {
          // This might be a brand new conversation for the recipient!
          // We need to fetch the details to add it to the sidebar.
          fetchConversation(msg.conversation_id, profile.id).then(newConv => {
            if (newConv) {
              setConversations(current => {
                if (current.some(c => c.id === newConv.id)) return current
                return [newConv, ...current]
              })
            }
          })
          return prev
        }
      })
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [profile?.id])

  // 2. Fetch messages for active conversation & subscribe to new ones
  useEffect(() => {
    if (!conversationId) {
      setMessages([])
      return
    }

    const loadMessages = async () => {
      const data = await fetchMessages(conversationId)
      setMessages(data)
    }

    loadMessages()

    const subscription = subscribeToMessages(conversationId, (msg) => {
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev
        return [...prev, msg]
      })
      // Increment message count for this conversation in the sidebar
      setConversations(prev => prev.map(c => 
        c.id === conversationId ? { ...c, messageCount: (c.messageCount || 0) + 1 } : c
      ))
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [conversationId])

  // 3. Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !conversationId || !profile?.id || sending) return

    setSending(true)
    try {
      const sentMsg = await sendMessage(conversationId, profile.id, newMessage)
      setMessages(prev => [...prev, sentMsg])
      setNewMessage('')
      // Increment message count for this conversation in the sidebar
      setConversations(prev => prev.map(c => 
        c.id === conversationId ? { ...c, messageCount: (c.messageCount || 0) + 1 } : c
      ))
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setSending(false)
    }
  }

  const filteredConversations = conversations.filter(c => {
    // Only show conversations that have messages OR are currently selected (active)
    const hasMessages = (c.messageCount || 0) > 0
    const isActive = c.id === conversationId
    
    if (!hasMessages && !isActive) return false

    const otherParticipant = c.participants[0]?.profiles
    return otherParticipant?.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           otherParticipant?.username.toLowerCase().includes(searchQuery.toLowerCase())
  })

  if (loading) {
    return (
      <div className="h-[calc(100vh-12rem)] flex items-center justify-center bg-white rounded-[3rem] border border-brand-100 shadow-sm">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-[3rem] border border-brand-100 shadow-sm h-[calc(100vh-12rem)] flex overflow-hidden">
      {/* Conversations Sidebar */}
      <div className={clsx(
        "w-full md:w-80 lg:w-96 border-r border-brand-50 flex flex-col transition-all",
        conversationId ? "hidden md:flex" : "flex"
      )}>
        <div className="p-6 border-b border-brand-50">
          <h2 className="text-2xl font-bold text-brand-900 mb-4">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-400" />
            <input 
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-brand-50 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length > 0 ? (
            filteredConversations.map((conv) => {
              const otherUser = conv.participants[0]?.profiles
              const isActive = conversationId === conv.id
              
              return (
                <div 
                  key={conv.id}
                  onClick={() => navigate(`/messages/${conv.id}`)}
                  className={clsx(
                    "p-4 flex gap-4 cursor-pointer hover:bg-brand-50 transition-colors border-l-4",
                    isActive ? "bg-brand-50 border-accent-500" : "border-transparent"
                  )}
                >
                  <ProfileAvatar 
                    profile={otherUser} 
                    className="w-12 h-12 rounded-2xl gradient-brand text-white font-bold shrink-0 shadow-sm" 
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h4 className="font-bold text-brand-900 truncate">{otherUser?.full_name}</h4>
                    </div>
                    <p className="text-xs text-brand-400 font-medium uppercase tracking-wider">{otherUser?.role}</p>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="p-10 text-center text-brand-400">
              <p className="text-sm">No conversations found.</p>
            </div>
          )}
        </div>
      </div>

      {/* Message Area */}
      <div className={clsx(
        "flex-1 flex flex-col bg-brand-50/30",
        !conversationId ? "hidden md:flex items-center justify-center p-12 text-center" : "flex"
      )}>
        {conversationId && activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="bg-white p-4 md:px-8 md:py-5 border-b border-brand-50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => navigate('/messages')}
                  className="md:hidden p-2 hover:bg-brand-50 rounded-full transition-colors"
                >
                  <ChevronLeft className="w-6 h-6 text-brand-600" />
                </button>
                <ProfileAvatar 
                  profile={activeConversation.participants[0]?.profiles} 
                  className="w-10 h-10 rounded-xl gradient-brand text-white font-bold shadow-sm" 
                />
                <div>
                  <h3 className="font-bold text-brand-900 leading-tight">
                    {activeConversation.participants[0]?.profiles?.full_name}
                  </h3>
                  <p className="text-[10px] text-brand-400 font-bold uppercase tracking-widest">
                    {activeConversation.participants[0]?.profiles?.role}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Link 
                  to={`/profile/${activeConversation.participants[0]?.profiles?.username}`}
                  className="p-2 hover:bg-brand-50 rounded-xl transition-colors text-brand-400"
                >
                  <User className="w-5 h-5" />
                </Link>
                <button className="p-2 hover:bg-brand-50 rounded-xl transition-colors text-brand-400">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="flex justify-center mb-8">
                 <div className="bg-white border border-brand-100 px-4 py-1.5 rounded-full text-[10px] font-bold text-brand-400 uppercase tracking-widest flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    Conversation Started {format(new Date(activeConversation.created_at), 'MMMM do, yyyy')}
                 </div>
              </div>
              
              {messages.map((msg) => {
                const isMe = msg.sender_id === profile?.id
                return (
                  <div 
                    key={msg.id}
                    className={clsx(
                      "flex flex-col max-w-[80%]",
                      isMe ? "ml-auto items-end" : "items-start"
                    )}
                  >
                    <div className={clsx(
                      "px-5 py-3 rounded-[2rem] text-sm leading-relaxed shadow-sm",
                      isMe 
                        ? "gradient-brand text-white rounded-tr-none" 
                        : "bg-white border border-brand-100 text-brand-800 rounded-tl-none"
                    )}>
                      {msg.content}
                    </div>
                    <span className="text-[10px] text-brand-300 font-bold mt-1.5 px-2">
                      {format(new Date(msg.created_at), 'h:mm a')}
                    </span>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 bg-white border-t border-brand-50">
              <form onSubmit={handleSendMessage} className="flex gap-4">
                <input 
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 bg-brand-50 px-6 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500 transition-all text-brand-900"
                />
                <button 
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="w-14 h-14 gradient-brand rounded-2xl flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 active:scale-95"
                >
                  {sending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-white rounded-[2rem] shadow-inner flex items-center justify-center text-brand-100 mb-6">
              <MessageCircle className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-brand-900 mb-2">Your Conversations</h3>
            <p className="text-brand-400 text-sm max-w-xs mx-auto font-medium">
              Select a chat from the sidebar or visit a profile to start a new conversation.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
