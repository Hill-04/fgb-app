'use client'

import { useMemo, useState } from 'react'

import type { LiveTablePlayer, LiveTableTeam } from '../live-game-table-adapter'
import { LIVE_PLAYER_INLINE_ACTIONS, type LivePlayerInlineAction } from '../../live-fiba-config'

type LiveFibaTeamPanelProps = {
  team: LiveTableTeam
  selectedAthleteId?: string
  onSelectAthlete?: (athleteId: string) => void
  onPlayerAction?: (player: LiveTablePlayer, action: LivePlayerInlineAction) => void
}

function PlayerStatus({ player }: { player: LiveTablePlayer }) {
  if (player.disqualified) {
    return <span className="rounded-full bg-red-500/15 px-2 py-1 text-[10px] font-black uppercase text-red-200">DQ</span>
  }

  if (player.isOnCourt) {
    return <span className="rounded-full bg-emerald-400/15 px-2 py-1 text-[10px] font-black uppercase text-emerald-200">Court</span>
  }

  if (!player.isAvailable) {
    return <span className="rounded-full bg-white/8 px-2 py-1 text-[10px] font-black uppercase text-white/40">Out</span>
  }

  return <span className="rounded-full bg-[#f5c849]/15 px-2 py-1 text-[10px] font-black uppercase text-[#f5c849]">Bench</span>
}

function ActionButton({
  action,
  active,
  disabled,
  onClick,
}: {
  action: LivePlayerInlineAction
  active: boolean
  disabled: boolean
  onClick: () => void
}) {
  const toneClass =
    action.tone === 'score'
      ? 'border-emerald-300/20 bg-emerald-400/10 text-emerald-100 hover:bg-emerald-400/18'
      : action.tone === 'alert'
        ? 'border-red-300/20 bg-red-400/10 text-red-100 hover:bg-red-400/18'
        : 'border-white/10 bg-white/[0.05] text-white/78 hover:bg-white/10'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        'rounded-xl border px-2.5 py-2 text-[10px] font-black uppercase tracking-[0.12em] transition',
        toneClass,
        active ? 'scale-[0.98] ring-2 ring-[#f5c849] ring-offset-0' : '',
        disabled ? 'cursor-not-allowed opacity-35 hover:bg-inherit' : '',
      ].join(' ')}
    >
      {action.label}
    </button>
  )
}

export function LiveFibaTeamPanel({
  team,
  selectedAthleteId = '',
  onSelectAthlete,
  onPlayerAction,
}: LiveFibaTeamPanelProps) {
  const [recentActionKey, setRecentActionKey] = useState('')
  const [recentActionLabel, setRecentActionLabel] = useState('')
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

  const flashAction = (playerId: string, actionId: string, actionLabel: string) => {
    const key = `${playerId}:${actionId}`
    setRecentActionKey(key)
    setRecentActionLabel(actionLabel)
    window.setTimeout(() => {
      setRecentActionKey((current) => (current === key ? '' : current))
      setRecentActionLabel((current) => (current === actionLabel ? '' : current))
    }, 900)
  }

  return (
    <section className="overflow-hidden rounded-[24px] border border-white/10 bg-[#0b1019] text-white shadow-[0_22px_64px_rgba(0,0,0,0.28)]">
      <header
        className={[
          'flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-4',
          team.side === 'home'
            ? 'bg-[linear-gradient(90deg,rgba(27,115,64,0.42),rgba(255,255,255,0.03))]'
            : 'bg-[linear-gradient(90deg,rgba(204,16,22,0.42),rgba(255,255,255,0.03))]',
        ].join(' ')}
      >
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/42">
            {team.side === 'home' ? 'Home roster' : 'Away roster'}
          </p>
          <h2 className="mt-1 text-2xl font-black uppercase tracking-[0.04em]">{team.name}</h2>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/40">
            Coach: {team.coachName}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-white/8 px-3 py-2">
            <p className="text-[9px] uppercase tracking-[0.18em] text-white/35">Pts</p>
            <p className="text-xl font-black">{team.score}</p>
          </div>
          <div className="rounded-xl bg-white/8 px-3 py-2">
            <p className="text-[9px] uppercase tracking-[0.18em] text-white/35">Fls</p>
            <p className="text-xl font-black text-[#f5c849]">{team.fouls}</p>
          </div>
          <div className="rounded-xl bg-white/8 px-3 py-2">
            <p className="text-[9px] uppercase tracking-[0.18em] text-white/35">TM</p>
            <p className="text-xl font-black">{team.timeoutsUsed}</p>
          </div>
        </div>
      </header>

      <div className="max-h-[560px] overflow-auto">
        <table className="w-full min-w-[1040px] text-left">
          <thead className="sticky top-0 z-10 bg-[#111827] text-[10px] font-black uppercase tracking-[0.16em] text-white/38">
            <tr>
              <th className="px-4 py-3">Athlete</th>
              <th className="px-3 py-3 text-center">Status</th>
              <th className="px-3 py-3 text-center">Pts</th>
              <th className="px-3 py-3 text-center">Reb</th>
              <th className="px-3 py-3 text-center">Ast</th>
              <th className="px-3 py-3 text-center">Fls</th>
              <th className="px-3 py-3 text-center">Stl</th>
              <th className="px-3 py-3 text-center">Blk</th>
              <th className="px-3 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/8">
            {players.map((player) => {
              const selected = selectedAthleteId === player.athleteId
              const actionsDisabled = !player.isAvailable || !player.isOnCourt || player.disqualified
              return (
                <tr
                  key={player.id}
                  onClick={() => onSelectAthlete?.(player.athleteId)}
                  className={[
                    'cursor-pointer transition hover:bg-white/[0.06]',
                    selected ? 'bg-[#f5c849]/10' : 'bg-transparent',
                  ].join(' ')}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/8 text-sm font-black">
                        {player.jerseyNumber ?? '--'}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-black uppercase tracking-[0.04em] text-white">
                          {player.name}
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1 text-[9px] font-black uppercase tracking-[0.12em] text-white/35">
                          {player.isStarter && <span>Starter</span>}
                          {player.isCaptain && <span>Captain</span>}
                          {recentActionKey.startsWith(`${player.id}:`) && recentActionLabel ? (
                            <span className="rounded-full bg-[#f5c849] px-2 py-0.5 text-[9px] text-black">
                              {recentActionLabel}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center"><PlayerStatus player={player} /></td>
                  <td className="px-3 py-3 text-center text-sm font-black">{player.points}</td>
                  <td className="px-3 py-3 text-center text-sm font-bold text-white/70">{player.rebounds}</td>
                  <td className="px-3 py-3 text-center text-sm font-bold text-white/70">{player.assists}</td>
                  <td className="px-3 py-3 text-center text-sm font-black text-[#f5c849]">{player.fouls}</td>
                  <td className="px-3 py-3 text-center text-sm font-bold text-white/70">{player.steals}</td>
                  <td className="px-3 py-3 text-center text-sm font-bold text-white/70">{player.blocks}</td>
                  <td className="px-3 py-3">
                    <div className="grid grid-cols-5 gap-2 xl:grid-cols-10">
                      {LIVE_PLAYER_INLINE_ACTIONS.map((action) => {
                        const key = `${player.id}:${action.id}`
                        return (
                          <ActionButton
                            key={action.id}
                            action={action}
                            active={recentActionKey === key}
                            disabled={actionsDisabled}
                            onClick={() => {
                              if (actionsDisabled) return
                              onSelectAthlete?.(player.athleteId)
                              flashAction(player.id, action.id, action.label)
                              onPlayerAction?.(player, action)
                            }}
                          />
                        )
                      })}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
