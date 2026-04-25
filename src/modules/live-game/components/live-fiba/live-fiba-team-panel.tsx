'use client'

import type { MouseEvent } from 'react'
import { memo, useMemo } from 'react'

import type { LiveTablePlayer, LiveTableTeam } from '../live-game-table-adapter'
import { LIVE_PLAYER_INLINE_ACTIONS, type LivePlayerInlineAction } from '../../live-fiba-config'
import type { RecentLiveInteraction } from './live-fiba-table'

type LiveFibaTeamPanelProps = {
  team: LiveTableTeam
  selectedAthleteId?: string
  recentInteraction?: RecentLiveInteraction | null
  onSelectAthlete?: (athleteId: string) => void
  onPlayerAction?: (player: LiveTablePlayer, action: LivePlayerInlineAction) => void
}

const PRIMARY_ACTIONS = LIVE_PLAYER_INLINE_ACTIONS.slice(0, 5)
const SECONDARY_ACTIONS = LIVE_PLAYER_INLINE_ACTIONS.slice(5)

function getBlockedReason(player: LiveTablePlayer) {
  if (player.disqualified) return 'Acoes bloqueadas: atleta desqualificado.'
  if (player.fouls >= 5) return 'Acoes bloqueadas: limite de faltas atingido.'
  if (!player.isAvailable) return 'Acoes bloqueadas: atleta indisponivel.'
  if (!player.isOnCourt) return 'Acoes bloqueadas: atleta fora de quadra.'
  return ''
}

function PlayerBadge({ player }: { player: LiveTablePlayer }) {
  if (player.disqualified) {
    return <span className="rounded-full border border-[#CC1016]/45 bg-[#CC1016]/14 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#FFB4B7]">DQ</span>
  }

  if (player.fouls >= 5) {
    return <span className="rounded-full border border-[#F5C200]/45 bg-[#F5C200]/12 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#F5C200]">5 fouls</span>
  }

  if (player.isOnCourt) {
    return <span className="rounded-full border border-[#145530]/45 bg-[#145530]/18 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-100">Court</span>
  }

  if (!player.isAvailable) {
    return <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/40">Out</span>
  }

  return <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/58">Bench</span>
}

function ActionButton({
  action,
  active,
  disabled,
  disabledReason = '',
  onClick,
}: {
  action: { label: string; tone: LivePlayerInlineAction['tone'] }
  active: boolean
  disabled: boolean
  disabledReason?: string
  onClick: (event: MouseEvent<HTMLButtonElement>) => void
}) {
  const toneClass =
    action.tone === 'score'
      ? 'border-[#F5C200]/40 bg-[#F5C200]/14 text-[#F5C200]'
      : action.tone === 'alert'
        ? 'border-[#CC1016]/35 bg-[#CC1016]/12 text-[#FFB4B7]'
        : 'border-white/10 bg-white/[0.05] text-white/75'

  return (
    <button
      type="button"
      title={disabled ? disabledReason : action.label}
      onClick={onClick}
      disabled={disabled}
      className={[
        'min-h-[42px] min-w-0 rounded-xl border px-2 py-2 text-[11px] font-black uppercase tracking-[0.12em] transition',
        toneClass,
        active ? 'scale-[0.98] ring-2 ring-[#F5C200] ring-offset-0' : '',
        disabled ? 'cursor-not-allowed opacity-35' : 'hover:bg-white/[0.1]',
      ].join(' ')}
    >
      {action.label}
    </button>
  )
}

const PlayerActionCard = memo(function PlayerActionCard({
  player,
  selected,
  actionPulse,
  onSelectAthlete,
  onPlayerAction,
}: {
  player: LiveTablePlayer
  selected: boolean
  actionPulse: string
  onSelectAthlete?: (athleteId: string) => void
  onPlayerAction?: (player: LiveTablePlayer, action: LivePlayerInlineAction) => void
}) {
  const isHardLocked = player.disqualified || player.fouls >= 5
  const eventActionsDisabled = !player.isAvailable || !player.isOnCourt || isHardLocked
  const substitutionAction: LivePlayerInlineAction = player.isOnCourt
    ? { id: 'sub-out', label: 'SUB OUT', eventType: 'SUBSTITUTION_OUT', tone: 'neutral' }
    : { id: 'sub-in', label: 'SUB IN', eventType: 'SUBSTITUTION_IN', tone: 'neutral' }
  const substitutionDisabled = player.disqualified ? !player.isOnCourt : !player.isAvailable
  const foulPulse = actionPulse.includes('FOUL')
  const scorePulse = actionPulse.includes('SHOT_MADE') || actionPulse.includes('FREE_THROW_MADE')
  const blockedReason = getBlockedReason(player)

  return (
    <div
      className={[
        'grid h-full grid-cols-[52px_minmax(0,1fr)] gap-2 rounded-[20px] border p-2.5 transition',
        selected
          ? 'border-[#F5C200]/55 bg-[#F5C200]/12 shadow-[0_0_0_1px_rgba(245,194,0,0.24)]'
          : 'border-white/10 bg-black/20',
        scorePulse ? 'ring-2 ring-[#F5C200]/55' : '',
        foulPulse ? 'ring-2 ring-[#CC1016]/55 bg-[#CC1016]/10' : '',
      ].join(' ')}
      onClick={() => onSelectAthlete?.(player.athleteId)}
    >
      <div className="flex flex-col items-center justify-between rounded-2xl border border-white/10 bg-white/[0.05] px-2 py-2">
        <span className="text-[24px] font-black leading-none tracking-[-0.06em] text-white">{player.jerseyNumber ?? '--'}</span>
        <span
          className={[
            'h-2.5 w-2.5 rounded-full',
            player.disqualified ? 'bg-[#CC1016]' : player.isOnCourt ? 'bg-[#F5C200]' : 'bg-white/20',
          ].join(' ')}
        />
      </div>

      <div className="grid min-h-0 grid-rows-[auto_auto_1fr_1fr_auto] gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-[13px] font-black uppercase tracking-[0.03em] text-white">{player.name}</p>
            <p className="truncate text-[10px] font-bold uppercase tracking-[0.16em] text-white/38">
              {player.isStarter ? 'Starter' : 'Roster'} {player.isCaptain ? '/ Captain' : ''}
            </p>
          </div>
          <PlayerBadge player={player} />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-white/72">
          <span className="rounded-full bg-white/[0.06] px-2 py-1 text-[#F5C200]">PTS {player.points}</span>
          <span className="rounded-full bg-white/[0.06] px-2 py-1">REB {player.rebounds}</span>
          <span className="rounded-full bg-white/[0.06] px-2 py-1">AST {player.assists}</span>
          <span className="rounded-full bg-white/[0.06] px-2 py-1 text-[#FFB4B7]">FL {player.fouls}</span>
        </div>

        <div className="grid grid-cols-5 gap-1">
          {PRIMARY_ACTIONS.map((action) => (
            <ActionButton
              key={action.id}
              action={action}
              active={actionPulse === action.eventType}
              disabled={eventActionsDisabled}
              disabledReason={blockedReason}
              onClick={(event) => {
                event.stopPropagation()
                if (eventActionsDisabled) return
                onSelectAthlete?.(player.athleteId)
                onPlayerAction?.(player, action)
              }}
            />
          ))}
        </div>

        <div className="grid grid-cols-5 gap-1">
          {SECONDARY_ACTIONS.map((action) => (
            <ActionButton
              key={action.id}
              action={action}
              active={actionPulse === action.eventType}
              disabled={eventActionsDisabled}
              disabledReason={blockedReason}
              onClick={(event) => {
                event.stopPropagation()
                if (eventActionsDisabled) return
                onSelectAthlete?.(player.athleteId)
                onPlayerAction?.(player, action)
              }}
            />
          ))}

          <ActionButton
            action={substitutionAction}
            active={actionPulse === substitutionAction.eventType}
            disabled={substitutionDisabled}
            disabledReason={player.disqualified ? 'Substituicao bloqueada: atleta desqualificado.' : 'Substituicao bloqueada: atleta indisponivel.'}
            onClick={(event) => {
              event.stopPropagation()
              if (substitutionDisabled) return
              onSelectAthlete?.(player.athleteId)
              onPlayerAction?.(player, substitutionAction)
            }}
          />
        </div>

        <div className="min-h-[18px]">
          {blockedReason ? (
            <p className="truncate text-[10px] font-black uppercase tracking-[0.14em] text-[#FFB4B7]">{blockedReason}</p>
          ) : selected ? (
            <p className="truncate text-[10px] font-black uppercase tracking-[0.14em] text-[#F5C200]">Jogador ativo para clique rapido e teclado.</p>
          ) : null}
        </div>
      </div>
    </div>
  )
},
(prev, next) =>
  prev.selected === next.selected &&
  prev.actionPulse === next.actionPulse &&
  prev.player.id === next.player.id &&
  prev.player.points === next.player.points &&
  prev.player.rebounds === next.player.rebounds &&
  prev.player.assists === next.player.assists &&
  prev.player.fouls === next.player.fouls &&
  prev.player.turnovers === next.player.turnovers &&
  prev.player.steals === next.player.steals &&
  prev.player.blocks === next.player.blocks &&
  prev.player.isOnCourt === next.player.isOnCourt &&
  prev.player.isAvailable === next.player.isAvailable &&
  prev.player.disqualified === next.player.disqualified
)

export function LiveFibaTeamPanel({
  team,
  selectedAthleteId = '',
  recentInteraction = null,
  onSelectAthlete,
  onPlayerAction,
}: LiveFibaTeamPanelProps) {
  const players = useMemo(
    () =>
      [...team.players].sort((left, right) => {
        if (left.isOnCourt !== right.isOnCourt) return Number(right.isOnCourt) - Number(left.isOnCourt)
        if (left.disqualified !== right.disqualified) return Number(left.disqualified) - Number(right.disqualified)
        if (left.jerseyNumber !== right.jerseyNumber) return (left.jerseyNumber ?? 999) - (right.jerseyNumber ?? 999)
        return left.name.localeCompare(right.name)
      }),
    [team.players]
  )

  const rowsTemplate = players.length > 0 ? `repeat(${players.length}, minmax(0, 1fr))` : 'minmax(0, 1fr)'

  return (
    <section className="grid min-h-0 grid-rows-[auto_1fr] overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0e14] text-white shadow-[0_24px_72px_rgba(0,0,0,0.34)]">
      <header
        className={[
          'border-b border-white/10 px-4 py-4',
          team.side === 'home'
            ? 'bg-[linear-gradient(90deg,rgba(20,85,48,0.42),rgba(255,255,255,0.03))]'
            : 'bg-[linear-gradient(90deg,rgba(204,16,22,0.42),rgba(255,255,255,0.03))]',
        ].join(' ')}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/45">
              {team.side === 'home' ? 'Painel mandante' : 'Painel visitante'}
            </p>
            <h2 className="mt-1 text-[clamp(1.1rem,1.6vw,1.6rem)] font-black uppercase tracking-[0.04em]">{team.name}</h2>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/35">Score</p>
              <p className="mt-1 text-lg font-black text-white">{team.score}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/35">Bonus</p>
              <p className="mt-1 text-lg font-black text-[#F5C200]">{team.inBonus ? 'ON' : 'OFF'}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/35">TO</p>
              <p className="mt-1 text-lg font-black text-white">{team.remainingTimeouts}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="min-h-0 overflow-hidden p-3">
        {players.length === 0 ? (
          <div className="grid h-full place-items-center rounded-[24px] border border-dashed border-white/10 bg-white/[0.03] p-6 text-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-white/55">Roster vazio</p>
              <p className="mt-2 text-sm text-white/35">Nenhum atleta disponivel para operacao ao vivo.</p>
            </div>
          </div>
        ) : (
          <div className="grid h-full gap-2 overflow-hidden" style={{ gridTemplateRows: rowsTemplate }}>
            {players.map((player) => {
              const interactionMatchesPlayer = recentInteraction?.athleteId === player.athleteId
              const actionPulse = interactionMatchesPlayer ? recentInteraction?.eventType ?? '' : ''

              return (
                <PlayerActionCard
                  key={player.id}
                  player={player}
                  selected={selectedAthleteId === player.athleteId}
                  actionPulse={actionPulse}
                  onSelectAthlete={onSelectAthlete}
                  onPlayerAction={onPlayerAction}
                />
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
