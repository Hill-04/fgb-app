'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { MISSING_FIELD_LABELS, type MissingFieldKey } from '@/lib/audit-athletes'

interface AuditResponse {
  ok: boolean
  elapsedMs: number
  summary: {
    total: number
    complete: number
    incomplete: number
    completePct: number
  }
  missingByType: Record<string, number>
  byTeam: Array<{
    teamId: string
    teamName: string
    total: number
    complete: number
    incomplete: number
    incompleteAthletes: Array<{
      athleteId: string
      registrationNumber: number | null
      missingFields: string[]
      totalProblems: number
      isMinor: boolean
      age: number | null
    }>
  }>
  timestamp: string
}

interface FlatRow {
  athleteId: string
  registrationNumber: number | null
  teamId: string
  teamName: string
  missingFields: string[]
  totalProblems: number
  isMinor: boolean
  age: number | null
}

export function AuditAthletesClient({ data }: { data: AuditResponse }) {
  const [filterTeam, setFilterTeam] = useState<string>('all')
  const [filterMissingType, setFilterMissingType] = useState<string>('all')
  const [searchReg, setSearchReg] = useState('')

  // Flatten todos os atletas incompletos pra tabela
  const allRows: FlatRow[] = useMemo(() => {
    const rows: FlatRow[] = []
    for (const team of data.byTeam) {
      for (const a of team.incompleteAthletes) {
        rows.push({
          athleteId: a.athleteId,
          registrationNumber: a.registrationNumber,
          teamId: team.teamId,
          teamName: team.teamName,
          missingFields: a.missingFields,
          totalProblems: a.totalProblems,
          isMinor: a.isMinor,
          age: a.age,
        })
      }
    }
    return rows
  }, [data])

  // Aplicar filtros
  const filteredRows = useMemo(() => {
    return allRows.filter((row) => {
      if (filterTeam !== 'all' && row.teamId !== filterTeam) return false
      if (filterMissingType !== 'all' && !row.missingFields.includes(filterMissingType)) return false
      if (searchReg) {
        const regStr = row.registrationNumber?.toString() ?? ''
        if (!regStr.includes(searchReg)) return false
      }
      return true
    })
  }, [allRows, filterTeam, filterMissingType, searchReg])

  // Lista única de teams pro dropdown
  const teamOptions = useMemo(() => {
    return data.byTeam.map((t) => ({ id: t.teamId, name: t.teamName, count: t.incomplete }))
  }, [data])

  // Lista única de tipos de problema pro dropdown
  const missingTypeOptions = useMemo(() => {
    return Object.entries(data.missingByType)
      .sort((a, b) => b[1] - a[1])
      .map(([key, count]) => ({
        key,
        label: MISSING_FIELD_LABELS[key as MissingFieldKey] ?? key,
        count,
      }))
  }, [data])

  // Exportar CSV
  function exportCSV() {
    const headers = ['registrationNumber', 'teamName', 'age', 'isMinor', 'totalProblems', 'missingFields']
    const rows = filteredRows.map((r) => [
      r.registrationNumber ?? '',
      `"${r.teamName.replace(/"/g, '""')}"`,
      r.age ?? '',
      r.isMinor ? 'Sim' : 'Não',
      r.totalProblems,
      `"${r.missingFields.map((f) => MISSING_FIELD_LABELS[f as MissingFieldKey] ?? f).join('; ')}"`,
    ])
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-athletes-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/admin/athletes" className="text-sm text-[var(--gray)] hover:text-[var(--verde)]">
            ← Voltar
          </Link>
        </div>
        <h1 className="fgb-display text-3xl text-[var(--black)] mb-2">Auditoria de Completude</h1>
        <p className="text-sm text-[var(--gray)]">
          Atletas com dados faltantes para cadastro completo. Atualizado em{' '}
          {new Date(data.timestamp).toLocaleString('pt-BR')}.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="fgb-card p-6">
          <div className="text-sm text-[var(--gray)] mb-1">Total de atletas</div>
          <div className="fgb-display text-4xl text-[var(--black)]">{data.summary.total}</div>
        </div>
        <div className="fgb-card p-6">
          <div className="text-sm text-[var(--gray)] mb-1">Completos</div>
          <div className="fgb-display text-4xl text-[var(--verde)]">
            {data.summary.complete}
            <span className="text-base text-[var(--gray)] ml-2">({data.summary.completePct}%)</span>
          </div>
        </div>
        <div className="fgb-card p-6">
          <div className="text-sm text-[var(--gray)] mb-1">Incompletos</div>
          <div className="fgb-display text-4xl text-[var(--red,#DC2626)]">{data.summary.incomplete}</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="fgb-card p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label className="fgb-label text-[var(--gray)] mb-2 block">Clube</Label>
            <select
              value={filterTeam}
              onChange={(e) => setFilterTeam(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-[var(--border)] bg-white text-sm"
            >
              <option value="all">Todos ({allRows.length})</option>
              {teamOptions.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.count})
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label className="fgb-label text-[var(--gray)] mb-2 block">Tipo de problema</Label>
            <select
              value={filterMissingType}
              onChange={(e) => setFilterMissingType(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-[var(--border)] bg-white text-sm"
            >
              <option value="all">Todos</option>
              {missingTypeOptions.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label} ({t.count})
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label className="fgb-label text-[var(--gray)] mb-2 block">Buscar por registro</Label>
            <Input
              value={searchReg}
              onChange={(e) => setSearchReg(e.target.value)}
              placeholder="Ex: 12345"
              className="h-10"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={exportCSV} className="w-full fgb-btn-primary h-10" disabled={filteredRows.length === 0}>
              Exportar CSV ({filteredRows.length})
            </Button>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="fgb-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--gray-l)] border-b border-[var(--border)]">
              <tr>
                <th className="px-4 py-3 text-left fgb-label text-[var(--gray)]">Registro</th>
                <th className="px-4 py-3 text-left fgb-label text-[var(--gray)]">Clube</th>
                <th className="px-4 py-3 text-left fgb-label text-[var(--gray)]">Idade</th>
                <th className="px-4 py-3 text-left fgb-label text-[var(--gray)]">Problemas</th>
                <th className="px-4 py-3 text-left fgb-label text-[var(--gray)]">Faltando</th>
                <th className="px-4 py-3 text-right fgb-label text-[var(--gray)]">Ação</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-[var(--gray)]">
                    Nenhum atleta encontrado com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr key={row.athleteId} className="border-b border-[var(--border)] hover:bg-[var(--gray-l)]/40">
                    <td className="px-4 py-3 font-mono text-xs">{row.registrationNumber ?? '—'}</td>
                    <td className="px-4 py-3">{row.teamName}</td>
                    <td className="px-4 py-3">
                      {row.age !== null ? (
                        <span>
                          {row.age}
                          {row.isMinor && (
                            <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
                              Menor
                            </span>
                          )}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                        {row.totalProblems}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {row.missingFields.map((f) => (
                          <span key={f} className="inline-block text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                            {MISSING_FIELD_LABELS[f as MissingFieldKey] ?? f}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/athletes/${row.athleteId}`}
                        className="text-xs text-[var(--verde)] hover:underline"
                      >
                        Editar →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
