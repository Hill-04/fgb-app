'use client'

import { Play, Flag, Square, TimerReset, RefreshCcw } from 'lucide-react'

import type { LiveGameTableModel, LiveTableTab } from '../live-game-table-adapter'
import type { LiveAdminHandlers } from '../../types/live-admin'
import { getLiveControlAvailability } from '../../live-fiba-config'

type LiveFibaControlsProps = {
  tableModel: LiveGameTableModel
  activeTab: LiveTableTab
  isSyncing?: boolean
  pendingCount?: number
  error?: string
  onTabChange: (tab: LiveTableTab) => void
  onRefresh?: () => void
  handlers?: Pick<LiveAdminHandlers, 'handleControlEvent' | 'handleTimeoutFromSide'>
}

const tabs: Array<{ id: LiveTableTab; label: string }> = [
  { id: 'home', label: 'HOME' },
  { id: 'away', label: 'AWAY' },
  { id: 'log', label: 'LOG' },
  { id: 'box', label: 'BOXSCORE' },
]

export function LiveFibaControls({
  tableModel,
  activeTab,
  isSyncing = false,
  pendingCount = 0,
  error = '',
  onTabChange,
  onRefresh,
  handlers,
}: LiveFibaControlsProps) {
  const isFinal = ['FINAL_PENDING_CONFIRMATION', 'FINAL_OFFICIAL'].includes(tableModel.liveStatus)
  const controlAvailability = getLiveControlAvailability({
    liveStatus: tableModel.liveStatus,
    currentPeriod: tableModel.currentPeriod,
    isFinal,
  })

  const remainingHomeTimeouts = Math.max(0, 5 - tableModel.home.timeoutsUsed)
  const remainingAwayTimeouts = Math.max(0, 5 - tableModel.away.timeoutsUsed)
  const timeoutDisabled = tableModel.liveStatus !== 'LIVE' || isFinal

  return (
    <footer className="sticky bottom-3 z-20 rounded-[24px] border border-white/10 bg-[#070b12]/95 p-3 text-white shadow-[0_22px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={controlAvailability.startOrResume.disabled}
            title={controlAvailability.startOrResume.hint}
            onClick={() => handlers?.handleControlEvent(controlAvailability.startOrResume.eventType)}
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500/16 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-emerald-100 transition hover:bg-emerald-500/24 disabled:cursor-not-allowed disabled:opacity-35"
          >
            <Play className="h-4 w-4" />
            {controlAvailability.startOrResume.label}
          </button>
          <button
            type="button"
            disabled={controlAvailability.endPeriod.disabled}
            title={controlAvailability.endPeriod.hint}
            onClick={() => handlers?.handleControlEvent(controlAvailability.endPeriod.eventType)}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#f5c849]/14 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-[#f5c849] transition hover:bg-[#f5c849]/22 disabled:cursor-not-allowed disabled:opacity-35"
          >
            <Flag className="h-4 w-4" />
            {controlAvailability.endPeriod.label}
          </button>
          <button
            type="button"
            disabled={controlAvailability.endGame.disabled}
            title={controlAvailability.endGame.hint}
            onClick={() => handlers?.handleControlEvent(controlAvailability.endGame.eventType)}
            className="inline-flex items-center gap-2 rounded-2xl bg-red-500/14 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-red-100 transition hover:bg-red-500/22 disabled:cursor-not-allowed disabled:opacity-35"
          >
            <Square className="h-4 w-4" />
            {controlAvailability.endGame.label}
          </button>
          <button
            type="button"
            disabled={timeoutDisabled || remainingHomeTimeouts === 0}
            title={
              remainingHomeTimeouts === 0
                ? 'Equipe da casa sem timeouts restantes.'
                : timeoutDisabled
                  ? 'Timeout disponivel somente com o jogo ao vivo.'
                  : 'Registra timeout da equipe da casa.'
            }
            onClick={() => handlers?.handleTimeoutFromSide('home')}
            className="inline-flex items-center gap-2 rounded-2xl border border-emerald-300/20 bg-emerald-500/10 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-emerald-100 transition hover:bg-emerald-500/18 disabled:cursor-not-allowed disabled:opacity-35"
          >
            <TimerReset className="h-4 w-4" />
            Timeout home ({remainingHomeTimeouts})
          </button>
          <button
            type="button"
            disabled={timeoutDisabled || remainingAwayTimeouts === 0}
            title={
              remainingAwayTimeouts === 0
                ? 'Equipe visitante sem timeouts restantes.'
                : timeoutDisabled
                  ? 'Timeout disponivel somente com o jogo ao vivo.'
                  : 'Registra timeout da equipe visitante.'
            }
            onClick={() => handlers?.handleTimeoutFromSide('away')}
            className="inline-flex items-center gap-2 rounded-2xl border border-red-300/20 bg-red-500/10 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-red-100 transition hover:bg-red-500/18 disabled:cursor-not-allowed disabled:opacity-35"
          >
            <TimerReset className="h-4 w-4" />
            Timeout away ({remainingAwayTimeouts})
          </button>
        </div>

        <div className="grid gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-3 lg:grid-cols-3">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/35">Estado</p>
            <p className="mt-1 text-sm font-black uppercase text-white">{tableModel.liveStatus}</p>
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/35">Acao disponivel</p>
            <p className="mt-1 text-sm font-black uppercase text-[#f5c849]">{controlAvailability.startOrResume.label}</p>
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/35">Orientacao</p>
            <p className="mt-1 text-sm font-semibold text-white/70">{controlAvailability.startOrResume.hint}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <nav className="grid grid-cols-4 gap-2 lg:w-[520px]" aria-label="FIBA live table tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={[
                'rounded-2xl px-3 py-3 text-xs font-black uppercase tracking-[0.16em] transition',
                activeTab === tab.id
                  ? 'bg-[#f5c849] text-black shadow-[0_0_24px_rgba(245,200,73,0.2)]'
                  : 'border border-white/10 bg-white/[0.04] text-white/50 hover:bg-white/8 hover:text-white',
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="flex flex-wrap items-center justify-between gap-2 lg:justify-end">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/35">Match</p>
            <p className="text-sm font-black uppercase text-white">
              {tableModel.home.shortName} {tableModel.home.score} x {tableModel.away.score} {tableModel.away.shortName}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/35">Sync</p>
            <p className={['text-sm font-black uppercase', isSyncing ? 'text-[#f5c849]' : 'text-emerald-200'].join(' ')}>
              {isSyncing ? `Pending ${pendingCount}` : 'Ready'}
            </p>
          </div>
          {error && (
            <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-2">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-red-200">Alert</p>
              <p className="max-w-[260px] truncate text-sm font-bold text-red-100">{error}</p>
            </div>
          )}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-white transition hover:bg-white/10"
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </button>
          )}
        </div>
      </div>
      </div>
    </footer>
  )
}
