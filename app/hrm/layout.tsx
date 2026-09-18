import { redirect } from 'next/navigation'
import { getAuthContext } from '@/lib/hrm/auth'
import { PortalShell, type PortalUser } from '@/components/hrm/portal-shell'

export default async function HrmLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getAuthContext()

  if (!ctx) {
    redirect('/auth/login')
  }

  const serialisedUser: PortalUser = {
    userId: ctx.userId,
    displayName: ctx.profile?.display_name ?? 'Staff',
    email: ctx.profile?.email ?? null,
    photoUrl: ctx.profile?.photo_url ?? null,
    roles: ctx.roles.map((ur) => ({
      slug: ur.role?.slug ?? '',
      name: ur.role?.name ?? '',
    })),
    permissions: Array.from(ctx.permissions),
    unreadCount: 0,
  }

  return <PortalShell user={serialisedUser}>{children}</PortalShell>
}