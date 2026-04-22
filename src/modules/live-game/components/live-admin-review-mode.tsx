'use client'

import type { LiveAdminHandlers } from '../types/live-admin'

type LiveAdminReviewModeProps = {
  data: any
  submitting: boolean
  handlers: LiveAdminHandlers
}

export function LiveAdminReviewMode({ data, submitting, handlers }: LiveAdminReviewModeProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-sm">
        <h2 className="fgb-display text-2xl leading-none text-[var(--black)]">Checklist final</h2>
        <div className="mt-5 space-y-3">
          {(data.review?.issues || []).map((issue: string) => (
            <div key={issue} className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{issue}</div>
          ))}
          {(data.review?.warnings || []).map((warning: string) => (
            <div key={warning} className="rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-700">{warning}</div>
          ))}
          {(data.review?.issues || []).length === 0 && (data.review?.warnings || []).length === 0 && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Partida pronta para fechamento oficial.</div>
          )}
        </div>
        <button onClick={handlers.doReviewAction} disabled={submitting || !data.review?.readyToFinalize} className="mt-5 rounded-xl bg-[var(--black)] px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-50">Fechar oficialmente</button>
      </div>
      <div className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-sm">
        <h2 className="fgb-display text-2xl leading-none text-[var(--black)]">Parciais</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {(data.boxScore?.periods || []).map((period: any) => (
            <div key={period.id} className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm text-[var(--black)]">
              Periodo {period.period}: {period.homePoints} x {period.awayPoints}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
