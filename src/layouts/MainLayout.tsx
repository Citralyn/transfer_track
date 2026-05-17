import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom'
import { 
  Home, 
  Search, 
  Briefcase, 
  User, 
  MessageSquare, 
  Settings, 
  LogOut, 
  Bell, 
  Menu, 
  X
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { clsx } from 'clsx'
import { ProfileAvatar } from '@/components/ui/ProfileAvatar'
import { useQuery } from '@tanstack/react-query'
import {
  fetchNotifications,
  loadSeenNotificationIds,
  saveSeenNotificationIds,
  type AppNotification,
} from '@/lib/notifications'
import { encodeSearchSlug } from '@/lib/search'

export default function MainLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [seenNotificationIds, setSeenNotificationIds] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const { profile, signOut } = useAuthStore()
  const navigate = useNavigate()
  const mobileNotificationsRef = useRef<HTMLDivElement>(null)
  const desktopNotificationsRef = useRef<HTMLDivElement>(null)

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', profile?.id],
    enabled: Boolean(profile?.id),
    queryFn: () => fetchNotifications(profile!.id),
    refetchInterval: 30000,
  })

  useEffect(() => {
    if (!profile?.id) {
      setSeenNotificationIds(new Set())
      return
    }
    setSeenNotificationIds(loadSeenNotificationIds(profile.id))
  }, [profile?.id])

  useEffect(() => {
    if (!isNotificationsOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      const clickedInsideMobile = mobileNotificationsRef.current?.contains(target)
      const clickedInsideDesktop = desktopNotificationsRef.current?.contains(target)
      if (!clickedInsideMobile && !clickedInsideDesktop) {
        setIsNotificationsOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [isNotificationsOpen])

  const unseenNotifications = useMemo(
    () => notifications.filter((notification) => !seenNotificationIds.has(notification.id)),
    [notifications, seenNotificationIds]
  )

  const openNotifications = () => {
    setIsNotificationsOpen((current) => {
      const nextOpen = !current
      if (nextOpen && profile?.id && notifications.length > 0) {
        const ids = notifications.map((notification) => notification.id)
        saveSeenNotificationIds(profile.id, ids)
        setSeenNotificationIds(loadSeenNotificationIds(profile.id))
      }
      return nextOpen
    })
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const query = searchQuery.trim()
    if (query) {
      navigate(`/search/${encodeSearchSlug(query)}`)
      setIsMobileMenuOpen(false)
    }
  }

  const navItems = [
    { name: 'Feed', path: '/feed', icon: <Home className="w-6 h-6" />, color: 'bg-[#ffff00] text-black' },
    { name: 'Opportunities', path: '/opportunities', icon: <Briefcase className="w-6 h-6" />, color: 'bg-[#ff00ff] text-white' },
    { name: 'People', path: '/people', icon: <UsersIcon className="w-6 h-6" />, color: 'bg-[#00ff00] text-black' },
    { name: 'Messages', path: '/messages', icon: <MessageSquare className="w-6 h-6" />, color: 'bg-[#4f46e5] text-white' },
    { name: 'Profile', path: `/profile`, icon: <User className="w-6 h-6" />, color: 'bg-[#ff0000] text-white' },
  ]

  return (
    <div className="min-h-screen bg-[#fdfcf0] flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-white border-r-4 border-black h-screen sticky top-0 p-6">
        <Link to="/feed" className="flex items-center gap-2 mb-10 px-2">
          <div className="w-12 h-12 bg-[#ff0000] border-4 border-black rounded-none flex items-center justify-center text-white font-black text-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            TT
          </div>
          <span className="text-xl font-black text-black tracking-tight uppercase">Transfer Track</span>
        </Link>

        <nav className="flex-1 space-y-3">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) => clsx(
                "flex items-center gap-4 px-4 py-4 rounded-none font-black transition-all duration-100 border-4 border-black",
                isActive 
                  ? `${item.color} shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]` 
                  : "text-black hover:bg-white border-transparent"
              )}
            >
              {item.icon}
              <span className="uppercase tracking-tighter">{item.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto space-y-2 pt-6 border-t border-brand-50">
          <NavLink
            to="/settings"
            className={({ isActive }) => clsx(
              "flex items-center gap-4 px-4 py-3.5 rounded-none font-black transition-all",
              isActive ? "bg-white text-black" : "text-black hover:text-black hover:bg-white"
            )}
          >
            <Settings className="w-6 h-6" />
            <span>Settings</span>
          </NavLink>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-none font-black text-black hover:text-red-600 hover:bg-red-50 transition-all"
          >
            <LogOut className="w-6 h-6" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between px-6 py-4 bg-white border-b-4 border-black sticky top-0 z-50">
        <Link to="/feed" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-[#ff0000] border-4 border-black rounded-none flex items-center justify-center text-white font-black text-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            TT
          </div>
        </Link>
        <div className="flex items-center gap-4">
          <div className="relative" ref={mobileNotificationsRef}>
            <NotificationBell
              compact
              hasUnseen={unseenNotifications.length > 0}
              onClick={openNotifications}
            />
            {isNotificationsOpen && (
              <NotificationsDropdown
                notifications={notifications}
                seenNotificationIds={seenNotificationIds}
                onNavigate={(href) => {
                  setIsNotificationsOpen(false)
                  navigate(getNotificationTarget(href))
                }}
              />
            )}
          </div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-black bg-[#ffff00] border-4 border-black p-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            {isMobileMenuOpen ? <X className="w-8 h-8 stroke-[3]" /> : <Menu className="w-8 h-8 stroke-[3]" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[76px] bg-white z-40 p-6 animate-in slide-in-from-top duration-300">
          <form onSubmit={handleSearch} className="relative mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-black" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="SEARCH..."
              className="w-full pl-14 pr-4 py-4 rounded-none bg-white border-4 border-black outline-none font-black"
            />
          </form>
          
          <nav className="space-y-4">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) => clsx(
                  "flex items-center gap-4 px-6 py-5 rounded-none font-black text-xl border-4 border-black transition-all",
                  isActive ? `${item.color} shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]` : "bg-white text-black"
                )}
              >
                {item.icon}
                <span className="uppercase">{item.name}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
        <div className="max-w-4xl mx-auto">
          {/* Header with Search and Profile */}
          <div className="hidden md:flex items-center justify-between mb-12">
            <form onSubmit={handleSearch} className="relative flex-1 max-w-lg">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-black" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="SEARCH EVERYTHING..."
                className="w-full pl-14 pr-4 py-4 rounded-none bg-white border-4 border-black outline-none font-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] focus:translate-x-1 focus:translate-y-1 focus:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all text-black placeholder:text-black"
              />
            </form>
            <div className="flex items-center gap-4 ml-6 relative group">
              <div className="relative" ref={desktopNotificationsRef}>
                <NotificationBell
                  hasUnseen={unseenNotifications.length > 0}
                  onClick={openNotifications}
                />
                {isNotificationsOpen && (
                  <NotificationsDropdown
                    notifications={notifications}
                    seenNotificationIds={seenNotificationIds}
                    onNavigate={(href) => {
                      setIsNotificationsOpen(false)
                      navigate(getNotificationTarget(href))
                    }}
                  />
                )}
              </div>
              
              {/* Profile Section with Dropdown */}
              <div className="relative py-2">
                <Link 
                  to="/profile" 
                  className="flex items-center gap-3 bg-white border-4 border-black p-1.5 pr-4 rounded-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:border-brand-300 transition-all cursor-pointer relative z-[101]"
                >
                  <ProfileAvatar profile={profile} className="w-9 h-9 rounded-none bg-[#ff0000] text-white font-black" />
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-black leading-tight">{profile?.full_name}</span>
                    <span className="text-[10px] text-black font-bold uppercase tracking-wider">{profile?.role}</span>
                  </div>
                </Link>

                {/* Dropdown Menu - Wrapped in a hover bridge container */}
                <div className="absolute right-0 top-full -mt-1 pt-3 w-48 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300 delay-75 z-[100]">
                  <div className="bg-white border-4 border-black rounded-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-2">
                    <Link 
                      to="/settings" 
                      className="flex items-center gap-3 px-4 py-2.5 rounded-none text-sm font-black text-black hover:bg-white hover:text-black transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                    <button 
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-4 py-2.5 rounded-none text-sm font-black text-black hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-black flex items-center justify-around py-3 px-2 z-50 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
         {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) => clsx(
                "flex flex-col items-center gap-1 px-3 py-1 rounded-none transition-all",
                isActive ? "text-[#4f46e5]" : "text-black"
              )}
            >
              {item.icon}
              <span className="text-[10px] font-black">{item.name}</span>
            </NavLink>
          ))}
      </nav>
    </div>
  )
}

function NotificationBell({
  hasUnseen,
  onClick,
  compact,
}: {
  hasUnseen: boolean
  onClick: () => void
  compact?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'flex items-center justify-center text-black hover:text-black transition-all relative',
        compact ? 'w-8 h-8' : 'w-12 h-12 bg-white border-4 border-black rounded-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]'
      )}
      aria-label="Notifications"
    >
      <Bell className="w-6 h-6" />
      {hasUnseen && (
        <span className={clsx(
          'absolute w-3 h-3 bg-[#ff00ff] border-4 border-black rounded-none',
          compact ? '-top-1 -right-1' : 'top-3 right-3'
        )} />
      )}
    </button>
  )
}

function NotificationsDropdown({
  notifications,
  seenNotificationIds,
  onNavigate,
}: {
  notifications: AppNotification[]
  seenNotificationIds: Set<string>
  onNavigate: (href: string) => void
}) {
  return (
    <div className="absolute right-0 top-full mt-3 w-[min(22rem,calc(100vw-2rem))] bg-white border-4 border-black rounded-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] z-[120] overflow-hidden">
      <div className="px-5 py-4 border-b border-brand-50">
        <h3 className="font-black text-black">Notifications</h3>
      </div>
      {notifications.length === 0 ? (
        <div className="p-8 text-center">
          <div className="w-14 h-14 bg-[#00ff00] rounded-none flex items-center justify-center text-black mx-auto mb-4">
            <Bell className="w-7 h-7" />
          </div>
          <p className="text-black font-bold">No notifications yet.</p>
        </div>
      ) : (
        <div className="max-h-96 overflow-y-auto p-2">
          {notifications.map((notification) => {
            const isSeen = seenNotificationIds.has(notification.id)
            return (
              <button
                key={notification.id}
                type="button"
                onClick={() => onNavigate(notification.href)}
                className={clsx(
                  'w-full text-left p-4 rounded-none transition-all border',
                  isSeen
                    ? 'border-transparent text-black hover:bg-white'
                    : 'border-accent-100 bg-[#ff00ff]/60 text-black hover:bg-[#ff00ff]'
                )}
              >
                <p className={clsx('text-sm leading-relaxed', isSeen ? 'font-bold' : 'font-black')}>
                  {notification.text}
                </p>
                {notification.createdAt && (
                  <p className="text-[11px] font-black uppercase tracking-wider text-black mt-2">
                    {formatNotificationTime(notification.createdAt)}
                  </p>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function formatNotificationTime(value: string) {
  const date = new Date(value)
  const diffMs = Date.now() - date.getTime()
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000))
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  return date.toLocaleDateString()
}

function getNotificationTarget(href: string) {
  const knownTargets = ['/feed', '/connections', '/messages']
  if (href.startsWith('/messages/')) return href
  if (href.startsWith('/feed/')) return href
  if (href.startsWith('/profile/')) return href
  if (href.startsWith('/opportunities/')) return href
  if (knownTargets.includes(href)) return href
  return '/feed'
}

function UsersIcon(props: any) {
  return (
    <svg 
      {...props}
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}
