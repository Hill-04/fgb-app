"use client"

import { useState, useEffect } from 'react'
import { FileText, Download, Trophy, Calendar } from 'lucide-react'
import { Badge } from '@/components/Badge'

type Document = {
  id: string
  name: string
  type: string
  format: string
  url: string | null
  createdAt: string
  championship: { name: string }
}

const TYPE_LABELS: Record<string, string> = {
  relatorio_geral: 'Relatório Geral',
  tabela_confrontos: 'Tabela de Confrontos',
  calendario_equipe: 'Calendário da Equipe',
  custos: 'Custos',
  ata: 'Ata de Reunião',
}

export default function TeamDocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/team/documents')
      .then(r => r.json())
      .then(data => { setDocuments(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-10 max-w-6xl mx-auto font-sans">
      <div className="animate-fade-in border-b border-[var(--border)] pb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
            <FileText className="w-4 h-4 text-orange-600" />
          </div>
          <span className="text-[var(--gray)] font-bold uppercase tracking-widest text-[10px]">Documentos Oficiais</span>
        </div>
        <h1 className="text-4xl font-display font-black text-[var(--black)] tracking-tight uppercase italic">Documentos</h1>
        <p className="text-[var(--gray)] mt-2 font-medium">Documentos emitidos pela Federação relacionados às suas inscrições.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-gray-50 border border-[var(--border)] rounded-3xl" />)}
        </div>
      ) : documents.length === 0 ? (
        <div className="bg-gray-50 border border-[var(--border)] rounded-3xl p-20 text-center shadow-inner">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-6" />
          <h3 className="text-xl font-bold text-[var(--black)] mb-2 uppercase tracking-tight italic">Nenhum documento disponível</h3>
          <p className="text-[var(--gray)] max-w-xs mx-auto font-medium">Os documentos gerados pela Federação para sua equipe aparecerão aqui.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {documents.map((doc) => (
            <div key={doc.id} className="fgb-card bg-white border border-[var(--border)] rounded-3xl p-6 flex items-start gap-4 hover:border-orange-200 transition-all group shadow-sm hover:shadow-md">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-orange-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[var(--black)] truncate uppercase tracking-tight">{doc.name}</p>
                <p className="text-[10px] font-bold text-[var(--gray)] uppercase tracking-widest mt-1">{TYPE_LABELS[doc.type] || doc.type}</p>
                <p className="text-[10px] text-[var(--gray)] mt-1 flex items-center gap-1 font-medium">
                  <Trophy className="w-3 h-3 text-orange-400" /> {doc.championship.name}
                </p>
                <p className="text-[10px] text-[var(--gray)] flex items-center gap-1 font-medium mt-0.5">
                  <Calendar className="w-3 h-3 text-gray-400" /> {new Date(doc.createdAt).toLocaleDateString('pt-BR')}
                </p>
              </div>
              {doc.url ? (
                <a href={doc.url} target="_blank" rel="noreferrer" className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center hover:bg-orange-100 transition-colors">
                    <Download className="w-4 h-4 text-orange-600" />
                  </div>
                </a>
              ) : (
                <Badge variant="outline" className="text-[8px] uppercase opacity-50 shrink-0 text-[var(--gray)] border-[var(--border)]">
                   {doc.format}
                </Badge>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
