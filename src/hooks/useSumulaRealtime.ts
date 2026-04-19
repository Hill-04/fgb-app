"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { createBrowserClient } from "@supabase/ssr"
import type { Sumula, SumulaEvent, PlayerOnGame, SumulaLocalState } from "@/types/sumula"
import { FIBA } from "@/types/sumula"

// Cliente sem tipo Database para as tabelas da súmula (ainda não geradas pelo Supabase CLI)
function createSumulaClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

function mapDbToSumula(row: Record<string, unknown>): Sumula {
  return {
    id: row.id as string,
    gameId: row.game_id as string,
    status: row.status as Sumula["status"],
    startedAt: row.started_at as string | undefined,
    finishedAt: row.finished_at as string | undefined,
    signedAt: row.signed_at as string | undefined,
    currentPeriod: row.current_period as number,
    isOvertime: row.is_overtime as boolean,
    overtimeCount: row.overtime_count as number,
    homeScore: row.home_score as number,
    awayScore: row.away_score as number,
    homePeriodScores: (row.home_period_scores as number[]) ?? [],
    awayPeriodScores: (row.away_period_scores as number[]) ?? [],
    homeTeamFoulsByPeriod: (row.home_team_fouls_by_period as number[]) ?? [],
    awayTeamFoulsByPeriod: (row.away_team_fouls_by_period as number[]) ?? [],
    homeTimeoutsUsed: row.home_timeouts_used as number,
    awayTimeoutsUsed: row.away_timeouts_used as number,
    homeTimeoutsUsedLastPeriod: row.home_timeouts_used_last_period as number,
    awayTimeoutsUsedLastPeriod: row.away_timeouts_used_last_period as number,
  }
}

function mapDbToPlayer(row: Record<string, unknown>): PlayerOnGame {
  return {
    id: row.id as string,
    sumulaId: row.sumula_id as string,
    athleteId: row.athlete_id as string,
    teamSide: row.team_side as PlayerOnGame["teamSide"],
    jerseyNumber: row.jersey_number as number,
    fullName: row.full_name as string,
    position: row.position as string | undefined,
    isStarter: row.is_starter as boolean,
    isCaptain: row.is_captain as boolean,
    isCoach: row.is_coach as boolean,
    isOnCourt: row.is_on_court as boolean,
    isDisqualified: row.is_disqualified as boolean,
    isEjected: row.is_ejected as boolean,
    stats: {
      points: row.points as number,
      fieldGoalsMade: row.field_goals_made as number,
      fieldGoalsAttempted: row.field_goals_attempted as number,
      threePointersMade: row.three_pointers_made as number,
      threePointersAttempted: row.three_pointers_attempted as number,
      freeThrowsMade: row.free_throws_made as number,
      freeThrowsAttempted: row.free_throws_attempted as number,
      offensiveRebounds: row.offensive_rebounds as number,
      defensiveRebounds: row.defensive_rebounds as number,
      totalRebounds: row.total_rebounds as number,
      assists: row.assists as number,
      steals: row.steals as number,
      blocks: row.blocks as number,
      turnovers: row.turnovers as number,
      personalFouls: row.personal_fouls as number,
      technicalFouls: row.technical_fouls as number,
      unsportsmanlikeFouls: row.unsportsmanlike_fouls as number,
      disqualifyingFouls: row.disqualifying_fouls as number,
      foulsReceived: row.fouls_received as number,
      secondsPlayed: row.seconds_played as number,
      efficiency: row.efficiency as number,
    },
  }
}

function mapDbToEvent(row: Record<string, unknown>): SumulaEvent {
  return {
    id: row.id as string,
    sumulaId: row.sumula_id as string,
    sequence: row.sequence as number,
    period: row.period as number,
    gameClockMs: row.game_clock_ms as number,
    realTimestamp: row.real_timestamp as string,
    type: row.type as SumulaEvent["type"],
    teamSide: row.team_side as SumulaEvent["teamSide"],
    playerOnGameId: row.player_on_game_id as string | undefined,
    playerJerseyNumber: row.player_jersey_number as number | undefined,
    playerName: row.player_name as string | undefined,
    assistedByPlayerId: row.assisted_by_player_id as string | undefined,
    foulType: row.foul_type as SumulaEvent["foulType"] | undefined,
    committedBy: row.committed_by as string | undefined,
    foulOnPlayerId: row.foul_on_player_id as string | undefined,
    homeScoreAfter: row.home_score_after as number,
    awayScoreAfter: row.away_score_after as number,
    substitutedPlayerId: row.substituted_player_id as string | undefined,
    isCancelled: row.is_cancelled as boolean,
  }
}

export function useSumulaRealtime(gameId: string) {
  const supabase = createSumulaClient()
  const [state, setState] = useState<SumulaLocalState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const clockRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const sequenceRef = useRef(0)

  // ── LOAD INICIAL ─────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        let { data: sumulaRow } = await supabase
          .from("sumulas")
          .select("*")
          .eq("game_id", gameId)
          .single()

        if (!sumulaRow) {
          const { data: created } = await supabase
            .from("sumulas")
            .insert({ game_id: gameId })
            .select()
            .single()
          sumulaRow = created
        }

        if (!sumulaRow) throw new Error("Não foi possível carregar a súmula.")

        const { data: players } = await supabase
          .from("players_on_game")
          .select("*")
          .eq("sumula_id", sumulaRow.id)
          .order("team_side")
          .order("jersey_number")

        const { data: events } = await supabase
          .from("sumula_events")
          .select("*")
          .eq("sumula_id", sumulaRow.id)
          .eq("is_cancelled", false)
          .order("sequence", { ascending: false })
          .limit(100)

        const sumula = mapDbToSumula(sumulaRow)
        const allPlayers = (players ?? []).map(mapDbToPlayer)
        const allEvents = (events ?? []).map(mapDbToEvent)

        sequenceRef.current = allEvents.length > 0 ? allEvents[0].sequence : 0

        const periodMs = sumula.isOvertime ? FIBA.OT_MS : FIBA.PERIOD_MS

        setState({
          sumula,
          homeLineup: allPlayers.filter((p) => p.teamSide === "HOME"),
          awayLineup: allPlayers.filter((p) => p.teamSide === "AWAY"),
          events: allEvents,
          gameClockMs: periodMs,
          shotClockMs: FIBA.SHOT_CLOCK_MS,
          isClockRunning: false,
          isShotClockRunning: false,
          possession: null,
        })
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Erro desconhecido")
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [gameId]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── REALTIME — escutar eventos novos ─────────────────────
  useEffect(() => {
    if (!state?.sumula.id) return

    const sumulaId = state.sumula.id

    const channel = supabase
      .channel(`sumula:${sumulaId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "sumula_events", filter: `sumula_id=eq.${sumulaId}` },
        (payload) => {
          const newEvent = mapDbToEvent(payload.new as Record<string, unknown>)
          setState((prev) => (prev ? { ...prev, events: [newEvent, ...prev.events] } : prev))
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "sumulas", filter: `id=eq.${sumulaId}` },
        (payload) => {
          setState((prev) =>
            prev ? { ...prev, sumula: mapDbToSumula(payload.new as Record<string, unknown>) } : prev
          )
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "players_on_game", filter: `sumula_id=eq.${sumulaId}` },
        (payload) => {
          const updated = mapDbToPlayer(payload.new as Record<string, unknown>)
          setState((prev) => {
            if (!prev) return prev
            const side = updated.teamSide === "HOME" ? "homeLineup" : "awayLineup"
            return {
              ...prev,
              [side]: prev[side].map((p) => (p.id === updated.id ? updated : p)),
            }
          })
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [state?.sumula.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── RELÓGIO LOCAL ─────────────────────────────────────────
  const startClock = useCallback(() => {
    setState((prev) => (prev ? { ...prev, isClockRunning: true } : prev))
  }, [])

  const stopClock = useCallback(() => {
    setState((prev) => (prev ? { ...prev, isClockRunning: false } : prev))
    if (clockRef.current) clearInterval(clockRef.current)
  }, [])

  useEffect(() => {
    if (!state?.isClockRunning) {
      if (clockRef.current) clearInterval(clockRef.current)
      return
    }

    clockRef.current = setInterval(() => {
      setState((prev) => {
        if (!prev?.isClockRunning) return prev
        const newClock = Math.max(prev.gameClockMs - 100, 0)
        const newShot = Math.max(prev.shotClockMs - 100, 0)
        if (newClock === 0) {
          clearInterval(clockRef.current!)
          return { ...prev, gameClockMs: 0, shotClockMs: 0, isClockRunning: false }
        }
        return { ...prev, gameClockMs: newClock, shotClockMs: newShot }
      })
    }, 100)

    return () => {
      if (clockRef.current) clearInterval(clockRef.current)
    }
  }, [state?.isClockRunning])

  const resetShotClock = useCallback((full = true) => {
    setState((prev) =>
      prev
        ? { ...prev, shotClockMs: full ? FIBA.SHOT_CLOCK_MS : FIBA.SHOT_CLOCK_RESET_REBOUND_MS }
        : prev
    )
  }, [])

  // ── AÇÕES — gravam no Supabase (Realtime propaga) ─────────
  const registerEvent = useCallback(
    async (payload: {
      type: string
      teamSide: string
      playerOnGameId?: string
      playerJerseyNumber?: number
      playerName?: string
      assistedByPlayerId?: string
      foulType?: string
      foulOnPlayerId?: string
      substitutedPlayerId?: string
    }) => {
      if (!state?.sumula.id) return

      sequenceRef.current += 1

      const { error: insertError } = await supabase.from("sumula_events").insert({
        sumula_id: state.sumula.id,
        sequence: sequenceRef.current,
        period: state.sumula.currentPeriod,
        game_clock_ms: state.gameClockMs,
        type: payload.type,
        team_side: payload.teamSide,
        player_on_game_id: payload.playerOnGameId ?? null,
        player_jersey_number: payload.playerJerseyNumber ?? null,
        player_name: payload.playerName ?? null,
        assisted_by_player_id: payload.assistedByPlayerId ?? null,
        foul_type: payload.foulType ?? null,
        foul_on_player_id: payload.foulOnPlayerId ?? null,
        substituted_player_id: payload.substitutedPlayerId ?? null,
        home_score_after: state.sumula.homeScore,
        away_score_after: state.sumula.awayScore,
      })

      if (insertError) console.error("Erro ao registrar evento:", insertError)
    },
    [state, supabase]
  )

  const updateScore = useCallback(
    async (side: "HOME" | "AWAY", points: number, playerId: string) => {
      if (!state?.sumula) return

      const isHome = side === "HOME"
      const newHomeScore = isHome ? state.sumula.homeScore + points : state.sumula.homeScore
      const newAwayScore = !isHome ? state.sumula.awayScore + points : state.sumula.awayScore

      await supabase
        .from("sumulas")
        .update({ home_score: newHomeScore, away_score: newAwayScore })
        .eq("id", state.sumula.id)

      const player = [...state.homeLineup, ...state.awayLineup].find((p) => p.id === playerId)
      if (!player) return

      const patch =
        points === 2
          ? {
              points: player.stats.points + 2,
              field_goals_made: player.stats.fieldGoalsMade + 1,
              field_goals_attempted: player.stats.fieldGoalsAttempted + 1,
            }
          : points === 3
            ? {
                points: player.stats.points + 3,
                field_goals_made: player.stats.fieldGoalsMade + 1,
                field_goals_attempted: player.stats.fieldGoalsAttempted + 1,
                three_pointers_made: player.stats.threePointersMade + 1,
                three_pointers_attempted: player.stats.threePointersAttempted + 1,
              }
            : {
                points: player.stats.points + 1,
                free_throws_made: player.stats.freeThrowsMade + 1,
                free_throws_attempted: player.stats.freeThrowsAttempted + 1,
              }

      await supabase.from("players_on_game").update(patch).eq("id", playerId)
      resetShotClock(true)
    },
    [state, supabase, resetShotClock]
  )

  const registerFoul = useCallback(
    async (playerId: string, foulType: string, side: "HOME" | "AWAY") => {
      if (!state?.sumula) return

      const player = [...state.homeLineup, ...state.awayLineup].find((p) => p.id === playerId)
      if (!player) return

      const newPersonalFouls = player.stats.personalFouls + 1
      const isDisqualified = newPersonalFouls >= FIBA.MAX_PERSONAL_FOULS || foulType === "DISQUALIFICANTE"

      await supabase
        .from("players_on_game")
        .update({
          personal_fouls: newPersonalFouls,
          is_disqualified: isDisqualified,
          is_on_court: isDisqualified ? false : player.isOnCourt,
        })
        .eq("id", playerId)

      const periodIdx = state.sumula.currentPeriod - 1
      const foulsKey = side === "HOME" ? "home_team_fouls_by_period" : "away_team_fouls_by_period"
      const currentFouls =
        side === "HOME"
          ? [...state.sumula.homeTeamFoulsByPeriod]
          : [...state.sumula.awayTeamFoulsByPeriod]

      currentFouls[periodIdx] = (currentFouls[periodIdx] ?? 0) + 1

      await supabase
        .from("sumulas")
        .update({ [foulsKey]: currentFouls })
        .eq("id", state.sumula.id)

      return {
        isDisqualified,
        teamFouls: currentFouls[periodIdx],
        isBonus: currentFouls[periodIdx] >= FIBA.TEAM_FOUL_BONUS,
      }
    },
    [state, supabase]
  )

  const registerSubstitution = useCallback(
    async (playerInId: string, playerOutId: string) => {
      if (!state?.sumula) return
      await supabase.from("players_on_game").update({ is_on_court: true }).eq("id", playerInId)
      await supabase.from("players_on_game").update({ is_on_court: false }).eq("id", playerOutId)
    },
    [state, supabase]
  )

  const registerTimeout = useCallback(
    async (side: "HOME" | "AWAY") => {
      if (!state?.sumula) return

      const used = side === "HOME" ? state.sumula.homeTimeoutsUsed : state.sumula.awayTimeoutsUsed
      if (used >= FIBA.MAX_TIMEOUTS) return { allowed: false, reason: "Sem timeouts restantes" }

      const field = side === "HOME" ? "home_timeouts_used" : "away_timeouts_used"
      await supabase
        .from("sumulas")
        .update({ [field]: used + 1 })
        .eq("id", state.sumula.id)

      stopClock()
      return { allowed: true }
    },
    [state, supabase, stopClock]
  )

  const updateSumulaStatus = useCallback(
    async (status: string, extras?: Record<string, unknown>) => {
      if (!state?.sumula) return
      await supabase
        .from("sumulas")
        .update({ status, ...extras })
        .eq("id", state.sumula.id)
    },
    [state, supabase]
  )

  const endPeriod = useCallback(async () => {
    if (!state?.sumula) return

    stopClock()

    const { currentPeriod, homeScore, awayScore, isOvertime } = state.sumula
    const isLastRegularPeriod = currentPeriod >= FIBA.PERIODS
    const isTied = homeScore === awayScore

    const homePeriods = [...state.sumula.homePeriodScores]
    const awayPeriods = [...state.sumula.awayPeriodScores]
    const prevHomeTotal = homePeriods.reduce((a, b) => a + b, 0)
    const prevAwayTotal = awayPeriods.reduce((a, b) => a + b, 0)
    homePeriods.push(homeScore - prevHomeTotal)
    awayPeriods.push(awayScore - prevAwayTotal)

    if ((isLastRegularPeriod || isOvertime) && isTied) {
      // Prorrogação
      await supabase
        .from("sumulas")
        .update({
          current_period: currentPeriod + 1,
          is_overtime: true,
          overtime_count: state.sumula.overtimeCount + 1,
          status: "INTERVALO",
          home_period_scores: homePeriods,
          away_period_scores: awayPeriods,
          home_team_fouls_by_period: [...state.sumula.homeTeamFoulsByPeriod, 0],
          away_team_fouls_by_period: [...state.sumula.awayTeamFoulsByPeriod, 0],
        })
        .eq("id", state.sumula.id)

      setState((prev) =>
        prev ? { ...prev, gameClockMs: FIBA.OT_MS, shotClockMs: FIBA.SHOT_CLOCK_MS } : prev
      )
    } else if (isLastRegularPeriod && !isTied) {
      // Fim de jogo
      await supabase
        .from("sumulas")
        .update({
          status: "FINALIZADA",
          finished_at: new Date().toISOString(),
          home_period_scores: homePeriods,
          away_period_scores: awayPeriods,
        })
        .eq("id", state.sumula.id)
    } else {
      // Fim de período normal
      await supabase
        .from("sumulas")
        .update({
          current_period: currentPeriod + 1,
          status: "INTERVALO",
          home_period_scores: homePeriods,
          away_period_scores: awayPeriods,
          home_team_fouls_by_period: [...state.sumula.homeTeamFoulsByPeriod, 0],
          away_team_fouls_by_period: [...state.sumula.awayTeamFoulsByPeriod, 0],
        })
        .eq("id", state.sumula.id)

      setState((prev) =>
        prev ? { ...prev, gameClockMs: FIBA.PERIOD_MS, shotClockMs: FIBA.SHOT_CLOCK_MS } : prev
      )
    }
  }, [state, supabase, stopClock])

  const saveLineup = useCallback(
    async (
      athletes: Array<{
        id: string
        side: "HOME" | "AWAY"
        jerseyNumber: number
        fullName: string
        position?: string
        isStarter: boolean
      }>
    ) => {
      if (!state?.sumula.id) return

      const { error: upsertError } = await supabase.from("players_on_game").upsert(
        athletes.map((a) => ({
          sumula_id: state.sumula.id,
          athlete_id: a.id,
          team_side: a.side,
          jersey_number: a.jerseyNumber,
          full_name: a.fullName,
          position: a.position ?? null,
          is_starter: a.isStarter,
          is_on_court: a.isStarter,
        })),
        { onConflict: "sumula_id,athlete_id" }
      )

      if (upsertError) throw upsertError
    },
    [state?.sumula.id, supabase]
  )

  return {
    state,
    loading,
    error,
    actions: {
      startClock,
      stopClock,
      resetShotClock,
      registerEvent,
      updateScore,
      registerFoul,
      registerSubstitution,
      registerTimeout,
      endPeriod,
      updateSumulaStatus,
      saveLineup,
    },
  }
}
