'use client'

import { CheckCircle2 } from 'lucide-react'

type Props = {
  publishedAt: Date | string
  isHistoricallyLocked?: boolean
  version?: number
  pdfUrl?: string | null
}

/**
 * Badge "Súmula Oficial — Publicada" pra página pública de jogo.
 *
 * Standalone — escolha onde plugar (GameHeroClient, GameInfoContent, etc.).
 * Recebe os campos via props, não consome contexto.
 */
export function PublishedSumulaBadge({ publishedAt, isHistoricallyLocked, version, pdfUrl }: Props) {
  const date = typeof publishedAt === 'string' ? new Date(publishedAt) : publishedAt

  return (
    <div className="mb-4 rounded-lg border border-fgb-green-700/30 bg-fgb-green-50 p-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <CheckCircle2 size={18} className="text-fgb-green-700" />
            <span className="text-sm font-semibold text-fgb-green-700">
              Súmula Oficial — Publicada
            </span>
            {isHistoricallyLocked && (
              <span className="rounded-full bg-fgb-yellow-100 px-2 py-0.5 text-xs font-medium text-fgb-yellow-800">
                Travada
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-fgb-ink-600">
            Publicada em {date.toLocaleDateString('pt-BR')}
            {version && version > 1 ? ` · versão ${version}` : ''}
          </p>
        </div>
        {pdfUrl && (
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-fgb-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-fgb-green-800"
          >
            Baixar PDF
          </a>
        )}
      </div>
    </div>
  )
}
