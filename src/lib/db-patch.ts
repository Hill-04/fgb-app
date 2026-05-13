import { prisma } from '@/lib/db'

type PatchResult = {
  target: string
  sql?: string
  status: 'SUCCESS' | 'SKIPPED_EXISTS' | 'ERROR'
  error?: string
}

type ColumnPatch = {
  kind: 'column'
  table: string
  column: string
  sql: string
  fallbackSql?: string[]
  critical?: boolean
}

type TablePatch = {
  kind: 'table'
  table: string
  sql: string
  critical?: boolean
}

type SqlPatch = {
  kind: 'sql'
  name: string
  sql: string
  critical?: boolean
}

type SchemaPatch = ColumnPatch | TablePatch | SqlPatch

const schemaPatches: SchemaPatch[] = [
  {
    kind: 'table',
    table: 'Standing',
    sql: `CREATE TABLE IF NOT EXISTS Standing (
      id TEXT PRIMARY KEY,
      teamId TEXT NOT NULL,
      categoryId TEXT NOT NULL,
      played INTEGER DEFAULT 0,
      wins INTEGER DEFAULT 0,
      losses INTEGER DEFAULT 0,
      draws INTEGER DEFAULT 0,
      points INTEGER DEFAULT 0,
      pointsFor INTEGER DEFAULT 0,
      pointsAgainst INTEGER DEFAULT 0,
      diff INTEGER DEFAULT 0,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    critical: true,
  },
  {
    kind: 'table',
    table: 'AthleteCategory',
    sql: `CREATE TABLE IF NOT EXISTS AthleteCategory (
      id TEXT PRIMARY KEY,
      registrationId TEXT NOT NULL,
      athleteName TEXT NOT NULL,
      athleteDoc TEXT,
      categoryIds TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    critical: true,
  },
  {
    kind: 'table',
    table: 'FeeConfig',
    sql: `CREATE TABLE IF NOT EXISTS FeeConfig (
      id TEXT PRIMARY KEY,
      key TEXT NOT NULL UNIQUE,
      label TEXT NOT NULL,
      value REAL NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      isActive INTEGER DEFAULT 1,
      appliesFrom DATETIME DEFAULT CURRENT_TIMESTAMP,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    critical: true,
  },
  {
    kind: 'table',
    table: 'RegistrationFee',
    sql: `CREATE TABLE IF NOT EXISTS RegistrationFee (
      id TEXT PRIMARY KEY,
      registrationId TEXT NOT NULL,
      feeKey TEXT NOT NULL,
      feeLabel TEXT NOT NULL,
      quantity INTEGER DEFAULT 1,
      unitValue REAL NOT NULL,
      totalValue REAL NOT NULL,
      notes TEXT,
      status TEXT DEFAULT 'PENDING',
      paidAt DATETIME,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    critical: true,
  },
  {
    kind: 'table',
    table: 'Athlete',
    sql: `CREATE TABLE IF NOT EXISTS Athlete (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      birthDate DATETIME,
      document TEXT,
      sex TEXT,
      photoUrl TEXT,
      status TEXT DEFAULT 'ACTIVE',
      teamId TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
  },
  {
    kind: 'table',
    table: 'AthleteIdCard',
    sql: `CREATE TABLE IF NOT EXISTS AthleteIdCard (
      id TEXT PRIMARY KEY,
      athleteId TEXT NOT NULL,
      cardNumber TEXT UNIQUE,
      qrToken TEXT UNIQUE,
      issuedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      expiresAt DATETIME,
      status TEXT DEFAULT 'ACTIVE',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
  },
  {
    kind: 'table',
    table: 'AthleteBidEntry',
    sql: `CREATE TABLE IF NOT EXISTS AthleteBidEntry (
      id TEXT PRIMARY KEY,
      athleteId TEXT NOT NULL,
      championshipId TEXT,
      teamFromId TEXT,
      teamToId TEXT,
      type TEXT DEFAULT 'REGISTRATION',
      status TEXT DEFAULT 'PENDING',
      reason TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
  },
  {
    kind: 'table',
    table: 'AthleteRegistrationRequest',
    sql: `CREATE TABLE IF NOT EXISTS AthleteRegistrationRequest (
      id TEXT PRIMARY KEY,
      teamId TEXT NOT NULL,
      athleteId TEXT,
      status TEXT DEFAULT 'DRAFT',
      fullName TEXT NOT NULL,
      birthDate DATETIME NOT NULL,
      documentNumber TEXT NOT NULL,
      documentNumberNormalized TEXT NOT NULL,
      motherName TEXT,
      phone TEXT,
      email TEXT,
      requestedCategoryLabel TEXT,
      cbbRegistrationNumber TEXT,
      cbbCheckStatus TEXT DEFAULT 'PENDING',
      cbbCheckedAt DATETIME,
      cbbCheckedByUserId TEXT,
      cbbNotes TEXT,
      cbbReference TEXT,
      cbbDocumentMatch INTEGER,
      cbbNameMatch INTEGER,
      cbbBirthDateMatch INTEGER,
      submittedAt DATETIME,
      reviewedAt DATETIME,
      reviewedByUserId TEXT,
      rejectionReason TEXT,
      approvedAt DATETIME,
      approvedByUserId TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    critical: true,
  },
  {
    kind: 'table',
    table: 'AthleteRegistrationAuditLog',
    sql: `CREATE TABLE IF NOT EXISTS AthleteRegistrationAuditLog (
      id TEXT PRIMARY KEY,
      requestId TEXT NOT NULL,
      action TEXT NOT NULL,
      description TEXT NOT NULL,
      metadataJson TEXT,
      createdByUserId TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    critical: true,
  },
  {
    kind: 'table',
    table: 'PlayerStat',
    sql: `CREATE TABLE IF NOT EXISTS PlayerStat (
      id TEXT PRIMARY KEY,
      gameId TEXT NOT NULL,
      teamId TEXT NOT NULL,
      userId TEXT NOT NULL,
      points INTEGER DEFAULT 0,
      fouls INTEGER DEFAULT 0,
      assists INTEGER DEFAULT 0,
      rebounds INTEGER DEFAULT 0,
      blocks INTEGER DEFAULT 0,
      steals INTEGER DEFAULT 0,
      threePoints INTEGER DEFAULT 0
    );`,
    critical: true,
  },
  {
    kind: 'table',
    table: 'GameLiveSession',
    sql: `CREATE TABLE IF NOT EXISTS GameLiveSession (
      id TEXT PRIMARY KEY,
      gameId TEXT NOT NULL,
      status TEXT DEFAULT 'PRE_GAME_READY',
      startedAt DATETIME,
      endedAt DATETIME,
      openedByUserId TEXT,
      closedByUserId TEXT,
      notes TEXT,
      publicVisibilityStatus TEXT DEFAULT 'PRE_GAME',
      currentPeriod INTEGER DEFAULT 0,
      clockStatus TEXT DEFAULT 'STOPPED',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    critical: true,
  },
  {
    kind: 'table',
    table: 'GameRoster',
    sql: `CREATE TABLE IF NOT EXISTS GameRoster (
      id TEXT PRIMARY KEY,
      gameId TEXT NOT NULL,
      teamId TEXT NOT NULL,
      coachName TEXT,
      assistantCoachName TEXT,
      isLocked INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    critical: true,
  },
  {
    kind: 'table',
    table: 'GameRosterPlayer',
    sql: `CREATE TABLE IF NOT EXISTS GameRosterPlayer (
      id TEXT PRIMARY KEY,
      gameRosterId TEXT NOT NULL,
      athleteId TEXT NOT NULL,
      jerseyNumber INTEGER,
      isStarter INTEGER DEFAULT 0,
      isCaptain INTEGER DEFAULT 0,
      isAvailable INTEGER DEFAULT 1,
      isOnCourt INTEGER DEFAULT 0,
      isDisqualified INTEGER DEFAULT 0,
      status TEXT DEFAULT 'ACTIVE',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    critical: true,
  },
  {
    kind: 'table',
    table: 'GameOfficial',
    sql: `CREATE TABLE IF NOT EXISTS GameOfficial (
      id TEXT PRIMARY KEY,
      gameId TEXT NOT NULL,
      officialType TEXT NOT NULL,
      name TEXT NOT NULL,
      refereeId TEXT,
      role TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    critical: true,
  },
  {
    kind: 'table',
    table: 'GameEvent',
    sql: `CREATE TABLE IF NOT EXISTS GameEvent (
      id TEXT PRIMARY KEY,
      gameId TEXT NOT NULL,
      liveSessionId TEXT NOT NULL,
      sequenceNumber INTEGER NOT NULL,
      sequence INTEGER,
      period INTEGER DEFAULT 0,
      clockTime TEXT NOT NULL,
      clockMs INTEGER,
      eventType TEXT NOT NULL,
      teamId TEXT,
      athleteId TEXT,
      secondaryAthleteId TEXT,
      pointsDelta INTEGER,
      homeScoreAfter INTEGER,
      awayScoreAfter INTEGER,
      payloadJson TEXT,
      createdByUserId TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      isCancelled INTEGER DEFAULT 0,
      isReverted INTEGER DEFAULT 0,
      revertedAt DATETIME,
      revertedByUserId TEXT,
      correctionReason TEXT
    );`,
    critical: true,
  },
  {
    kind: 'table',
    table: 'GamePlayerStatLine',
    sql: `CREATE TABLE IF NOT EXISTS GamePlayerStatLine (
      id TEXT PRIMARY KEY,
      gameId TEXT NOT NULL,
      athleteId TEXT NOT NULL,
      teamId TEXT NOT NULL,
      minutesPlayed INTEGER DEFAULT 0,
      points INTEGER DEFAULT 0,
      fouls INTEGER DEFAULT 0,
      technicalFouls INTEGER DEFAULT 0,
      assists INTEGER DEFAULT 0,
      reboundsOffensive INTEGER DEFAULT 0,
      reboundsDefensive INTEGER DEFAULT 0,
      reboundsTotal INTEGER DEFAULT 0,
      steals INTEGER DEFAULT 0,
      blocks INTEGER DEFAULT 0,
      turnovers INTEGER DEFAULT 0,
      twoPtMade INTEGER DEFAULT 0,
      twoPtAttempted INTEGER DEFAULT 0,
      threePtMade INTEGER DEFAULT 0,
      threePtAttempted INTEGER DEFAULT 0,
      freeThrowsMade INTEGER DEFAULT 0,
      freeThrowsAttempted INTEGER DEFAULT 0,
      plusMinus INTEGER,
      isStarter INTEGER DEFAULT 0,
      fouledOut INTEGER DEFAULT 0,
      disqualified INTEGER DEFAULT 0,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    critical: true,
  },
  {
    kind: 'table',
    table: 'GameTeamStatLine',
    sql: `CREATE TABLE IF NOT EXISTS GameTeamStatLine (
      id TEXT PRIMARY KEY,
      gameId TEXT NOT NULL,
      teamId TEXT NOT NULL,
      points INTEGER DEFAULT 0,
      fouls INTEGER DEFAULT 0,
      timeoutsUsed INTEGER DEFAULT 0,
      reboundsTotal INTEGER DEFAULT 0,
      assists INTEGER DEFAULT 0,
      steals INTEGER DEFAULT 0,
      turnovers INTEGER DEFAULT 0,
      blocks INTEGER DEFAULT 0,
      twoPtMade INTEGER DEFAULT 0,
      twoPtAttempted INTEGER DEFAULT 0,
      threePtMade INTEGER DEFAULT 0,
      threePtAttempted INTEGER DEFAULT 0,
      freeThrowsMade INTEGER DEFAULT 0,
      freeThrowsAttempted INTEGER DEFAULT 0,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    critical: true,
  },
  {
    kind: 'table',
    table: 'GamePeriodScore',
    sql: `CREATE TABLE IF NOT EXISTS GamePeriodScore (
      id TEXT PRIMARY KEY,
      gameId TEXT NOT NULL,
      period INTEGER NOT NULL,
      homePoints INTEGER DEFAULT 0,
      awayPoints INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    critical: true,
  },
  {
    kind: 'table',
    table: 'GameOfficialReport',
    sql: `CREATE TABLE IF NOT EXISTS GameOfficialReport (
      id TEXT PRIMARY KEY,
      gameId TEXT NOT NULL UNIQUE,
      finalHomeScore INTEGER DEFAULT 0,
      finalAwayScore INTEGER DEFAULT 0,
      overtimeCount INTEGER DEFAULT 0,
      officialPdfUrl TEXT,
      boxScoreJson TEXT,
      playByPlayJson TEXT,
      signedOffByUserId TEXT,
      finalizedAt DATETIME,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    critical: true,
  },
  {
    kind: 'table',
    table: 'GameAuditLog',
    sql: `CREATE TABLE IF NOT EXISTS GameAuditLog (
      id TEXT PRIMARY KEY,
      gameId TEXT NOT NULL,
      actionType TEXT NOT NULL,
      actorUserId TEXT,
      targetEntity TEXT NOT NULL,
      targetEntityId TEXT,
      description TEXT NOT NULL,
      metaJson TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    critical: true,
  },
  {
    kind: 'table',
    table: 'Referee',
    sql: `CREATE TABLE IF NOT EXISTS Referee (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      licenseNumber TEXT,
      phone TEXT,
      email TEXT,
      city TEXT,
      status TEXT DEFAULT 'ACTIVE',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
  },
  {
    kind: 'table',
    table: 'RefereeAssignment',
    sql: `CREATE TABLE IF NOT EXISTS RefereeAssignment (
      id TEXT PRIMARY KEY,
      gameId TEXT NOT NULL,
      refereeId TEXT NOT NULL,
      role TEXT DEFAULT 'MAIN',
      status TEXT DEFAULT 'ASSIGNED',
      notes TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
  },
  {
    kind: 'table',
    table: 'Sponsor',
    sql: `CREATE TABLE IF NOT EXISTS Sponsor (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      logoUrl TEXT,
      websiteUrl TEXT,
      isActive INTEGER DEFAULT 1,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
  },
  {
    kind: 'table',
    table: 'SponsorClick',
    sql: `CREATE TABLE IF NOT EXISTS SponsorClick (
      id TEXT PRIMARY KEY,
      sponsorId TEXT NOT NULL,
      source TEXT,
      referrer TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
  },
  {
    kind: 'table',
    table: 'NewsPost',
    sql: `CREATE TABLE IF NOT EXISTS NewsPost (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT UNIQUE,
      excerpt TEXT,
      content TEXT NOT NULL,
      coverUrl TEXT,
      status TEXT DEFAULT 'DRAFT',
      publishedAt DATETIME,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
  },
  {
    kind: 'table',
    table: 'VideoPost',
    sql: `CREATE TABLE IF NOT EXISTS VideoPost (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT UNIQUE,
      description TEXT,
      videoUrl TEXT NOT NULL,
      coverUrl TEXT,
      status TEXT DEFAULT 'DRAFT',
      publishedAt DATETIME,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
  },
  {
    kind: 'table',
    table: 'SeasonRanking',
    sql: `CREATE TABLE IF NOT EXISTS SeasonRanking (
      id TEXT PRIMARY KEY,
      teamId TEXT NOT NULL,
      season INTEGER NOT NULL,
      points INTEGER DEFAULT 0,
      wins INTEGER DEFAULT 0,
      losses INTEGER DEFAULT 0,
      games INTEGER DEFAULT 0,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
  },

  { kind: 'column', table: 'Game', column: 'court', sql: 'ALTER TABLE Game ADD COLUMN court TEXT;', critical: true },
  { kind: 'column', table: 'Game', column: 'round', sql: 'ALTER TABLE Game ADD COLUMN round INTEGER DEFAULT 1;', critical: true },
  { kind: 'column', table: 'Game', column: 'blockId', sql: 'ALTER TABLE Game ADD COLUMN blockId TEXT;', critical: true },
  { kind: 'column', table: 'Game', column: 'isReturn', sql: 'ALTER TABLE Game ADD COLUMN isReturn INTEGER DEFAULT 0;', critical: true },
  { kind: 'column', table: 'Game', column: 'period', sql: 'ALTER TABLE Game ADD COLUMN period TEXT;', critical: true },
  { kind: 'column', table: 'Game', column: 'venue', sql: 'ALTER TABLE Game ADD COLUMN venue TEXT;', critical: true },
  { kind: 'column', table: 'Game', column: 'wasRescheduled', sql: 'ALTER TABLE Game ADD COLUMN wasRescheduled INTEGER DEFAULT 0;', critical: true },
  { kind: 'column', table: 'Game', column: 'rescheduleReason', sql: 'ALTER TABLE Game ADD COLUMN rescheduleReason TEXT;', critical: true },
  { kind: 'column', table: 'Game', column: 'blockedByTeamId', sql: 'ALTER TABLE Game ADD COLUMN blockedByTeamId TEXT;', critical: true },
  { kind: 'column', table: 'Game', column: 'liveStatus', sql: "ALTER TABLE Game ADD COLUMN liveStatus TEXT DEFAULT 'SCHEDULED';", critical: true },
  { kind: 'column', table: 'Game', column: 'currentPeriod', sql: 'ALTER TABLE Game ADD COLUMN currentPeriod INTEGER DEFAULT 0;', critical: true },
  { kind: 'column', table: 'Game', column: 'clockDisplay', sql: 'ALTER TABLE Game ADD COLUMN clockDisplay TEXT;', critical: true },
  { kind: 'column', table: 'Game', column: 'homeTimeoutsUsed', sql: 'ALTER TABLE Game ADD COLUMN homeTimeoutsUsed INTEGER DEFAULT 0;', critical: true },
  { kind: 'column', table: 'Game', column: 'awayTimeoutsUsed', sql: 'ALTER TABLE Game ADD COLUMN awayTimeoutsUsed INTEGER DEFAULT 0;', critical: true },
  { kind: 'column', table: 'Game', column: 'homeTeamFoulsCurrentPeriod', sql: 'ALTER TABLE Game ADD COLUMN homeTeamFoulsCurrentPeriod INTEGER DEFAULT 0;', critical: true },
  { kind: 'column', table: 'Game', column: 'awayTeamFoulsCurrentPeriod', sql: 'ALTER TABLE Game ADD COLUMN awayTeamFoulsCurrentPeriod INTEGER DEFAULT 0;', critical: true },
  { kind: 'column', table: 'Game', column: 'isLivePublished', sql: 'ALTER TABLE Game ADD COLUMN isLivePublished INTEGER DEFAULT 0;', critical: true },
  { kind: 'column', table: 'Game', column: 'officialReportId', sql: 'ALTER TABLE Game ADD COLUMN officialReportId TEXT;', critical: true },
  { kind: 'column', table: 'Game', column: 'attendance', sql: 'ALTER TABLE Game ADD COLUMN attendance INTEGER;', critical: false },
  { kind: 'column', table: 'GameEvent', column: 'sequence', sql: 'ALTER TABLE GameEvent ADD COLUMN sequence INTEGER;' },
  { kind: 'column', table: 'GameEvent', column: 'clockMs', sql: 'ALTER TABLE GameEvent ADD COLUMN clockMs INTEGER;' },
  { kind: 'column', table: 'GameEvent', column: 'homeScoreAfter', sql: 'ALTER TABLE GameEvent ADD COLUMN homeScoreAfter INTEGER;' },
  { kind: 'column', table: 'GameEvent', column: 'awayScoreAfter', sql: 'ALTER TABLE GameEvent ADD COLUMN awayScoreAfter INTEGER;' },
  { kind: 'column', table: 'GameEvent', column: 'isCancelled', sql: 'ALTER TABLE GameEvent ADD COLUMN isCancelled INTEGER DEFAULT 0;', critical: true },
  { kind: 'column', table: 'GameRosterPlayer', column: 'isDisqualified', sql: 'ALTER TABLE GameRosterPlayer ADD COLUMN isDisqualified INTEGER DEFAULT 0;', critical: true },
  { kind: 'column', table: 'GamePlayerStatLine', column: 'technicalFouls', sql: 'ALTER TABLE GamePlayerStatLine ADD COLUMN technicalFouls INTEGER DEFAULT 0;', critical: true },

  { kind: 'column', table: 'Registration', column: 'canHost', sql: 'ALTER TABLE Registration ADD COLUMN canHost INTEGER DEFAULT 0;', critical: true },
  { kind: 'column', table: 'Registration', column: 'gymName', sql: 'ALTER TABLE Registration ADD COLUMN gymName TEXT;', critical: true },
  { kind: 'column', table: 'Registration', column: 'gymAddress', sql: 'ALTER TABLE Registration ADD COLUMN gymAddress TEXT;', critical: true },
  { kind: 'column', table: 'Registration', column: 'gymCity', sql: 'ALTER TABLE Registration ADD COLUMN gymCity TEXT;', critical: true },
  { kind: 'column', table: 'Registration', column: 'gymMapsLink', sql: 'ALTER TABLE Registration ADD COLUMN gymMapsLink TEXT;', critical: true },
  { kind: 'column', table: 'Registration', column: 'coachName', sql: 'ALTER TABLE Registration ADD COLUMN coachName TEXT;', critical: true },
  { kind: 'column', table: 'Registration', column: 'coachPhone', sql: 'ALTER TABLE Registration ADD COLUMN coachPhone TEXT;', critical: true },
  { kind: 'column', table: 'Registration', column: 'coachEmail', sql: 'ALTER TABLE Registration ADD COLUMN coachEmail TEXT;', critical: true },
  { kind: 'column', table: 'Registration', column: 'coachMultiTeam', sql: 'ALTER TABLE Registration ADD COLUMN coachMultiTeam INTEGER DEFAULT 0;', critical: true },
  { kind: 'column', table: 'Registration', column: 'observations', sql: 'ALTER TABLE Registration ADD COLUMN observations TEXT;', critical: true },

  { kind: 'column', table: 'BlockedDate', column: 'affectsAllCats', sql: 'ALTER TABLE BlockedDate ADD COLUMN affectsAllCats INTEGER DEFAULT 0;', critical: true },
  {
    kind: 'column',
    table: 'BlockedDate',
    column: 'createdAt',
    sql: 'ALTER TABLE BlockedDate ADD COLUMN createdAt DATETIME;',
    fallbackSql: ['ALTER TABLE BlockedDate ADD COLUMN createdAt TEXT;'],
    critical: true,
  },

  { kind: 'column', table: 'Team', column: 'responsible', sql: 'ALTER TABLE Team ADD COLUMN responsible TEXT;', critical: true },
  { kind: 'column', table: 'Team', column: 'totalFeesOwed', sql: 'ALTER TABLE Team ADD COLUMN totalFeesOwed REAL DEFAULT 0;', critical: true },

  { kind: 'column', table: 'Championship', column: 'minTeamsPerCat', sql: 'ALTER TABLE Championship ADD COLUMN minTeamsPerCat INTEGER DEFAULT 3;', critical: true },
  { kind: 'column', table: 'Championship', column: 'isSimulation', sql: 'ALTER TABLE Championship ADD COLUMN isSimulation INTEGER DEFAULT 0;', critical: true },
  { kind: 'column', table: 'Championship', column: 'relegationDown', sql: 'ALTER TABLE Championship ADD COLUMN relegationDown INTEGER DEFAULT 0;', critical: true },
  { kind: 'column', table: 'Championship', column: 'promotionUp', sql: 'ALTER TABLE Championship ADD COLUMN promotionUp INTEGER DEFAULT 0;', critical: true },
  { kind: 'column', table: 'Championship', column: 'hasRelegation', sql: 'ALTER TABLE Championship ADD COLUMN hasRelegation INTEGER DEFAULT 0;', critical: true },
  { kind: 'column', table: 'Championship', column: 'maxGamesPerTeamPerDay', sql: 'ALTER TABLE Championship ADD COLUMN maxGamesPerTeamPerDay INTEGER DEFAULT 2;', critical: true },
  { kind: 'column', table: 'Championship', column: 'scheduleOptimizationMode', sql: "ALTER TABLE Championship ADD COLUMN scheduleOptimizationMode TEXT DEFAULT 'less_travel';", critical: true },

  { kind: 'column', table: 'ChampionshipCategory', column: 'isViable', sql: 'ALTER TABLE ChampionshipCategory ADD COLUMN isViable INTEGER DEFAULT 0;', critical: true },

  { kind: 'column', table: 'Standing', column: 'draws', sql: 'ALTER TABLE Standing ADD COLUMN draws INTEGER DEFAULT 0;', critical: true },
  { kind: 'column', table: 'Standing', column: 'pointsAgainst', sql: 'ALTER TABLE Standing ADD COLUMN pointsAgainst INTEGER DEFAULT 0;', critical: true },
  { kind: 'column', table: 'Standing', column: 'diff', sql: 'ALTER TABLE Standing ADD COLUMN diff INTEGER DEFAULT 0;', critical: true },
  { kind: 'column', table: 'Standing', column: 'updatedAt', sql: 'ALTER TABLE Standing ADD COLUMN updatedAt DATETIME;', critical: true },

  { kind: 'sql', name: 'BlockedDate_registrationId_idx', sql: 'CREATE INDEX IF NOT EXISTS BlockedDate_registrationId_idx ON BlockedDate(registrationId);' },
  { kind: 'sql', name: 'BlockedDate_startDate_endDate_idx', sql: 'CREATE INDEX IF NOT EXISTS BlockedDate_startDate_endDate_idx ON BlockedDate(startDate, endDate);' },
  { kind: 'sql', name: 'Standing_teamId_categoryId_key', sql: 'CREATE UNIQUE INDEX IF NOT EXISTS Standing_teamId_categoryId_key ON Standing(teamId, categoryId);' },
  { kind: 'sql', name: 'AthleteCategory_registrationId_idx', sql: 'CREATE INDEX IF NOT EXISTS AthleteCategory_registrationId_idx ON AthleteCategory(registrationId);' },
  { kind: 'sql', name: 'AthleteRegistrationRequest_teamId_idx', sql: 'CREATE INDEX IF NOT EXISTS AthleteRegistrationRequest_teamId_idx ON AthleteRegistrationRequest(teamId);' },
  { kind: 'sql', name: 'AthleteRegistrationRequest_athleteId_idx', sql: 'CREATE INDEX IF NOT EXISTS AthleteRegistrationRequest_athleteId_idx ON AthleteRegistrationRequest(athleteId);' },
  { kind: 'sql', name: 'AthleteRegistrationRequest_status_idx', sql: 'CREATE INDEX IF NOT EXISTS AthleteRegistrationRequest_status_idx ON AthleteRegistrationRequest(status);' },
  { kind: 'sql', name: 'AthleteRegistrationRequest_cbbCheckStatus_idx', sql: 'CREATE INDEX IF NOT EXISTS AthleteRegistrationRequest_cbbCheckStatus_idx ON AthleteRegistrationRequest(cbbCheckStatus);' },
  { kind: 'sql', name: 'AthleteRegistrationRequest_documentNumberNormalized_idx', sql: 'CREATE INDEX IF NOT EXISTS AthleteRegistrationRequest_documentNumberNormalized_idx ON AthleteRegistrationRequest(documentNumberNormalized);' },
  { kind: 'sql', name: 'AthleteRegistrationAuditLog_requestId_idx', sql: 'CREATE INDEX IF NOT EXISTS AthleteRegistrationAuditLog_requestId_idx ON AthleteRegistrationAuditLog(requestId);' },
  { kind: 'sql', name: 'AthleteRegistrationAuditLog_createdByUserId_idx', sql: 'CREATE INDEX IF NOT EXISTS AthleteRegistrationAuditLog_createdByUserId_idx ON AthleteRegistrationAuditLog(createdByUserId);' },
  { kind: 'sql', name: 'RegistrationFee_registrationId_idx', sql: 'CREATE INDEX IF NOT EXISTS RegistrationFee_registrationId_idx ON RegistrationFee(registrationId);' },
  { kind: 'sql', name: 'FeeConfig_key_key', sql: 'CREATE UNIQUE INDEX IF NOT EXISTS FeeConfig_key_key ON FeeConfig(key);' },

  // ─── Performance indexes para Game e Registration (paineis de campeonato) ───
  { kind: 'sql', name: 'Game_championshipId_status_idx',   sql: 'CREATE INDEX IF NOT EXISTS Game_championshipId_status_idx ON Game(championshipId, status);' },
  { kind: 'sql', name: 'Game_championshipId_dateTime_idx', sql: 'CREATE INDEX IF NOT EXISTS Game_championshipId_dateTime_idx ON Game(championshipId, dateTime);' },
  { kind: 'sql', name: 'Game_categoryId_status_idx',       sql: 'CREATE INDEX IF NOT EXISTS Game_categoryId_status_idx ON Game(categoryId, status);' },
  { kind: 'sql', name: 'Game_dateTime_idx',                sql: 'CREATE INDEX IF NOT EXISTS Game_dateTime_idx ON Game(dateTime);' },
  { kind: 'sql', name: 'Registration_championshipId_status_idx', sql: 'CREATE INDEX IF NOT EXISTS Registration_championshipId_status_idx ON Registration(championshipId, status);' },
  { kind: 'sql', name: 'Registration_teamId_idx',          sql: 'CREATE INDEX IF NOT EXISTS Registration_teamId_idx ON Registration(teamId);' },

  { kind: 'column', table: 'PlayerStat', column: 'assists',     sql: 'ALTER TABLE PlayerStat ADD COLUMN assists     INTEGER DEFAULT 0;', critical: true },
  { kind: 'column', table: 'PlayerStat', column: 'rebounds',    sql: 'ALTER TABLE PlayerStat ADD COLUMN rebounds    INTEGER DEFAULT 0;', critical: true },
  { kind: 'column', table: 'PlayerStat', column: 'blocks',      sql: 'ALTER TABLE PlayerStat ADD COLUMN blocks      INTEGER DEFAULT 0;', critical: true },
  { kind: 'column', table: 'PlayerStat', column: 'steals',      sql: 'ALTER TABLE PlayerStat ADD COLUMN steals      INTEGER DEFAULT 0;', critical: true },
  { kind: 'column', table: 'PlayerStat', column: 'threePoints', sql: 'ALTER TABLE PlayerStat ADD COLUMN threePoints INTEGER DEFAULT 0;', critical: true },

  { kind: 'column', table: 'Athlete', column: 'position',     sql: 'ALTER TABLE Athlete ADD COLUMN position     TEXT;', critical: true },
  { kind: 'column', table: 'Athlete', column: 'jerseyNumber', sql: 'ALTER TABLE Athlete ADD COLUMN jerseyNumber INTEGER;', critical: true },

  { kind: 'sql', name: 'GameRoster_gameId_teamId_key', sql: 'CREATE UNIQUE INDEX IF NOT EXISTS GameRoster_gameId_teamId_key ON GameRoster(gameId, teamId);' },
  { kind: 'sql', name: 'GameRosterPlayer_gameRosterId_athleteId_key', sql: 'CREATE UNIQUE INDEX IF NOT EXISTS GameRosterPlayer_gameRosterId_athleteId_key ON GameRosterPlayer(gameRosterId, athleteId);' },
  { kind: 'sql', name: 'GamePlayerStatLine_gameId_athleteId_key', sql: 'CREATE UNIQUE INDEX IF NOT EXISTS GamePlayerStatLine_gameId_athleteId_key ON GamePlayerStatLine(gameId, athleteId);' },
  { kind: 'sql', name: 'GameTeamStatLine_gameId_teamId_key', sql: 'CREATE UNIQUE INDEX IF NOT EXISTS GameTeamStatLine_gameId_teamId_key ON GameTeamStatLine(gameId, teamId);' },
  { kind: 'sql', name: 'GamePeriodScore_gameId_period_key', sql: 'CREATE UNIQUE INDEX IF NOT EXISTS GamePeriodScore_gameId_period_key ON GamePeriodScore(gameId, period);' },
  { kind: 'sql', name: 'GameOfficialReport_gameId_key', sql: 'CREATE UNIQUE INDEX IF NOT EXISTS GameOfficialReport_gameId_key ON GameOfficialReport(gameId);' },

  { kind: 'sql', name: 'Standing_pointsAgainst_backfill', sql: 'UPDATE Standing SET pointsAgainst = COALESCE(pointsAg, 0) WHERE pointsAgainst IS NULL OR pointsAgainst = 0;' },
  { kind: 'sql', name: 'Standing_diff_backfill', sql: 'UPDATE Standing SET diff = COALESCE(pointsFor, 0) - COALESCE(pointsAg, 0) WHERE diff IS NULL OR diff = 0;' },
  { kind: 'sql', name: 'Standing_updatedAt_backfill', sql: "UPDATE Standing SET updatedAt = CURRENT_TIMESTAMP WHERE updatedAt IS NULL OR updatedAt = '';" },
  { kind: 'sql', name: 'BlockedDate_endDate_backfill', sql: 'UPDATE BlockedDate SET endDate = startDate WHERE endDate IS NULL;' },
  { kind: 'sql', name: 'BlockedDate_createdAt_backfill', sql: "UPDATE BlockedDate SET createdAt = COALESCE(createdAt, CURRENT_TIMESTAMP) WHERE createdAt IS NULL OR createdAt = '';" },

  // ── Fase 1: Team new fields ──────────────────────────────────────────────
  { kind: 'column', table: 'Team', column: 'presidentName',   sql: 'ALTER TABLE "Team" ADD COLUMN "presidentName" TEXT' },
  { kind: 'column', table: 'Team', column: 'presidentPhone',  sql: 'ALTER TABLE "Team" ADD COLUMN "presidentPhone" TEXT' },
  { kind: 'column', table: 'Team', column: 'presidentMobile', sql: 'ALTER TABLE "Team" ADD COLUMN "presidentMobile" TEXT' },
  { kind: 'column', table: 'Team', column: 'presidentEmail',  sql: 'ALTER TABLE "Team" ADD COLUMN "presidentEmail" TEXT' },
  { kind: 'column', table: 'Team', column: 'secretaryName',   sql: 'ALTER TABLE "Team" ADD COLUMN "secretaryName" TEXT' },
  { kind: 'column', table: 'Team', column: 'secretaryPhone',  sql: 'ALTER TABLE "Team" ADD COLUMN "secretaryPhone" TEXT' },
  { kind: 'column', table: 'Team', column: 'secretaryMobile', sql: 'ALTER TABLE "Team" ADD COLUMN "secretaryMobile" TEXT' },
  { kind: 'column', table: 'Team', column: 'secretaryEmail',  sql: 'ALTER TABLE "Team" ADD COLUMN "secretaryEmail" TEXT' },
  { kind: 'column', table: 'Team', column: 'financialName',   sql: 'ALTER TABLE "Team" ADD COLUMN "financialName" TEXT' },
  { kind: 'column', table: 'Team', column: 'financialPhone',  sql: 'ALTER TABLE "Team" ADD COLUMN "financialPhone" TEXT' },
  { kind: 'column', table: 'Team', column: 'financialMobile', sql: 'ALTER TABLE "Team" ADD COLUMN "financialMobile" TEXT' },
  { kind: 'column', table: 'Team', column: 'financialEmail',  sql: 'ALTER TABLE "Team" ADD COLUMN "financialEmail" TEXT' },
  { kind: 'column', table: 'Team', column: 'cnpj',            sql: 'ALTER TABLE "Team" ADD COLUMN "cnpj" TEXT' },
  { kind: 'column', table: 'Team', column: 'website',         sql: 'ALTER TABLE "Team" ADD COLUMN "website" TEXT' },
  { kind: 'column', table: 'Team', column: 'instagram',       sql: 'ALTER TABLE "Team" ADD COLUMN "instagram" TEXT' },
  { kind: 'column', table: 'Team', column: 'whatsapp',        sql: 'ALTER TABLE "Team" ADD COLUMN "whatsapp" TEXT' },
  { kind: 'column', table: 'Team', column: 'observations',    sql: 'ALTER TABLE "Team" ADD COLUMN "observations" TEXT' },
  { kind: 'column', table: 'Team', column: 'isActive',        sql: 'ALTER TABLE "Team" ADD COLUMN "isActive" INTEGER NOT NULL DEFAULT 1' },

  // ── Fase 1: Gym new fields ───────────────────────────────────────────────
  { kind: 'column', table: 'Gym', column: 'state',        sql: 'ALTER TABLE "Gym" ADD COLUMN "state" TEXT NOT NULL DEFAULT "RS"' },
  { kind: 'column', table: 'Gym', column: 'courts',       sql: 'ALTER TABLE "Gym" ADD COLUMN "courts" INTEGER NOT NULL DEFAULT 1' },
  { kind: 'column', table: 'Gym', column: 'phone',        sql: 'ALTER TABLE "Gym" ADD COLUMN "phone" TEXT' },
  { kind: 'column', table: 'Gym', column: 'lat',          sql: 'ALTER TABLE "Gym" ADD COLUMN "lat" REAL' },
  { kind: 'column', table: 'Gym', column: 'lng',          sql: 'ALTER TABLE "Gym" ADD COLUMN "lng" REAL' },
  { kind: 'column', table: 'Gym', column: 'observations', sql: 'ALTER TABLE "Gym" ADD COLUMN "observations" TEXT' },
  { kind: 'column', table: 'Gym', column: 'isActive',     sql: 'ALTER TABLE "Gym" ADD COLUMN "isActive" INTEGER NOT NULL DEFAULT 1' },
  { kind: 'column', table: 'Gym', column: 'createdAt',    sql: 'ALTER TABLE "Gym" ADD COLUMN "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP' },

  // ── Fase 1: Athlete new fields ───────────────────────────────────────────
  { kind: 'column', table: 'Athlete', column: 'registrationNumber',    sql: 'ALTER TABLE "Athlete" ADD COLUMN "registrationNumber" INTEGER' },
  { kind: 'column', table: 'Athlete', column: 'registrationCBB',       sql: 'ALTER TABLE "Athlete" ADD COLUMN "registrationCBB" TEXT' },
  { kind: 'column', table: 'Athlete', column: 'registrationPrev',      sql: 'ALTER TABLE "Athlete" ADD COLUMN "registrationPrev" TEXT' },
  { kind: 'column', table: 'Athlete', column: 'filiationDate',         sql: 'ALTER TABLE "Athlete" ADD COLUMN "filiationDate" DATETIME' },
  { kind: 'column', table: 'Athlete', column: 'birthCity',             sql: 'ALTER TABLE "Athlete" ADD COLUMN "birthCity" TEXT' },
  { kind: 'column', table: 'Athlete', column: 'nationality',           sql: 'ALTER TABLE "Athlete" ADD COLUMN "nationality" TEXT DEFAULT "Brasileira"' },
  { kind: 'column', table: 'Athlete', column: 'education',             sql: 'ALTER TABLE "Athlete" ADD COLUMN "education" TEXT' },
  { kind: 'column', table: 'Athlete', column: 'maritalStatus',         sql: 'ALTER TABLE "Athlete" ADD COLUMN "maritalStatus" TEXT' },
  { kind: 'column', table: 'Athlete', column: 'rg',                    sql: 'ALTER TABLE "Athlete" ADD COLUMN "rg" TEXT' },
  { kind: 'column', table: 'Athlete', column: 'rgOrgan',               sql: 'ALTER TABLE "Athlete" ADD COLUMN "rgOrgan" TEXT' },
  { kind: 'column', table: 'Athlete', column: 'rgDate',                sql: 'ALTER TABLE "Athlete" ADD COLUMN "rgDate" DATETIME' },
  { kind: 'column', table: 'Athlete', column: 'cpf',                   sql: 'ALTER TABLE "Athlete" ADD COLUMN "cpf" TEXT' },
  { kind: 'column', table: 'Athlete', column: 'cep',                   sql: 'ALTER TABLE "Athlete" ADD COLUMN "cep" TEXT' },
  { kind: 'column', table: 'Athlete', column: 'state',                 sql: 'ALTER TABLE "Athlete" ADD COLUMN "state" TEXT' },
  { kind: 'column', table: 'Athlete', column: 'city',                  sql: 'ALTER TABLE "Athlete" ADD COLUMN "city" TEXT' },
  { kind: 'column', table: 'Athlete', column: 'address',               sql: 'ALTER TABLE "Athlete" ADD COLUMN "address" TEXT' },
  { kind: 'column', table: 'Athlete', column: 'addressNum',            sql: 'ALTER TABLE "Athlete" ADD COLUMN "addressNum" TEXT' },
  { kind: 'column', table: 'Athlete', column: 'addressComp',           sql: 'ALTER TABLE "Athlete" ADD COLUMN "addressComp" TEXT' },
  { kind: 'column', table: 'Athlete', column: 'fatherName',            sql: 'ALTER TABLE "Athlete" ADD COLUMN "fatherName" TEXT' },
  { kind: 'column', table: 'Athlete', column: 'motherName',            sql: 'ALTER TABLE "Athlete" ADD COLUMN "motherName" TEXT' },
  { kind: 'column', table: 'Athlete', column: 'phone',                 sql: 'ALTER TABLE "Athlete" ADD COLUMN "phone" TEXT' },
  { kind: 'column', table: 'Athlete', column: 'mobile',                sql: 'ALTER TABLE "Athlete" ADD COLUMN "mobile" TEXT' },
  { kind: 'column', table: 'Athlete', column: 'height',                sql: 'ALTER TABLE "Athlete" ADD COLUMN "height" REAL' },
  { kind: 'column', table: 'Athlete', column: 'weight',                sql: 'ALTER TABLE "Athlete" ADD COLUMN "weight" REAL' },
  { kind: 'column', table: 'Athlete', column: 'shirtNumber',           sql: 'ALTER TABLE "Athlete" ADD COLUMN "shirtNumber" INTEGER' },
  { kind: 'column', table: 'Athlete', column: 'situation',             sql: 'ALTER TABLE "Athlete" ADD COLUMN "situation" TEXT NOT NULL DEFAULT "PENDING"' },
  { kind: 'column', table: 'Athlete', column: 'activatedAt',           sql: 'ALTER TABLE "Athlete" ADD COLUMN "activatedAt" DATETIME' },
  { kind: 'column', table: 'Athlete', column: 'activatedBy',           sql: 'ALTER TABLE "Athlete" ADD COLUMN "activatedBy" TEXT' },
  { kind: 'column', table: 'Athlete', column: 'docCPFUrl',             sql: 'ALTER TABLE "Athlete" ADD COLUMN "docCPFUrl" TEXT' },
  { kind: 'column', table: 'Athlete', column: 'docRGFrontUrl',         sql: 'ALTER TABLE "Athlete" ADD COLUMN "docRGFrontUrl" TEXT' },
  { kind: 'column', table: 'Athlete', column: 'docRGBackUrl',          sql: 'ALTER TABLE "Athlete" ADD COLUMN "docRGBackUrl" TEXT' },
  { kind: 'column', table: 'Athlete', column: 'docBirthCertUrl',       sql: 'ALTER TABLE "Athlete" ADD COLUMN "docBirthCertUrl" TEXT' },
  { kind: 'column', table: 'Athlete', column: 'docOtherUrl',           sql: 'ALTER TABLE "Athlete" ADD COLUMN "docOtherUrl" TEXT' },
  { kind: 'column', table: 'Athlete', column: 'notes',                 sql: 'ALTER TABLE "Athlete" ADD COLUMN "notes" TEXT' },
  { kind: 'column', table: 'Athlete', column: 'saveWithoutValidation', sql: 'ALTER TABLE "Athlete" ADD COLUMN "saveWithoutValidation" INTEGER NOT NULL DEFAULT 0' },

  // ── PM-06.N: Athlete CPF frente+verso + contato filiação ─────────────────
  { kind: 'column', table: 'Athlete', column: 'docCPFFrontUrl',     sql: 'ALTER TABLE "Athlete" ADD COLUMN "docCPFFrontUrl" TEXT' },
  { kind: 'column', table: 'Athlete', column: 'docCPFBackUrl',      sql: 'ALTER TABLE "Athlete" ADD COLUMN "docCPFBackUrl" TEXT' },
  { kind: 'column', table: 'Athlete', column: 'parentContactPhone', sql: 'ALTER TABLE "Athlete" ADD COLUMN "parentContactPhone" TEXT' },
  { kind: 'column', table: 'Athlete', column: 'parentContactRole',  sql: 'ALTER TABLE "Athlete" ADD COLUMN "parentContactRole" TEXT' },

  // ── PM-06.N: Migração de dados: docCPFUrl → docCPFFrontUrl (idempotente) ─
  { kind: 'sql', name: 'PM06N_migrate_athlete_docCPFUrl', sql: 'UPDATE "Athlete" SET "docCPFFrontUrl" = "docCPFUrl" WHERE "docCPFFrontUrl" IS NULL AND "docCPFUrl" IS NOT NULL' },

  // ── PM-06.N: AthleteRegistrationRequest novos campos ─────────────────────
  { kind: 'column', table: 'AthleteRegistrationRequest', column: 'sex',                sql: 'ALTER TABLE "AthleteRegistrationRequest" ADD COLUMN "sex" TEXT' },
  { kind: 'column', table: 'AthleteRegistrationRequest', column: 'nationality',        sql: 'ALTER TABLE "AthleteRegistrationRequest" ADD COLUMN "nationality" TEXT' },
  { kind: 'column', table: 'AthleteRegistrationRequest', column: 'maritalStatus',      sql: 'ALTER TABLE "AthleteRegistrationRequest" ADD COLUMN "maritalStatus" TEXT' },
  { kind: 'column', table: 'AthleteRegistrationRequest', column: 'education',          sql: 'ALTER TABLE "AthleteRegistrationRequest" ADD COLUMN "education" TEXT' },
  { kind: 'column', table: 'AthleteRegistrationRequest', column: 'rg',                 sql: 'ALTER TABLE "AthleteRegistrationRequest" ADD COLUMN "rg" TEXT' },
  { kind: 'column', table: 'AthleteRegistrationRequest', column: 'rgOrgan',            sql: 'ALTER TABLE "AthleteRegistrationRequest" ADD COLUMN "rgOrgan" TEXT' },
  { kind: 'column', table: 'AthleteRegistrationRequest', column: 'rgDate',             sql: 'ALTER TABLE "AthleteRegistrationRequest" ADD COLUMN "rgDate" DATETIME' },
  { kind: 'column', table: 'AthleteRegistrationRequest', column: 'cpf',                sql: 'ALTER TABLE "AthleteRegistrationRequest" ADD COLUMN "cpf" TEXT' },
  { kind: 'column', table: 'AthleteRegistrationRequest', column: 'cep',                sql: 'ALTER TABLE "AthleteRegistrationRequest" ADD COLUMN "cep" TEXT' },
  { kind: 'column', table: 'AthleteRegistrationRequest', column: 'state',              sql: 'ALTER TABLE "AthleteRegistrationRequest" ADD COLUMN "state" TEXT' },
  { kind: 'column', table: 'AthleteRegistrationRequest', column: 'city',               sql: 'ALTER TABLE "AthleteRegistrationRequest" ADD COLUMN "city" TEXT' },
  { kind: 'column', table: 'AthleteRegistrationRequest', column: 'address',            sql: 'ALTER TABLE "AthleteRegistrationRequest" ADD COLUMN "address" TEXT' },
  { kind: 'column', table: 'AthleteRegistrationRequest', column: 'addressNum',         sql: 'ALTER TABLE "AthleteRegistrationRequest" ADD COLUMN "addressNum" TEXT' },
  { kind: 'column', table: 'AthleteRegistrationRequest', column: 'addressComp',        sql: 'ALTER TABLE "AthleteRegistrationRequest" ADD COLUMN "addressComp" TEXT' },
  { kind: 'column', table: 'AthleteRegistrationRequest', column: 'fatherName',         sql: 'ALTER TABLE "AthleteRegistrationRequest" ADD COLUMN "fatherName" TEXT' },
  { kind: 'column', table: 'AthleteRegistrationRequest', column: 'parentContactPhone', sql: 'ALTER TABLE "AthleteRegistrationRequest" ADD COLUMN "parentContactPhone" TEXT' },
  { kind: 'column', table: 'AthleteRegistrationRequest', column: 'parentContactRole',  sql: 'ALTER TABLE "AthleteRegistrationRequest" ADD COLUMN "parentContactRole" TEXT' },
  { kind: 'column', table: 'AthleteRegistrationRequest', column: 'height',             sql: 'ALTER TABLE "AthleteRegistrationRequest" ADD COLUMN "height" REAL' },
  { kind: 'column', table: 'AthleteRegistrationRequest', column: 'weight',             sql: 'ALTER TABLE "AthleteRegistrationRequest" ADD COLUMN "weight" REAL' },
  { kind: 'column', table: 'AthleteRegistrationRequest', column: 'position',           sql: 'ALTER TABLE "AthleteRegistrationRequest" ADD COLUMN "position" TEXT' },
  { kind: 'column', table: 'AthleteRegistrationRequest', column: 'jerseyNumber',       sql: 'ALTER TABLE "AthleteRegistrationRequest" ADD COLUMN "jerseyNumber" INTEGER' },
  { kind: 'column', table: 'AthleteRegistrationRequest', column: 'photoUrl',           sql: 'ALTER TABLE "AthleteRegistrationRequest" ADD COLUMN "photoUrl" TEXT' },
  { kind: 'column', table: 'AthleteRegistrationRequest', column: 'docCPFFrontUrl',     sql: 'ALTER TABLE "AthleteRegistrationRequest" ADD COLUMN "docCPFFrontUrl" TEXT' },
  { kind: 'column', table: 'AthleteRegistrationRequest', column: 'docCPFBackUrl',      sql: 'ALTER TABLE "AthleteRegistrationRequest" ADD COLUMN "docCPFBackUrl" TEXT' },
  { kind: 'column', table: 'AthleteRegistrationRequest', column: 'docRGFrontUrl',      sql: 'ALTER TABLE "AthleteRegistrationRequest" ADD COLUMN "docRGFrontUrl" TEXT' },
  { kind: 'column', table: 'AthleteRegistrationRequest', column: 'docRGBackUrl',       sql: 'ALTER TABLE "AthleteRegistrationRequest" ADD COLUMN "docRGBackUrl" TEXT' },
  { kind: 'column', table: 'AthleteRegistrationRequest', column: 'docBirthCertUrl',    sql: 'ALTER TABLE "AthleteRegistrationRequest" ADD COLUMN "docBirthCertUrl" TEXT' },
  { kind: 'column', table: 'AthleteRegistrationRequest', column: 'docOtherUrl',        sql: 'ALTER TABLE "AthleteRegistrationRequest" ADD COLUMN "docOtherUrl" TEXT' },

  // ── Fase 1: Referee new fields ───────────────────────────────────────────
  { kind: 'column', table: 'Referee', column: 'registrationNumber', sql: 'ALTER TABLE "Referee" ADD COLUMN "registrationNumber" INTEGER' },
  { kind: 'column', table: 'Referee', column: 'sex',                sql: 'ALTER TABLE "Referee" ADD COLUMN "sex" TEXT' },
  { kind: 'column', table: 'Referee', column: 'birthDate',          sql: 'ALTER TABLE "Referee" ADD COLUMN "birthDate" DATETIME' },
  { kind: 'column', table: 'Referee', column: 'rg',                 sql: 'ALTER TABLE "Referee" ADD COLUMN "rg" TEXT' },
  { kind: 'column', table: 'Referee', column: 'cpf',                sql: 'ALTER TABLE "Referee" ADD COLUMN "cpf" TEXT' },
  { kind: 'column', table: 'Referee', column: 'cep',                sql: 'ALTER TABLE "Referee" ADD COLUMN "cep" TEXT' },
  { kind: 'column', table: 'Referee', column: 'address',            sql: 'ALTER TABLE "Referee" ADD COLUMN "address" TEXT' },
  { kind: 'column', table: 'Referee', column: 'motherName',         sql: 'ALTER TABLE "Referee" ADD COLUMN "motherName" TEXT' },
  { kind: 'column', table: 'Referee', column: 'mobile',             sql: 'ALTER TABLE "Referee" ADD COLUMN "mobile" TEXT' },
  { kind: 'column', table: 'Referee', column: 'notes',              sql: 'ALTER TABLE "Referee" ADD COLUMN "notes" TEXT' },
  { kind: 'column', table: 'Referee', column: 'photoUrl',           sql: 'ALTER TABLE "Referee" ADD COLUMN "photoUrl" TEXT' },
  { kind: 'column', table: 'Referee', column: 'isActive',           sql: 'ALTER TABLE "Referee" ADD COLUMN "isActive" INTEGER NOT NULL DEFAULT 1' },
  { kind: 'column', table: 'Referee', column: 'categoryId',         sql: 'ALTER TABLE "Referee" ADD COLUMN "categoryId" TEXT' },

  // ── Fase 1: New tables ───────────────────────────────────────────────────
  {
    kind: 'table',
    table: 'CoachStaff',
    sql: `CREATE TABLE IF NOT EXISTS "CoachStaff" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "teamId" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "email" TEXT,
      "role" TEXT NOT NULL,
      "crefi" TEXT,
      "sex" TEXT,
      "birthDate" DATETIME,
      "rg" TEXT,
      "cpf" TEXT,
      "cep" TEXT,
      "state" TEXT,
      "city" TEXT,
      "address" TEXT,
      "addressNum" TEXT,
      "addressComp" TEXT,
      "fatherName" TEXT,
      "motherName" TEXT,
      "phone" TEXT,
      "phone2" TEXT,
      "mobile" TEXT,
      "notes" TEXT,
      "photoUrl" TEXT,
      "isActive" INTEGER NOT NULL DEFAULT 1,
      "situation" TEXT NOT NULL DEFAULT 'ACTIVE',
      "activatedAt" DATETIME,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    critical: true,
  },
  { kind: 'sql', name: 'CoachStaff_teamId_idx', sql: 'CREATE INDEX IF NOT EXISTS "CoachStaff_teamId_idx" ON "CoachStaff"("teamId")' },
  {
    kind: 'table',
    table: 'RefereeCategory',
    sql: `CREATE TABLE IF NOT EXISTS "RefereeCategory" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "remuneration" REAL NOT NULL DEFAULT 0,
      "isActive" INTEGER NOT NULL DEFAULT 1,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    critical: true,
  },
  {
    kind: 'table',
    table: 'OfficialRoster',
    sql: `CREATE TABLE IF NOT EXISTS "OfficialRoster" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "teamId" TEXT NOT NULL,
      "championshipId" TEXT NOT NULL,
      "categoryId" TEXT,
      "season" INTEGER NOT NULL DEFAULT 2026,
      "coachId" TEXT,
      "authorized1Id" TEXT,
      "authorized2Id" TEXT,
      "authorized3Id" TEXT,
      "status" TEXT NOT NULL DEFAULT 'DRAFT',
      "submittedAt" DATETIME,
      "approvedAt" DATETIME,
      "approvedBy" TEXT,
      "rejectionReason" TEXT,
      "pdfUrl" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    critical: true,
  },
  { kind: 'sql', name: 'OfficialRoster_teamId_idx', sql: 'CREATE INDEX IF NOT EXISTS "OfficialRoster_teamId_idx" ON "OfficialRoster"("teamId")' },
  { kind: 'sql', name: 'OfficialRoster_championshipId_idx', sql: 'CREATE INDEX IF NOT EXISTS "OfficialRoster_championshipId_idx" ON "OfficialRoster"("championshipId")' },
  {
    kind: 'table',
    table: 'OfficialRosterAthlete',
    sql: `CREATE TABLE IF NOT EXISTS "OfficialRosterAthlete" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "rosterId" TEXT NOT NULL,
      "athleteId" TEXT NOT NULL,
      "shirtNumber" INTEGER,
      "position" TEXT,
      "order" INTEGER NOT NULL DEFAULT 0
    )`,
    critical: true,
  },
  { kind: 'sql', name: 'OfficialRosterAthlete_unique', sql: 'CREATE UNIQUE INDEX IF NOT EXISTS "OfficialRosterAthlete_rosterId_athleteId_key" ON "OfficialRosterAthlete"("rosterId","athleteId")' },
  { kind: 'sql', name: 'OfficialRosterAthlete_rosterId_idx', sql: 'CREATE INDEX IF NOT EXISTS "OfficialRosterAthlete_rosterId_idx" ON "OfficialRosterAthlete"("rosterId")' },
  {
    kind: 'table',
    table: 'TeamFee',
    sql: `CREATE TABLE IF NOT EXISTS "TeamFee" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "teamId" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "description" TEXT NOT NULL,
      "amount" REAL NOT NULL,
      "dueDate" DATETIME NOT NULL,
      "paidAt" DATETIME,
      "paidAmount" REAL,
      "paymentProof" TEXT,
      "status" TEXT NOT NULL DEFAULT 'PENDING',
      "season" INTEGER NOT NULL DEFAULT 2026,
      "notes" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    critical: true,
  },
  { kind: 'sql', name: 'TeamFee_teamId_status_idx', sql: 'CREATE INDEX IF NOT EXISTS "TeamFee_teamId_status_idx" ON "TeamFee"("teamId","status")' },
  { kind: 'sql', name: 'TeamFee_season_status_idx', sql: 'CREATE INDEX IF NOT EXISTS "TeamFee_season_status_idx" ON "TeamFee"("season","status")' },
  // ─── Competições Externas ────────────────────────────────────────────────
  {
    kind: 'table',
    table: 'ExternalCompetition',
    sql: `CREATE TABLE IF NOT EXISTS "ExternalCompetition" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "organizer" TEXT NOT NULL,
      "city" TEXT,
      "state" TEXT,
      "startDate" DATETIME NOT NULL,
      "endDate" DATETIME NOT NULL,
      "categoriesJson" TEXT NOT NULL DEFAULT '[]',
      "gender" TEXT,
      "description" TEXT,
      "websiteUrl" TEXT,
      "logoUrl" TEXT,
      "isPublished" BOOLEAN NOT NULL DEFAULT false,
      "season" INTEGER NOT NULL DEFAULT 2026,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    critical: true,
  },
  {
    kind: 'table',
    table: 'ExternalCompetitionBlock',
    sql: `CREATE TABLE IF NOT EXISTS "ExternalCompetitionBlock" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "externalCompetitionId" TEXT NOT NULL,
      "championshipId" TEXT NOT NULL,
      "categoryId" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    critical: true,
  },
  { kind: 'sql', name: 'ExternalCompetitionBlock_unique', sql: 'CREATE UNIQUE INDEX IF NOT EXISTS "ExternalCompetitionBlock_externalCompetitionId_championshipId_categoryId_key" ON "ExternalCompetitionBlock"("externalCompetitionId","championshipId","categoryId")' },
  {
    kind: 'table',
    table: 'ExternalRegistration',
    sql: `CREATE TABLE IF NOT EXISTS "ExternalRegistration" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "externalCompetitionId" TEXT NOT NULL,
      "athleteId" TEXT,
      "teamId" TEXT,
      "categoryId" TEXT,
      "declaredBy" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'DECLARED',
      "notes" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    critical: true,
  },
  { kind: 'sql', name: 'ExternalRegistration_athleteId_idx', sql: 'CREATE INDEX IF NOT EXISTS "ExternalRegistration_athleteId_idx" ON "ExternalRegistration"("athleteId")' },
  { kind: 'sql', name: 'ExternalRegistration_teamId_idx', sql: 'CREATE INDEX IF NOT EXISTS "ExternalRegistration_teamId_idx" ON "ExternalRegistration"("teamId")' },
  {
    kind: 'table',
    table: 'FGBRegistrationBlock',
    sql: `CREATE TABLE IF NOT EXISTS "FGBRegistrationBlock" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "athleteId" TEXT,
      "teamId" TEXT,
      "championshipId" TEXT NOT NULL,
      "categoryId" TEXT,
      "reason" TEXT NOT NULL,
      "externalRegistrationId" TEXT NOT NULL,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "liftedAt" DATETIME,
      "liftedBy" TEXT,
      "liftReason" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    critical: true,
  },
  { kind: 'sql', name: 'FGBRegistrationBlock_athlete_championship_idx', sql: 'CREATE INDEX IF NOT EXISTS "FGBRegistrationBlock_athleteId_championshipId_idx" ON "FGBRegistrationBlock"("athleteId","championshipId")' },
  { kind: 'sql', name: 'FGBRegistrationBlock_team_championship_idx', sql: 'CREATE INDEX IF NOT EXISTS "FGBRegistrationBlock_teamId_championshipId_idx" ON "FGBRegistrationBlock"("teamId","championshipId")' },
  {
    kind: 'table',
    table: 'Article',
    sql: `CREATE TABLE IF NOT EXISTS "Article" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "slug" TEXT NOT NULL UNIQUE,
      "title" TEXT NOT NULL,
      "subtitle" TEXT,
      "content" TEXT NOT NULL,
      "coverImage" TEXT,
      "category" TEXT NOT NULL DEFAULT 'Conhecimento',
      "tags" TEXT,
      "author" TEXT NOT NULL DEFAULT 'Redação FGB',
      "source" TEXT,
      "sourceUrl" TEXT,
      "isPublished" BOOLEAN NOT NULL DEFAULT true,
      "publishedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "readTime" INTEGER NOT NULL DEFAULT 5,
      "views" INTEGER NOT NULL DEFAULT 0,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    critical: true,
  },
  { kind: 'sql', name: 'Article_category_isPublished_idx', sql: 'CREATE INDEX IF NOT EXISTS "Article_category_isPublished_idx" ON "Article"("category","isPublished")' },
  { kind: 'sql', name: 'Article_publishedAt_idx', sql: 'CREATE INDEX IF NOT EXISTS "Article_publishedAt_idx" ON "Article"("publishedAt")' },
  { kind: 'sql', name: 'Article_slug_idx', sql: 'CREATE INDEX IF NOT EXISTS "Article_slug_idx" ON "Article"("slug")' },

  // ─── Sprint 1: Championship — sancionamento + scheduling flexível + lifecycle ───
  { kind: 'column', table: 'Championship', column: 'sanctioning', sql: `ALTER TABLE "Championship" ADD COLUMN "sanctioning" TEXT NOT NULL DEFAULT 'FGB_OFFICIAL'` },
  { kind: 'column', table: 'Championship', column: 'countsForRanking', sql: `ALTER TABLE "Championship" ADD COLUMN "countsForRanking" BOOLEAN NOT NULL DEFAULT 1` },
  { kind: 'column', table: 'Championship', column: 'countsForBidEligibility', sql: `ALTER TABLE "Championship" ADD COLUMN "countsForBidEligibility" BOOLEAN NOT NULL DEFAULT 1` },
  { kind: 'column', table: 'Championship', column: 'sanctionNumber', sql: `ALTER TABLE "Championship" ADD COLUMN "sanctionNumber" TEXT` },
  { kind: 'column', table: 'Championship', column: 'modality', sql: `ALTER TABLE "Championship" ADD COLUMN "modality" TEXT NOT NULL DEFAULT '5x5'` },
  { kind: 'column', table: 'Championship', column: 'ageRangeMin', sql: `ALTER TABLE "Championship" ADD COLUMN "ageRangeMin" INTEGER` },
  { kind: 'column', table: 'Championship', column: 'ageRangeMax', sql: `ALTER TABLE "Championship" ADD COLUMN "ageRangeMax" INTEGER` },
  { kind: 'column', table: 'Championship', column: 'allowedWeekdaysJson', sql: `ALTER TABLE "Championship" ADD COLUMN "allowedWeekdaysJson" TEXT NOT NULL DEFAULT '[6,0]'` },
  { kind: 'column', table: 'Championship', column: 'timeSlotsJson', sql: `ALTER TABLE "Championship" ADD COLUMN "timeSlotsJson" TEXT NOT NULL DEFAULT '[]'` },
  { kind: 'column', table: 'Championship', column: 'blackoutDatesJson', sql: `ALTER TABLE "Championship" ADD COLUMN "blackoutDatesJson" TEXT NOT NULL DEFAULT '[]'` },
  { kind: 'column', table: 'Championship', column: 'minRestHoursBetweenGames', sql: `ALTER TABLE "Championship" ADD COLUMN "minRestHoursBetweenGames" REAL NOT NULL DEFAULT 20` },
  { kind: 'column', table: 'Championship', column: 'maxGamesPerTeamPerWeek', sql: `ALTER TABLE "Championship" ADD COLUMN "maxGamesPerTeamPerWeek" INTEGER NOT NULL DEFAULT 3` },
  { kind: 'column', table: 'Championship', column: 'homePattern', sql: `ALTER TABLE "Championship" ADD COLUMN "homePattern" TEXT NOT NULL DEFAULT 'ALTERNATED'` },

  // === PM-02 (2026-05-11) — campos explicitos de scheduling ===
  // Substituem constantes hardcoded em src/lib/scheduling/roundRobin.ts
  { kind: 'column', table: 'Championship', column: 'maxCategoriesPerDay', sql: `ALTER TABLE "Championship" ADD COLUMN "maxCategoriesPerDay" INTEGER NOT NULL DEFAULT 2` },
  { kind: 'column', table: 'Championship', column: 'minAgeGapBetweenGames', sql: `ALTER TABLE "Championship" ADD COLUMN "minAgeGapBetweenGames" INTEGER NOT NULL DEFAULT 3` },
  { kind: 'column', table: 'Championship', column: 'lunchBreakMinutes', sql: `ALTER TABLE "Championship" ADD COLUMN "lunchBreakMinutes" INTEGER NOT NULL DEFAULT 120` },
  { kind: 'column', table: 'Championship', column: 'afternoonStartTime', sql: `ALTER TABLE "Championship" ADD COLUMN "afternoonStartTime" TEXT NOT NULL DEFAULT '13:00'` },
  { kind: 'column', table: 'Championship', column: 'fridayEnabled', sql: `ALTER TABLE "Championship" ADD COLUMN "fridayEnabled" BOOLEAN NOT NULL DEFAULT 0` },
  { kind: 'column', table: 'Championship', column: 'sharedGymHandlingMode', sql: `ALTER TABLE "Championship" ADD COLUMN "sharedGymHandlingMode" TEXT NOT NULL DEFAULT 'SEQUENTIAL'` },

  { kind: 'column', table: 'Championship', column: 'regulationPdfUrl', sql: `ALTER TABLE "Championship" ADD COLUMN "regulationPdfUrl" TEXT` },
  { kind: 'column', table: 'Championship', column: 'regulationVersion', sql: `ALTER TABLE "Championship" ADD COLUMN "regulationVersion" INTEGER NOT NULL DEFAULT 1` },
  { kind: 'column', table: 'Championship', column: 'regulationPublishedAt', sql: `ALTER TABLE "Championship" ADD COLUMN "regulationPublishedAt" DATETIME` },
  { kind: 'column', table: 'Championship', column: 'publishedAt', sql: `ALTER TABLE "Championship" ADD COLUMN "publishedAt" DATETIME` },
  { kind: 'column', table: 'Championship', column: 'registrationOpenedAt', sql: `ALTER TABLE "Championship" ADD COLUMN "registrationOpenedAt" DATETIME` },
  { kind: 'column', table: 'Championship', column: 'technicalCongressDate', sql: `ALTER TABLE "Championship" ADD COLUMN "technicalCongressDate" DATETIME` },
  { kind: 'column', table: 'Championship', column: 'drawDate', sql: `ALTER TABLE "Championship" ADD COLUMN "drawDate" DATETIME` },
  { kind: 'column', table: 'Championship', column: 'finishedAt', sql: `ALTER TABLE "Championship" ADD COLUMN "finishedAt" DATETIME` },

  // ─── Sprint 1: ChampionshipCategory ───
  { kind: 'column', table: 'ChampionshipCategory', column: 'minBirthYear', sql: `ALTER TABLE "ChampionshipCategory" ADD COLUMN "minBirthYear" INTEGER` },
  { kind: 'column', table: 'ChampionshipCategory', column: 'maxBirthYear', sql: `ALTER TABLE "ChampionshipCategory" ADD COLUMN "maxBirthYear" INTEGER` },
  { kind: 'column', table: 'ChampionshipCategory', column: 'modality', sql: `ALTER TABLE "ChampionshipCategory" ADD COLUMN "modality" TEXT NOT NULL DEFAULT '5x5'` },

  // ─── Sprint 1: Athlete BID ───
  { kind: 'column', table: 'Athlete', column: 'bidPublishedAt', sql: `ALTER TABLE "Athlete" ADD COLUMN "bidPublishedAt" DATETIME` },
  { kind: 'column', table: 'Athlete', column: 'bidNumber', sql: `ALTER TABLE "Athlete" ADD COLUMN "bidNumber" TEXT` },

  // ─── Sprint 1: Registration elegibilidade ───
  { kind: 'column', table: 'Registration', column: 'eligibilityWindowStart', sql: `ALTER TABLE "Registration" ADD COLUMN "eligibilityWindowStart" DATETIME` },
  { kind: 'column', table: 'Registration', column: 'eligibilityWindowEnd', sql: `ALTER TABLE "Registration" ADD COLUMN "eligibilityWindowEnd" DATETIME` },
  { kind: 'column', table: 'Registration', column: 'certNegativaUrl', sql: `ALTER TABLE "Registration" ADD COLUMN "certNegativaUrl" TEXT` },

  // ─── Sprint 1: Tabelas novas ───
  {
    kind: 'table',
    table: 'TiebreakerRule',
    sql: `CREATE TABLE IF NOT EXISTS "TiebreakerRule" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "championshipId" TEXT NOT NULL,
      "order" INTEGER NOT NULL,
      "type" TEXT NOT NULL
    )`,
    critical: true,
  },
  { kind: 'sql', name: 'TiebreakerRule_championship_order_idx', sql: 'CREATE INDEX IF NOT EXISTS "TiebreakerRule_championshipId_order_idx" ON "TiebreakerRule"("championshipId","order")' },

  {
    kind: 'table',
    table: 'ChampionshipPhase',
    sql: `CREATE TABLE IF NOT EXISTS "ChampionshipPhase" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "championshipId" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "order" INTEGER NOT NULL DEFAULT 0,
      "formatType" TEXT NOT NULL DEFAULT 'ROUND_ROBIN',
      "formatConfigJson" TEXT NOT NULL DEFAULT '{}',
      "tiebreakerChain" TEXT NOT NULL DEFAULT 'h2h_record,h2h_diff,h2h_for,all_diff,all_for,draw',
      "startDate" DATETIME,
      "endDate" DATETIME,
      "qualifiesNextCount" INTEGER,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    critical: true,
  },
  { kind: 'sql', name: 'ChampionshipPhase_championship_order_idx', sql: 'CREATE INDEX IF NOT EXISTS "ChampionshipPhase_championshipId_order_idx" ON "ChampionshipPhase"("championshipId","order")' },

  {
    kind: 'table',
    table: 'ChampionshipPhaseCategory',
    sql: `CREATE TABLE IF NOT EXISTS "ChampionshipPhaseCategory" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "phaseId" TEXT NOT NULL,
      "categoryId" TEXT NOT NULL
    )`,
    critical: true,
  },
  { kind: 'sql', name: 'ChampionshipPhaseCategory_unique', sql: 'CREATE UNIQUE INDEX IF NOT EXISTS "ChampionshipPhaseCategory_phaseId_categoryId_key" ON "ChampionshipPhaseCategory"("phaseId","categoryId")' },

  {
    kind: 'table',
    table: 'ChampionshipGroup',
    sql: `CREATE TABLE IF NOT EXISTS "ChampionshipGroup" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "phaseId" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "order" INTEGER NOT NULL DEFAULT 0,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    critical: true,
  },
  { kind: 'sql', name: 'ChampionshipGroup_phase_idx', sql: 'CREATE INDEX IF NOT EXISTS "ChampionshipGroup_phaseId_idx" ON "ChampionshipGroup"("phaseId")' },

  {
    kind: 'table',
    table: 'GameSeries',
    sql: `CREATE TABLE IF NOT EXISTS "GameSeries" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "phaseId" TEXT NOT NULL,
      "team1Id" TEXT NOT NULL,
      "team2Id" TEXT NOT NULL,
      "bestOf" INTEGER NOT NULL DEFAULT 1,
      "homePattern" TEXT NOT NULL DEFAULT 'ALTERNATED',
      "winnerTeamId" TEXT,
      "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    critical: true,
  },
  { kind: 'sql', name: 'GameSeries_phase_idx', sql: 'CREATE INDEX IF NOT EXISTS "GameSeries_phaseId_idx" ON "GameSeries"("phaseId")' },
  { kind: 'sql', name: 'GameSeries_team1_idx', sql: 'CREATE INDEX IF NOT EXISTS "GameSeries_team1Id_idx" ON "GameSeries"("team1Id")' },
  { kind: 'sql', name: 'GameSeries_team2_idx', sql: 'CREATE INDEX IF NOT EXISTS "GameSeries_team2Id_idx" ON "GameSeries"("team2Id")' },

  {
    kind: 'table',
    table: 'TournamentDocument',
    sql: `CREATE TABLE IF NOT EXISTS "TournamentDocument" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "championshipId" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "fileUrl" TEXT NOT NULL,
      "version" INTEGER NOT NULL DEFAULT 1,
      "publishedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "supersedesId" TEXT,
      "notes" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    critical: true,
  },
  { kind: 'sql', name: 'TournamentDocument_championship_type_idx', sql: 'CREATE INDEX IF NOT EXISTS "TournamentDocument_championshipId_type_idx" ON "TournamentDocument"("championshipId","type")' },

  {
    kind: 'table',
    table: 'ChampionshipStatusTransition',
    sql: `CREATE TABLE IF NOT EXISTS "ChampionshipStatusTransition" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "championshipId" TEXT NOT NULL,
      "fromStatus" TEXT NOT NULL,
      "toStatus" TEXT NOT NULL,
      "reason" TEXT,
      "performedBy" TEXT,
      "metadataJson" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    critical: true,
  },
  { kind: 'sql', name: 'ChampionshipStatusTransition_championship_createdAt_idx', sql: 'CREATE INDEX IF NOT EXISTS "ChampionshipStatusTransition_championshipId_createdAt_idx" ON "ChampionshipStatusTransition"("championshipId","createdAt")' },

  // === FASE 1 (2026-05-11) — Lifecycle state machine + atleta verificado FGB + cadeia de correcao + versionamento de sumula ===
  // Documentado em docs/fase-1-migration-plan.md
  { kind: 'column', table: 'Game', column: 'lifecycleState', sql: "ALTER TABLE Game ADD COLUMN lifecycleState TEXT NOT NULL DEFAULT 'SCHEDULED';", critical: true },
  { kind: 'column', table: 'Game', column: 'lifecycleVersion', sql: 'ALTER TABLE Game ADD COLUMN lifecycleVersion INTEGER NOT NULL DEFAULT 0;', critical: true },
  { kind: 'sql', name: 'Game_lifecycleState_idx', sql: 'CREATE INDEX IF NOT EXISTS "Game_lifecycleState_idx" ON "Game"("lifecycleState")' },

  { kind: 'column', table: 'Athlete', column: 'verifiedFgb', sql: 'ALTER TABLE Athlete ADD COLUMN verifiedFgb INTEGER NOT NULL DEFAULT 0;', critical: true },
  { kind: 'column', table: 'Athlete', column: 'verifiedFgbAt', sql: 'ALTER TABLE Athlete ADD COLUMN verifiedFgbAt DATETIME;', critical: true },
  { kind: 'column', table: 'Athlete', column: 'verifiedFgbBy', sql: 'ALTER TABLE Athlete ADD COLUMN verifiedFgbBy TEXT;', critical: true },
  { kind: 'sql', name: 'Athlete_verifiedFgb_idx', sql: 'CREATE INDEX IF NOT EXISTS "Athlete_verifiedFgb_idx" ON "Athlete"("verifiedFgb")' },

  { kind: 'column', table: 'GameEvent', column: 'correctsEventId', sql: 'ALTER TABLE GameEvent ADD COLUMN correctsEventId TEXT;', critical: true },
  { kind: 'column', table: 'GameEvent', column: 'supersededByEventId', sql: 'ALTER TABLE GameEvent ADD COLUMN supersededByEventId TEXT;', critical: true },
  { kind: 'sql', name: 'GameEvent_correctsEventId_idx', sql: 'CREATE INDEX IF NOT EXISTS "GameEvent_correctsEventId_idx" ON "GameEvent"("correctsEventId")' },
  { kind: 'sql', name: 'GameEvent_supersededByEventId_idx', sql: 'CREATE INDEX IF NOT EXISTS "GameEvent_supersededByEventId_idx" ON "GameEvent"("supersededByEventId")' },

  { kind: 'column', table: 'GameOfficialReport', column: 'currentVersion', sql: 'ALTER TABLE GameOfficialReport ADD COLUMN currentVersion INTEGER NOT NULL DEFAULT 1;', critical: true },

  {
    kind: 'table',
    table: 'GameOfficialReportVersion',
    sql: `CREATE TABLE IF NOT EXISTS "GameOfficialReportVersion" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "reportId" TEXT NOT NULL,
      "version" INTEGER NOT NULL,
      "finalHomeScore" INTEGER NOT NULL DEFAULT 0,
      "finalAwayScore" INTEGER NOT NULL DEFAULT 0,
      "overtimeCount" INTEGER NOT NULL DEFAULT 0,
      "officialPdfUrl" TEXT,
      "boxScoreJson" TEXT,
      "playByPlayJson" TEXT,
      "signedOffByUserId" TEXT,
      "finalizedAt" DATETIME,
      "reason" TEXT,
      "createdByUserId" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("reportId") REFERENCES "GameOfficialReport"("id") ON DELETE CASCADE ON UPDATE CASCADE
    )`,
    critical: true,
  },
  { kind: 'sql', name: 'GameOfficialReportVersion_reportId_version_key', sql: 'CREATE UNIQUE INDEX IF NOT EXISTS "GameOfficialReportVersion_reportId_version_key" ON "GameOfficialReportVersion"("reportId","version")' },
  { kind: 'sql', name: 'GameOfficialReportVersion_reportId_idx', sql: 'CREATE INDEX IF NOT EXISTS "GameOfficialReportVersion_reportId_idx" ON "GameOfficialReportVersion"("reportId")' },

  // === FASE 6.B (2026-05-11) — Registration lifecycle + audit fields ===
  // Documentado em docs/fase-6-registrations-audit.md
  { kind: 'column', table: 'Registration', column: 'lifecycleState', sql: "ALTER TABLE Registration ADD COLUMN lifecycleState TEXT NOT NULL DEFAULT 'SUBMITTED';", critical: true },
  { kind: 'column', table: 'Registration', column: 'lifecycleVersion', sql: 'ALTER TABLE Registration ADD COLUMN lifecycleVersion INTEGER NOT NULL DEFAULT 0;', critical: true },
  { kind: 'column', table: 'Registration', column: 'submittedAt', sql: 'ALTER TABLE Registration ADD COLUMN submittedAt DATETIME;', critical: true },
  { kind: 'column', table: 'Registration', column: 'confirmedAt', sql: 'ALTER TABLE Registration ADD COLUMN confirmedAt DATETIME;', critical: true },
  { kind: 'column', table: 'Registration', column: 'confirmedByUserId', sql: 'ALTER TABLE Registration ADD COLUMN confirmedByUserId TEXT;', critical: true },
  { kind: 'column', table: 'Registration', column: 'rejectedAt', sql: 'ALTER TABLE Registration ADD COLUMN rejectedAt DATETIME;', critical: true },
  { kind: 'column', table: 'Registration', column: 'rejectedByUserId', sql: 'ALTER TABLE Registration ADD COLUMN rejectedByUserId TEXT;', critical: true },
  { kind: 'column', table: 'Registration', column: 'rejectionReason', sql: 'ALTER TABLE Registration ADD COLUMN rejectionReason TEXT;', critical: true },
  { kind: 'sql', name: 'Registration_lifecycleState_idx', sql: 'CREATE INDEX IF NOT EXISTS "Registration_lifecycleState_idx" ON "Registration"("lifecycleState")' },

  // === FASE 5.E (2026-05-11) — Hard immutability via SQLite triggers ===
  // Documentado em docs/fase-5e-immutability-triggers.md
  //
  // Estrategia "semantic": bloqueia UPDATE de campos de dados quando
  // lifecycleState IN ('CONFIRMED','PUBLISHED') E o estado nao esta saindo
  // do imutavel. Transicoes legitimas (CONFIRMED->UNDER_REVIEW via
  // requestReview, CONFIRMED->PUBLISHED via publishGame) passam pois
  // NEW.lifecycleState != OLD.lifecycleState.
  //
  // Defesa em profundidade: a state machine app-level ja garante isso, mas
  // o trigger protege contra UPDATEs ad-hoc (script, console SQL, bug futuro).
  {
    kind: 'sql',
    name: 'Game_immutable_data_update_trigger',
    sql: `CREATE TRIGGER IF NOT EXISTS "Game_immutable_data_update"
      BEFORE UPDATE ON "Game"
      FOR EACH ROW
      WHEN OLD.lifecycleState IN ('CONFIRMED', 'PUBLISHED')
        AND NEW.lifecycleState = OLD.lifecycleState
        AND (
          COALESCE(NEW.homeScore, -1)         != COALESCE(OLD.homeScore, -1)
          OR COALESCE(NEW.awayScore, -1)      != COALESCE(OLD.awayScore, -1)
          OR COALESCE(NEW.homeTeamId, '')     != COALESCE(OLD.homeTeamId, '')
          OR COALESCE(NEW.awayTeamId, '')     != COALESCE(OLD.awayTeamId, '')
          OR COALESCE(NEW.dateTime, '')       != COALESCE(OLD.dateTime, '')
          OR COALESCE(NEW.phase, -1)          != COALESCE(OLD.phase, -1)
          OR COALESCE(NEW.round, -1)          != COALESCE(OLD.round, -1)
          OR COALESCE(NEW.categoryId, '')     != COALESCE(OLD.categoryId, '')
          OR COALESCE(NEW.championshipId, '') != COALESCE(OLD.championshipId, '')
          OR COALESCE(NEW.status, '')         != COALESCE(OLD.status, '')
        )
      BEGIN
        SELECT RAISE(ABORT, 'Game CONFIRMED/PUBLISHED imutavel: solicite UNDER_REVIEW antes de modificar dados');
      END;`,
  },
  {
    kind: 'sql',
    name: 'Game_immutable_delete_trigger',
    sql: `CREATE TRIGGER IF NOT EXISTS "Game_immutable_delete"
      BEFORE DELETE ON "Game"
      FOR EACH ROW
      WHEN OLD.lifecycleState IN ('CONFIRMED', 'PUBLISHED')
      BEGIN
        SELECT RAISE(ABORT, 'Game CONFIRMED/PUBLISHED nao pode ser deletado');
      END;`,
  },

  // === PM-01 (2026-05-11) — FIBA helpers + historical lock + audit log ===
  // Documentado em Downloads/files (4)/01-PM-FIBA-HELPERS.md
  { kind: 'column', table: 'User', column: 'isFederationSuperAdmin', sql: 'ALTER TABLE "User" ADD COLUMN "isFederationSuperAdmin" INTEGER NOT NULL DEFAULT 0;', critical: true },
  { kind: 'column', table: 'Game', column: 'isHistoricallyLocked', sql: 'ALTER TABLE "Game" ADD COLUMN "isHistoricallyLocked" INTEGER NOT NULL DEFAULT 0;', critical: true },
  { kind: 'column', table: 'Game', column: 'lockedAt', sql: 'ALTER TABLE "Game" ADD COLUMN "lockedAt" DATETIME;', critical: true },
  { kind: 'column', table: 'Game', column: 'lockedByUserId', sql: 'ALTER TABLE "Game" ADD COLUMN "lockedByUserId" TEXT;', critical: true },
  { kind: 'column', table: 'Game', column: 'lockReason', sql: 'ALTER TABLE "Game" ADD COLUMN "lockReason" TEXT;', critical: true },
  {
    kind: 'table',
    table: 'HistoricalDataAuditLog',
    sql: `CREATE TABLE IF NOT EXISTS "HistoricalDataAuditLog" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "entityType" TEXT NOT NULL,
      "entityId" TEXT NOT NULL,
      "fieldChanged" TEXT,
      "oldValue" TEXT,
      "newValue" TEXT,
      "reason" TEXT NOT NULL,
      "performedByUserId" TEXT NOT NULL,
      "performedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    critical: true,
  },
  { kind: 'sql', name: 'HistoricalDataAuditLog_entity_idx', sql: 'CREATE INDEX IF NOT EXISTS "HistoricalDataAuditLog_entityType_entityId_idx" ON "HistoricalDataAuditLog"("entityType","entityId")' },
  { kind: 'sql', name: 'HistoricalDataAuditLog_performedBy_idx', sql: 'CREATE INDEX IF NOT EXISTS "HistoricalDataAuditLog_performedByUserId_idx" ON "HistoricalDataAuditLog"("performedByUserId")' },
  { kind: 'sql', name: 'HistoricalDataAuditLog_performedAt_idx', sql: 'CREATE INDEX IF NOT EXISTS "HistoricalDataAuditLog_performedAt_idx" ON "HistoricalDataAuditLog"("performedAt")' },
]

let schemaEnsured = false
let schemaEnsurePromise: Promise<void> | null = null

function isIgnorablePatchError(message: string) {
  const normalized = message.toLowerCase()
  return (
    normalized.includes('duplicate column name') ||
    normalized.includes('already exists') ||
    normalized.includes('duplicate index name')
  )
}

async function tableExists(table: string) {
  const rows = await (prisma as any).$queryRawUnsafe(
    `SELECT name FROM sqlite_master WHERE type='table' AND name='${table}' LIMIT 1;`
  )
  return Array.isArray(rows) && rows.length > 0
}

async function columnExists(table: string, column: string) {
  const rows = await (prisma as any).$queryRawUnsafe(`PRAGMA table_info("${table}");`)
  return Array.isArray(rows) && rows.some((row: any) => row?.name === column)
}

async function runColumnPatch(patch: ColumnPatch) {
  const target = `${patch.table}.${patch.column}`

  if (await columnExists(patch.table, patch.column)) {
    return { target, sql: patch.sql, status: 'SKIPPED_EXISTS' as const }
  }

  let lastError = ''

  for (const sql of [patch.sql, ...(patch.fallbackSql ?? [])]) {
    try {
      await (prisma as any).$executeRawUnsafe(sql)

      if (await columnExists(patch.table, patch.column)) {
        return { target, sql, status: 'SUCCESS' as const }
      }
    } catch (error: any) {
      const message = error?.message || 'Erro desconhecido'
      lastError = message

      if (isIgnorablePatchError(message) && (await columnExists(patch.table, patch.column))) {
        return { target, sql, status: 'SKIPPED_EXISTS' as const }
      }
    }
  }

  return {
    target,
    sql: patch.sql,
    status: 'ERROR' as const,
    error: lastError || `Coluna ${target} nao foi criada.`,
  }
}

async function runTablePatch(patch: TablePatch) {
  const target = patch.table

  if (await tableExists(patch.table)) {
    return { target, sql: patch.sql, status: 'SKIPPED_EXISTS' as const }
  }

  try {
    await (prisma as any).$executeRawUnsafe(patch.sql)

    if (await tableExists(patch.table)) {
      return { target, sql: patch.sql, status: 'SUCCESS' as const }
    }
  } catch (error: any) {
    const message = error?.message || 'Erro desconhecido'
    if (isIgnorablePatchError(message) && (await tableExists(patch.table))) {
      return { target, sql: patch.sql, status: 'SKIPPED_EXISTS' as const }
    }

    return { target, sql: patch.sql, status: 'ERROR' as const, error: message }
  }

  return { target, sql: patch.sql, status: 'ERROR' as const, error: `Tabela ${patch.table} nao foi criada.` }
}

async function runSqlPatch(patch: SqlPatch) {
  try {
    await (prisma as any).$executeRawUnsafe(patch.sql)
    return { target: patch.name, sql: patch.sql, status: 'SUCCESS' as const }
  } catch (error: any) {
    const message = error?.message || 'Erro desconhecido'
    if (isIgnorablePatchError(message)) {
      return { target: patch.name, sql: patch.sql, status: 'SKIPPED_EXISTS' as const }
    }

    return { target: patch.name, sql: patch.sql, status: 'ERROR' as const, error: message }
  }
}

export function isDatabaseSchemaError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  const normalized = message.toLowerCase()
  return (
    normalized.includes('sql_input_error') ||
    normalized.includes('no such column') ||
    normalized.includes('no such table') ||
    normalized.includes('duplicate column name')
  )
}

export async function runDatabasePatch() {
  const results: PatchResult[] = []

  for (const patch of schemaPatches) {
    if (patch.kind === 'column') {
      results.push(await runColumnPatch(patch))
      continue
    }

    if (patch.kind === 'table') {
      results.push(await runTablePatch(patch))
      continue
    }

    results.push(await runSqlPatch(patch))
  }

  return results
}

export async function ensureDatabaseSchema(force = false) {
  if (process.env.SKIP_AUTO_SCHEMA_ENSURE === 'true' && !force) {
    return
  }

  // This patch system is SQLite-only — skip silently on PostgreSQL/Supabase
  const dbUrl = process.env.DATABASE_URL ?? ''
  if (!(dbUrl.startsWith('file:') || dbUrl.startsWith('libsql:'))) {
    return
  }

  if (schemaEnsured && !force) {
    return
  }

  if (!schemaEnsurePromise || force) {
    schemaEnsurePromise = (async () => {
      const results = await runDatabasePatch()
      const criticalErrors = results.filter((result) => {
        if (result.status !== 'ERROR') return false

        return schemaPatches.some((patch) => {
          if ('table' in patch && patch.kind === 'table') return patch.table === result.target && patch.critical
          if ('column' in patch && patch.kind === 'column') return `${patch.table}.${patch.column}` === result.target && patch.critical
          return false
        })
      })

      if (criticalErrors.length > 0) {
        console.error('[DB_PATCH] Critical schema patch errors:', criticalErrors)
        throw new Error(
          criticalErrors.map((error) => `${error.target}: ${error.error || 'erro desconhecido'}`).join(' | ')
        )
      }

      schemaEnsured = true
    })()
  }

  await schemaEnsurePromise
}

export async function withDatabaseSchemaRetry<T>(operation: () => Promise<T>) {
  try {
    return await operation()
  } catch (error) {
    if (!isDatabaseSchemaError(error)) {
      throw error
    }

    await ensureDatabaseSchema(true)
    return operation()
  }
}
