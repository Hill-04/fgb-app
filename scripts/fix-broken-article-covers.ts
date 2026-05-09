/**
 * One-time backfill: substitui as capas quebradas dos artigos seedados,
 * baixando uma imagem temática do Wikimedia Commons e enviando para o
 * Supabase Storage (bucket "article-covers"). Atualiza o campo coverImage
 * de cada artigo no Turso.
 *
 * Uso:
 *   npx tsx scripts/fix-broken-article-covers.ts
 */

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
dotenv.config()

import { prisma } from '../src/lib/db'
import {
  getSupabaseAdmin,
  ensureArticleCoversBucket,
  ARTICLE_COVERS_BUCKET,
} from '../src/lib/supabase/admin'

type Target = {
  slug: string
  sourceUrl: string
  storageKey: string
  contentType: string
  description: string
}

const targets: Target[] = [
  {
    slug: 'nbb-2025-2026-o-maior-da-historia',
    sourceUrl:
      'https://commons.wikimedia.org/wiki/Special:FilePath/Flamengo%20x%20Vila%20Velha%20Basquete%20(5186176838).jpg?width=1280',
    storageKey: 'seed/nbb-2025-flamengo.jpg',
    contentType: 'image/jpeg',
    description: 'NBB — Flamengo x Vila Velha (Wikimedia Commons)',
  },
  {
    slug: 'basquete-3x3-tudo-sobre-a-modalidade-olimpica',
    sourceUrl:
      'https://commons.wikimedia.org/wiki/Special:FilePath/AG%2023%203x3%20Basketball%20110.jpg?width=1280',
    storageKey: 'seed/basquete-3x3.jpg',
    contentType: 'image/jpeg',
    description: '3x3 — Pan Americano 2023 (Wikimedia Commons)',
  },
  {
    slug: 'fgb-72-anos-de-basquete-gaucho',
    sourceUrl:
      'https://commons.wikimedia.org/wiki/Special:FilePath/Vila%20Velha%20Basquete-Garoto-BMG%20x%20Pinheiros-Sky%20(5158270505).jpg?width=1280',
    storageKey: 'seed/fgb-72-anos.jpg',
    contentType: 'image/jpeg',
    description: 'NBB — Vila Velha x Pinheiros (Wikimedia Commons)',
  },
]

async function downloadBytes(url: string): Promise<Uint8Array> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'fgb-app/1.0 (admin@fgb.local) cover-backfill',
      Accept: 'image/*',
    },
    redirect: 'follow',
  })
  if (!res.ok) throw new Error(`Download falhou: ${res.status} ${res.statusText} (${url})`)
  return new Uint8Array(await res.arrayBuffer())
}

async function main() {
  console.log('[fix-covers] verificando bucket Supabase…')
  await ensureArticleCoversBucket()
  const admin = getSupabaseAdmin()

  for (const t of targets) {
    const article = await prisma.article.findUnique({ where: { slug: t.slug } })
    if (!article) {
      console.warn(`✗ artigo não encontrado para slug=${t.slug} — pulando`)
      continue
    }

    console.log(`→ baixando ${t.description}`)
    const bytes = await downloadBytes(t.sourceUrl)
    console.log(`  tamanho: ${(bytes.byteLength / 1024).toFixed(1)} KB`)

    const { error: upErr } = await admin.storage
      .from(ARTICLE_COVERS_BUCKET)
      .upload(t.storageKey, bytes, { contentType: t.contentType, upsert: true })
    if (upErr) {
      console.error(`✗ upload falhou para ${t.storageKey}: ${upErr.message}`)
      continue
    }

    const { data: pub } = admin.storage.from(ARTICLE_COVERS_BUCKET).getPublicUrl(t.storageKey)
    const newUrl = pub.publicUrl

    await prisma.article.update({
      where: { id: article.id },
      data: { coverImage: newUrl },
    })

    console.log(`✓ ${t.slug}`)
    console.log(`  ${newUrl}`)
  }

  console.log('\n[fix-covers] concluído.')
}

main()
  .catch((err) => {
    console.error('[fix-covers] erro:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
