"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ShieldCheck, CheckCircle2, XCircle, RotateCcw, Ban, X } from "lucide-react"
import {
  confirmRegistrationAction,
  rejectRegistrationAction,
  requestRevisionRegistrationAction,
  cancelRegistrationAction,
} from "@/app/admin/championships/[id]/registrations/registration-server-actions"
import {
  getStateLabel,
  type RegistrationLifecycleState,
} from "@/lib/registration-lifecycle"

type Props = {
  registrationId: string
  championshipId: string
  /** Estado atual derivado (lifecycleState ou status legacy). */
  currentState: RegistrationLifecycleState
}

const STATE_BG: Record<RegistrationLifecycleState, string> = {
  DRAFT: "var(--fgb-ink-100)",
  SUBMITTED: "var(--fgb-yellow-50)",
  UNDER_REVIEW: "var(--fgb-yellow-100)",
  CONFIRMED: "var(--fgb-green-50)",
  REJECTED: "var(--fgb-red-50)",
  CANCELLED: "var(--fgb-ink-200)",
}

const STATE_FG: Record<RegistrationLifecycleState, string> = {
  DRAFT: "var(--fgb-ink-700)",
  SUBMITTED: "var(--fgb-yellow-800)",
  UNDER_REVIEW: "var(--fgb-yellow-800)",
  CONFIRMED: "var(--fgb-green-800)",
  REJECTED: "var(--fgb-red-700)",
  CANCELLED: "var(--fgb-ink-600)",
}

export function RegistrationLifecycleActions({
  registrationId,
  championshipId,
  currentState,
}: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [rejectMode, setRejectMode] = useState(false)
  const [reason, setReason] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const canConfirm = ["SUBMITTED", "UNDER_REVIEW"].includes(currentState)
  const canReject = ["SUBMITTED", "UNDER_REVIEW"].includes(currentState)
  const canRevise = ["CONFIRMED", "SUBMITTED"].includes(currentState)
  const canCancel = currentState !== "CANCELLED"

  function close() {
    setOpen(false)
    setRejectMode(false)
    setReason("")
    setError(null)
  }

  function doConfirm() {
    startTransition(async () => {
      const res = await confirmRegistrationAction({ registrationId, championshipId })
      if (!res.ok) {
        setError(res.error)
        return
      }
      close()
      router.refresh()
    })
  }

  function doReject() {
    if (reason.trim().length < 3) {
      setError("Motivo deve ter no mínimo 3 caracteres")
      return
    }
    startTransition(async () => {
      const res = await rejectRegistrationAction({
        registrationId,
        championshipId,
        reason: reason.trim(),
      })
      if (!res.ok) {
        setError(res.error)
        return
      }
      close()
      router.refresh()
    })
  }

  function doRevise() {
    if (!confirm("Solicitar revisão? A inscrição volta para UNDER_REVIEW.")) return
    startTransition(async () => {
      const res = await requestRevisionRegistrationAction({ registrationId, championshipId })
      if (!res.ok) {
        setError(res.error)
        return
      }
      close()
      router.refresh()
    })
  }

  function doCancel() {
    if (!confirm("Cancelar inscrição? Esta ação fica registrada permanentemente.")) return
    startTransition(async () => {
      const res = await cancelRegistrationAction({
        registrationId,
        championshipId,
        reason: "Cancelado via admin",
      })
      if (!res.ok) {
        setError(res.error)
        return
      }
      close()
      router.refresh()
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fgb-label inline-flex items-center gap-1.5 transition-all"
        style={{
          fontSize: 9,
          padding: "5px 10px",
          background: STATE_BG[currentState],
          color: STATE_FG[currentState],
          border: `1px solid ${STATE_FG[currentState]}33`,
          letterSpacing: "0.18em",
          borderRadius: 6,
        }}
        title="Gerenciar estado da inscrição"
      >
        <ShieldCheck size={11} aria-hidden />
        {getStateLabel(currentState)}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(8,60,30,0.55)", backdropFilter: "blur(4px)" }}
          onClick={close}
        >
          <div
            className="rounded-lg overflow-hidden max-w-md w-full"
            style={{ background: "#fff", border: `2px solid ${STATE_FG[currentState]}` }}
            onClick={e => e.stopPropagation()}
          >
            <div
              className="px-5 py-3 flex items-center gap-3"
              style={{ background: STATE_BG[currentState], borderBottom: `1px solid ${STATE_FG[currentState]}33` }}
            >
              <ShieldCheck size={20} style={{ color: STATE_FG[currentState] }} aria-hidden />
              <div className="flex-1">
                <h3
                  style={{
                    fontFamily: "var(--font-anton)",
                    fontSize: 18,
                    textTransform: "uppercase",
                    color: STATE_FG[currentState],
                    lineHeight: 1,
                  }}
                >
                  Gerenciar Inscrição
                </h3>
                <p
                  className="fgb-label mt-1"
                  style={{ fontSize: 9, color: STATE_FG[currentState], letterSpacing: "0.22em" }}
                >
                  Estado atual: {getStateLabel(currentState)}
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                className="p-1 rounded transition-colors hover:bg-black/5"
                aria-label="Fechar"
              >
                <X size={16} style={{ color: STATE_FG[currentState] }} />
              </button>
            </div>

            <div className="px-5 py-4">
              {!rejectMode ? (
                <div className="space-y-2">
                  {canConfirm && (
                    <button
                      type="button"
                      onClick={doConfirm}
                      disabled={isPending}
                      className="w-full text-left px-4 py-3 rounded-md transition-colors hover:brightness-95 disabled:opacity-50 flex items-center gap-3"
                      style={{ background: "var(--fgb-green-50)", border: "1px solid var(--fgb-green-200)" }}
                    >
                      <CheckCircle2 size={18} style={{ color: "var(--fgb-green-700)" }} aria-hidden />
                      <div className="flex-1 min-w-0">
                        <div className="fgb-label" style={{ fontSize: 10, color: "var(--fgb-green-800)", letterSpacing: "0.18em" }}>
                          Confirmar Inscrição
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: "var(--fgb-ink-700)" }}>
                          Aprova oficialmente — equipe participa do campeonato
                        </div>
                      </div>
                    </button>
                  )}

                  {canReject && (
                    <button
                      type="button"
                      onClick={() => setRejectMode(true)}
                      disabled={isPending}
                      className="w-full text-left px-4 py-3 rounded-md transition-colors hover:brightness-95 disabled:opacity-50 flex items-center gap-3"
                      style={{ background: "var(--fgb-red-50)", border: "1px solid var(--fgb-red-200)" }}
                    >
                      <XCircle size={18} style={{ color: "var(--fgb-red-700)" }} aria-hidden />
                      <div className="flex-1 min-w-0">
                        <div className="fgb-label" style={{ fontSize: 10, color: "var(--fgb-red-700)", letterSpacing: "0.18em" }}>
                          Recusar Inscrição
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: "var(--fgb-ink-700)" }}>
                          Exige motivo. Equipe vê e pode re-submeter após corrigir.
                        </div>
                      </div>
                    </button>
                  )}

                  {canRevise && (
                    <button
                      type="button"
                      onClick={doRevise}
                      disabled={isPending}
                      className="w-full text-left px-4 py-3 rounded-md transition-colors hover:brightness-95 disabled:opacity-50 flex items-center gap-3"
                      style={{ background: "var(--fgb-yellow-50)", border: "1px solid var(--fgb-yellow-200)" }}
                    >
                      <RotateCcw size={18} style={{ color: "var(--fgb-yellow-700)" }} aria-hidden />
                      <div className="flex-1 min-w-0">
                        <div className="fgb-label" style={{ fontSize: 10, color: "var(--fgb-yellow-800)", letterSpacing: "0.18em" }}>
                          Solicitar Revisão
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: "var(--fgb-ink-700)" }}>
                          Move para UNDER_REVIEW. Preserva histórico de confirmação.
                        </div>
                      </div>
                    </button>
                  )}

                  {canCancel && (
                    <button
                      type="button"
                      onClick={doCancel}
                      disabled={isPending}
                      className="w-full text-left px-4 py-3 rounded-md transition-colors hover:brightness-95 disabled:opacity-50 flex items-center gap-3"
                      style={{ background: "var(--fgb-ink-100)", border: "1px solid var(--fgb-ink-200)" }}
                    >
                      <Ban size={18} style={{ color: "var(--fgb-ink-700)" }} aria-hidden />
                      <div className="flex-1 min-w-0">
                        <div className="fgb-label" style={{ fontSize: 10, color: "var(--fgb-ink-700)", letterSpacing: "0.18em" }}>
                          Cancelar Inscrição
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: "var(--fgb-ink-700)" }}>
                          Encerra definitivamente (W.O., desistência).
                        </div>
                      </div>
                    </button>
                  )}

                  {error && (
                    <p className="text-xs px-2 py-2 rounded-md mt-2" style={{ background: "var(--fgb-red-50)", color: "var(--fgb-red-700)" }}>
                      {error}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="fgb-label block" style={{ fontSize: 10, color: "var(--fgb-ink-500)", letterSpacing: "0.18em" }}>
                    Motivo da recusa <span style={{ color: "var(--fgb-red-600)" }}>*</span>
                  </label>
                  <textarea
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder="Ex: Documentação incompleta — falta certidão negativa atualizada"
                    rows={4}
                    className="w-full px-3 py-2 text-sm rounded-md focus:outline-none"
                    style={{ border: "1px solid var(--fgb-ink-200)", color: "var(--fgb-ink-900)" }}
                  />
                  <p className="text-xs" style={{ color: "var(--fgb-ink-500)" }}>
                    Mínimo 3 caracteres. Equipe verá este motivo na sua área.
                  </p>
                  {error && (
                    <p className="text-xs px-2 py-2 rounded-md" style={{ background: "var(--fgb-red-50)", color: "var(--fgb-red-700)" }}>
                      {error}
                    </p>
                  )}
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => { setRejectMode(false); setError(null) }}
                      className="fgb-label transition-colors"
                      style={{ fontSize: 10, letterSpacing: "0.18em", padding: "8px 14px", color: "var(--fgb-ink-700)" }}
                    >
                      Voltar
                    </button>
                    <button
                      type="button"
                      onClick={doReject}
                      disabled={isPending || reason.trim().length < 3}
                      className="fgb-label transition-colors disabled:opacity-40"
                      style={{
                        fontSize: 10, letterSpacing: "0.18em", padding: "8px 14px",
                        background: "var(--fgb-red-500)", color: "#fff", borderRadius: 4,
                      }}
                    >
                      Confirmar recusa
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
