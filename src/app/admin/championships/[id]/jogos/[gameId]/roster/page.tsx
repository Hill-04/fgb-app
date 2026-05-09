import { notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

async function saveEscalacao(formData: FormData) {
  'use server'
  const gameId         = String(formData.get('gameId')         || '').trim()
  const championshipId = String(formData.get('championshipId') || '').trim()
  const homeTeamId     = String(formData.get('homeTeamId')     || '').trim()
  const awayTeamId     = String(formData.get('awayTeamId')     || '').trim()
  if (!gameId) return

  const homeCoach     = String(formData.get('homeCoach')     || '').trim() || null
  const homeAsstCoach = String(formData.get('homeAsstCoach') || '').trim() || null
  const awayCoach     = String(formData.get('awayCoach')     || '').trim() || null
  const awayAsstCoach = String(formData.get('awayAsstCoach') || '').trim() || null

  for (const [teamId, coach, asstCoach, prefix] of [
    [homeTeamId, homeCoach, homeAsstCoach, 'home'],
    [awayTeamId, awayCoach, awayAsstCoach, 'away'],
  ] as [string, string | null, string | null, string][]) {
    if (!teamId) continue

    const selected: { athleteId: string; jerseyNumber: number }[] = []
    for (const [key, value] of formData.entries()) {
      if (key.startsWith(`${prefix}_athlete_`) && value === 'on') {
        const athleteId   = key.slice(`${prefix}_athlete_`.length)
        const jerseyRaw   = formData.get(`${prefix}_jersey_${athleteId}`)
        const jerseyNumber = jerseyRaw !== null && jerseyRaw !== '' ? Math.max(0, Number(jerseyRaw)) : 0
        selected.push({ athleteId, jerseyNumber })
      }
    }

    const roster = await prisma.gameRoster.upsert({
      where:  { gameId_teamId: { gameId, teamId } },
      create: { gameId, teamId, coachName: coach, assistantCoachName: asstCoach },
      update: { coachName: coach, assistantCoachName: asstCoach },
    })

    await prisma.gameRosterPlayer.deleteMany({ where: { gameRosterId: roster.id } })
    if (selected.length > 0) {
      await prisma.gameRosterPlayer.createMany({
        data: selected.map(s => ({
          gameRosterId: roster.id,
          athleteId:    s.athleteId,
          jerseyNumber: s.jerseyNumber,
        })),
      })
    }
  }

  if (championshipId) {
    revalidatePath(`/admin/championships/${championshipId}/jogos/${gameId}`)
    revalidatePath(`/admin/championships/${championshipId}/jogos/${gameId}/roster`)
  }
}

export default async function RosterPage({
  params,
}: {
  params: Promise<{ id: string; gameId: string }>
}) {
  const { id: championshipId, gameId } = await params

  const game = await prisma.game.findFirst({
    where: { id: gameId, championshipId },
    include: {
      homeTeam: { select: { id: true, name: true } },
      awayTeam: { select: { id: true, name: true } },
      rosters: {
        include: {
          players: { select: { athleteId: true, jerseyNumber: true } },
        },
      },
    },
  })
  if (!game) notFound()

  const [homeAthletes, awayAthletes] = await Promise.all([
    prisma.athlete.findMany({
      where:   { teamId: game.homeTeamId, status: { not: 'INACTIVE' } },
      orderBy: { jerseyNumber: 'asc' },
      select:  { id: true, name: true, jerseyNumber: true, position: true },
    }),
    prisma.athlete.findMany({
      where:   { teamId: game.awayTeamId, status: { not: 'INACTIVE' } },
      orderBy: { jerseyNumber: 'asc' },
      select:  { id: true, name: true, jerseyNumber: true, position: true },
    }),
  ])

  const homeRoster    = game.rosters.find(r => r.teamId === game.homeTeamId)
  const awayRoster    = game.rosters.find(r => r.teamId === game.awayTeamId)
  const homeSelected  = new Map<string, number>(homeRoster?.players.map(p => [p.athleteId, p.jerseyNumber ?? 0]) ?? [])
  const awaySelected  = new Map<string, number>(awayRoster?.players.map(p => [p.athleteId, p.jerseyNumber ?? 0]) ?? [])

  const inputCls = 'h-9 rounded-xl border border-[var(--border)] bg-white px-3 text-sm w-full'

  return (
    <div className="max-w-5xl space-y-6 pb-12">
      <div>
        <h1 className="fgb-display text-3xl text-[var(--black)]">Escalação</h1>
        <p className="fgb-label text-[var(--gray)] mt-1" style={{ textTransform: 'none', letterSpacing: 0 }}>
          Selecione os atletas que vão jogar e informe técnico e assistente.
        </p>
      </div>

      <form action={saveEscalacao}>
        <input type="hidden" name="gameId"         value={gameId} />
        <input type="hidden" name="championshipId" value={championshipId} />
        <input type="hidden" name="homeTeamId"     value={game.homeTeamId} />
        <input type="hidden" name="awayTeamId"     value={game.awayTeamId} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Home team */}
          <TeamSection
            prefix="home"
            teamName={game.homeTeam.name}
            athletes={homeAthletes}
            selectedMap={homeSelected}
            coachDefault={homeRoster?.coachName ?? ''}
            asstDefault={homeRoster?.assistantCoachName ?? ''}
            inputCls={inputCls}
          />

          {/* Away team */}
          <TeamSection
            prefix="away"
            teamName={game.awayTeam.name}
            athletes={awayAthletes}
            selectedMap={awaySelected}
            coachDefault={awayRoster?.coachName ?? ''}
            asstDefault={awayRoster?.assistantCoachName ?? ''}
            inputCls={inputCls}
          />
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button type="submit" className="fgb-btn-primary h-10 px-6 rounded-xl">
            Salvar Escalação
          </button>
          <a
            href={`/admin/championships/${championshipId}/jogos/${gameId}`}
            className="fgb-btn-secondary h-10 px-5 rounded-xl flex items-center text-sm"
          >
            Voltar
          </a>
        </div>
      </form>
    </div>
  )
}

function TeamSection({
  prefix,
  teamName,
  athletes,
  selectedMap,
  coachDefault,
  asstDefault,
  inputCls,
}: {
  prefix: string
  teamName: string
  athletes: { id: string; name: string; jerseyNumber: number | null; position: string | null }[]
  selectedMap: Map<string, number>
  coachDefault: string
  asstDefault: string
  inputCls: string
}) {
  return (
    <div className="fgb-card overflow-hidden">
      {/* Team header */}
      <div className="px-5 py-3 bg-[var(--verde)] ">
        <p className="text-sm font-black text-white uppercase tracking-wide">{teamName}</p>
        <p className="text-[10px] text-white/70">{selectedMap.size} atleta{selectedMap.size !== 1 ? 's' : ''} escalado{selectedMap.size !== 1 ? 's' : ''}</p>
      </div>

      <div className="p-4 space-y-3">
        {/* Coach inputs */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="fgb-label text-[var(--gray)] mb-1 block" style={{ fontSize: 9 }}>Técnico</label>
            <input
              name={`${prefix}Coach`}
              defaultValue={coachDefault}
              placeholder="Nome do técnico"
              className={inputCls}
            />
          </div>
          <div>
            <label className="fgb-label text-[var(--gray)] mb-1 block" style={{ fontSize: 9 }}>Ass. Técnico</label>
            <input
              name={`${prefix}AsstCoach`}
              defaultValue={asstDefault}
              placeholder="Assistente"
              className={inputCls}
            />
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[var(--border)] pt-3">
          <div className="grid grid-cols-[auto_1fr_auto_70px] gap-x-3 gap-y-0 px-1 mb-2">
            <span className="text-[9px] font-black uppercase text-[var(--gray)] tracking-widest">✓</span>
            <span className="text-[9px] font-black uppercase text-[var(--gray)] tracking-widest">Atleta</span>
            <span className="text-[9px] font-black uppercase text-[var(--gray)] tracking-widest">Pos.</span>
            <span className="text-[9px] font-black uppercase text-[var(--gray)] tracking-widest text-right">#</span>
          </div>

          {athletes.length === 0 ? (
            <p className="text-sm text-[var(--gray)] py-4 text-center">
              Nenhum atleta cadastrado neste time.
            </p>
          ) : (
            <div className="space-y-1">
              {athletes.map(athlete => {
                const isSelected   = selectedMap.has(athlete.id)
                const jerseyInGame = selectedMap.get(athlete.id) ?? athlete.jerseyNumber ?? 0
                return (
                  <label
                    key={athlete.id}
                    className={`grid grid-cols-[auto_1fr_auto_70px] gap-x-3 items-center px-2 py-1.5 rounded-xl cursor-pointer transition-colors ${
                      isSelected ? 'bg-[var(--verde)]/8 border border-[var(--verde)]/20' : 'hover:bg-[var(--gray-l)]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      name={`${prefix}_athlete_${athlete.id}`}
                      defaultChecked={isSelected}
                      className="accent-[var(--verde)] w-4 h-4"
                    />
                    <span className="text-sm font-bold text-[var(--black)] truncate">{athlete.name}</span>
                    <span className="text-[10px] text-[var(--gray)] uppercase">{athlete.position ?? '—'}</span>
                    <input
                      type="number"
                      name={`${prefix}_jersey_${athlete.id}`}
                      defaultValue={jerseyInGame}
                      min={0}
                      max={99}
                      className="h-7 rounded-lg border border-[var(--border)] bg-white px-2 text-xs text-center w-full"
                    />
                  </label>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
