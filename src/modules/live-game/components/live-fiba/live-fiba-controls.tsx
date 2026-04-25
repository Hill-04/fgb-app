'use client'

import type { ReactNode } from 'react'
import { Flag, Play, RefreshCcw, RotateCcw, Square, TimerReset } from 'lucide-react'

import type { LiveGameTableModel, LiveTableSide } from '../live-game-table-adapter'
import { getLiveControlAvailability } from '../../live-fiba-config'
import type { RecentLiveInteraction } from './live-fiba-table'

type LiveFibaControlsProps = {
  tableModel: LiveGameTableModel
  shotClock: number
  selectedPlayerLabel?: string | null
  recentInteraction?: RecentLiveInteraction | null
  isSyncing?: boolean
  pendingCount?: number
  error?: string
  onRefresh?: () => void
  onShotClockReset: (seconds: number) => void
  onTimeout: (side: LiveTableSide) => void
  onControlEvent: (eventType: string) => void
}

function ControlButton({
  icon,
  label,
  hint,
  disabled,
  tone,
  active = false,
  onClick,
}: {
  icon: ReactNode
  label: string
  hint: string
  disabled: boolean
  tone: 'start' | 'warn' | 'danger' | 'neutral'
  active?: boolean
  onClick: () => void
}) {
  const toneClass =
    tone === 'start'
      ? 'border-[#145530]/40 bg-[#145530]/18 text-emerald-100'
      : tone === 'warn'
        ? 'border-[#F5C200]/35 bg-[#F5C200]/12 text-[#F5C200]'
        : tone === 'danger'
          ? 'border-[#CC1016]/35 bg-[#CC1016]/14 text-[#FFB4B7]'
          : 'border-white/10 bg-white/[0.05] text-white/80'

  return (
    <button
      type="button"
      title={hint}
      disabled={disabled}
      onClick={onClick}
      className={[
        'flex min-h-16 flex-col items-start justify-between rounded-[22px] border px-4 py-3 text-left transition duration-150',
        toneClass,
        active ? 'ring-2 ring-[#F5C200] ring-offset-0 shadow-[0_0_0_1px_rgba(245,194,0,0.28)]' : '',
        disabled ? 'cursor-not-allowed opacity-35' : 'hover:bg-white/[0.1]',
      ].join(' ')}
    >
      <span className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.1em]">
        {icon}
        {label}
      </span>
      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">{hint}</span>
    </button>
  )
}

export function LiveFibaControls({
  tableModel,
  shotClock,
  selectedPlayerLabel = '',
  recentInteraction = null,
  isSyncing = false,
  pendingCount = 0,
  error = '',
  onRefresh,
  onShotClockReset,
  onTimeout,
  onControlEvent,
}: LiveFibaControlsProps) {
  const isFinal = ['FINAL_PENDING_CONFIRMATION', 'FINAL_OFFICIAL'].includes(tableModel.liveStatus)
  const controlAvailability = getLiveControlAvailability({
    liveStatus: tableModel.liveStatus,
    currentPeriod: tableModel.currentPeriod,
    isFinal,
  })

  const timeoutDisabled = tableModel.liveStatus !== 'LIVE' || isFinal
  const recentEventType = recentInteraction?.eventType ?? ''
  const recentTimeoutSide = recentInteraction?.eventType === 'TIMEOUT_CONFIRMED' ? recentInteraction.side : null
  const selectedModeActive = Boolean(selectedPlayerLabel)

  return (
    <footer className="rounded-[28px] border border-white/10 bg-[#070a10]/95 p-3 text-white shadow-[0_30px_90px_rgba(0,0,0,0.46)] backdrop-blur-xl">
      <div className="grid gap-3 xl:grid-cols-[1.2fr_1fr]">
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <ControlButton
            icon={<Play className="h-4 w-4" />}
            label={controlAvailability.startOrResume.label}
            hint={controlAvailability.startOrResume.hint}
            disabled={controlAvailability.startOrResume.disabled}
            tone="start"
            active={recentEventType === controlAvailability.startOrResume.eventType}
            onClick={() => onControlEvent(controlAvailability.startOrResume.eventType)}
          />

          <ControlButton
            icon={<Flag className="h-4 w-4" />}
            label={controlAvailability.endPeriod.label}
            hint={controlAvailability.endPeriod.hint}
            disabled={controlAvailability.endPeriod.disabled}
            tone="warn"
            active={recentEventType === controlAvailability.endPeriod.eventType}
            onClick={() => onControlEvent(controlAvailability.endPeriod.eventType)}
          />

          <ControlButton
            icon={<Square className="h-4 w-4" />}
            label={controlAvailability.endGame.label}
            hint={controlAvailability.endGame.hint}
            disabled={controlAvailability.endGame.disabled}
            tone="danger"
            active={recentEventType === controlAvailability.endGame.eventType}
            onClick={() => onControlEvent(controlAvailability.endGame.eventType)}
          />

          <ControlButton
            icon={<TimerReset className="h-4 w-4" />}
            label={`Timeout ${tableModel.home.shortName}`}
            hint={
              tableModel.home.remainingTimeouts === 0
                ? 'Mandante sem timeout restante.'
                : timeoutDisabled
                  ? 'Timeout disponivel apenas com jogo ao vivo.'
                  : `${tableModel.home.remainingTimeouts} timeout(s) restante(s).`
            }
            disabled={timeoutDisabled || tableModel.home.remainingTimeouts === 0}
            tone="neutral"
            active={recentTimeoutSide === 'home'}
            onClick={() => onTimeout('home')}
          />

          <ControlButton
            icon={<TimerReset className="h-4 w-4" />}
            label={`Timeout ${tableModel.away.shortName}`}
            hint={
              tableModel.away.remainingTimeouts === 0
                ? 'Visitante sem timeout restante.'
                : timeoutDisabled
                  ? 'Timeout disponivel apenas com jogo ao vivo.'
                  : `${tableModel.away.remainingTimeouts} timeout(s) restante(s).`
            }
            disabled={timeoutDisabled || tableModel.away.remainingTimeouts === 0}
            tone="neutral"
            active={recentTimeoutSide === 'away'}
            onClick={() => onTimeout('away')}
          />

          <div className="grid min-h-14 gap-2 rounded-[22px] border border-white/10 bg-white/[0.05] px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-black uppercase tracking-[0.1em] text-white">Shot clock</span>
              <span className="text-2xl font-black leading-none text-[#F5C200]">{Math.max(shotClock, 0)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onShotClockReset(24)}
                className="rounded-xl border border-[#F5C200]/35 bg-[#F5C200]/12 px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-[#F5C200] transition hover:bg-[#F5C200]/18"
              >
                24s
              </button>
              <button
                type="button"
                onClick={() => onShotClockReset(14)}
                className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-white/78 transition hover:bg-white/[0.1]"
              >
                14s
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <div className="grid gap-2 rounded-[24px] border border-white/10 bg-white/[0.04] px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/38">Estado operacional</p>
              <p className={['text-[10px] font-black uppercase tracking-[0.16em]', isSyncing ? 'text-[#F5C200]' : 'text-emerald-100'].join(' ')}>
                {isSyncing ? `Sincronizando ${pendingCount}` : 'Mesa estavel'}
              </p>
            </div>
            <p className="text-sm font-black uppercase tracking-[0.06em] text-white">
              {tableModel.home.shortName} {tableModel.home.score} x {tableModel.away.score} {tableModel.away.shortName}
            </p>
            <p className="text-sm font-semibold text-white/68">
              Proxima acao principal: {controlAvailability.startOrResume.label}. {controlAvailability.startOrResume.hint}
            </p>
            <div
              className={[
                'rounded-2xl border px-3 py-2 transition',
                selectedModeActive ? 'border-[#F5C200]/35 bg-[#F5C200]/10' : 'border-white/10 bg-black/20',
              ].join(' ')}
            >
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/38">Jogador ativo</p>
              <p className="mt-1 truncate text-sm font-black uppercase tracking-[0.04em] text-white">
                {selectedPlayerLabel || 'Selecione um jogador para operar com teclado'}
              </p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/42">
                Atalhos: 1 +1 / 2 +2 / 3 +3 / F foul / R reb / A ast / S stl / B blk / T turnover
              </p>
            </div>
            {error ? <p className="text-sm font-semibold text-[#FFB4B7]">{error}</p> : null}
          </div>

          {onRefresh ? (
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-[22px] border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-black uppercase tracking-[0.12em] text-white transition hover:bg-white/[0.1]"
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh
              <RotateCcw className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>
    </footer>
  )
}
