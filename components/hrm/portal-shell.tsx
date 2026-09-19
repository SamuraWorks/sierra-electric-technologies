'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown, LogOut, Menu, UserRound, X } from 'lucide-react'
import { filterNavGroups, getIcon, isActive } from '@/lib/hrm/navigation'
import { images } from '@/lib/site'

export interface PortalUser {
  userId: string
  displayName: string
  email: string | null
  photoUrl: string | null
  roles: { slug: string; name: string }[]
  permissions: string[]
  unreadCount: number
}

interface PortalShellProps {
  children: React.ReactNode
  user: PortalUser
}

function cn(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(' ')
}

function initialsOf(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

const BRAND_NAME = 'Sierra Electric'
const BRAND_SUBTITLE = 'Staff & Operations'

// ─── Sidebar (the slider) ────────────────────────────────────────

function Sidebar({
  user,
  pathname,
  collapsed = false,
  onToggle,
  onClose,
}: {
  user: PortalUser
  pathname: string
  collapsed?: boolean
  onToggle?: () => void
  onClose?: () => void
}) {
  const groups = filterNavGroups(user.permissions)

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-slate-200 bg-white transition-[width] duration-300 ease-in-out',
        collapsed ? 'w-20' : 'w-60',
      )}
    >
      {/* Brand row — the 3-line hamburger sits on the right edge of the slider */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 px-1">
        <Link href="/hrm/dashboard" className="flex min-w-0 items-center gap-3" title="HR dashboard">
          <img
            src={images.logo}
            alt="Sierra Electric Technologies logo"
            className="h-8 w-8 flex-shrink-0 rounded-lg object-cover"
            width={32}
            height={32}
          />
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-none text-slate-900">{BRAND_NAME}</p>
              <p className="mt-0.5 text-xs text-slate-400">{BRAND_SUBTITLE}</p>
            </div>
          )}
        </Link>

        <button
          onClick={collapsed ? onToggle : (onClose ?? onToggle)}
          aria-label={collapsed ? 'Open menu' : 'Close menu'}
          title={collapsed ? 'Open menu' : 'Close menu'}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100"
        >
          <Menu size={17} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {groups.map((group) => {
          if (group.items.length === 0) return null
          return (
            <div key={group.title}>
              {!collapsed && (
                <p className="mb-1 px-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {group.title}
                </p>
              )}
              <ul className={collapsed ? 'space-y-1' : 'space-y-0.5'}>
                {group.items.map((item) => {
                  const Icon = getIcon(item.label)
                  const active = isActive(item.href, pathname, item.exact)
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        title={collapsed ? item.label : undefined}
                        aria-label={collapsed ? item.label : undefined}
                        className={cn(
                          'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
                          collapsed && 'justify-center px-0 py-2',
                          active
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                        )}
                      >
                        <Icon size={16} className={active ? 'text-blue-600' : 'text-slate-400'} />
                        {!collapsed && <span>{item.label}</span>}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </nav>

      {/* Footer copyright */}
      <div className="shrink-0 border-t border-slate-100">
        {!collapsed && (
          <p className="px-3 py-3 text-xs leading-snug text-slate-400">
            © {new Date().getFullYear()} Sierra Electric Staff & Operations.
          </p>
        )}
      </div>
    </aside>
  )
}

// ─── Header / profile bar ────────────────────────────────────────

function UserMenu({ user }: { user: PortalUser }) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-100"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
          {initialsOf(user.displayName)}
        </span>
        <span className="hidden text-left sm:block">
          <span className="block text-sm font-medium leading-none text-slate-900">{user.displayName}</span>
          <span className="mt-0.5 block text-xs leading-none text-slate-400">
            {user.roles[0]?.name ?? 'Staff'}
          </span>
        </span>
        <ChevronDown size={14} className="text-slate-400" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg"
        >
          <div className="mb-1 border-b border-slate-100 px-2 py-2">
            <p className="text-sm font-medium text-slate-900">{user.displayName}</p>
            <p className="mt-0.5 text-xs text-slate-500">{user.email}</p>
          </div>
          <Link
            href="/hrm/profile"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex w-full items-center rounded-lg px-2 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50"
          >
            <UserRound size={14} className="mr-2" /> My Profile
          </Link>
          <form action="/auth/sign-out" method="post" className="mt-1 border-t border-slate-100 pt-1">
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center rounded-lg px-2 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
            >
              <LogOut size={14} className="mr-2" /> Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

function Header({ user, mobileOpen, onMenuClick }: { user: PortalUser; mobileOpen: boolean; onMenuClick: () => void }) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
      <div className="flex items-center gap-1">
        <button
          onClick={onMenuClick}
          aria-label="Open menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 lg:hidden"
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
        <span className="hidden text-sm font-semibold text-slate-900 lg:block">
          {user.roles[0]?.name ?? 'Portal'}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <UserMenu user={user} />
      </div>
    </header>
  )
}

// ─── PortalShell ─────────────────────────────────────────────────

export function PortalShell({ children, user }: PortalShellProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    const stored = localStorage.getItem('hrm-sidebar-open')
    if (stored !== null) setSidebarOpen(stored !== 'false')
  }, [])

  const toggleSidebar = () => {
    setSidebarOpen((prev) => {
      const next = !prev
      localStorage.setItem('hrm-sidebar-open', String(next))
      return next
    })
  }

  return (
    <div className="hrm-portal flex h-screen overflow-hidden bg-slate-50">
      {/* Desktop sidebar — slides in/out via the hamburger on the slider */}
      <div className="hidden h-full lg:block">
        <Sidebar user={user} pathname={pathname} collapsed={!sidebarOpen} onToggle={toggleSidebar} />
      </div>

      {/* Mobile drawer — slides in/out on demand */}
      <div className={`fixed inset-0 z-40 lg:hidden ${mobileOpen ? '' : 'pointer-events-none'}`} aria-hidden={!mobileOpen}>
        <div
          onClick={() => setMobileOpen(false)}
          className={`absolute inset-0 bg-slate-900/50 transition-opacity duration-200 ${mobileOpen ? 'opacity-100' : 'opacity-0'}`}
        />
        <div
          className={`absolute inset-y-0 left-0 transition-transform duration-300 ease-in-out ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <Sidebar user={user} pathname={pathname} onClose={() => setMobileOpen(false)} />
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header user={user} mobileOpen={mobileOpen} onMenuClick={() => setMobileOpen((v) => !v)} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}