// ============================================================
// FGB — Types TypeScript (Fase 1)
// Arquivo: src/types/database.ts
// ============================================================

export type AthletePosition =
  | 'armador'
  | 'ala-armador'
  | 'ala'
  | 'ala-pivo'
  | 'pivo'

export type GameStatus =
  | 'scheduled'
  | 'live'
  | 'finished'
  | 'postponed'
  | 'cancelled'

// ============================================================
// TABELAS PRINCIPAIS
// ============================================================

export interface Season {
  id: string
  name: string           // "2024/2025"
  year_start: number
  year_end: number
  is_active: boolean
  created_at: string
}

export interface Team {
  id: string
  name: string
  short_name: string
  city: string | null
  logo_url: string | null
  primary_color: string | null
  secondary_color: string | null
  is_active: boolean
  created_at: string
}

export interface Athlete {
  id: string
  name: string
  nickname: string | null
  position: AthletePosition | null
  jersey_number: number | null
  team_id: string | null
  nationality: string | null
  birth_date: string | null
  height_cm: number | null
  weight_kg: number | null
  photo_url: string | null
  is_active: boolean
  created_at: string
}

export interface Game {
  id: string
  season_id: string
  round: number | null
  home_team_id: string
  away_team_id: string
  scheduled_at: string
  venue: string | null
  status: GameStatus
  home_score: number | null
  away_score: number | null
  live_period: number | null
  live_home_score: number | null
  live_away_score: number | null
  broadcast_url: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface GameStat {
  id: string
  game_id: string
  athlete_id: string
  team_id: string
  minutes_played: number
  dnp: boolean
  points: number
  rebounds_offensive: number
  rebounds_defensive: number
  rebounds_total: number          // coluna gerada
  assists: number
  steals: number
  blocks: number
  turnovers: number
  fouls: number
  fg_made: number
  fg_attempted: number
  three_made: number
  three_attempted: number
  ft_made: number
  ft_attempted: number
  dunks: number
  double_double: boolean          // coluna gerada
  efficiency: number              // coluna gerada
  created_at: string
}

// ============================================================
// VIEWS
// ============================================================

export interface AthleteSeasonStats {
  athlete_id: string
  athlete_name: string
  nickname: string | null
  position: AthletePosition | null
  jersey_number: number | null
  photo_url: string | null
  team_id: string
  team_name: string
  team_short: string
  team_logo: string | null
  season_id: string
  games_played: number
  // médias
  avg_points: number
  avg_rebounds: number
  avg_assists: number
  avg_steals: number
  avg_blocks: number
  avg_turnovers: number
  avg_efficiency: number
  avg_minutes: number
  // percentuais
  fg_pct: number
  three_pct: number
  ft_pct: number
  // totais
  total_points: number
  total_rebounds: number
  total_assists: number
  total_dunks: number
  double_doubles: number
  // recordes pessoais na temporada
  record_points: number
  record_rebounds: number
  record_assists: number
}

export interface Standing {
  season_id: string
  team_id: string
  team_name: string
  short_name: string
  logo_url: string | null
  primary_color: string | null
  games_played: number
  wins: number
  losses: number
  win_pct: number
  points: number
  pts_for: number
  pts_against: number
  avg_pts_for: number
  avg_pts_against: number
}

// ============================================================
// TIPOS AUXILIARES (com joins para uso no front)
// ============================================================

export interface GameWithTeams extends Game {
  home_team: Team
  away_team: Team
}

export interface GameStatWithAthlete extends GameStat {
  athlete: Pick<Athlete, 'id' | 'name' | 'nickname' | 'position' | 'jersey_number' | 'photo_url'>
}

export interface AthleteWithTeam extends Athlete {
  team: Team | null
}

export interface GameWithStats extends GameWithTeams {
  home_stats: GameStatWithAthlete[]
  away_stats: GameStatWithAthlete[]
}

// ============================================================
// TIPOS DE INSERÇÃO (sem campos gerados/automáticos)
// ============================================================

export type InsertSeason    = Omit<Season,    'id' | 'created_at'>
export type InsertTeam      = Omit<Team,      'id' | 'created_at'>
export type InsertAthlete   = Omit<Athlete,   'id' | 'created_at'>
export type InsertGame      = Omit<Game,      'id' | 'created_at' | 'updated_at'>
export type InsertGameStat  = Omit<GameStat,  'id' | 'created_at' | 'rebounds_total' | 'double_double' | 'efficiency'>

export type UpdateSeason    = Partial<InsertSeason>
export type UpdateTeam      = Partial<InsertTeam>
export type UpdateAthlete   = Partial<InsertAthlete>
export type UpdateGame      = Partial<InsertGame>
export type UpdateGameStat  = Partial<InsertGameStat>

// ============================================================
// TIPO DO BANCO COMPLETO (para o client do Supabase)
// src/types/supabase.ts — use com: createClient<Database>()
// ============================================================

export interface Database {
  public: {
    Tables: {
      seasons:    { Row: Season;    Insert: InsertSeason;    Update: UpdateSeason }
      teams:      { Row: Team;      Insert: InsertTeam;      Update: UpdateTeam }
      athletes:   { Row: Athlete;   Insert: InsertAthlete;   Update: UpdateAthlete }
      games:      { Row: Game;      Insert: InsertGame;      Update: UpdateGame }
      game_stats: { Row: GameStat;  Insert: InsertGameStat;  Update: UpdateGameStat }
    }
    Views: {
      athlete_season_stats: { Row: AthleteSeasonStats }
      standings:            { Row: Standing }
    }
    Enums: {
      athlete_position: AthletePosition
      game_status:      GameStatus
    }
  }
}
