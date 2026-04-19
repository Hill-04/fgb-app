'use client'

import { useState } from 'react'
import type { LiveTablePlayer, LiveTableTeam } from './live-game-table-adapter'

type PlayerActionKey = '2pts' | '3pts' | 'ft' | 'foul' | 'reb' | 'ast' | 'sub'

type LiveTeamPanelFibaProps = {
  team: LiveTableTeam
  selectedAthleteId: string
  onSelectAthlete: (athleteId: string) => void
  onPlayerAction: (player: LiveTablePlayer, action: PlayerActionKey) => void
}

const FGB = {
  verde:    '#1B7340',
  vermelho: '#CC1016',
  amarelo:  '#F5C200',
}

function ActionBtn({ label, color, onClick, disabled = false }: {
  label: string; color: string; onClick: () => void; disabled?: boolean
}) {
  const [flash, setFlash] = useState(false)
  const handle = () => {
    if (disabled) return
    setFlash(true)
    setTimeout(() => setFlash(false), 150)
    onClick()
  }
  return (
    <button onClick={handle} disabled={disabled} style={{
      width: 28, height: 24, borderRadius: 4,
      background: flash ? '#FFFFFF' : `${color}33`,
      color: flash ? color : color,
      fontSize: 10, fontWeight: 800, cursor: disabled ? 'not-allowed' : 'pointer',
      border: `1px solid ${color}66`,
      transition: 'background .1s, transform .1s',
      transform: flash ? 'scale(0.88)' : 'scale(1)',
      fontFamily: "'Barlow Condensed', 'Oswald', sans-serif",
      opacity: disabled ? 0.3 : 1,
    }}>
      {label}
    </button>
  )
}

function PlayerRow({
  player, selected, jerseyBg, onSelect, onAction,
}: {
  player: LiveTablePlayer
  selected: boolean
  jerseyBg: string
  onSelect: () => void
  onAction: (action: PlayerActionKey) => void
}) {
  const inTrouble = player.fouls >= 3 && !player.disqualified
  const canAct = player.isAvailable && !player.disqualified

  return (
    <div style={{
      borderRadius: 8, padding: '7px 8px', marginBottom: 4,
      background: player.disqualified
        ? 'rgba(255,0,0,.06)'
        : player.isOnCourt
          ? 'rgba(255,255,255,.08)'
          : 'rgba(255,255,255,.03)',
      border: selected
        ? `1px solid ${FGB.amarelo}`
        : player.isOnCourt
          ? '1px solid rgba(255,255,255,.12)'
          : '1px solid transparent',
      opacity: player.disqualified ? 0.5 : 1,
      transition: 'all .15s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Jersey */}
        <div style={{
          width: 30, height: 30, borderRadius: 5, background: jerseyBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 900, color: '#FFF', flexShrink: 0,
          fontFamily: "'Barlow Condensed', 'Oswald', sans-serif",
        }}>
          {player.jerseyNumber ?? '--'}
        </div>

        {/* Nome */}
        <button onClick={onSelect} style={{
          flex: 1, minWidth: 0, textAlign: 'left', background: 'none',
          border: 'none', padding: 0, cursor: 'pointer',
        }}>
          <div style={{
            fontSize: 12, fontWeight: 600,
            color: player.isOnCourt ? '#FFF' : 'rgba(255,255,255,.5)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {player.name}
            {player.isCaptain && <span style={{ marginLeft: 4, fontSize: 9, color: FGB.amarelo }}>(C)</span>}
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,.3)' }}>
            {player.isOnCourt ? 'Em quadra' : 'Banco'}
          </div>
        </button>

        {/* Mini stats */}
        <div style={{ display: 'flex', gap: 3, fontSize: 10, fontFamily: "'Barlow Condensed', sans-serif" }}>
          <span style={{
            background: player.points > 0 ? 'rgba(245,194,0,.2)' : 'rgba(255,255,255,.06)',
            color: player.points > 0 ? FGB.amarelo : 'rgba(255,255,255,.5)',
            padding: '1px 5px', borderRadius: 3, fontWeight: player.points > 0 ? 700 : 400,
          }}>{player.points}P</span>
          <span style={{ background: 'rgba(255,255,255,.06)', color: 'rgba(255,255,255,.5)', padding: '1px 5px', borderRadius: 3 }}>{player.rebounds}R</span>
          <span style={{ background: 'rgba(255,255,255,.06)', color: 'rgba(255,255,255,.5)', padding: '1px 5px', borderRadius: 3 }}>{player.assists}A</span>
          <span style={{
            background: player.disqualified ? 'rgba(255,0,0,.2)' : inTrouble ? 'rgba(245,194,0,.2)' : 'rgba(255,255,255,.06)',
            color: player.disqualified ? '#FF4444' : inTrouble ? FGB.amarelo : 'rgba(255,255,255,.5)',
            padding: '1px 5px', borderRadius: 3, fontWeight: inTrouble ? 700 : 400,
          }}>{player.fouls}F</span>
        </div>
      </div>

      {/* Ações */}
      {!player.disqualified && (
        <div style={{ display: 'flex', gap: 3, marginTop: 7, flexWrap: 'wrap' }}>
          {player.isOnCourt && <>
            <ActionBtn label="+2" color="#2ECC71" onClick={() => onAction('2pts')} disabled={!canAct} />
            <ActionBtn label="+3" color="#3498DB" onClick={() => onAction('3pts')} disabled={!canAct} />
            <ActionBtn label="LL" color="#9B59B6" onClick={() => onAction('ft')} disabled={!canAct} />
            <ActionBtn label="F" color="#E67E22" onClick={() => onAction('foul')} disabled={!canAct} />
            <ActionBtn label="R" color="#1ABC9C" onClick={() => onAction('reb')} disabled={!canAct} />
            <ActionBtn label="A" color="#F39C12" onClick={() => onAction('ast')} disabled={!canAct} />
          </>}
          <ActionBtn
            label={player.isOnCourt ? '↓' : '↑'}
            color={player.isOnCourt ? '#E74C3C' : '#27AE60'}
            onClick={() => onAction('sub')}
            disabled={!canAct}
          />
        </div>
      )}
      {player.disqualified && (
        <div style={{ marginTop: 4, fontSize: 10, color: '#FF4444', fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif" }}>
          ELIMINADO
        </div>
      )}
    </div>
  )
}

export function LiveTeamPanelFiba({
  team, selectedAthleteId, onSelectAthlete, onPlayerAction,
}: LiveTeamPanelFibaProps) {
  const jerseyBg = team.side === 'home' ? FGB.verde : FGB.vermelho
  const accentColor = team.side === 'home' ? '#7FD4A0' : '#FF9999'

  return (
    <div style={{
      borderRadius: '0 0 14px 14px',
      border: '1px solid rgba(255,255,255,.08)', borderTop: 'none',
      background: 'rgba(255,255,255,.04)', padding: 12,
    }}>
      <div style={{
        fontSize: 11, color: 'rgba(255,255,255,.4)', marginBottom: 10,
        fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1, textTransform: 'uppercase',
      }}>
        <span style={{ color: accentColor, fontWeight: 700 }}>{team.name}</span>
        <span style={{ marginLeft: 8, color: 'rgba(255,255,255,.25)', fontSize: 10 }}>
          clique nas ações: +2 +3 LL = pontos · F = falta · R = rebote · A = assist · ↑↓ = substituição
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
        {team.players.map(player => (
          <PlayerRow
            key={player.id}
            player={player}
            selected={selectedAthleteId === player.athleteId}
            jerseyBg={jerseyBg}
            onSelect={() => onSelectAthlete(player.athleteId)}
            onAction={action => onPlayerAction(player, action)}
          />
        ))}
      </div>

      {team.players.length === 0 && (
        <div style={{
          border: '1px dashed rgba(255,255,255,.1)', borderRadius: 8, padding: '24px 16px',
          textAlign: 'center', color: 'rgba(255,255,255,.3)', fontSize: 13,
        }}>
          Sem roster carregado.
        </div>
      )}
    </div>
  )
}
