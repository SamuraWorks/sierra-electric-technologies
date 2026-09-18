import type { MetadataRoute } from 'next'
import { programmes, projectHref, projects, services } from '@/lib/site'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ['', '/about', '/approach', '/team', '/research', '/investors', '/contact']
  const workRoutes = services.map((service) => `/work/${service.slug}`)
  const projectRoutes = projects.map((project) => projectHref(project.title))
  const programmeRoutes = programmes.map((programme) => programme.href)

  return [...staticRoutes, ...workRoutes, ...projectRoutes, ...programmeRoutes].map((route) => ({
    url: new URL(route, baseUrl).toString(),
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: route === '' ? 1 : 0.8,
  }))
}