'use client'

import { useRef, useState } from 'react'
import { Upload, X, Loader2, ImageIcon, FileText } from 'lucide-react'

interface Props {
  fieldName: string
  currentUrl?: string | null
  label: string
  accept?: string
  variant?: 'photo' | 'doc'
  onUrlChange?: (url: string) => void
}

export function FileUpload({ fieldName, currentUrl, label, accept = 'image/*', variant = 'photo', onUrlChange }: Props) {
  const [url, setUrl] = useState(currentUrl ?? '')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const isPhoto = variant === 'photo'

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: form })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro no upload')
      setUrl(json.url)
      onUrlChange?.(json.url)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">{label}</p>

      {/* Hidden field that submits the URL */}
      <input type="hidden" name={fieldName} value={url} />

      <div className="flex items-center gap-3">
        {/* Preview */}
        {isPhoto ? (
          <div className="w-14 h-14 rounded-xl border border-[var(--border)] bg-[var(--gray-l)] overflow-hidden flex items-center justify-center flex-shrink-0">
            {url ? (
              <img src={url} alt={label} className="w-full h-full object-cover" />
            ) : (
              <ImageIcon className="w-6 h-6 text-[var(--gray)] opacity-40" />
            )}
          </div>
        ) : (
          <div className="w-10 h-10 rounded-xl border border-[var(--border)] bg-[var(--gray-l)] flex items-center justify-center flex-shrink-0">
            {url ? (
              <a href={url} target="_blank" rel="noreferrer" className="flex items-center justify-center w-full h-full">
                <FileText className="w-5 h-5 text-[var(--verde)]" />
              </a>
            ) : (
              <FileText className="w-5 h-5 text-[var(--gray)] opacity-40" />
            )}
          </div>
        )}

        <div className="flex-1 min-w-0 space-y-1">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-[var(--border)] bg-white text-[10px] font-black uppercase tracking-widest text-[var(--black)] hover:border-[var(--verde)] transition-all disabled:opacity-50"
          >
            {uploading ? (
              <><Loader2 className="w-3 h-3 animate-spin" /> Enviando...</>
            ) : (
              <><Upload className="w-3 h-3" /> {url ? 'Trocar arquivo' : 'Enviar arquivo'}</>
            )}
          </button>

          {url && (
            <button
              type="button"
              onClick={() => { setUrl(''); onUrlChange?.('') }}
              className="inline-flex items-center gap-1 h-8 px-3 rounded-xl border border-[var(--border)] text-[10px] font-black uppercase tracking-widest text-[var(--red)] hover:bg-red-50 transition-all ml-2"
            >
              <X className="w-3 h-3" /> Remover
            </button>
          )}

          {error && <p className="text-[10px] text-[var(--red)]">{error}</p>}
          {url && !error && (
            <p className="text-[10px] text-[var(--gray)] truncate max-w-[220px]">
              {url.split('/').pop()}
            </p>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFile}
        className="hidden"
      />
    </div>
  )
}
