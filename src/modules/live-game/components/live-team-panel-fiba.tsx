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
      className={`h-6 min-w-[28px] rounded-md border px-2 text-[10px] font-black uppercase tracking-[0.12em] transition disabled:cursor-not-allowed disabled:opacity-35 ${colorClass}`}
    >
      {label}
    </button>
  )
}

function PlayerRow({
  player,
  selected,
  onSelect,
  onAction,
}: {
  player: LiveTablePlayer
  selected: boolean
  onSelect: () => void
  onAction: (action: PlayerActionKey) => void
}) {
  const inTrouble = player.fouls >= 3
  const canOperate = player.isAvailable && !player.disqualified

  return (
    <div
      className={`w-full rounded-[14px] border px-3 py-3 text-left transition ${
        selected
          ? 'border-[#ffd76c]/40 bg-white/10 shadow-[0_10px_24px_rgba(0,0,0,0.18)]'
          : 'border-white/8 bg-white/[0.04] hover:border-white/18 hover:bg-white/[0.06]'
      }`}
    >
      <button type="button" onClick={onSelect} className="w-full text-left">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-[11px] font-black text-white">
            {player.jerseyNumber ?? '--'}
          </div>

          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-white">
              {player.name}
            </div>
            <div className="mt-1 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.18em] text-white/40">
              <span>{player.isOnCourt ? 'Em quadra' : 'Banco'}</span>
              {player.isStarter && <span>Titular</span>}
              {player.isCaptain && <span>Capitao</span>}
              {!player.isAvailable && <span>Indisponivel</span>}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-1 text-[10px] font-black uppercase tracking-[0.12em] text-white/65">
            <span className="rounded bg-white/8 px-2 py-1 text-center text-[#ffd76c]">{player.points}P</span>
            <span className="rounded bg-white/8 px-2 py-1 text-center">{player.rebounds}R</span>
            <span className="rounded bg-white/8 px-2 py-1 text-center">{player.assists}A</span>
            <span
              className={`rounded px-2 py-1 text-center ${
                player.disqualified
                  ? 'bg-[#7c1f2f] text-[#ffb0bf]'
                  : inTrouble
                    ? 'bg-[#604215] text-[#ffd76c]'
                    : 'bg-white/8'
              }`}
            >
              {player.fouls}F
            </span>
          </div>
        </div>
      </button>

      <div className="mt-3 flex flex-wrap gap-2">
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
  const onCourt = team.players.filter((player) => player.isOnCourt)
  const bench = team.players.filter((player) => !player.isOnCourt)

  return (
    <div className="rounded-[18px] border border-white/8 bg-white/[0.04] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.35em] text-white/45">
            {team.side === 'home' ? 'Mandante' : 'Visitante'}
          </div>
          <h3 className="mt-2 text-[26px] font-black uppercase tracking-[0.08em] text-white">
            {team.name}
          </h3>
          <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-white/35">
            {team.coachName}
          </p>
        </div>
        <div className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-white/65">
          {team.players.length} atletas
        </div>
      </div>

      <div className="mt-4 grid gap-2 text-[10px] uppercase tracking-[0.18em] text-white/35 sm:grid-cols-2">
        <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2">
          Em quadra · {onCourt.length}
        </div>
        <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2">
          Banco · {bench.length}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {team.players.map((player) => (
          <PlayerRow
            key={player.id}
            player={player}
            selected={selectedAthleteId === player.athleteId}
            onSelect={() => onSelectAthlete(player.athleteId)}
            onAction={(action) => onPlayerAction(player, action)}
          />
        ))}
        {team.players.length === 0 && (
          <div className="rounded-[14px] border border-dashed border-white/10 bg-white/[0.03] px-4 py-6 text-sm text-white/40">
            Sem roster carregado para esta equipe.
          </div>
        )}
      </div>
    </div>
  )
}
