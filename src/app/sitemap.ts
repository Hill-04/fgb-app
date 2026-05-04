import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/db'

// Fallback para o domínio de produção se NEXT_PUBLIC_SITE_URL não estiver definido
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://basquetegaucho.com.br'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`,                  changeFrequency: 'daily',   priority: 1.0 },
    { url: `${BASE_URL}/campeonatos`,        changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${BASE_URL}/noticias`,           changeFrequency: 'daily',   priority: 0.8 },
    { url: `${BASE_URL}/videos`,             changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${BASE_URL}/calendario`,         changeFrequency: 'daily',   priority: 0.8 },
    { url: `${BASE_URL}/jogos`,              changeFrequency: 'daily',   priority: 0.7 },
    { url: `${BASE_URL}/fgb/historia`,       changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/fgb/diretoria`,      changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/fgb/regulamento`,    changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/fgb/notas`,          changeFrequency: 'weekly',  priority: 0.6 },
    { url: `${BASE_URL}/fgb/arbitragem`,     changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/fgb/categorias`,     changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/selecao-gaucha`,     changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/patrocinadores`,     changeFrequency: 'monthly', priority: 0.4 },
  ]

  const [championships, newsPosts, videoPosts] = await Promise.all([
    prisma.championship.findMany({
      where: {
        status: { in: ['ONGOING', 'REGISTRATION_OPEN', 'FINISHED'] },
        isSimulation: false,
      },
      select: { id: true, updatedAt: true },
    }).catch(() => []),
    prisma.newsPost.findMany({
      where: { status: 'PUBLISHED' },
      select: { slug: true, updatedAt: true },
    }).catch(() => []),
    prisma.videoPost.findMany({
      where: { status: 'PUBLISHED' },
      select: { slug: true, updatedAt: true },
    }).catch(() => []),
  ])

  const championshipRoutes: MetadataRoute.Sitemap = championships.map((c) => ({
    url: `${BASE_URL}/campeonatos/${c.id}`,
    lastModified: c.updatedAt,
    changeFrequency: 'daily',
    priority: 0.9,
  }))

  const newsRoutes: MetadataRoute.Sitemap = newsPosts.map((p) => ({
    url: `${BASE_URL}/noticias/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  const videoRoutes: MetadataRoute.Sitemap = videoPosts.map((v) => ({
    url: `${BASE_URL}/videos/${v.slug}`,
    lastModified: v.updatedAt,
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  return [...staticRoutes, ...championshipRoutes, ...newsRoutes, ...videoRoutes]
}
