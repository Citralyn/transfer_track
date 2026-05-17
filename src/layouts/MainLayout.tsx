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
    { name: 'Feed', path: '/feed', icon: <Home className="w-6 h-6" /> },
    { name: 'Opportunities', path: '/opportunities', icon: <Briefcase className="w-6 h-6" /> },
    { name: 'People', path: '/people', icon: <UsersIcon className="w-6 h-6" /> },
    { name: 'Messages', path: '/messages', icon: <MessageSquare className="w-6 h-6" /> },
    { name: 'Profile', path: `/profile`, icon: <User className="w-6 h-6" /> },
  ]

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-card border-r-4 border-brand-200 h-screen sticky top-0 p-6">
        <Link to="/feed" className="flex items-center gap-2 mb-10 px-2">
          <div className="w-10 h-10 gradient-brand rounded-none flex items-center justify-center text-white font-bold text-xl shadow-lg">
            TT
          </div>
          <span className="text-xl font-bold text-black tracking-tight">Transfer Track</span>
        </Link>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) => clsx(
                "flex items-center gap-4 px-4 py-3.5 rounded-none font-semibold transition-all duration-200",
                isActive 
                  ? "gradient-brand text-white shadow-md shadow-brand-200" 
                  : "text-slate-900 hover:text-black hover:bg-white"
              )}
            >
              {item.icon}
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto space-y-2 pt-6 border-t-4 border-brand-200">
          <NavLink
            to="/settings"
            className={({ isActive }) => clsx(
              "flex items-center gap-4 px-4 py-3.5 rounded-none font-semibold transition-all",
              isActive ? "bg-white text-black" : "text-slate-900 hover:text-black hover:bg-white"
            )}
          >
            <Settings className="w-6 h-6" />
            <span>Settings</span>
          </NavLink>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-none font-semibold text-slate-900 hover:text-red-600 hover:bg-red-50 transition-all"
          >
            <LogOut className="w-6 h-6" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between px-6 py-4 bg-card border-b-4 border-brand-200 sticky top-0 z-50">
        <Link to="/feed" className="flex items-center gap-2">
          <div className="w-8 h-8 gradient-brand rounded-none flex items-center justify-center text-white font-bold text-lg">
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
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-900">
            {isMobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[65px] bg-card z-40 p-6 animate-in slide-in-from-top duration-300">
          <form onSubmit={handleSearch} className="relative mb-5">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search everything..."
              className="w-full pl-12 pr-4 py-3 rounded-none bg-white border-4 border-brand-200 shadow-lg focus:ring-2 focus:ring-brand-500 outline-none transition-all"
            />
          </form>
          <nav className="space-y-4">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) => clsx(
                  "flex items-center gap-4 px-6 py-4 rounded-none font-bold text-lg transition-all",
                  isActive ? "gradient-brand text-white shadow-lg" : "text-slate-900 bg-white"
                )}
              >
                {item.icon}
                <span>{item.name}</span>
              </NavLink>
            ))}
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-4 px-6 py-4 rounded-none font-bold text-lg text-slate-900 bg-red-50"
            >
              <LogOut className="w-6 h-6" />
              <span>Logout</span>
            </button>
          </nav>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
        <div className="max-w-4xl mx-auto">
          {/* Header with Search and Profile */}
          <div className="hidden md:flex items-center justify-between mb-8">
            <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-400" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search students, professors, labs..."
                className="w-full pl-12 pr-4 py-3 rounded-none bg-card border-4 border-brand-200 shadow-lg focus:ring-2 focus:ring-brand-500 outline-none transition-all shadow-sm"
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
                  className="flex items-center gap-3 bg-card border-4 border-brand-200 shadow-lg p-1.5 pr-4 rounded-none shadow-sm hover:border-brand-300 transition-all cursor-pointer relative z-[101]"
                >
                  <ProfileAvatar profile={profile} className="w-9 h-9 rounded-none gradient-brand text-white font-bold" />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-black leading-tight">{profile?.full_name}</span>
                    <span className="text-[10px] text-brand-400 font-medium uppercase tracking-wider">{profile?.role}</span>
                  </div>
                </Link>

                {/* Dropdown Menu - Wrapped in a hover bridge container */}
                <div className="absolute right-0 top-full -mt-1 pt-3 w-48 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300 delay-75 z-[100]">
                  <div className="bg-card border-4 border-brand-200 shadow-lg rounded-none shadow-xl p-2">
                    <Link 
                      to="/settings" 
                      className="flex items-center gap-3 px-4 py-2.5 rounded-none text-sm font-bold text-black hover:bg-white hover:text-black transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                    <button 
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-4 py-2.5 rounded-none text-sm font-bold text-black hover:bg-red-50 hover:text-red-600 transition-colors"
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t-4 border-brand-200 flex items-center justify-around py-3 px-2 z-50 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
         {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) => clsx(
                "flex flex-col items-center gap-1 px-3 py-1 rounded-none transition-all",
                isActive ? "text-accent-600" : "text-brand-400"
              )}
            >
              {item.icon}
              <span className="text-[10px] font-bold">{item.name}</span>
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
        'flex items-center justify-center text-slate-900 hover:text-black transition-all relative',
        compact ? 'w-8 h-8' : 'w-12 h-12 bg-card border-4 border-brand-200 shadow-lg rounded-none shadow-sm'
      )}
      aria-label="Notifications"
    >
      <Bell className="w-6 h-6" />
      {hasUnseen && (
        <span className={clsx(
          'absolute w-3 h-3 bg-accent-500 border-4 border-brand-200 shadow-lg rounded-none',
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
    <div className="absolute right-0 top-full mt-3 w-[min(22rem,calc(100vw-2rem))] bg-card border-4 border-brand-200 shadow-lg rounded-none shadow-xl z-[120] overflow-hidden">
      <div className="px-5 py-4 border-b-4 border-brand-200">
        <h3 className="font-bold text-black">Notifications</h3>
      </div>
      {notifications.length === 0 ? (
        <div className="p-8 text-center">
          <div className="w-14 h-14 gradient-soft rounded-none flex items-center justify-center text-brand-300 mx-auto mb-4">
            <Bell className="w-7 h-7" />
          </div>
          <p className="text-slate-900 font-medium">No notifications yet.</p>
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
                    ? 'border-transparent text-brand-400 hover:bg-white'
                    : 'border-accent-100 bg-accent-50/60 text-black hover:bg-accent-50'
                )}
              >
                <p className={clsx('text-sm leading-relaxed', isSeen ? 'font-medium' : 'font-bold')}>
                  {notification.text}
                </p>
                {notification.createdAt && (
                  <p className="text-[11px] font-bold uppercase tracking-wider text-brand-300 mt-2">
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
