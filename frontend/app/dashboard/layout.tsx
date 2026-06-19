"use client"
import { useEffect, useState, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import {
  LayoutDashboard, FileText, Search, Network,
  BarChart3, Settings, LogOut, Upload, Bell,
  ChevronLeft, ChevronRight, Menu, X
} from "lucide-react"
import { supabase } from "@/lib/supabase"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/papers", label: "My Papers", icon: FileText },
  { href: "/dashboard/search", label: "Semantic Search", icon: Search },
  { href: "/dashboard/research-graph", label: "Research Graph", icon: Network },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showResults, setShowResults] = useState(false)
  const [searching, setSearching] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        router.push("/login")
      } else {
        setUser(data.user)
        setLoading(false)
      }
    }
    checkUser()
  }, [router])

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (searchQuery.trim().length === 0) {
        setSearchResults([])
        setShowResults(false)
        return
      }
      setSearching(true)
      const { data } = await supabase
        .from("papers")
        .select("id, title, file_name, status")
        .ilike("title", `%${searchQuery}%`)
        .limit(6)
      setSearchResults(data || [])
      setShowResults(true)
      setSearching(false)
    }, 300)
    return () => clearTimeout(delayDebounce)
  }, [searchQuery])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#00C853] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const userInitial = (user?.user_metadata?.full_name?.[0] || user?.email?.[0] || "U").toUpperCase()
  const userName = user?.user_metadata?.full_name || "Researcher"
  const userEmail = user?.email || ""

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white flex overflow-hidden">

      {/* ── DESKTOP SIDEBAR ── */}
      <aside className={`
        hidden md:flex flex-col fixed left-0 top-0 h-screen z-30
        bg-[#0D0D13] border-r border-white/8
        transition-all duration-300 ease-in-out
        ${collapsed ? "w-[60px]" : "w-[220px]"}
      `}>

        {/* Logo + Collapse Button */}
        <div className={`flex items-center border-b border-white/8 h-[56px] shrink-0 ${collapsed ? "justify-center px-0" : "justify-between px-4"}`}>
          {!collapsed && (
            <Link href="/" className="text-lg font-bold tracking-tight">
              Scholar<span className="text-[#00C853]">AI</span>
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-7 h-7 rounded-lg hover:bg-white/8 flex items-center justify-center transition text-gray-400 hover:text-white shrink-0"
          >
            {collapsed
              ? <ChevronRight className="w-4 h-4" />
              : <ChevronLeft className="w-4 h-4" />
            }
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : ""}
                className={`
                  flex items-center rounded-lg transition-all duration-150
                  ${collapsed ? "justify-center w-9 h-9 mx-auto" : "gap-3 px-3 py-2.5"}
                  ${active
                    ? "bg-[#00C853]/12 text-[#00C853]"
                    : "text-gray-400 hover:text-white hover:bg-white/6"
                  }
                `}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {!collapsed && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
              </Link>
            )
          })}

          {/* Divider */}
          <div className={`my-2 border-t border-white/8 ${collapsed ? "mx-2" : "mx-1"}`} />

          {/* Settings */}
          <Link
            href="/dashboard/settings"
            title={collapsed ? "Settings" : ""}
            className={`
              flex items-center rounded-lg transition-all duration-150
              ${collapsed ? "justify-center w-9 h-9 mx-auto" : "gap-3 px-3 py-2.5"}
              ${pathname === "/dashboard/settings"
                ? "bg-[#00C853]/12 text-[#00C853]"
                : "text-gray-400 hover:text-white hover:bg-white/6"
              }
            `}
          >
            <Settings className="w-4 h-4 shrink-0" />
            {!collapsed && <span className="text-sm font-medium">Settings</span>}
          </Link>
        </nav>

        {/* Bottom - User */}
        <div className={`border-t border-white/8 p-2 shrink-0`}>
          {collapsed ? (
            <div className="flex flex-col items-center gap-2">
              <div
                title={userName}
                className="w-8 h-8 rounded-full bg-[#00C853]/15 border border-[#00C853]/30 flex items-center justify-center text-[#00C853] text-xs font-bold cursor-pointer"
              >
                {userInitial}
              </div>
              <button
                onClick={handleLogout}
                title="Log out"
                className="w-8 h-8 rounded-lg hover:bg-white/6 flex items-center justify-center text-gray-500 hover:text-white transition"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg">
                <div className="w-7 h-7 rounded-full bg-[#00C853]/15 border border-[#00C853]/30 flex items-center justify-center text-[#00C853] text-xs font-bold shrink-0">
                  {userInitial}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-white truncate">{userName}</div>
                  <div className="text-xs text-gray-500 truncate">{userEmail}</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/6 transition"
              >
                <LogOut className="w-3.5 h-3.5 shrink-0" />
                Log out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ── MOBILE OVERLAY ── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/70 z-40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── MOBILE SIDEBAR ── */}
      <aside className={`
        md:hidden fixed top-0 left-0 h-full w-[220px] z-50
        bg-[#0D0D13] border-r border-white/8
        flex flex-col
        transform transition-transform duration-300
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="flex items-center justify-between px-4 h-[53px] border-b border-white/8 shrink-0">
          <Link href="/" className="text-lg font-bold tracking-tight">
            Scholar<span className="text-[#00C853]">AI</span>
          </Link>
          <button onClick={() => setMobileOpen(false)} className="text-gray-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  active
                    ? "bg-[#00C853]/12 text-[#00C853]"
                    : "text-gray-400 hover:text-white hover:bg-white/6"
                }`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            )
          })}
          <div className="my-2 border-t border-white/8 mx-1" />
          <Link
            href="/dashboard/settings"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
              pathname === "/settings"
                ? "bg-[#00C853]/12 text-[#00C853]"
                : "text-gray-400 hover:text-white hover:bg-white/6"
            }`}
          >
            <Settings className="w-4 h-4 shrink-0" />
            Settings
          </Link>
        </nav>

        <div className="border-t border-white/8 p-2 shrink-0">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg mb-1">
            <div className="w-7 h-7 rounded-full bg-[#00C853]/15 border border-[#00C853]/30 flex items-center justify-center text-[#00C853] text-xs font-bold shrink-0">
              {userInitial}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-white truncate">{userName}</div>
              <div className="text-xs text-gray-500 truncate">{userEmail}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/6 transition"
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            Log out
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className={`
        flex-1 flex flex-col min-w-0
        transition-all duration-300
        ${collapsed ? "md:ml-[60px]" : "md:ml-[220px]"}
      `}>

        {/* TOPBAR */}
        <header className="sticky top-0 z-20 flex items-center gap-3 px-4 h-[56px] border-b border-white/8 bg-[#0A0A0F]/95 backdrop-blur shrink-0">

          {/* Mobile menu */}
          <button
            className="md:hidden p-1.5 rounded-lg hover:bg-white/6 text-gray-400 hover:text-white transition"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search */}
          <div ref={searchRef} className="flex-1 relative max-w-sm">
            <div className="flex items-center gap-2 bg-white/5 border border-white/8 rounded-lg px-3 py-2 hover:border-white/15 focus-within:border-[#00C853]/40 transition cursor-text">
              <Search className="w-3.5 h-3.5 text-gray-500 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.trim() && setShowResults(true)}
                placeholder="Search your papers by title..."
                className="bg-transparent text-sm text-white outline-none flex-1 placeholder:text-gray-600"
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(""); setShowResults(false) }}>
                  <X className="w-3.5 h-3.5 text-gray-500 hover:text-white transition" />
                </button>
              )}
            </div>

            {/* Dropdown Results */}
            {showResults && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#13131A] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 max-h-80 overflow-y-auto">
                {searching ? (
                  <div className="p-4 text-center">
                    <div className="w-4 h-4 border-2 border-[#00C853] border-t-transparent rounded-full animate-spin mx-auto" />
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="p-4 text-center">
                    <p className="text-gray-500 text-xs">No papers found for "{searchQuery}"</p>
                  </div>
                ) : (
                  <div className="py-1.5">
                    {searchResults.map((paper) => (
                      <Link
                        key={paper.id}
                        href={`/dashboard/papers/${paper.id}`}
                        onClick={() => { setShowResults(false); setSearchQuery("") }}
                        className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 transition"
                      >
                        <div className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                          <FileText className="w-3.5 h-3.5 text-red-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white truncate">
                            {paper.title || paper.file_name}
                          </p>
                          <p className="text-xs text-gray-600">
                            {paper.status === "processed" ? "Analyzed" : "Processing"}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right */}
          
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>

      </div>
    </div>
  )
}