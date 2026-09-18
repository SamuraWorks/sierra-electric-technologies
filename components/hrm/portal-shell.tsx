'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  ShieldCheck,
  LayoutDashboard,
} from 'lucide-react'
import { filterNavGroups, getIcon, isActive } from '@/lib/hrm/navigation'

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

function initialsOf(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function SidebarContent({
  user,
  pathname,
  collapsed,
  onNavClick,
}: {
  user: PortalUser
  pathname: string
  collapsed: boolean
  onNavClick: () => void
}) {
  const groups = filterNavGroups(user.permissions)

  return (
    <>
      <div
        className={`flex h-16 items-center border-b border-[var(--line)] px-4 ${
          collapsed ? 'justify-center' : 'justify-between'
        }`}
      >
        {!collapsed ? (
          <Link href="/hrm/dashboard" className="flex items-center gap-3">
            <span className="grid size-8 place-items-center rounded-[var(--r-sm)] bg-[var(--accent)] text-[11px] font-bold text-[var(--accent-ink)]">
              SET
            </span>
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--text)]">
              HR Portal
            </span>
          </Link>
        ) : (
          <Link href="/hrm/dashboard" className="grid size-8 place-items-center rounded-[var(--r-sm)] bg-[var(--accent)] text-[11px] font-bold text-[var(--accent-ink)]">
            SET
          </Link>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {groups.map((group) => (
          <div key={group.title} className="mb-4">
            {!collapsed && (
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                {group.title}
              </p>
            )}
            {collapsed && <div className="mx-auto mb-1.5 h-px w-4 bg-[var(--line-2)]" />}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = getIcon(item.label)
                const active = isActive(item.href, pathname, item.exact)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavClick}
                    title={item.label}
                    className={`group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 ${
                      collapsed ? 'justify-center' : ''
                    } ${
                      active
                        ? 'bg-[rgba(47,154,91,0.1)] text-[var(--accent)]'
                        : 'text-[var(--text-2)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'
                    }`}
                  >
                    <Icon className="size-[17px] shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-[var(--line)] px-3 py-3">
        <div className={`flex items-center gap-3 rounded-lg px-2 py-2 ${collapsed ? 'justify-center' : ''}`}>
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--surface-2)] text-xs font-bold uppercase text-[var(--accent-strong)] ring-1 ring-[var(--line-2)]">
            {initialsOf(user.displayName)}
          </span>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[var(--text)]">{user.displayName}</p>
              <p className="truncate text-xs text-[var(--muted)]">{user.roles[0]?.name ?? 'Staff'}</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export function PortalShell({ children, user }: PortalShellProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    const stored = localStorage.getItem('hrm-sidebar-collapsed')
    if (stored === 'true') setCollapsed(true)
  }, [])

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem('hrm-sidebar-collapsed', String(next))
      return next
    })
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg)]">
      {/* Desktop sidebar */}
      <aside
        className={`relative hidden flex-col border-r border-[var(--line)] bg-[var(--surface)] transition-all duration-300 ease-in-out lg:flex ${
          collapsed ? 'w-[60px]' : 'w-60'
        }`}
      >
        <div className="absolute -right-3 top-[1.625rem] z-10">
          <button
            onClick={toggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="grid size-6 place-items-center rounded-full border border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] shadow-sm transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
          >
            {collapsed ? <ChevronRight className="size-3" /> : <ChevronLeft className="size-3" />}
          </button>
        </div>
        <SidebarContent user={user} pathname={pathname} collapsed={collapsed} onNavClick={() => {}} />
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-black/30"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative flex w-60 flex-col bg-[var(--surface)] shadow-[var(--sh-md)]">
            <SidebarContent user={user} pathname={pathname} collapsed={false} onNavClick={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-[var(--line)] bg-[var(--surface)]/95 px-4 backdrop-blur-md lg:px-6">
          <div className="flex w-full items-center gap-4">
            <button
              onClick={() => (window.innerWidth >= 1024 ? toggleCollapse() : setMobileOpen(true))}
              aria-label="Toggle menu"
              className="rounded-lg p-2 text-[var(--muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
            >
              <Menu className="size-5" />
            </button>

            <div className="flex flex-1 items-center gap-1.5 text-sm text-[var(--muted)]">
              <Link href="/hrm/dashboard" className="flex items-center gap-1.5 transition-colors hover:text-[var(--text)]">
                <LayoutDashboard className="size-4 text-[var(--accent)]" />
                HR Portal
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden items-center gap-1.5 rounded-full border border-[rgba(47,154,91,0.35)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--accent)] sm:flex">
                <ShieldCheck className="size-3" />
                {user.roles[0]?.name ?? 'Staff'}
              </span>

              <div className="flex items-center gap-2 rounded-lg px-1.5 py-1">
                <span className="grid size-8 place-items-center rounded-full bg-[var(--surface-2)] text-[10px] font-bold uppercase text-[var(--accent-strong)] ring-1 ring-[var(--line-2)]">
                  {initialsOf(user.displayName)}
                </span>
                <span className="hidden text-sm font-semibold text-[var(--text)] sm:block">
                  {user.displayName}
                </span>
              </div>

              <form action="/auth/sign-out" method="post">
                <button
                  type="submit"
                  aria-label="Sign out"
                  className="rounded-lg p-2 text-[var(--muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
                >
                  <LogOut className="size-4" />
                </button>
              </form>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}