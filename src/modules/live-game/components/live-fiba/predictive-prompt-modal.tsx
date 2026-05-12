'use client'

type Suggestion = {
  type: 'OFFER_FTS' | 'WHO_REBOUNDED' | 'WHO_ASSISTED' | 'WHO_SUBBED_IN'
  prompt: string
  options: { id: string; label: string; keyboard?: string }[]
}

type Props = {
  suggestion: Suggestion | null
  onSelect: (optionId: string) => void
  onDismiss: () => void
}

export function PredictivePromptModal({ suggestion, onSelect, onDismiss }: Props) {
  if (!suggestion) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-amber-400 bg-white p-4 shadow-2xl">
      <div className="mx-auto max-w-3xl">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-semibold uppercase tracking-wide text-slate-600">
            {suggestion.prompt}
          </span>
          <button onClick={onDismiss} className="text-xs text-slate-400 hover:text-slate-700">
            Esc para pular
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {suggestion.options.map(opt => (
            <button
              key={opt.id}
              onClick={() => onSelect(opt.id)}
              className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-left hover:border-fgb-green-700 hover:bg-fgb-green-50"
            >
              <div className="text-sm font-medium text-slate-800">{opt.label}</div>
              {opt.keyboard && (
                <div className="mt-1 text-xs text-slate-400">tecla: {opt.keyboard}</div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
