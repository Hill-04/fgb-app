'use client'

import { useState } from 'react'
import { Facebook, Link as LinkIcon, MessageCircle, Twitter } from 'lucide-react'

export default function ShareButtons({ title, slug }: { title: string; slug: string }) {
  const [copied, setCopied] = useState(false)

  const url = typeof window !== 'undefined'
    ? `${window.location.origin}/portal/${slug}`
    : `https://fgb-app.vercel.app/portal/${slug}`
  const enc = encodeURIComponent
  const text = `${title} — Portal FGB`

  const wa = `https://api.whatsapp.com/send?text=${enc(text + ' ' + url)}`
  const fb = `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`
  const tw = `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}`

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }

  const btnStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 14px',
    fontSize: 11,
    border: '1px solid var(--fgb-ink-200)',
    background: '#fff',
    color: 'var(--fgb-ink-700)',
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    textDecoration: 'none',
    cursor: 'pointer',
    transition: 'all 0.15s',
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <a href={wa} target="_blank" rel="noopener noreferrer" style={btnStyle}>
        <MessageCircle size={14} /> WhatsApp
      </a>
      <a href={fb} target="_blank" rel="noopener noreferrer" style={btnStyle}>
        <Facebook size={14} /> Facebook
      </a>
      <a href={tw} target="_blank" rel="noopener noreferrer" style={btnStyle}>
        <Twitter size={14} /> X
      </a>
      <button onClick={copyLink} style={btnStyle}>
        <LinkIcon size={14} /> {copied ? 'Copiado!' : 'Copiar link'}
      </button>
    </div>
  )
}
