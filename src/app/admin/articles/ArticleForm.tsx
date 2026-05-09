'use client'

import Link from 'next/link'
import { useRef, useState } from 'react'

const CATEGORIES = ['Conhecimento', 'Notícias', 'Basquete Gaúcho', 'Institucional']

type ArticleFormValues = {
  id?: string
  slug?: string
  title?: string
  subtitle?: string | null
  content?: string
  coverImage?: string | null
  category?: string
  author?: string
  source?: string | null
  sourceUrl?: string | null
  tags?: string | null
  readTime?: number
  isPublished?: boolean
}

function tagsToInput(tagsJson: string | null | undefined) {
  if (!tagsJson) return ''
  try {
    const parsed = JSON.parse(tagsJson)
    if (Array.isArray(parsed)) return parsed.join(', ')
  } catch {
    /* ignore */
  }
  return tagsJson
}

const labelCls = 'fgb-label block mb-1.5'
const labelStyle: React.CSSProperties = { fontSize: 10, color: 'var(--fgb-ink-500)', letterSpacing: '0.14em' }
const inputCls = 'w-full px-3 py-2 border border-[var(--fgb-ink-200)] rounded bg-white text-[var(--fgb-ink-900)] focus:outline-none focus:border-[var(--fgb-green-700)] transition-colors'

function CoverImageUpload({ initialUrl }: { initialUrl: string | null | undefined }) {
  const [url, setUrl] = useState<string>(initialUrl ?? '')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setError(null)
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/admin/upload-image', { method: 'POST', body: fd })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || `Upload falhou (${res.status})`)
      setUrl(data.url)
    } catch (e: any) {
      setError(e?.message ?? 'Erro ao enviar imagem')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <label className={labelCls} style={labelStyle}>Imagem de capa *</label>
      <input type="hidden" name="coverImage" value={url} required />

      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <div
          className="relative w-full sm:w-48 aspect-[16/9] rounded border border-[var(--fgb-ink-200)] overflow-hidden bg-[var(--fgb-ink-50)] flex items-center justify-center shrink-0"
        >
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="Pré-visualização" className="w-full h-full object-cover" />
          ) : (
            <span className="fgb-label text-[var(--fgb-ink-400)]" style={{ fontSize: 9 }}>
              sem imagem
            </span>
          )}
        </div>

        <div className="flex-1 w-full">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void handleFile(f)
              e.target.value = ''
            }}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="fgb-btn-secondary h-9 px-4 text-sm"
            >
              {uploading ? 'Enviando…' : url ? 'Trocar imagem' : 'Enviar imagem'}
            </button>
            {url && !uploading && (
              <button
                type="button"
                onClick={() => setUrl('')}
                className="fgb-label h-9 px-3"
                style={{ fontSize: 10, color: 'var(--fgb-red-500)' }}
              >
                Remover
              </button>
            )}
          </div>
          <p
            className="fgb-label mt-2"
            style={{ fontSize: 9, color: 'var(--fgb-ink-400)', textTransform: 'none', letterSpacing: 0 }}
          >
            JPG, PNG, WEBP ou GIF · até 8 MB · proporção 16:9 recomendada
          </p>
          {error && (
            <p
              className="fgb-label mt-2"
              style={{ fontSize: 10, color: 'var(--fgb-red-500)', textTransform: 'none', letterSpacing: 0 }}
            >
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export function ArticleForm({
  values,
  action,
  submitLabel = 'Salvar',
}: {
  values?: ArticleFormValues
  action: (formData: FormData) => void | Promise<void>
  submitLabel?: string
}) {
  const v = values ?? {}

  return (
    <form action={action} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4">
        <div>
          <label className={labelCls} style={labelStyle}>Título *</label>
          <input
            name="title"
            required
            defaultValue={v.title ?? ''}
            className={inputCls}
            placeholder="Ex: A história do basquete gaúcho"
          />
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>Slug *</label>
          <input
            name="slug"
            defaultValue={v.slug ?? ''}
            className={inputCls}
            placeholder="auto-gerado se vazio"
          />
        </div>
      </div>

      <div>
        <label className={labelCls} style={labelStyle}>Subtítulo</label>
        <input
          name="subtitle"
          defaultValue={v.subtitle ?? ''}
          className={inputCls}
          placeholder="Resumo de 1-2 linhas"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className={labelCls} style={labelStyle}>Categoria</label>
          <select
            name="category"
            defaultValue={v.category ?? 'Conhecimento'}
            className={inputCls}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>Autor</label>
          <input
            name="author"
            defaultValue={v.author ?? 'Redação FGB'}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>Tempo de leitura (min)</label>
          <input
            name="readTime"
            type="number"
            min={1}
            defaultValue={v.readTime ?? 5}
            className={inputCls}
          />
        </div>
      </div>

      <CoverImageUpload initialUrl={v.coverImage} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelCls} style={labelStyle}>Fonte</label>
          <input
            name="source"
            defaultValue={v.source ?? ''}
            className={inputCls}
            placeholder="Ex: CBB, NBB, FGB"
          />
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>URL da fonte</label>
          <input
            name="sourceUrl"
            type="url"
            defaultValue={v.sourceUrl ?? ''}
            className={inputCls}
            placeholder="https://..."
          />
        </div>
      </div>

      <div>
        <label className={labelCls} style={labelStyle}>Tags (separadas por vírgula)</label>
        <input
          name="tags"
          defaultValue={tagsToInput(v.tags)}
          className={inputCls}
          placeholder="basquete, fgb, historia"
        />
      </div>

      <div>
        <label className={labelCls} style={labelStyle}>Conteúdo (HTML) *</label>
        <textarea
          name="content"
          required
          defaultValue={v.content ?? ''}
          rows={20}
          className={inputCls + ' font-mono text-sm'}
          style={{ resize: 'vertical' }}
        />
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          name="isPublished"
          defaultChecked={v.isPublished ?? true}
          className="w-4 h-4 accent-[var(--fgb-green-700)]"
        />
        <span className="fgb-label" style={{ fontSize: 11, color: 'var(--fgb-ink-700)' }}>
          Publicar agora
        </span>
      </label>

      <div className="flex items-center gap-3 pt-2 border-t border-[var(--fgb-ink-200)]">
        <button type="submit" className="fgb-btn-primary">
          {submitLabel}
        </button>
        <Link
          href="/admin/articles"
          className="fgb-label"
          style={{ fontSize: 11, color: 'var(--fgb-ink-500)' }}
        >
          Cancelar
        </Link>
      </div>
    </form>
  )
}
