import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js'

let cached: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('Supabase admin client missing env (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)')
  }
  cached = createSupabaseClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return cached
}

export const ARTICLE_COVERS_BUCKET = 'article-covers'

export async function ensureArticleCoversBucket() {
  const admin = getSupabaseAdmin()
  const { data: buckets, error } = await admin.storage.listBuckets()
  if (error) throw error
  if (buckets?.some((b) => b.name === ARTICLE_COVERS_BUCKET)) return
  const { error: createErr } = await admin.storage.createBucket(ARTICLE_COVERS_BUCKET, {
    public: true,
    fileSizeLimit: 8 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  })
  if (createErr && !/already exists/i.test(createErr.message)) throw createErr
}
