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
import { useState } from 'react'
import type { FormEvent } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { clsx } from 'clsx'
import { ProfileAvatar } from '@/components/ui/ProfileAvatar'

export default function MainLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { profile, signOut } = useAuthStore()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const query = searchQuery.trim()
    if (query) {
      navigate(`/search?q=${encodeURIComponent(query)}`)
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
    <div className="min-h-screen bg-brand-50 flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-white border-r border-brand-100 h-screen sticky top-0 p-6">
        <Link to="/feed" className="flex items-center gap-2 mb-10 px-2">
          <div className="w-10 h-10 gradient-brand rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
            TT
          </div>
          <span className="text-xl font-bold text-brand-900 tracking-tight">Transfer Track</span>
        </Link>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) => clsx(
                "flex items-center gap-4 px-4 py-3.5 rounded-2xl font-semibold transition-all duration-200",
                isActive 
                  ? "gradient-brand text-white shadow-md shadow-brand-200" 
                  : "text-brand-500 hover:text-brand-800 hover:bg-brand-50"
              )}
            >
              {item.icon}
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto space-y-2 pt-6 border-t border-brand-50">
          <NavLink
            to="/settings"
            className={({ isActive }) => clsx(
              "flex items-center gap-4 px-4 py-3.5 rounded-2xl font-semibold transition-all",
              isActive ? "bg-brand-50 text-brand-900" : "text-brand-500 hover:text-brand-800 hover:bg-brand-50"
            )}
          >
            <Settings className="w-6 h-6" />
            <span>Settings</span>
          </NavLink>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl font-semibold text-brand-500 hover:text-red-600 hover:bg-red-50 transition-all"
          >
            <LogOut className="w-6 h-6" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between px-6 py-4 bg-white border-b border-brand-100 sticky top-0 z-50">
        <Link to="/feed" className="flex items-center gap-2">
          <div className="w-8 h-8 gradient-brand rounded-lg flex items-center justify-center text-white font-bold text-lg">
            TT
          </div>
        </Link>
        <div className="flex items-center gap-4">
          <button className="text-brand-500 relative">
            <Bell className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-accent-500 border-2 border-white rounded-full" />
          </button>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-brand-500">
            {isMobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[65px] bg-white z-40 p-6 animate-in slide-in-from-top duration-300">
          <form onSubmit={handleSearch} className="relative mb-5">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search everything..."
              className="w-full pl-12 pr-4 py-3 rounded-2xl bg-brand-50 border border-brand-100 focus:ring-2 focus:ring-brand-500 outline-none transition-all"
            />
          </form>
          <nav className="space-y-4">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) => clsx(
                  "flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-lg transition-all",
                  isActive ? "gradient-brand text-white shadow-lg" : "text-brand-500 bg-brand-50"
                )}
              >
                {item.icon}
                <span>{item.name}</span>
              </NavLink>
            ))}
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-lg text-brand-500 bg-red-50"
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
                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white border border-brand-100 focus:ring-2 focus:ring-brand-500 outline-none transition-all shadow-sm"
              />
            </form>
            <div className="flex items-center gap-4 ml-6 relative group">
              <button className="w-12 h-12 flex items-center justify-center bg-white border border-brand-100 rounded-2xl text-brand-500 hover:text-brand-800 transition-all shadow-sm relative">
                <Bell className="w-6 h-6" />
                <span className="absolute top-3 right-3 w-3 h-3 bg-accent-500 border-2 border-white rounded-full" />
              </button>
              
              {/* Profile Section with Dropdown */}
              <div className="relative py-2">
                <Link 
                  to="/profile" 
                  className="flex items-center gap-3 bg-white border border-brand-100 p-1.5 pr-4 rounded-2xl shadow-sm hover:border-brand-300 transition-all cursor-pointer relative z-[101]"
                >
                  <ProfileAvatar profile={profile} className="w-9 h-9 rounded-xl gradient-brand text-white font-bold" />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-brand-900 leading-tight">{profile?.full_name}</span>
                    <span className="text-[10px] text-brand-400 font-medium uppercase tracking-wider">{profile?.role}</span>
                  </div>
                </Link>

                {/* Dropdown Menu - Wrapped in a hover bridge container */}
                <div className="absolute right-0 top-full -mt-1 pt-3 w-48 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300 delay-75 z-[100]">
                  <div className="bg-white border border-brand-100 rounded-2xl shadow-xl p-2">
                    <Link 
                      to="/settings" 
                      className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold text-brand-600 hover:bg-brand-50 hover:text-brand-900 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                    <button 
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold text-brand-600 hover:bg-red-50 hover:text-red-600 transition-colors"
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-brand-100 flex items-center justify-around py-3 px-2 z-50 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
         {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) => clsx(
                "flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all",
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
