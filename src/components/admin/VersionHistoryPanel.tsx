import { History, FileCheck, RotateCcw, Send, ShieldCheck, AlertTriangle, X as XIcon } from "lucide-react"

type Version = {
  version: number
  finalHomeScore: number
  finalAwayScore: number
  finalizedAt: Date | null
  reason: string | null
  createdAt: Date
  createdByUserId: string | null
}

type AuditEntry = {
  id: string
  actionType: string
  actorUserId: string | null
  description: string
  metaJson: string | null
  createdAt: Date
}

type Props = {
  versions: Version[]
  audit: AuditEntry[]
}

const ACTION_META: Record<string, { label: string; icon: React.ReactNode; tone: string }> = {
  GAME_CLOSED: {
    label: "Fechado",
    icon: <FileCheck size={12} />,
    tone: "var(--fgb-green-700)",
  },
  GAME_PUBLISHED: {
    label: "Publicado",
    icon: <Send size={12} />,
    tone: "var(--fgb-green-800)",
  },
  REVIEW_REQUESTED: {
    label: "Revisão",
    icon: <RotateCcw size={12} />,
    tone: "var(--fgb-yellow-700)",
  },
  LIFECYCLE_TRANSITION: {
    label: "Transição",
    icon: <ShieldCheck size={12} />,
    tone: "var(--fgb-navy-700)",
  },
}

function actionMeta(action: string) {
  return (
    ACTION_META[action] ?? {
      label: action,
      icon: <ShieldCheck size={12} />,
      tone: "var(--fgb-ink-600)",
    }
  )
}

export function VersionHistoryPanel({ versions, audit }: Props) {
  if (versions.length === 0 && audit.length === 0) {
    return null
  }

  return (
    <section
      className="rounded-lg overflow-hidden"
      style={{ background: "#fff", border: "1px solid var(--fgb-ink-200)" }}
    >
      <div
        className="px-5 py-3 flex items-center gap-2"
        style={{
          background: "var(--fgb-green-50)",
          borderBottom: "1px solid var(--fgb-green-200)",
        }}
      >
        <History size={14} style={{ color: "var(--fgb-green-700)" }} aria-hidden />
        <h3
          style={{
            fontFamily: "var(--font-anton)",
            fontSize: 16,
            textTransform: "uppercase",
            color: "var(--fgb-ink-900)",
            letterSpacing: "0.02em",
            lineHeight: 1,
          }}
        >
          Histórico Oficial
        </h3>
        <span
          className="fgb-label ml-auto"
          style={{ fontSize: 9, color: "var(--fgb-ink-500)", letterSpacing: "0.18em" }}
        >
          imutável
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
        {/* Versões da súmula */}
        <div
          className="px-5 py-4"
          style={{ borderRight: "1px solid var(--fgb-ink-100)" }}
        >
          <p
            className="fgb-label mb-3"
            style={{ fontSize: 10, color: "var(--fgb-ink-500)", letterSpacing: "0.18em" }}
          >
            Versões da súmula
          </p>
          {versions.length === 0 ? (
            <p
              className="text-xs"
              style={{ color: "var(--fgb-ink-400)", lineHeight: 1.5 }}
            >
              Nenhuma versão gerada. Será criada no primeiro fechamento.
            </p>
          ) : (
            <ul className="space-y-2">
              {versions.map((v, i) => (
                <li
                  key={v.version}
                  className="p-3 rounded-md flex items-start gap-3"
                  style={{
                    background: i === 0 ? "var(--fgb-green-50)" : "var(--fgb-ink-50)",
                    border: `1px solid ${
                      i === 0 ? "var(--fgb-green-200)" : "var(--fgb-ink-100)"
                    }`,
                  }}
                >
                  <span
                    className="shrink-0 inline-flex items-center justify-center"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 6,
                      background: i === 0 ? "var(--fgb-green-700)" : "var(--fgb-ink-300)",
                      color: "#fff",
                      fontFamily: "var(--font-anton)",
                      fontSize: 16,
                    }}
                  >
                    v{v.version}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span
                        className="tabular-nums"
                        style={{
                          fontFamily: "var(--font-anton)",
                          fontSize: 18,
                          color: "var(--fgb-ink-900)",
                          lineHeight: 1,
                        }}
                      >
                        {v.finalHomeScore} × {v.finalAwayScore}
                      </span>
                      {i === 0 && (
                        <span
                          className="fgb-label"
                          style={{
                            fontSize: 9,
                            color: "var(--fgb-green-700)",
                            letterSpacing: "0.18em",
                          }}
                        >
                          atual
                        </span>
                      )}
                    </div>
                    {v.reason && (
                      <p
                        className="text-xs mt-1"
                        style={{
                          color: "var(--fgb-ink-700)",
                          textTransform: "none",
                          letterSpacing: 0,
                          lineHeight: 1.5,
                        }}
                      >
                        {v.reason}
                      </p>
                    )}
                    <p
                      className="fgb-label mt-2"
                      style={{
                        fontSize: 9,
                        color: "var(--fgb-ink-400)",
                        textTransform: "none",
                        letterSpacing: 0,
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {v.finalizedAt
                        ? new Date(v.finalizedAt).toLocaleString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                      {v.createdByUserId ? ` · ${v.createdByUserId}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Audit log */}
        <div className="px-5 py-4">
          <p
            className="fgb-label mb-3"
            style={{ fontSize: 10, color: "var(--fgb-ink-500)", letterSpacing: "0.18em" }}
          >
            Audit log recente
          </p>
          {audit.length === 0 ? (
            <p
              className="text-xs"
              style={{ color: "var(--fgb-ink-400)", lineHeight: 1.5 }}
            >
              Nenhuma ação registrada.
            </p>
          ) : (
            <ul className="space-y-2">
              {audit.slice(0, 8).map(entry => {
                const meta = actionMeta(entry.actionType)
                return (
                  <li
                    key={entry.id}
                    className="p-2.5 rounded-md flex items-start gap-2.5"
                    style={{
                      background: "var(--fgb-ink-50)",
                      border: "1px solid var(--fgb-ink-100)",
                    }}
                  >
                    <span
                      className="shrink-0 inline-flex items-center justify-center mt-0.5"
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 4,
                        background: meta.tone,
                        color: "#fff",
                      }}
                    >
                      {meta.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="fgb-label"
                          style={{
                            fontSize: 9,
                            color: meta.tone,
                            letterSpacing: "0.18em",
                          }}
                        >
                          {meta.label}
                        </span>
                        <span
                          className="fgb-label"
                          style={{
                            fontSize: 9,
                            color: "var(--fgb-ink-400)",
                            textTransform: "none",
                            letterSpacing: 0,
                            fontFamily: "var(--font-mono)",
                          }}
                        >
                          {new Date(entry.createdAt).toLocaleString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p
                        className="text-xs mt-1"
                        style={{ color: "var(--fgb-ink-700)", lineHeight: 1.5 }}
                      >
                        {entry.description}
                      </p>
                      {entry.actorUserId && (
                        <p
                          className="fgb-label mt-0.5"
                          style={{
                            fontSize: 9,
                            color: "var(--fgb-ink-400)",
                            textTransform: "none",
                            letterSpacing: 0,
                            fontFamily: "var(--font-mono)",
                          }}
                        >
                          por {entry.actorUserId}
                        </p>
                      )}
                    </div>
                  </li>
                )
              })}
              {audit.length > 8 && (
                <p
                  className="fgb-label text-center pt-2"
                  style={{ fontSize: 9, color: "var(--fgb-ink-400)", letterSpacing: "0.18em" }}
                >
                  + {audit.length - 8} entrada{audit.length - 8 === 1 ? "" : "s"} mais antiga
                  {audit.length - 8 === 1 ? "" : "s"}
                </p>
              )}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
