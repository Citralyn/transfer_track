import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom'
import { 
  Search, 
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
import logo from '@/assets/red_train.png'

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
    { name: 'Feed', path: '/feed', color: '#ff3b30' },
    { name: 'Opportunities', path: '/opportunities', color: '#34c759' },
    { name: 'People', path: '/people', color: '#ffcc00' },
    { name: 'Messages', path: '/messages', color: '#af52de' },
    { name: 'Profile', path: `/profile`, color: '#ff9500' },
  ]

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-white border-r border-black/5 h-screen sticky top-0 p-6">
        <Link to="/feed" className="flex items-center gap-3 mb-12 px-2">
          <img src={logo} alt="Transfer Track" className="w-12 h-12 object-contain" />
          <span className="text-2xl font-logo text-[#ff3b30] tracking-tight">Transfer Track</span>
        </Link>

        <nav className="flex-1 space-y-4">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) => clsx(
                "flex items-center px-4 py-3 font-bold transition-all duration-200 border-l-4",
                isActive 
                  ? "text-[#1d1d1f] translate-x-1" 
                  : "text-[#86868b] border-transparent hover:text-[#1d1d1f] hover:translate-x-1"
              )}
              style={({ isActive }) => ({
                borderLeftColor: isActive ? item.color : 'transparent'
              })}
            >
              <span className="uppercase tracking-widest text-sm">{item.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto space-y-2 pt-6 border-t border-brand-50">
          <NavLink
            to="/settings"
            className={({ isActive }) => clsx(
              "flex items-center gap-4 px-4 py-3.5 rounded-xl font-semibold transition-all",
              isActive ? "bg-white text-[#1d1d1f]" : "text-[#1d1d1f] hover:text-[#1d1d1f] hover:bg-white"
            )}
          >
            <Settings className="w-6 h-6" />
            <span>Settings</span>
          </NavLink>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl font-semibold text-[#1d1d1f] hover:text-red-600 hover:bg-red-50 transition-all"
          >
            <LogOut className="w-6 h-6" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between px-6 py-4 bg-white border-b border-black/5 sticky top-0 z-50">
        <Link to="/feed" className="flex items-center gap-2">
          <img src={logo} alt="Transfer Track" className="w-10 h-10 object-contain" />
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
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-[#1d1d1f] bg-[#ffcc00] border border-black/5 p-1 shadow-xl">
            {isMobileMenuOpen ? <X className="w-8 h-8 stroke-[3]" /> : <Menu className="w-8 h-8 stroke-[3]" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[76px] bg-white z-40 p-6 animate-in slide-in-from-top duration-300">
          <form onSubmit={handleSearch} className="relative mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-[#1d1d1f]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="SEARCH..."
              className="w-full pl-14 pr-4 py-4 rounded-xl bg-white border border-black/5 outline-none font-semibold"
            />
          </form>
          
          <nav className="space-y-4">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) => clsx(
                  "flex items-center gap-4 px-6 py-5 rounded-xl font-bold text-xl border-l-8 transition-all",
                  isActive ? "bg-white shadow-md text-[#1d1d1f]" : "bg-white text-[#86868b] border-transparent"
                )}
                style={({ isActive }) => ({
                  borderLeftColor: isActive ? item.color : 'transparent'
                })}
              >
                <span className="uppercase tracking-widest">{item.name}</span>
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
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-[#1d1d1f]" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="SEARCH EVERYTHING..."
                className="w-full pl-14 pr-4 py-4 rounded-xl bg-white border border-black/5 outline-none font-semibold shadow-xl focus:translate-x-1 focus:translate-y-1 focus:shadow-xl transition-all text-[#1d1d1f] placeholder:text-[#1d1d1f]"
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
                  className="flex items-center gap-3 bg-white border border-black/5 p-1.5 pr-4 rounded-xl shadow-xl hover:border-brand-300 transition-all cursor-pointer relative z-[101]"
                >
                  <ProfileAvatar profile={profile} className="w-9 h-9 rounded-full bg-[#ff3b30] text-white font-semibold" />
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-[#1d1d1f] leading-tight">{profile?.full_name}</span>
                    <span className="text-[10px] text-[#86868b] font-bold uppercase tracking-wider">{profile?.role}</span>
                  </div>
                </Link>

                {/* Dropdown Menu - Wrapped in a hover bridge container */}
                <div className="absolute right-0 top-full -mt-1 pt-3 w-48 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300 delay-75 z-[100]">
                  <div className="bg-white border border-black/5 rounded-xl shadow-xl p-2">
                    <Link 
                      to="/settings" 
                      className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-[#1d1d1f] hover:bg-white hover:text-[#1d1d1f] transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                    <button 
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-[#1d1d1f] hover:bg-red-50 hover:text-red-600 transition-colors"
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-black/5 flex items-center justify-around py-3 px-2 z-50">
         {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) => clsx(
                "flex flex-col items-center gap-1 px-4 py-2 transition-all border-b-4",
                isActive ? "text-[#1d1d1f]" : "text-[#86868b] border-transparent"
              )}
              style={({ isActive }) => ({
                borderBottomColor: isActive ? item.color : 'transparent'
              })}
            >
              <span className="text-[11px] font-bold uppercase tracking-widest">{item.name}</span>
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
        'flex items-center justify-center text-[#1d1d1f] hover:text-[#1d1d1f] transition-all relative',
        compact ? 'w-8 h-8' : 'w-12 h-12 bg-white border border-black/5 rounded-xl shadow-xl'
      )}
      aria-label="Notifications"
    >
      <Bell className="w-6 h-6" />
      {hasUnseen && (
        <span className={clsx(
          'absolute w-3 h-3 bg-[#af52de] border border-black/5 rounded-full',
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
    <div className="absolute right-0 top-full mt-3 w-[min(22rem,calc(100vw-2rem))] bg-white border border-black/5 rounded-xl shadow-xl z-[120] overflow-hidden">
      <div className="px-5 py-4 border-b border-brand-50">
        <h3 className="font-semibold text-[#1d1d1f]">Notifications</h3>
      </div>
      {notifications.length === 0 ? (
        <div className="p-8 text-center">
          <div className="w-14 h-14 bg-[#34c759] rounded-full flex items-center justify-center text-[#1d1d1f] mx-auto mb-4">
            <Bell className="w-7 h-7" />
          </div>
          <p className="text-[#1d1d1f] font-bold">No notifications yet.</p>
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
                  'w-full text-left p-4 rounded-xl transition-all border',
                  isSeen
                    ? 'border-transparent text-[#1d1d1f] hover:bg-white'
                    : 'border-accent-100 bg-[#af52de]/60 text-[#1d1d1f] hover:bg-[#af52de]'
                )}
              >
                <p className={clsx('text-sm leading-relaxed', isSeen ? 'font-bold' : 'font-semibold')}>
                  {notification.text}
                </p>
                {notification.createdAt && (
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#1d1d1f] mt-2">
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


