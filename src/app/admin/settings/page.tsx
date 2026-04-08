import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Settings, Shield, Globe, Bell, Database, Lock } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminSettingsPage() {
  const session = await getServerSession(authOptions)
  if (!session || !(session.user as any).isAdmin) redirect('/login')

  const sections = [
    {
      icon: Globe,
      title: 'Identidade da Federação',
      description: 'Nome oficial, logo, contato público e redes sociais',
      accent: 'border-t-[var(--verde)]',
      iconBg: 'bg-[var(--verde)]/10 text-[var(--verde)]',
      fields: [
        { label: 'Nome da Federação', value: 'Federação Gaúcha de Basketball', type: 'text' },
        { label: 'Sigla', value: 'FGB', type: 'text' },
        { label: 'E-mail de Contato', value: 'contato@fgbasket.com.br', type: 'email' },
        { label: 'Telefone', value: '(51) 3333-0000', type: 'text' },
        { label: 'Site Oficial', value: 'https://basquetegaucho.com.br', type: 'url' },
      ],
    },
    {
      icon: Bell,
      title: 'Notificações',
      description: 'Configurações de envio de e-mails e alertas automáticos',
      accent: 'border-t-[var(--yellow)]',
      iconBg: 'bg-[var(--yellow)]/20 text-[var(--black)]',
      fields: [
        { label: 'E-mail SMTP', value: 'smtp.federacao.com.br', type: 'text' },
        { label: 'Porta SMTP', value: '587', type: 'text' },
        { label: 'Remetente', value: 'noreply@fgbasket.com.br', type: 'email' },
      ],
    },
    {
      icon: Shield,
      title: 'Segurança',
      description: 'Controle de acesso e permissões do sistema',
      accent: 'border-t-[var(--red)]',
      iconBg: 'bg-[var(--red)]/10 text-[var(--red)]',
      fields: [
        { label: 'Sessão máxima (horas)', value: '24', type: 'number' },
        { label: 'Domínios permitidos', value: 'fgbasket.com.br', type: 'text' },
      ],
    },
  ]

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="fgb-label text-[var(--gray)]" style={{ fontSize: 10 }}>Administração</span>
          <span className="fgb-badge fgb-badge-outline">CONFIGURAÇÕES</span>
        </div>
        <h1 className="fgb-display text-3xl text-[var(--black)]">Configurações da Federação</h1>
        <p className="fgb-label text-[var(--gray)] mt-1" style={{ textTransform: 'none', letterSpacing: 0 }}>
          Parâmetros gerais do sistema e da federação
        </p>
      </div>

      {/* Info banner */}
      <div className="fgb-card bg-[var(--yellow)]/10 border border-[var(--yellow)]/40 p-4 flex items-start gap-3">
        <Lock className="w-4 h-4 text-[var(--black)] flex-shrink-0 mt-0.5" />
        <div>
          <p className="fgb-label text-[var(--black)]" style={{ fontSize: 10 }}>Configurações sensíveis</p>
          <p className="fgb-label text-[var(--gray)] mt-0.5" style={{ fontSize: 9, textTransform: 'none', letterSpacing: 0 }}>
            Alterações aqui afetam todo o sistema. Certifique-se antes de salvar.
          </p>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-6">
        {sections.map(section => {
          const Icon = section.icon
          return (
            <div key={section.title} className={`fgb-card bg-white border-t-[3px] ${section.accent} overflow-hidden`}>
              {/* Section header */}
              <div className="flex items-center gap-4 p-6 border-b border-[var(--border)] bg-[var(--gray-l)]">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${section.iconBg}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="fgb-display text-base text-[var(--black)] leading-none">{section.title}</h2>
                  <p className="fgb-label text-[var(--gray)] mt-1" style={{ fontSize: 9, textTransform: 'none', letterSpacing: 0 }}>
                    {section.description}
                  </p>
                </div>
              </div>

              {/* Fields */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {section.fields.map(field => (
                  <div key={field.label} className="space-y-1.5">
                    <label className="fgb-label text-[var(--gray)]" style={{ fontSize: 9 }}>{field.label}</label>
                    <input
                      type={field.type}
                      defaultValue={field.value}
                      className="w-full bg-[var(--gray-l)] border border-[var(--border)] rounded-xl h-10 px-3 text-sm font-sans text-[var(--black)] focus:outline-none focus:border-[var(--verde)] focus:ring-1 focus:ring-[var(--verde)] transition-all"
                      readOnly
                    />
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="px-6 pb-6">
                <div className="fgb-label text-[var(--gray)] text-center py-3 border border-dashed border-[var(--border)] rounded-xl" style={{ fontSize: 9, textTransform: 'none', letterSpacing: 0 }}>
                  Edição disponível em breve — entre em contato com o suporte técnico para alterações urgentes
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* System info */}
      <div className="fgb-card admin-card-verde p-6 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
          <Database className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="fgb-display text-sm text-white leading-none">Sistema FGB v2.0</p>
          <p className="fgb-label text-white/60 mt-1" style={{ fontSize: 9, textTransform: 'none', letterSpacing: 0 }}>
            Next.js 16 · Prisma 6 · PostgreSQL · Vercel
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-50" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
          </span>
          <span className="fgb-label text-white/80" style={{ fontSize: 9 }}>Online</span>
        </div>
      </div>
    </div>
  )
}
