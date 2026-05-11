"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  closeGameAction,
  requestReviewAction,
  publishGameAction,
} from "@/app/admin/championships/[id]/jogos/[gameId]/sumula/close-actions"
import {
  Lock,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Send,
  X,
  CheckCircle2,
} from "lucide-react"

type LifecycleState =
  | "DRAFT"
  | "SCHEDULED"
  | "LINEUP_LOCKED"
  | "LIVE"
  | "ENDED"
  | "CONFIRMED"
  | "PUBLISHED"
  | "UNDER_REVIEW"
  | "CANCELLED"
  | "POSTPONED"

type StateMeta = {
  label: string
  description: string
  bg: string
  fg: string
  accent: string
  icon: React.ReactNode
}

const STATE_META: Record<LifecycleState, StateMeta> = {
  DRAFT: {
    label: "Rascunho",
    description: "Jogo criado, aguardando agendamento oficial.",
    bg: "var(--fgb-ink-100)",
    fg: "var(--fgb-ink-700)",
    accent: "var(--fgb-ink-500)",
    icon: <ShieldCheck size={14} />,
  },
  SCHEDULED: {
    label: "Agendado",
    description: "Pronto para receber configuração e escalações.",
    bg: "var(--fgb-yellow-50)",
    fg: "var(--fgb-yellow-800)",
    accent: "var(--fgb-yellow-500)",
    icon: <ShieldCheck size={14} />,
  },
  LINEUP_LOCKED: {
    label: "Escalações travadas",
    description: "Rosters confirmados, atletas verificados, pronto para começar.",
    bg: "var(--fgb-green-100)",
    fg: "var(--fgb-green-800)",
    accent: "var(--fgb-green-600)",
    icon: <Lock size={14} />,
  },
  LIVE: {
    label: "Ao vivo",
    description: "Jogo em andamento — eventos sendo registrados.",
    bg: "var(--fgb-red-50)",
    fg: "var(--fgb-red-700)",
    accent: "var(--fgb-red-500)",
    icon: <span className="inline-block w-2 h-2 rounded-full" style={{ background: "var(--fgb-red-500)", animation: "fgb-pulse 1.4s ease-in-out infinite" }} aria-hidden />,
  },
  ENDED: {
    label: "Encerrado",
    description: "Fim natural. Aguardando validação de paridade e confirmação.",
    bg: "rgba(30, 58, 95, 0.08)",
    fg: "var(--fgb-navy-800)",
    accent: "var(--fgb-navy-600)",
    icon: <ShieldCheck size={14} />,
  },
  CONFIRMED: {
    label: "Confirmado",
    description: "Súmula oficial gerada. Pronto para publicação.",
    bg: "var(--fgb-green-50)",
    fg: "var(--fgb-green-800)",
    accent: "var(--fgb-green-700)",
    icon: <CheckCircle2 size={14} />,
  },
  PUBLISHED: {
    label: "Publicado",
    description: "Visível publicamente. Dados imutáveis (use revisão para correções).",
    bg: "var(--fgb-green-700)",
    fg: "#fff",
    accent: "var(--fgb-yellow-500)",
    icon: <CheckCircle2 size={14} />,
  },
  UNDER_REVIEW: {
    label: "Em revisão",
    description: "Revisão oficial em andamento — correções permitidas via cadeia de correção.",
    bg: "var(--fgb-yellow-500)",
    fg: "var(--fgb-ink-900)",
    accent: "var(--fgb-yellow-700)",
    icon: <AlertTriangle size={14} />,
  },
  CANCELLED: {
    label: "Cancelado",
    description: "Jogo cancelado (W.O., decisão administrativa).",
    bg: "var(--fgb-ink-200)",
    fg: "var(--fgb-ink-700)",
    accent: "var(--fgb-ink-500)",
    icon: <X size={14} />,
  },
  POSTPONED: {
    label: "Adiado",
    description: "Adiado para nova data.",
    bg: "var(--fgb-yellow-50)",
    fg: "var(--fgb-yellow-800)",
    accent: "var(--fgb-yellow-600)",
    icon: <RotateCcw size={14} />,
  },
}

type Props = {
  gameId: string
  championshipId: string
  state: LifecycleState
  currentVersion: number
  hasReport: boolean
}

export function GameLifecycleBanner({
  gameId,
  championshipId,
  state,
  currentVersion,
  hasReport,
}: Props) {
  const router = useRouter()
  const meta = STATE_META[state] ?? STATE_META.SCHEDULED
  const [isPending, startTransition] = useTransition()

  const [parityModal, setParityModal] = useState<{
    open: boolean
    errors: string[]
    details: string[]
  }>({ open: false, errors: [], details: [] })

  const [reviewModal, setReviewModal] = useState<{ open: boolean; reason: string }>({
    open: false,
    reason: "",
  })

  const canClose = ["LIVE", "ENDED", "UNDER_REVIEW", "SCHEDULED", "LINEUP_LOCKED"].includes(state)
  const canPublish = state === "CONFIRMED"
  const canRequestReview = ["CONFIRMED", "PUBLISHED"].includes(state)

  function doClose(allowParityErrors: boolean) {
    startTransition(async () => {
      const res = await closeGameAction({
        gameId,
        championshipId,
        allowParityErrors,
        reason: state === "UNDER_REVIEW" ? "Re-confirmação pós-revisão" : undefined,
      })
      if (!res.ok) {
        setParityModal({
          open: true,
          errors: [res.error],
          details: res.details ?? [],
        })
        return
      }
      setParityModal({ open: false, errors: [], details: [] })
      router.refresh()
    })
  }

  function doRequestReview() {
    if (reviewModal.reason.trim().length < 3) return
    startTransition(async () => {
      const res = await requestReviewAction({
        gameId,
        championshipId,
        reason: reviewModal.reason.trim(),
      })
      if (!res.ok) {
        alert(res.error)
        return
      }
      setReviewModal({ open: false, reason: "" })
      router.refresh()
    })
  }

  function doPublish() {
    if (!confirm("Publicar este jogo? Os dados ficarão visíveis ao público e marcados como imutáveis.")) return
    startTransition(async () => {
      const res = await publishGameAction({ gameId, championshipId })
      if (!res.ok) {
        alert(res.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <>
      <div
        className="rounded-lg overflow-hidden"
        style={{
          background: meta.bg,
          border: `1.5px solid ${meta.accent}`,
        }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-4">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <span
              className="inline-flex items-center justify-center shrink-0 mt-0.5"
              style={{
                width: 32,
                height: 32,
                borderRadius: 6,
                background: meta.accent,
                color: state === "PUBLISHED" ? "var(--fgb-ink-900)" : "#fff",
              }}
            >
              {meta.icon}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <span
                  className="fgb-label"
                  style={{
                    fontSize: 10,
                    color: meta.fg,
                    letterSpacing: "0.22em",
                  }}
                >
                  Status do jogo
                </span>
                {hasReport && (
                  <span
                    className="fgb-label"
                    style={{
                      fontSize: 9,
                      color: meta.fg,
                      opacity: 0.65,
                      letterSpacing: "0.18em",
                    }}
                  >
                    Súmula v{currentVersion}
                  </span>
                )}
              </div>
              <h3
                style={{
                  fontFamily: "var(--font-anton)",
                  fontSize: 22,
                  lineHeight: 1.05,
                  textTransform: "uppercase",
                  color: meta.fg,
                  marginTop: 4,
                }}
              >
                {meta.label}
              </h3>
              <p
                className="text-xs mt-1"
                style={{ color: meta.fg, opacity: 0.85, lineHeight: 1.5 }}
              >
                {meta.description}
              </p>
            </div>
          </div>

          <div className="flex gap-2 shrink-0 flex-wrap">
            {canClose && (
              <button
                type="button"
                onClick={() => doClose(false)}
                disabled={isPending}
                className="fgb-btn-primary disabled:opacity-50"
                style={{ fontSize: 11, padding: "10px 18px" }}
              >
                {isPending ? "Validando…" : state === "UNDER_REVIEW" ? "Re-confirmar" : "Fechar Jogo"}
              </button>
            )}
            {canPublish && (
              <button
                type="button"
                onClick={doPublish}
                disabled={isPending}
                className="fgb-btn-primary disabled:opacity-50"
                style={{
                  fontSize: 11,
                  padding: "10px 18px",
                  background: "var(--fgb-green-700)",
                  color: "#fff",
                }}
              >
                <Send size={12} className="inline mr-1.5" aria-hidden />
                Publicar
              </button>
            )}
            {canRequestReview && (
              <button
                type="button"
                onClick={() => setReviewModal({ open: true, reason: "" })}
                disabled={isPending}
                className="fgb-label disabled:opacity-50 transition-colors"
                style={{
                  fontSize: 10,
                  letterSpacing: "0.18em",
                  padding: "10px 18px",
                  background: "transparent",
                  color: meta.fg,
                  border: `1px solid ${meta.accent}`,
                  borderRadius: 4,
                }}
              >
                <RotateCcw size={12} className="inline mr-1.5" aria-hidden />
                Solicitar Revisão
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal de erros de paridade */}
      {parityModal.open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(8, 60, 30, 0.55)", backdropFilter: "blur(4px)" }}
          onClick={() => setParityModal({ open: false, errors: [], details: [] })}
        >
          <div
            className="rounded-lg overflow-hidden max-w-lg w-full"
            style={{ background: "#fff", border: "2px solid var(--fgb-red-500)" }}
            onClick={e => e.stopPropagation()}
          >
            <div
              className="px-5 py-3 flex items-center gap-3"
              style={{ background: "var(--fgb-red-50)", borderBottom: "1px solid var(--fgb-red-200)" }}
            >
              <AlertTriangle
                size={20}
                style={{ color: "var(--fgb-red-700)", flexShrink: 0 }}
                aria-hidden
              />
              <div className="flex-1">
                <h3
                  style={{
                    fontFamily: "var(--font-anton)",
                    fontSize: 18,
                    textTransform: "uppercase",
                    color: "var(--fgb-red-700)",
                    lineHeight: 1,
                  }}
                >
                  Não foi possível fechar
                </h3>
                <p
                  className="fgb-label mt-1"
                  style={{ fontSize: 9, color: "var(--fgb-red-600)", letterSpacing: "0.18em" }}
                >
                  Erros de validação
                </p>
              </div>
              <button
                type="button"
                onClick={() => setParityModal({ open: false, errors: [], details: [] })}
                className="p-1 rounded transition-colors hover:bg-[var(--fgb-red-100)]"
                aria-label="Fechar modal"
              >
                <X size={16} style={{ color: "var(--fgb-red-700)" }} />
              </button>
            </div>
            <div className="px-5 py-4 space-y-2">
              {parityModal.errors.map((e, i) => (
                <p
                  key={`e${i}`}
                  className="text-sm"
                  style={{ color: "var(--fgb-ink-900)", lineHeight: 1.5 }}
                >
                  {e}
                </p>
              ))}
              {parityModal.details.length > 0 && (
                <div
                  className="mt-3 p-3 rounded-md"
                  style={{ background: "var(--fgb-ink-50)", border: "1px solid var(--fgb-ink-200)" }}
                >
                  <p
                    className="fgb-label mb-2"
                    style={{ fontSize: 9, color: "var(--fgb-ink-500)", letterSpacing: "0.18em" }}
                  >
                    Detalhes
                  </p>
                  {parityModal.details.map((d, i) => (
                    <p
                      key={`d${i}`}
                      className="text-xs mt-1"
                      style={{ color: "var(--fgb-ink-700)", lineHeight: 1.5 }}
                    >
                      {d}
                    </p>
                  ))}
                </div>
              )}
              <div
                className="mt-4 p-3 rounded-md"
                style={{
                  background: "rgba(229,171,0,0.08)",
                  border: "1px solid var(--fgb-yellow-300)",
                }}
              >
                <p className="text-xs" style={{ color: "var(--fgb-yellow-800)", lineHeight: 1.5 }}>
                  <strong>Ação administrativa excepcional:</strong> fechar com erros de paridade
                  é possível mas será registrado no audit log permanente.
                </p>
              </div>
            </div>
            <div
              className="px-5 py-3 flex justify-end gap-2"
              style={{ background: "var(--fgb-ink-50)", borderTop: "1px solid var(--fgb-ink-200)" }}
            >
              <button
                type="button"
                onClick={() => setParityModal({ open: false, errors: [], details: [] })}
                className="fgb-label transition-colors"
                style={{
                  fontSize: 10,
                  letterSpacing: "0.18em",
                  padding: "8px 14px",
                  color: "var(--fgb-ink-700)",
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => doClose(true)}
                disabled={isPending}
                className="fgb-label transition-colors disabled:opacity-50"
                style={{
                  fontSize: 10,
                  letterSpacing: "0.18em",
                  padding: "8px 14px",
                  background: "var(--fgb-red-500)",
                  color: "#fff",
                  borderRadius: 4,
                }}
              >
                Forçar fechamento mesmo assim
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de revisão */}
      {reviewModal.open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(8, 60, 30, 0.55)", backdropFilter: "blur(4px)" }}
          onClick={() => setReviewModal({ open: false, reason: "" })}
        >
          <div
            className="rounded-lg overflow-hidden max-w-lg w-full"
            style={{ background: "#fff", border: "2px solid var(--fgb-yellow-500)" }}
            onClick={e => e.stopPropagation()}
          >
            <div
              className="px-5 py-3 flex items-center gap-3"
              style={{
                background: "var(--fgb-yellow-50)",
                borderBottom: "1px solid var(--fgb-yellow-200)",
              }}
            >
              <RotateCcw
                size={20}
                style={{ color: "var(--fgb-yellow-700)", flexShrink: 0 }}
                aria-hidden
              />
              <div className="flex-1">
                <h3
                  style={{
                    fontFamily: "var(--font-anton)",
                    fontSize: 18,
                    textTransform: "uppercase",
                    color: "var(--fgb-yellow-800)",
                    lineHeight: 1,
                  }}
                >
                  Solicitar revisão
                </h3>
                <p
                  className="fgb-label mt-1"
                  style={{ fontSize: 9, color: "var(--fgb-yellow-700)", letterSpacing: "0.18em" }}
                >
                  Motivo obrigatório
                </p>
              </div>
            </div>
            <div className="px-5 py-4">
              <p className="text-xs mb-3" style={{ color: "var(--fgb-ink-700)", lineHeight: 1.6 }}>
                Solicitar revisão move o jogo para <strong>UNDER_REVIEW</strong>. Permite
                correções via cadeia de correção (FIBA pattern). Quando finalizar a correção,
                use "Re-confirmar" para criar uma nova versão da súmula preservando o histórico.
              </p>
              <label
                className="fgb-label block mb-2"
                style={{ fontSize: 10, color: "var(--fgb-ink-500)", letterSpacing: "0.18em" }}
              >
                Motivo
              </label>
              <textarea
                value={reviewModal.reason}
                onChange={e =>
                  setReviewModal(m => ({ ...m, reason: e.target.value }))
                }
                placeholder="Ex: Árbitro corrigiu pontuação do atleta #23 após análise do vídeo"
                rows={3}
                className="w-full px-3 py-2 text-sm rounded-md focus:outline-none focus:ring-1"
                style={{
                  border: "1px solid var(--fgb-ink-200)",
                  color: "var(--fgb-ink-900)",
                }}
              />
              <p
                className="fgb-label mt-2"
                style={{
                  fontSize: 9,
                  color: "var(--fgb-ink-400)",
                  textTransform: "none",
                  letterSpacing: 0,
                }}
              >
                Mínimo 3 caracteres. Será registrado no audit log permanente.
              </p>
            </div>
            <div
              className="px-5 py-3 flex justify-end gap-2"
              style={{
                background: "var(--fgb-ink-50)",
                borderTop: "1px solid var(--fgb-ink-200)",
              }}
            >
              <button
                type="button"
                onClick={() => setReviewModal({ open: false, reason: "" })}
                className="fgb-label transition-colors"
                style={{
                  fontSize: 10,
                  letterSpacing: "0.18em",
                  padding: "8px 14px",
                  color: "var(--fgb-ink-700)",
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={doRequestReview}
                disabled={isPending || reviewModal.reason.trim().length < 3}
                className="fgb-label transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  fontSize: 10,
                  letterSpacing: "0.18em",
                  padding: "8px 14px",
                  background: "var(--fgb-yellow-500)",
                  color: "var(--fgb-ink-900)",
                  borderRadius: 4,
                }}
              >
                Confirmar solicitação
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
