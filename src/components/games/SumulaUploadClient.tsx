'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Upload, FileText, Loader2, Plus, Trash2, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react'

type FinalStatus = 'FINISHED' | 'WO' | 'CANCELED'

interface PeriodRow {
  period: number
  homeScore: string
  awayScore: string
}

interface LatestVersion {
  version: number
  officialPdfUrl: string | null
  sourceType: string
  createdAtIso: string
}

interface SumulaUploadClientProps {
  game: {
    id: string
    dateTimeIso: string
    status: string
    homeScore: number | null
    awayScore: number | null
    homeTeam: { id: string; name: string }
    awayTeam: { id: string; name: string }
    category: { id: string; name: string } | null
    championship: { id: string; name: string; year: number | null } | null
    latestVersion: LatestVersion | null
  }
}

const INITIAL_PERIODS: PeriodRow[] = [
  { period: 1, homeScore: '', awayScore: '' },
  { period: 2, homeScore: '', awayScore: '' },
  { period: 3, homeScore: '', awayScore: '' },
  { period: 4, homeScore: '', awayScore: '' },
]

export default function SumulaUploadClient({ game }: SumulaUploadClientProps) {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [homeScore, setHomeScore] = useState<string>(game.homeScore?.toString() ?? '')
  const [awayScore, setAwayScore] = useState<string>(game.awayScore?.toString() ?? '')
  const [finalStatus, setFinalStatus] = useState<FinalStatus>('FINISHED')
  const [periods, setPeriods] = useState<PeriodRow[]>(INITIAL_PERIODS)
  const [showPeriods, setShowPeriods] = useState<boolean>(false)
  const [notes, setNotes] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const gameDate = useMemo(() => new Date(game.dateTimeIso), [game.dateTimeIso])

  function addOvertime() {
    const nextPeriod = (periods[periods.length - 1]?.period ?? 4) + 1
    setPeriods([...periods, { period: nextPeriod, homeScore: '', awayScore: '' }])
  }

  function removePeriod(index: number) {
    if (periods.length <= 4) return
    setPeriods(periods.filter((_, i) => i !== index))
  }

  function updatePeriod(index: number, field: 'homeScore' | 'awayScore', value: string) {
    setPeriods(periods.map((p, i) => (i === index ? { ...p, [field]: value } : p)))
  }

  function parseIntSafe(s: string): number | null {
    if (s.trim() === '') return null
    const n = Number.parseInt(s, 10)
    return Number.isFinite(n) ? n : null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!file) {
      setError('Selecione o arquivo PDF da súmula.')
      return
    }
    if (file.type !== 'application/pdf') {
      setError('Apenas PDF aceito.')
      return
    }
    if (file.size > 4 * 1024 * 1024) {
      setError('PDF maior que 4MB. Comprima antes de enviar.')
      return
    }

    const home = parseIntSafe(homeScore)
    const away = parseIntSafe(awayScore)
    if (home === null || away === null) {
      setError('Informe placar casa e visitante (números inteiros).')
      return
    }

    const meta: {
      homeScore: number
      awayScore: number
      finalStatus: FinalStatus
      periodScores?: Array<{ period: number; homeScore: number; awayScore: number }>
      notes?: string
    } = {
      homeScore: home,
      awayScore: away,
      finalStatus,
    }

    if (showPeriods) {
      const validPeriods = periods
        .map(p => ({
          period: p.period,
          homeScore: parseIntSafe(p.homeScore),
          awayScore: parseIntSafe(p.awayScore),
        }))
        .filter(
          (p): p is { period: number; homeScore: number; awayScore: number } =>
            p.homeScore !== null && p.awayScore !== null
        )
      if (validPeriods.length > 0) {
        meta.periodScores = validPeriods
      }
    }

    if (notes.trim()) {
      meta.notes = notes.trim()
    }

    setSubmitting(true)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('meta', JSON.stringify(meta))

      const res = await fetch(`/api/admin/games/${game.id}/sumula/upload`, {
        method: 'POST',
        body: form,
      })

      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean
        error?: string
        version?: number
        recalcTriggered?: boolean
      }

      if (!res.ok || !json.ok) {
        throw new Error(json.error || `Erro ${res.status}`)
      }

      setSuccess(
        `Súmula salva (v${json.version}).` +
          (json.recalcTriggered ? ' Standings recalculados.' : '')
      )

      setTimeout(() => {
        router.push(`/sumula/${game.id}`)
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar súmula.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-fgb-ink-50">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back nav */}
        <Link
          href={`/admin/games/${game.id}`}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-fgb-ink-600 hover:text-fgb-navy-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>

        {/* Header */}
        <div className="mb-6 rounded-xl border border-fgb-ink-200 bg-white p-6 shadow-sm">
          <h1 className="fgb-display text-2xl font-bold text-fgb-ink-900">
            Upload de Súmula PDF
          </h1>
          <p className="mt-1 text-sm text-fgb-ink-600">
            Envie a súmula gerada externamente e preencha o placar manualmente. As standings serão
            atualizadas automaticamente.
          </p>

          <div className="mt-4 grid gap-2 text-sm">
            <div>
              <span className="font-semibold text-fgb-ink-700">Campeonato: </span>
              <span className="text-fgb-ink-900">
                {game.championship?.name ?? '—'}
                {game.championship?.year ? ` (${game.championship.year})` : ''}
              </span>
            </div>
            <div>
              <span className="font-semibold text-fgb-ink-700">Categoria: </span>
              <span className="text-fgb-ink-900">{game.category?.name ?? '—'}</span>
            </div>
            <div>
              <span className="font-semibold text-fgb-ink-700">Jogo: </span>
              <span className="text-fgb-ink-900">
                {game.homeTeam.name} × {game.awayTeam.name}
              </span>
            </div>
            <div>
              <span className="font-semibold text-fgb-ink-700">Data: </span>
              <span className="text-fgb-ink-900">
                {gameDate.toLocaleString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <div>
              <span className="font-semibold text-fgb-ink-700">Status atual: </span>
              <span className="text-fgb-ink-900">{game.status}</span>
            </div>
          </div>

          {game.latestVersion?.officialPdfUrl && (
            <div className="mt-4 rounded-lg border border-fgb-ink-200 bg-fgb-ink-50 p-3 text-sm">
              <div className="flex items-center gap-2 text-fgb-ink-700">
                <FileText className="h-4 w-4" />
                <span className="font-semibold">
                  Versão atual: v{game.latestVersion.version} ({game.latestVersion.sourceType})
                </span>
              </div>
              <a
                href={game.latestVersion.officialPdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-xs text-fgb-navy-700 underline"
              >
                Abrir PDF da última versão
              </a>
            </div>
          )}
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-xl border border-fgb-ink-200 bg-white p-6 shadow-sm"
        >
          {/* File upload */}
          <div>
            <label className="block text-sm font-semibold text-fgb-ink-800">
              Arquivo PDF da súmula <span className="text-red-600">*</span>
            </label>
            <p className="mt-0.5 text-xs text-fgb-ink-500">PDF até 4MB.</p>
            <div className="mt-2 flex items-center gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-fgb-ink-300 bg-white px-4 py-2 text-sm font-medium text-fgb-ink-800 hover:bg-fgb-ink-50">
                <Upload className="h-4 w-4" />
                Selecionar PDF
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={e => setFile(e.target.files?.[0] ?? null)}
                />
              </label>
              {file && (
                <span className="text-xs text-fgb-ink-700">
                  {file.name} ({(file.size / 1024).toFixed(0)} KB)
                </span>
              )}
            </div>
          </div>

          {/* Scores + status */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-semibold text-fgb-ink-800">
                Placar Casa <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                min={0}
                value={homeScore}
                onChange={e => setHomeScore(e.target.value)}
                className="mt-1 w-full rounded-lg border border-fgb-ink-300 px-3 py-2 text-sm focus:border-fgb-navy-600 focus:outline-none focus:ring-1 focus:ring-fgb-navy-600"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-fgb-ink-800">
                Placar Visitante <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                min={0}
                value={awayScore}
                onChange={e => setAwayScore(e.target.value)}
                className="mt-1 w-full rounded-lg border border-fgb-ink-300 px-3 py-2 text-sm focus:border-fgb-navy-600 focus:outline-none focus:ring-1 focus:ring-fgb-navy-600"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-fgb-ink-800">
                Status final
              </label>
              <select
                value={finalStatus}
                onChange={e => setFinalStatus(e.target.value as FinalStatus)}
                className="mt-1 w-full rounded-lg border border-fgb-ink-300 px-3 py-2 text-sm focus:border-fgb-navy-600 focus:outline-none focus:ring-1 focus:ring-fgb-navy-600"
              >
                <option value="FINISHED">FINISHED</option>
                <option value="WO">WO</option>
                <option value="CANCELED">CANCELED</option>
              </select>
            </div>
          </div>

          {/* Period scores toggle */}
          <div>
            <button
              type="button"
              onClick={() => setShowPeriods(v => !v)}
              className="text-sm font-medium text-fgb-navy-700 hover:underline"
            >
              {showPeriods ? '− Ocultar' : '+ Adicionar'} placar por quarto (opcional)
            </button>

            {showPeriods && (
              <div className="mt-3 rounded-lg border border-fgb-ink-200 bg-fgb-ink-50 p-4">
                <div className="grid grid-cols-[60px_1fr_1fr_40px] items-center gap-2 text-xs font-semibold uppercase text-fgb-ink-600">
                  <span>Período</span>
                  <span>{game.homeTeam.name}</span>
                  <span>{game.awayTeam.name}</span>
                  <span />
                </div>
                {periods.map((p, i) => {
                  const label = p.period <= 4 ? `Q${p.period}` : `OT${p.period - 4}`
                  return (
                    <div
                      key={`${p.period}-${i}`}
                      className="mt-2 grid grid-cols-[60px_1fr_1fr_40px] items-center gap-2"
                    >
                      <span className="text-sm font-bold text-fgb-ink-800">{label}</span>
                      <input
                        type="number"
                        min={0}
                        value={p.homeScore}
                        onChange={e => updatePeriod(i, 'homeScore', e.target.value)}
                        className="w-full rounded border border-fgb-ink-300 px-2 py-1 text-sm"
                        placeholder="0"
                      />
                      <input
                        type="number"
                        min={0}
                        value={p.awayScore}
                        onChange={e => updatePeriod(i, 'awayScore', e.target.value)}
                        className="w-full rounded border border-fgb-ink-300 px-2 py-1 text-sm"
                        placeholder="0"
                      />
                      {p.period > 4 ? (
                        <button
                          type="button"
                          onClick={() => removePeriod(i)}
                          className="rounded p-1 text-fgb-ink-500 hover:bg-red-50 hover:text-red-600"
                          aria-label="Remover prorrogação"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ) : (
                        <span />
                      )}
                    </div>
                  )
                })}
                <button
                  type="button"
                  onClick={addOvertime}
                  className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-fgb-navy-700 hover:underline"
                >
                  <Plus className="h-3 w-3" />
                  Adicionar prorrogação
                </button>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-fgb-ink-800">
              Observações (opcional)
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-fgb-ink-300 px-3 py-2 text-sm focus:border-fgb-navy-600 focus:outline-none focus:ring-1 focus:ring-fgb-navy-600"
              placeholder="Ex.: súmula recebida da arbitragem por email"
            />
          </div>

          {/* Feedback */}
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 border-t border-fgb-ink-200 pt-4">
            <Link
              href={`/admin/games/${game.id}`}
              className="rounded-lg px-4 py-2 text-sm font-medium text-fgb-ink-700 hover:bg-fgb-ink-100"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-fgb-navy-700 px-5 py-2 text-sm font-bold text-white hover:bg-fgb-navy-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Salvar súmula
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
