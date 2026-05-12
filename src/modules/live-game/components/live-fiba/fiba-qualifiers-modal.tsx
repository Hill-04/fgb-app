'use client'

import { useEffect, useState } from 'react'
import { type FibaQualifier } from '@/lib/live-game/fiba-protocol'

type Props = {
  isOpen: boolean
  eventType: string
  onConfirm: (qualifiers: FibaQualifier[]) => void
  onSkip: () => void
}

const QUALIFIERS_FOR_EVENT: Record<string, FibaQualifier[]> = {
  SHOT_MADE_2: ['pointsinthepaint', 'fastbreak', 'secondchance', 'fromturnover', 'andone', 'contested', 'open', 'clutch'],
  SHOT_MADE_3: ['fastbreak', 'secondchance', 'fromturnover', 'contested', 'open', 'clutch'],
  SHOT_MISSED_2: ['blocked', 'contested', 'fastbreak'],
  SHOT_MISSED_3: ['blocked', 'contested', 'fastbreak'],
  FREE_THROW_MADE: ['andone', 'clutch'],
}

const QUALIFIER_LABELS: Record<FibaQualifier, string> = {
  pointsinthepaint: 'No garrafão',
  fastbreak: 'Contra-ataque',
  secondchance: 'Segunda chance',
  fromturnover: 'Após perda',
  andone: 'Falta + cesta',
  blocked: 'Bloqueado',
  contested: 'Contestado',
  open: 'Aberto',
  clutch: 'Clutch',
  gametying: 'Empate',
  gamewinning: 'Cesta da vitória',
}

export function FibaQualifiersModal({ isOpen, eventType, onConfirm, onSkip }: Props) {
  const [selected, setSelected] = useState<Set<FibaQualifier>>(new Set())
  const [countdown, setCountdown] = useState(4)

  const availableQualifiers = QUALIFIERS_FOR_EVENT[eventType] ?? []

  useEffect(() => {
    if (!isOpen) {
      setSelected(new Set())
      setCountdown(4)
      return
    }

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          onSkip()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isOpen, onSkip])

  if (!isOpen || availableQualifiers.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 rounded-xl border-2 border-fgb-green-700 bg-white p-4 shadow-2xl">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-fgb-ink-800">Qualificadores (opcional)</h3>
        <span className="text-xs text-fgb-ink-400">{countdown}s</span>
      </div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {availableQualifiers.map(q => (
          <button
            key={q}
            onClick={() => setSelected(prev => {
              const next = new Set(prev)
              if (next.has(q)) next.delete(q)
              else next.add(q)
              return next
            })}
            className={`rounded-md px-2 py-1 text-xs font-medium ${
              selected.has(q)
                ? 'bg-fgb-green-700 text-white'
                : 'bg-fgb-ink-100 text-fgb-ink-700 hover:bg-fgb-ink-200'
            }`}
          >
            {QUALIFIER_LABELS[q] ?? q}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          onClick={onSkip}
          className="flex-1 rounded-md border border-fgb-ink-300 px-3 py-1.5 text-sm text-fgb-ink-700 hover:bg-fgb-ink-50"
        >
          Pular
        </button>
        <button
          onClick={() => onConfirm([...selected])}
          disabled={selected.size === 0}
          className="flex-1 rounded-md bg-fgb-green-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-fgb-green-800 disabled:opacity-50"
        >
          Confirmar
        </button>
      </div>
    </div>
  )
}
