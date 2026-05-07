'use client'

import type { LiveAdminHandlers } from '../types/live-admin'

type LiveAdminPregameModeProps = {
  data: any
  submitting: boolean
  handlers: LiveAdminHandlers
}

export function LiveAdminPregameMode({ data, submitting, handlers }: LiveAdminPregameModeProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <button onClick={() => handlers.doPregameAction('sync-rosters')} disabled={submitting} className="rounded-xl bg-[var(--verde)] px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white">Sincronizar rosters</button>
          <button onClick={() => handlers.doPregameAction('lock-rosters')} disabled={submitting} className="rounded-xl border border-[var(--border)] px-4 py-3 text-[10px] font-black uppercase tracking-widest text-[var(--black)]">Travar rosters</button>
          <button onClick={() => handlers.doPregameAction('open-session')} disabled={submitting} className="rounded-xl bg-[var(--black)] px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white">Abrir sessao</button>
          <button onClick={handlers.addOfficial} disabled={submitting} className="rounded-xl border border-[var(--border)] px-4 py-3 text-[10px] font-black uppercase tracking-widest text-[var(--black)]">Adicionar oficial</button>
        </div>
        <div className="mt-5 space-y-4">
          {(data.rosters || []).map((roster: any) => (
            <div key={roster.id} className="rounded-2xl border border-[var(--border)] bg-[var(--gray-l)] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-[var(--black)]">{roster.teamName}</h2>
                  <p className="text-sm text-[var(--gray)]">Coach: {roster.coachName || 'Nao definido'}</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-[9px] font-black uppercase tracking-widest text-[var(--gray)]">{roster.isLocked ? 'Travado' : 'Editavel'}</span>
              </div>
              <div className="mt-4 grid gap-2 md:grid-cols-2">
                {(roster.players || []).map((player: any) => (
                  <div key={player.id} className="rounded-xl border border-white bg-white px-3 py-3 text-sm text-[var(--black)]">
                    <div className="font-semibold">{player.jerseyNumber ?? '--'} - {player.athleteName}</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button onClick={() => handlers.updateRosterPlayer(player.id, { isStarter: !player.isStarter })} className="rounded-full bg-[var(--gray-l)] px-3 py-1 text-[9px] font-black uppercase tracking-widest text-[var(--black)]">{player.isStarter ? 'Titular' : 'Banco'}</button>
                      <button onClick={() => handlers.updateRosterPlayer(player.id, { isOnCourt: !player.isOnCourt })} className="rounded-full bg-[var(--gray-l)] px-3 py-1 text-[9px] font-black uppercase tracking-widest text-[var(--black)]">{player.isOnCourt ? 'Em quadra' : 'Fora'}</button>
                      <button onClick={() => handlers.updateRosterPlayer(player.id, { isAvailable: !player.isAvailable })} className="rounded-full bg-[var(--gray-l)] px-3 py-1 text-[9px] font-black uppercase tracking-widest text-[var(--black)]">{player.isAvailable ? 'Disponivel' : 'Indisponivel'}</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-sm">
        <h2 className="fgb-display text-2xl leading-none text-[var(--black)]">Checklist</h2>
        <div className="mt-5 space-y-3 text-sm text-[var(--black)]">
          <div className="rounded-2xl border border-[var(--border)] px-4 py-3">Rosters: {(data.rosters || []).length >= 2 ? 'OK' : 'Pendente'}</div>
          <div className="rounded-2xl border border-[var(--border)] px-4 py-3">Atletas: {(data.rosters || []).every((roster: any) => roster.players.length > 0) ? 'OK' : 'Pendente'}</div>
          <div className="rounded-2xl border border-[var(--border)] px-4 py-3">Sessao: {data.session ? 'Aberta' : 'Nao iniciada'}</div>
          <div className="rounded-2xl border border-[var(--border)] px-4 py-3">Oficiais: {(data.referees?.length || 0) + (data.officials?.length || 0) > 0 ? 'Definidos' : 'Pendente'}</div>
        </div>
      </div>
    </div>
  )
}
