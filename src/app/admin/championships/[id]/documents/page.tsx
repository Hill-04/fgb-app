import { FileText } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ChampionshipDocumentsPage() {
  return (
    <div className="fgb-card p-10">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-[var(--gray-l)] border border-[var(--border)] flex items-center justify-center">
          <FileText className="w-5 h-5 text-[var(--verde)]" />
        </div>
        <div>
          <h2 className="fgb-display text-xl text-[var(--black)]">Documentos do Campeonato</h2>
          <p className="fgb-label text-[var(--gray)] mt-1" style={{ textTransform: 'none', letterSpacing: 0 }}>
            Regulamento, notas oficiais e anexos da competição.
          </p>
        </div>
      </div>
      <div className="border border-dashed border-[var(--border)] rounded-2xl p-10 text-center bg-[var(--gray-l)]">
        <p className="fgb-label text-[var(--gray)]" style={{ textTransform: 'none', letterSpacing: 0 }}>
          Nenhum documento enviado ainda.
        </p>
      </div>
    </div>
  )
}
