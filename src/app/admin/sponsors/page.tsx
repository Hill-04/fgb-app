import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

async function createSponsor(formData: FormData) {
  'use server'
  const name = String(formData.get('name') || '').trim()
  const logoUrl = String(formData.get('logoUrl') || '').trim()
  const websiteUrl = String(formData.get('websiteUrl') || '').trim()
  if (!name) return

  await prisma.sponsor.create({
    data: { name, logoUrl: logoUrl || null, websiteUrl: websiteUrl || null }
  })
  revalidatePath('/admin/sponsors')
}

export default async function AdminSponsorsPage() {
  try {
    const sponsors = await prisma.sponsor.findMany({
      orderBy: { createdAt: 'desc' },
      include: { clicks: true }
    })

    return (
      <div className="space-y-6 pb-12">
        <div>
          <h1 className="fgb-display text-3xl text-[var(--black)]">Patrocinadores</h1>
          <p className="fgb-label text-[var(--gray)] mt-1" style={{ textTransform: 'none', letterSpacing: 0 }}>
            Gestão e rastreio de cliques.
          </p>
        </div>

        <div className="fgb-card p-5">
          <form action={createSponsor} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input name="name" placeholder="Nome do patrocinador" className="h-10 rounded-xl border border-[var(--border)] bg-white px-3 text-sm" />
            <input name="logoUrl" placeholder="Logo URL (opcional)" className="h-10 rounded-xl border border-[var(--border)] bg-white px-3 text-sm" />
            <input name="websiteUrl" placeholder="Website (opcional)" className="h-10 rounded-xl border border-[var(--border)] bg-white px-3 text-sm" />
            <button type="submit" className="fgb-btn-primary h-10 rounded-xl md:col-span-3">Adicionar patrocinador</button>
          </form>
        </div>

        <div className="fgb-card overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--gray-l)]">
            <p className="fgb-label text-[var(--gray)]" style={{ fontSize: 10 }}>Patrocinadores ativos</p>
          </div>
          <div className="divide-y divide-[var(--border)] bg-white">
            {sponsors.length === 0 ? (
              <div className="p-10 text-center text-sm text-[var(--gray)]">Nenhum patrocinador cadastrado.</div>
            ) : (
              sponsors.map((sponsor) => (
                <div key={sponsor.id} className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl border border-[var(--border)] bg-[var(--gray-l)] flex items-center justify-center overflow-hidden">
                      {sponsor.logoUrl ? (
                        <img src={sponsor.logoUrl} alt={sponsor.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-black text-[var(--gray)]">LOGO</span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-black text-[var(--black)]">{sponsor.name}</p>
                      <p className="text-[11px] text-[var(--gray)]">
                        {sponsor.websiteUrl || 'Sem website'} · {sponsor.clicks.length} clique(s)
                      </p>
                    </div>
                  </div>
                  {sponsor.websiteUrl && (
                    <a href={sponsor.websiteUrl} className="fgb-btn-outline h-9 rounded-xl" target="_blank" rel="noreferrer">
                      Abrir site
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('[ADMIN SPONSORS ERROR]', error)
    return (
      <div className="fgb-card p-10 text-center">
        <p className="fgb-label text-[var(--red)]" style={{ textTransform: 'none', letterSpacing: 0 }}>
          Erro ao carregar patrocinadores.
        </p>
      </div>
    )
  }
}
