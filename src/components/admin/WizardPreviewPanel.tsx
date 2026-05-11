"use client"

import { Users, Trophy, Calendar, AlertTriangle, CheckCircle2 } from "lucide-react"
import { computePreview, type WizardForm } from "./wizard-preview"

type Props = {
  form: WizardForm
}

export function WizardPreviewPanel({ form }: Props) {
  const preview = computePreview(form)

  return (
    <div
      className="mt-8 rounded-lg overflow-hidden"
      style={{
        background: "#fff",
        border: "1.5px solid var(--fgb-green-200)",
      }}
    >
      <div
        className="px-5 py-3 flex items-center justify-between"
        style={{
          background: "var(--fgb-green-50)",
          borderBottom: "1px solid var(--fgb-green-200)",
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className="fgb-label"
            style={{ fontSize: 10, color: "var(--fgb-green-800)", letterSpacing: "0.22em" }}
          >
            Preview do Campeonato
          </span>
        </div>
        {preview.hasError ? (
          <span
            className="fgb-label inline-flex items-center gap-1.5"
            style={{ fontSize: 10, color: "var(--fgb-red-600)", letterSpacing: "0.18em" }}
          >
            <AlertTriangle size={12} aria-hidden />
            Atenção
          </span>
        ) : preview.hasWarning ? (
          <span
            className="fgb-label inline-flex items-center gap-1.5"
            style={{ fontSize: 10, color: "var(--fgb-yellow-700)", letterSpacing: "0.18em" }}
          >
            <AlertTriangle size={12} aria-hidden />
            Avisos
          </span>
        ) : (
          <span
            className="fgb-label inline-flex items-center gap-1.5"
            style={{ fontSize: 10, color: "var(--fgb-green-700)", letterSpacing: "0.18em" }}
          >
            <CheckCircle2 size={12} aria-hidden />
            Configuração OK
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
        <StatCard
          icon={<Users size={14} />}
          label="Equipes total"
          value={preview.totalTeams}
          sublabel={
            preview.categoriesCount > 0
              ? `${preview.teamsPerCategory}/cat × ${preview.categoriesCount} cat`
              : "Selecione categorias"
          }
        />
        <StatCard
          icon={<Trophy size={14} />}
          label="Jogos estimados"
          value={preview.totalGames}
          sublabel={
            preview.gamesPerCategory > 0
              ? `${preview.gamesPerCategory} por categoria`
              : "—"
          }
        />
        <StatCard
          icon={<Calendar size={14} />}
          label="Duração estimada"
          value={preview.estimatedWeeks > 0 ? `${preview.estimatedWeeks}` : "—"}
          sublabel={preview.estimatedWeeks > 0 ? "semanas (heurística)" : "configurar dias"}
        />
        <StatCard
          icon={<AlertTriangle size={14} />}
          label="Status"
          value={preview.conflicts.length}
          sublabel={preview.conflicts.length === 0 ? "sem problemas" : "ver detalhes"}
          variant={preview.hasError ? "error" : preview.hasWarning ? "warning" : "ok"}
        />
      </div>

      {preview.phaseBreakdown.length > 0 && preview.gamesPerCategory > 0 && (
        <div
          className="px-5 py-4"
          style={{ borderTop: "1px solid var(--fgb-ink-100)" }}
        >
          <p
            className="fgb-label mb-3"
            style={{ fontSize: 10, color: "var(--fgb-ink-500)", letterSpacing: "0.18em" }}
          >
            Estrutura por Categoria
          </p>
          <div className="space-y-2">
            {preview.phaseBreakdown.map((phase, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 p-2 rounded-md"
                style={{ background: "var(--fgb-ink-50)" }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="fgb-label shrink-0 inline-flex items-center justify-center"
                    style={{
                      width: 22,
                      height: 22,
                      background: "var(--fgb-green-700)",
                      color: "#fff",
                      fontSize: 10,
                      borderRadius: 4,
                    }}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p
                      className="text-sm font-semibold truncate"
                      style={{ color: "var(--fgb-ink-900)" }}
                    >
                      {phase.name}
                    </p>
                    <p
                      className="fgb-label truncate"
                      style={{
                        fontSize: 10,
                        color: "var(--fgb-ink-500)",
                        textTransform: "none",
                        letterSpacing: 0,
                      }}
                    >
                      {phase.rationale}
                    </p>
                  </div>
                </div>
                <span
                  className="shrink-0 tabular-nums"
                  style={{
                    fontFamily: "var(--font-anton)",
                    fontSize: 22,
                    lineHeight: 1,
                    color: "var(--fgb-green-700)",
                  }}
                >
                  {phase.games}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {preview.conflicts.length > 0 && (
        <div
          className="px-5 py-4"
          style={{ borderTop: "1px solid var(--fgb-ink-100)" }}
        >
          <p
            className="fgb-label mb-3"
            style={{ fontSize: 10, color: "var(--fgb-ink-500)", letterSpacing: "0.18em" }}
          >
            Conflitos Detectados
          </p>
          <div className="space-y-2">
            {preview.conflicts.map((c, i) => {
              const bg =
                c.severity === "error"
                  ? "var(--fgb-red-50)"
                  : c.severity === "warning"
                    ? "rgba(229,171,0,0.08)"
                    : "var(--fgb-green-50)"
              const border =
                c.severity === "error"
                  ? "var(--fgb-red-200)"
                  : c.severity === "warning"
                    ? "var(--fgb-yellow-300)"
                    : "var(--fgb-green-200)"
              const accent =
                c.severity === "error"
                  ? "var(--fgb-red-700)"
                  : c.severity === "warning"
                    ? "var(--fgb-yellow-700)"
                    : "var(--fgb-green-700)"
              return (
                <div
                  key={i}
                  className="p-3 rounded-md flex items-start gap-2"
                  style={{ background: bg, border: `1px solid ${border}` }}
                >
                  <AlertTriangle
                    size={14}
                    style={{ color: accent, flexShrink: 0, marginTop: 2 }}
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold" style={{ color: accent }}>
                      {c.title}
                    </p>
                    <p
                      className="text-xs mt-0.5"
                      style={{
                        color: "var(--fgb-ink-700)",
                        lineHeight: 1.5,
                      }}
                    >
                      {c.detail}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div
        className="px-5 py-2 text-center"
        style={{
          background: "var(--fgb-ink-50)",
          borderTop: "1px solid var(--fgb-ink-100)",
        }}
      >
        <p
          className="fgb-label"
          style={{ fontSize: 9, color: "var(--fgb-ink-400)", letterSpacing: "0.18em", textTransform: "none" }}
        >
          Estimativas atualizam em tempo real conforme você configura
        </p>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  sublabel,
  variant = "neutral",
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  sublabel: string
  variant?: "neutral" | "ok" | "warning" | "error"
}) {
  const valueColor =
    variant === "error"
      ? "var(--fgb-red-600)"
      : variant === "warning"
        ? "var(--fgb-yellow-700)"
        : variant === "ok"
          ? "var(--fgb-green-700)"
          : "var(--fgb-ink-900)"

  return (
    <div
      className="px-5 py-4"
      style={{
        borderRight: "1px solid var(--fgb-ink-100)",
        borderBottom: "1px solid var(--fgb-ink-100)",
      }}
    >
      <div
        className="fgb-label inline-flex items-center gap-1.5 mb-2"
        style={{ fontSize: 9, color: "var(--fgb-ink-500)", letterSpacing: "0.18em" }}
      >
        <span style={{ color: "var(--fgb-green-700)" }}>{icon}</span>
        {label}
      </div>
      <div
        className="tabular-nums"
        style={{
          fontFamily: "var(--font-anton)",
          fontSize: 32,
          lineHeight: 1,
          color: valueColor,
        }}
      >
        {value}
      </div>
      <p
        className="fgb-label mt-1"
        style={{
          fontSize: 9,
          color: "var(--fgb-ink-400)",
          textTransform: "none",
          letterSpacing: 0,
        }}
      >
        {sublabel}
      </p>
    </div>
  )
}
