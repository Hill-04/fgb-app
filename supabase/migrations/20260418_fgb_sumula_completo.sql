-- ============================================================
-- FGB — Súmula Eletrônica Full FIBA
-- Migration: 20260418_fgb_sumula_completo
--
-- NOTA: game_id referencia jogos que vivem no TursoDB (Prisma).
-- Por isso não há FK constraint para games — apenas UUID como
-- chave de correlação entre os dois bancos.
-- ============================================================

CREATE TABLE IF NOT EXISTS sumulas (
  id                              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id                         UUID NOT NULL UNIQUE,
  status                          TEXT NOT NULL DEFAULT 'NAO_INICIADA'
                                  CHECK (status IN ('NAO_INICIADA','EM_ANDAMENTO','INTERVALO','FINALIZADA','ASSINADA','HOMOLOGADA')),
  started_at                      TIMESTAMPTZ,
  finished_at                     TIMESTAMPTZ,
  signed_at                       TIMESTAMPTZ,
  current_period                  INTEGER NOT NULL DEFAULT 1,
  is_overtime                     BOOLEAN NOT NULL DEFAULT FALSE,
  overtime_count                  INTEGER NOT NULL DEFAULT 0,
  home_score                      INTEGER NOT NULL DEFAULT 0,
  away_score                      INTEGER NOT NULL DEFAULT 0,
  home_period_scores              INTEGER[] NOT NULL DEFAULT '{}',
  away_period_scores              INTEGER[] NOT NULL DEFAULT '{}',
  home_team_fouls_by_period       INTEGER[] NOT NULL DEFAULT '{}',
  away_team_fouls_by_period       INTEGER[] NOT NULL DEFAULT '{}',
  home_timeouts_used              INTEGER NOT NULL DEFAULT 0,
  away_timeouts_used              INTEGER NOT NULL DEFAULT 0,
  home_timeouts_used_last_period  INTEGER NOT NULL DEFAULT 0,
  away_timeouts_used_last_period  INTEGER NOT NULL DEFAULT 0,
  created_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS players_on_game (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sumula_id                 UUID NOT NULL REFERENCES sumulas(id) ON DELETE CASCADE,
  athlete_id                TEXT NOT NULL,
  team_side                 TEXT NOT NULL CHECK (team_side IN ('HOME','AWAY')),
  jersey_number             INTEGER NOT NULL,
  full_name                 TEXT NOT NULL,
  position                  TEXT,
  is_starter                BOOLEAN NOT NULL DEFAULT FALSE,
  is_captain                BOOLEAN NOT NULL DEFAULT FALSE,
  is_coach                  BOOLEAN NOT NULL DEFAULT FALSE,
  is_on_court               BOOLEAN NOT NULL DEFAULT FALSE,
  is_disqualified           BOOLEAN NOT NULL DEFAULT FALSE,
  is_ejected                BOOLEAN NOT NULL DEFAULT FALSE,
  points                    INTEGER NOT NULL DEFAULT 0,
  field_goals_made          INTEGER NOT NULL DEFAULT 0,
  field_goals_attempted     INTEGER NOT NULL DEFAULT 0,
  three_pointers_made       INTEGER NOT NULL DEFAULT 0,
  three_pointers_attempted  INTEGER NOT NULL DEFAULT 0,
  free_throws_made          INTEGER NOT NULL DEFAULT 0,
  free_throws_attempted     INTEGER NOT NULL DEFAULT 0,
  offensive_rebounds        INTEGER NOT NULL DEFAULT 0,
  defensive_rebounds        INTEGER NOT NULL DEFAULT 0,
  total_rebounds            INTEGER NOT NULL DEFAULT 0,
  assists                   INTEGER NOT NULL DEFAULT 0,
  steals                    INTEGER NOT NULL DEFAULT 0,
  blocks                    INTEGER NOT NULL DEFAULT 0,
  turnovers                 INTEGER NOT NULL DEFAULT 0,
  personal_fouls            INTEGER NOT NULL DEFAULT 0,
  technical_fouls           INTEGER NOT NULL DEFAULT 0,
  unsportsmanlike_fouls     INTEGER NOT NULL DEFAULT 0,
  disqualifying_fouls       INTEGER NOT NULL DEFAULT 0,
  fouls_received            INTEGER NOT NULL DEFAULT 0,
  seconds_played            INTEGER NOT NULL DEFAULT 0,
  efficiency                INTEGER NOT NULL DEFAULT 0,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (sumula_id, athlete_id)
);

CREATE TABLE IF NOT EXISTS sumula_events (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sumula_id                 UUID NOT NULL REFERENCES sumulas(id) ON DELETE CASCADE,
  sequence                  INTEGER NOT NULL,
  period                    INTEGER NOT NULL,
  game_clock_ms             INTEGER NOT NULL,
  real_timestamp            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  type                      TEXT NOT NULL,
  team_side                 TEXT NOT NULL CHECK (team_side IN ('HOME','AWAY')),
  player_on_game_id         UUID REFERENCES players_on_game(id),
  player_jersey_number      INTEGER,
  player_name               TEXT,
  assisted_by_player_id     UUID REFERENCES players_on_game(id),
  foul_type                 TEXT,
  committed_by              TEXT,
  foul_on_player_id         UUID REFERENCES players_on_game(id),
  home_score_after          INTEGER NOT NULL DEFAULT 0,
  away_score_after          INTEGER NOT NULL DEFAULT 0,
  substituted_player_id     UUID REFERENCES players_on_game(id),
  is_cancelled              BOOLEAN NOT NULL DEFAULT FALSE,
  cancelled_at              TIMESTAMPTZ,
  cancelled_reason          TEXT,
  UNIQUE (sumula_id, sequence)
);

CREATE TABLE IF NOT EXISTS sumula_signatures (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sumula_id        UUID NOT NULL REFERENCES sumulas(id) ON DELETE CASCADE,
  role             TEXT NOT NULL CHECK (role IN ('ARBITRO_PRINCIPAL','ARBITRO_AUXILIAR','REPRESENTANTE_HOME','REPRESENTANTE_AWAY','MESARIO')),
  signer_name      TEXT NOT NULL,
  signed_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  signature_token  TEXT NOT NULL UNIQUE,
  ip_address       TEXT,
  is_valid         BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (sumula_id, role)
);

-- Índices para performance e Realtime
CREATE INDEX IF NOT EXISTS idx_sumula_events_sumula   ON sumula_events(sumula_id);
CREATE INDEX IF NOT EXISTS idx_sumula_events_sequence ON sumula_events(sumula_id, sequence DESC);
CREATE INDEX IF NOT EXISTS idx_players_on_game_sumula ON players_on_game(sumula_id);
CREATE INDEX IF NOT EXISTS idx_players_on_game_side   ON players_on_game(sumula_id, team_side);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON sumulas;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON sumulas
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON players_on_game;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON players_on_game
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- RLS — leitura pública, escrita autenticada
ALTER TABLE sumulas           ENABLE ROW LEVEL SECURITY;
ALTER TABLE players_on_game   ENABLE ROW LEVEL SECURITY;
ALTER TABLE sumula_events      ENABLE ROW LEVEL SECURITY;
ALTER TABLE sumula_signatures  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_sumulas" ON sumulas;
CREATE POLICY "public_read_sumulas"  ON sumulas         FOR SELECT USING (true);
DROP POLICY IF EXISTS "auth_write_sumulas" ON sumulas;
CREATE POLICY "auth_write_sumulas"   ON sumulas         FOR ALL    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "public_read_pog" ON players_on_game;
CREATE POLICY "public_read_pog"      ON players_on_game FOR SELECT USING (true);
DROP POLICY IF EXISTS "auth_write_pog" ON players_on_game;
CREATE POLICY "auth_write_pog"       ON players_on_game FOR ALL    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "public_read_events" ON sumula_events;
CREATE POLICY "public_read_events"   ON sumula_events   FOR SELECT USING (true);
DROP POLICY IF EXISTS "auth_insert_events" ON sumula_events;
CREATE POLICY "auth_insert_events"   ON sumula_events   FOR INSERT WITH CHECK (auth.role() = 'authenticated');
-- Eventos só podem ser cancelados, nunca deletados
DROP POLICY IF EXISTS "auth_cancel_events" ON sumula_events;
CREATE POLICY "auth_cancel_events"   ON sumula_events   FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "public_read_signatures" ON sumula_signatures;
CREATE POLICY "public_read_signatures" ON sumula_signatures FOR SELECT USING (true);
DROP POLICY IF EXISTS "auth_write_signatures" ON sumula_signatures;
CREATE POLICY "auth_write_signatures"  ON sumula_signatures FOR ALL    USING (auth.role() = 'authenticated');

-- Habilitar Realtime nas tabelas
ALTER PUBLICATION supabase_realtime ADD TABLE sumulas;
ALTER PUBLICATION supabase_realtime ADD TABLE players_on_game;
ALTER PUBLICATION supabase_realtime ADD TABLE sumula_events;
