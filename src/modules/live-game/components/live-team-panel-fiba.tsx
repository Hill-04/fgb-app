import type { LiveTablePlayer, LiveTableTeam } from './live-game-table-adapter'

type PlayerActionKey = '2pts' | '3pts' | 'ft' | 'foul' | 'reb' | 'ast' | 'sub'

type LiveTeamPanelFibaProps = {
  team: LiveTableTeam
  selectedAthleteId: string
  onSelectAthlete: (athleteId: string) => void
  onPlayerAction: (player: LiveTablePlayer, action: PlayerActionKey) => void
}

function ActionButton({
  label,
  colorClass,
  onClick,
  disabled = false,
}: {
  label: string
  colorClass: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`h-[22px] w-[28px] rounded-[4px] border text-[10px] font-black transition disabled:cursor-not-allowed disabled:opacity-35 ${colorClass}`}
    >
      {label}
    </button>
  )
}

function PlayerRow({
  player,
  selected,
  teamTone,
  onSelect,
  onAction,
}: {
  player: LiveTablePlayer
  selected: boolean
  teamTone: 'home' | 'away'
  onSelect: () => void
  onAction: (action: PlayerActionKey) => void
}) {
  const inTrouble = player.fouls >= 3
  const canOperate = player.isAvailable && !player.disqualified

  return (
    <div
      className={`rounded-[8px] px-2 py-2 transition ${
        player.disqualified
          ? 'bg-red-500/10 opacity-60'
          : player.isOnCourt
            ? 'border border-white/12 bg-white/8'
            : 'bg-white/[0.03]'
      } ${selected ? 'ring-1 ring-[#f5c849]' : ''}`}
    >
      <div className="flex items-center gap-2">
        <div
          className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[4px] text-[11px] font-extrabold text-white ${
            teamTone === 'home' ? 'bg-[#0e3f80]' : 'bg-[#9f2437]'
          }`}
        >
          {player.jerseyNumber ?? '--'}
        </div>

        <button type="button" onClick={onSelect} className="min-w-0 flex-1 text-left">
          <div className={`truncate text-[12px] font-semibold ${player.isOnCourt ? 'text-white' : 'text-white/55'}`}>
            {player.name}
          </div>
          <div className="text-[10px] text-white/30">
            {player.isOnCourt ? 'Em quadra' : 'Banco'}
          </div>
        </button>

        <div className="flex items-center gap-1 text-[10px] font-black uppercase text-white/55">
          <span className={`rounded px-1.5 py-0.5 ${player.points > 0 ? 'bg-white/10 text-[#f5c849]' : 'bg-white/6'}`}>{player.points}P</span>
          <span className="rounded bg-white/6 px-1.5 py-0.5">{player.rebounds}R</span>
          <span className="rounded bg-white/6 px-1.5 py-0.5">{player.assists}A</span>
          <span className={`rounded px-1.5 py-0.5 ${player.disqualified ? 'bg-[#7c1f2f] text-[#ffb0bf]' : inTrouble ? 'bg-[#604215] text-[#ffd76c]' : 'bg-white/6'}`}>
            {player.fouls}F
          </span>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-1">
        {player.isOnCourt && (
          <>
            <ActionButton label="+2" colorClass="border-[#2ecc71]/40 bg-[#2ecc71]/12 text-[#8ff0b6]" onClick={() => onAction('2pts')} disabled={!canOperate} />
            <ActionButton label="+3" colorClass="border-[#3498db]/40 bg-[#3498db]/12 text-[#9fd6ff]" onClick={() => onAction('3pts')} disabled={!canOperate} />
            <ActionButton label="LL" colorClass="border-[#a56ee8]/40 bg-[#a56ee8]/12 text-[#d6bcff]" onClick={() => onAction('ft')} disabled={!canOperate} />
            <ActionButton label="F" colorClass="border-[#f39c12]/40 bg-[#f39c12]/12 text-[#ffd28a]" onClick={() => onAction('foul')} disabled={!canOperate} />
            <ActionButton label="R" colorClass="border-[#1abc9c]/40 bg-[#1abc9c]/12 text-[#9df1e0]" onClick={() => onAction('reb')} disabled={!canOperate} />
            <ActionButton label="A" colorClass="border-[#f1c40f]/40 bg-[#f1c40f]/12 text-[#ffe28a]" onClick={() => onAction('ast')} disabled={!canOperate} />
          </>
        )}
        <ActionButton
          label={player.isOnCourt ? '↓' : '↑'}
          colorClass={player.isOnCourt ? 'border-[#e74c3c]/40 bg-[#e74c3c]/12 text-[#ffae9f]' : 'border-[#27ae60]/40 bg-[#27ae60]/12 text-[#8ee1ad]'}
          onClick={() => onAction('sub')}
          disabled={!canOperate}
        />
      </div>
    </div>
  )
}

export function LiveTeamPanelFiba({
  team,
  selectedAthleteId,
  onSelectAthlete,
  onPlayerAction,
}: LiveTeamPanelFibaProps) {
  const teamTone = team.side === 'home' ? 'home' : 'away'

  return (
    <div className="rounded-b-[14px] border border-t-0 border-white/8 bg-white/[0.04] p-3">
      <div className="mb-3 text-[11px] uppercase tracking-[0.1em] text-white/45">
        JOGADORES — EM QUADRA
        <span className="ml-2 text-white/25">
          clique nas ações: +2 +3 LL = pontos | F = falta | R = rebote | A = assistência | ↑↓ = substituição
        </span>
      </div>

      <div className="grid gap-2 lg:grid-cols-2">
        {team.players.map((player) => (
          <PlayerRow
            key={player.id}
            player={player}
            selected={selectedAthleteId === player.athleteId}
            teamTone={teamTone}
            onSelect={() => onSelectAthlete(player.athleteId)}
            onAction={(action) => onPlayerAction(player, action)}
          />
        ))}
      </div>

      {team.players.length === 0 && (
        <div className="rounded-[8px] border border-dashed border-white/10 bg-white/[0.03] px-4 py-6 text-sm text-white/40">
          Sem roster carregado para esta equipe.
        </div>
      )}
    </div>
  )
}
