CREATE TABLE IF NOT EXISTS AthleteRegistrationRequest (
  id TEXT PRIMARY KEY,
  teamId TEXT NOT NULL,
  athleteId TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  fullName TEXT NOT NULL,
  birthDate DATETIME NOT NULL,
  documentNumber TEXT NOT NULL,
  documentNumberNormalized TEXT NOT NULL,
  motherName TEXT,
  phone TEXT,
  email TEXT,
  requestedCategoryLabel TEXT,
  cbbRegistrationNumber TEXT,
  cbbCheckStatus TEXT NOT NULL DEFAULT 'PENDING',
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
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teamId) REFERENCES Team(id) ON DELETE CASCADE,
  FOREIGN KEY (athleteId) REFERENCES Athlete(id) ON DELETE SET NULL,
  FOREIGN KEY (cbbCheckedByUserId) REFERENCES User(id) ON DELETE SET NULL,
  FOREIGN KEY (reviewedByUserId) REFERENCES User(id) ON DELETE SET NULL,
  FOREIGN KEY (approvedByUserId) REFERENCES User(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS AthleteRegistrationAuditLog (
  id TEXT PRIMARY KEY,
  requestId TEXT NOT NULL,
  action TEXT NOT NULL,
  description TEXT NOT NULL,
  metadataJson TEXT,
  createdByUserId TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (requestId) REFERENCES AthleteRegistrationRequest(id) ON DELETE CASCADE,
  FOREIGN KEY (createdByUserId) REFERENCES User(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS AthleteRegistrationRequest_teamId_idx
  ON AthleteRegistrationRequest(teamId);

CREATE INDEX IF NOT EXISTS AthleteRegistrationRequest_athleteId_idx
  ON AthleteRegistrationRequest(athleteId);

CREATE INDEX IF NOT EXISTS AthleteRegistrationRequest_status_idx
  ON AthleteRegistrationRequest(status);

CREATE INDEX IF NOT EXISTS AthleteRegistrationRequest_cbbCheckStatus_idx
  ON AthleteRegistrationRequest(cbbCheckStatus);

CREATE INDEX IF NOT EXISTS AthleteRegistrationRequest_documentNumberNormalized_idx
  ON AthleteRegistrationRequest(documentNumberNormalized);

CREATE INDEX IF NOT EXISTS AthleteRegistrationAuditLog_requestId_idx
  ON AthleteRegistrationAuditLog(requestId);

CREATE INDEX IF NOT EXISTS AthleteRegistrationAuditLog_createdByUserId_idx
  ON AthleteRegistrationAuditLog(createdByUserId);
