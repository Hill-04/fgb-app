import type { LiveGameTableModel } from './live-game-table-adapter'

export function LiveBoxscoreFiba({ table }: { table: LiveGameTableModel }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        {[table.home, table.away].map((team) => (
          <div
            key={team.id}
            className="rounded-[18px] border border-white/8 bg-white/[0.04] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.18)]"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.35em] text-white/45">
                  {team.side === 'home' ? 'Mandante' : 'Visitante'}
                </div>
                <h3 className="mt-2 text-[24px] font-black uppercase tracking-[0.08em] text-white">
                  {team.shortName}
                </h3>
              </div>
              <div className="text-[44px] font-black leading-none text-white">{team.score}</div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-3">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">Faltas</div>
                <div className="mt-1 text-lg font-black text-white">{team.fouls}</div>
              </div>
              <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-3">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">TO Usados</div>
                <div className="mt-1 text-lg font-black text-white">{team.timeoutsUsed}</div>
              </div>
              <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-3">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">Atletas</div>
                <div className="mt-1 text-lg font-black text-white">{team.players.length}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-[18px] border border-white/8 bg-white/[0.04] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.35em] text-white/45">
              Box score
            </div>
            <h3 className="mt-2 text-[24px] font-black uppercase tracking-[0.08em] text-white">
              Lideres da partida
            </h3>
          </div>
          <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-white/65">
            {table.boxRows.length} linhas
          </span>
        </div>

        <div className="mt-4 overflow-hidden rounded-[16px] border border-white/8">
          <div className="grid grid-cols-[1.4fr_1fr_repeat(4,minmax(0,0.7fr))] gap-2 bg-white/6 px-4 py-3 text-[10px] font-black uppercase tracking-[0.24em] text-white/45">
            <span>Atleta</span>
            <span>Equipe</span>
            <span className="text-center">Pts</span>
            <span className="text-center">Reb</span>
            <span className="text-center">Ast</span>
            <span className="text-center">F</span>
          </div>
          <div className="divide-y divide-white/6">
            {table.boxRows.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-[1.4fr_1fr_repeat(4,minmax(0,0.7fr))] gap-2 px-4 py-3 text-sm text-white/80"
              >
                <span className="truncate font-semibold text-white">{row.athleteName}</span>
                <span className="truncate text-white/55">{row.teamName}</span>
                <span className="text-center font-black text-[#ffe28a]">{row.points}</span>
                <span className="text-center">{row.rebounds}</span>
                <span className="text-center">{row.assists}</span>
                <span className="text-center">{row.fouls}</span>
              </div>
            ))}
            {table.boxRows.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-white/40">
                O box score vai aparecer aqui conforme os eventos forem consolidando a partida.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
