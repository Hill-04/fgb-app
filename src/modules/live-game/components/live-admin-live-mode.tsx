'use client'

import Link from 'next/link'
import { LiveBoxscoreFiba } from './live-boxscore-fiba'
import { LiveEventLogFiba } from './live-event-log-fiba'
import { LiveScoreboardFiba } from './live-scoreboard-fiba'
import { LiveTeamPanelFiba } from './live-team-panel-fiba'
import type {
  LiveGameTableModel,
  LiveTablePlayer,
  LiveTableTab,
  LiveTableTeam,
} from './live-game-table-adapter'
import { QUICK_EVENTS, type LiveAdminHandlers, type LiveAdminSelectionActions, type LiveAdminSelectionState } from '../types/live-admin'

type LiveAdminLiveModeProps = {
  data: any
  gameId: string
  tableModel: LiveGameTableModel
  selectedTeam: LiveTableTeam | null
  selectedAthlete: LiveTablePlayer | null
  isSyncing: boolean
  selection: LiveAdminSelectionState
  selectionActions: LiveAdminSelectionActions
  handlers: LiveAdminHandlers
}

function LiveAdminTeamTabs({
  tableModel,
  selectedAthleteId,
  activeTab,
  onTabChange,
  onSelectHomeAthlete,
  onSelectAwayAthlete,
  onPlayerQuickAction,
}: {
  tableModel: LiveGameTableModel
  selectedAthleteId: string
  activeTab: LiveTableTab
  onTabChange: (tab: LiveTableTab) => void
  onSelectHomeAthlete: (athleteId: string) => void
  onSelectAwayAthlete: (athleteId: string) => void
  onPlayerQuickAction: (teamId: string, player: LiveTablePlayer, action: Parameters<LiveAdminHandlers['handlePlayerQuickAction']>[2]) => void
}) {
  return (
    <div className="overflow-hidden rounded-[14px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] shadow-[0_20px_48px_rgba(4,10,22,0.28)]">
      <div className="flex gap-1.5 px-2 pt-2">
        {[
          ['home', tableModel.home.shortName],
          ['away', tableModel.away.shortName],
          ['log', 'Log'],
          ['box', 'Boxscore'],
        ].map(([tabId, label]) => (
          <button
            key={tabId}
            type="button"
            onClick={() => onTabChange(tabId as LiveTableTab)}
            className={`flex-1 rounded-t-[8px] border-b-2 px-2 py-2 text-[12px] font-bold uppercase tracking-[0.04em] transition ${
              activeTab === tabId
                ? 'border-b-[#f5c849] bg-white/10 text-[#f5c849]'
                : 'border-b-transparent bg-white/[0.03] text-white/50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'home' && (
        <LiveTeamPanelFiba
          team={tableModel.home}
          selectedAthleteId={selectedAthleteId}
          onSelectAthlete={onSelectHomeAthlete}
          onPlayerAction={(player, action) => onPlayerQuickAction(tableModel.home.id, player, action)}
        />
      )}

      {activeTab === 'away' && (
        <LiveTeamPanelFiba
          team={tableModel.away}
          selectedAthleteId={selectedAthleteId}
          onSelectAthlete={onSelectAwayAthlete}
          onPlayerAction={(player, action) => onPlayerQuickAction(tableModel.away.id, player, action)}
        />
      )}

      {activeTab === 'log' && <LiveEventLogFiba events={tableModel.events} />}
      {activeTab === 'box' && <LiveBoxscoreFiba table={tableModel} />}
    </div>
  )
}

function LiveAdminSelectionPanel({
  tableModel,
  selectedTeam,
  selectedAthlete,
  selection,
  selectionActions,
}: {
  tableModel: LiveGameTableModel
  selectedTeam: LiveTableTeam | null
  selectedAthlete: LiveTablePlayer | null
  selection: LiveAdminSelectionState
  selectionActions: LiveAdminSelectionActions
}) {
  return (
    <div className="rounded-[14px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))] p-4 text-white shadow-[0_18px_40px_rgba(0,0,0,0.2)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.24em] text-white/40">Selecao atual</div>
          <div className="mt-2 text-[22px] font-black uppercase tracking-[0.05em] text-white">
            {selectedAthlete?.name || 'Nenhum atleta selecionado'}
          </div>
          <div className="mt-1 text-sm text-white/45">
            {selectedTeam?.name || 'Equipe'} - camisa {selectedAthlete?.jerseyNumber ?? '--'}
          </div>
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-white/55">
          fallback
        </span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <select
          value={selection.selectedTeamId}
          onChange={(event) => {
            selectionActions.setSelectedTeamId(event.target.value)
            selectionActions.setSelectedAthleteId('')
          }}
          className="h-11 rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none"
        >
          <option value="" className="text-black">Equipe</option>
          <option value={tableModel.home.id} className="text-black">{tableModel.home.name}</option>
          <option value={tableModel.away.id} className="text-black">{tableModel.away.name}</option>
        </select>
        <select
          value={selection.selectedAthleteId}
          onChange={(event) => selectionActions.setSelectedAthleteId(event.target.value)}
          className="h-11 rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none"
        >
          <option value="" className="text-black">Atleta</option>
          {(selectedTeam?.players || []).map((player) => (
            <option key={player.id} value={player.athleteId} className="text-black">
              {player.jerseyNumber ?? '--'} - {player.name}
            </option>
          ))}
        </select>
        <input
          value={selection.clockTime}
          onChange={(event) => selectionActions.setClockTime(event.target.value)}
          className="h-11 rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none"
        />
        <input
          type="number"
          min={1}
          value={selection.selectedPeriod}
          onChange={(event) => selectionActions.setSelectedPeriod(Number(event.target.value) || 1)}
          className="h-11 rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none"
        />
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2">
        {[
          ['Pts', selectedAthlete?.points ?? 0],
          ['Reb', selectedAthlete?.rebounds ?? 0],
          ['Ast', selectedAthlete?.assists ?? 0],
          ['Faltas', selectedAthlete?.fouls ?? 0],
        ].map(([label, value]) => (
          <div key={label} className="rounded-[10px] bg-white/8 px-3 py-3 text-center">
            <div className="text-[9px] uppercase tracking-[0.18em] text-white/40">{label}</div>
            <div className="mt-1 text-lg font-black text-white">{value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function LiveAdminAuxiliaryConsole({
  data,
  gameId,
  selection,
  handlers,
}: {
  data: any
  gameId: string
  selection: LiveAdminSelectionState
  handlers: LiveAdminHandlers
}) {
  return (
    <div className="rounded-[14px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))] p-4 text-white shadow-[0_18px_40px_rgba(0,0,0,0.2)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.24em] text-white/40">Console auxiliar</div>
          <div className="mt-2 text-[22px] font-black uppercase tracking-[0.05em] text-white">
            Mesa manual e publicacao
          </div>
        </div>
        <button
          onClick={async () => {
            const last = [...(data.events || [])].reverse().find((event: any) => !event.isReverted && !event.isOptimistic)
            if (!last) return
            await handlers.doLiveActionDirect('revert-event', { eventId: last.id, reason: 'Desfazer rapido da mesa' })
          }}
          className="rounded-lg border border-white/10 bg-white/8 px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-white"
        >
          Desfazer ultimo
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {QUICK_EVENTS.filter(([_, eventType]) => !['TIMEOUT_CONFIRMED'].includes(eventType)).map(([label, eventType, pointsDelta]) => (
          <button
            key={label}
            onClick={() =>
              handlers.enqueueLiveEvent({
                eventType,
                pointsDelta,
                teamId: selection.selectedTeamId || null,
                athleteId: selection.selectedAthleteId || null,
                period: selection.selectedPeriod,
                clockTime: selection.clockTime,
              })
            }
            className="rounded-[10px] border border-white/10 bg-white/8 px-3 py-3 text-[11px] font-black uppercase tracking-[0.12em] text-white transition hover:bg-white/12"
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          onClick={() => handlers.doLiveActionDirect('publish')}
          className="rounded-lg bg-[var(--verde)] px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white"
        >
          Publicar no site
        </button>
        <Link
          href={`/games/${gameId}/live`}
          className="rounded-lg border border-white/10 bg-white/6 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white"
        >
          Ver publico
        </Link>
      </div>
    </div>
  )
}

export function LiveAdminLiveMode({
  data,
  gameId,
  tableModel,
  selectedTeam,
  selectedAthlete,
  isSyncing,
  selection,
  selectionActions,
  handlers,
}: LiveAdminLiveModeProps) {
  return (
    <div className="space-y-5">
      <LiveScoreboardFiba
        table={tableModel}
        clockDisplay={data.game.clockDisplay || selection.clockTime}
        visualShotClock={selection.visualShotClock}
        isSyncing={isSyncing}
        onResetShotClock={(value) => selectionActions.setVisualShotClock(value)}
        onTimeout={handlers.handleTimeoutFromSide}
        onControlEvent={handlers.handleControlEvent}
      />

      <LiveAdminTeamTabs
        tableModel={tableModel}
        selectedAthleteId={selection.selectedAthleteId}
        activeTab={selection.activeTab}
        onTabChange={selectionActions.setActiveTab}
        onSelectHomeAthlete={(athleteId) => {
          selectionActions.setSelectedTeamId(tableModel.home.id)
          selectionActions.setSelectedAthleteId(athleteId)
        }}
        onSelectAwayAthlete={(athleteId) => {
          selectionActions.setSelectedTeamId(tableModel.away.id)
          selectionActions.setSelectedAthleteId(athleteId)
        }}
        onPlayerQuickAction={handlers.handlePlayerQuickAction}
      />

      <div className="grid gap-3 xl:grid-cols-[1.05fr_0.95fr]">
        <LiveAdminSelectionPanel
          tableModel={tableModel}
          selectedTeam={selectedTeam}
          selectedAthlete={selectedAthlete}
          selection={selection}
          selectionActions={selectionActions}
        />
        <LiveAdminAuxiliaryConsole data={data} gameId={gameId} selection={selection} handlers={handlers} />
      </div>
    </div>
  )
}
