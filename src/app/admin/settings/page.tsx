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
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700 max-w-5xl">
      {/* Premium Header with pattern */}
      <div className="relative p-10 rounded-[32px] overflow-hidden bg-white border border-[var(--border)] shadow-sm">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(0,0,0,0.02)_0%,transparent_100%)]" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--verde)]/5 blur-[80px] rounded-full -mr-32 -mt-32" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1.5 h-8 bg-[var(--verde)] rounded-full shadow-[0_0_15px_rgba(27,115,64,0.3)]" />
            <div>
              <p className="fgb-label text-[var(--gray)]" style={{ fontSize: 9, letterSpacing: '0.2em' }}>GESTÃO ESTRUTURAL</p>
              <h1 className="fgb-display text-4xl text-[var(--black)] mt-1">Configurações da Federação</h1>
            </div>
          </div>
          <p className="fgb-label text-[var(--gray)] max-w-lg leading-relaxed" style={{ textTransform: 'none', letterSpacing: 0, opacity: 0.8 }}>
            Ajuste a identidade visual, parâmetros de comunicação e regras de segurança que governam todo o ecossistema FGB.
          </p>
        </div>
      </div>

      {/* Warning Card - High contrast */}
      <div className="group relative p-6 rounded-[24px] bg-[#FFF8E6] border border-[#FFE08C] shadow-sm flex items-start gap-4 transition-all hover:shadow-md">
        <div className="w-12 h-12 bg-[#FFE08C] rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm transition-transform group-hover:scale-110">
          <Lock className="w-6 h-6 text-[#856404]" />
        </div>
        <div>
          <h4 className="fgb-display text-base text-[#856404] mb-1">Configurações Críticas</h4>
          <p className="text-sm text-[#856404]/70 leading-snug">
            Estas definições afetam a integridade dos dados e o acesso dos usuários. Qualquer mudança aqui é refletida instantaneamente em todos os módulos.
          </p>
        </div>
      </div>

      {/* Grid of Sections - Pod Architecture */}
      <div className="grid grid-cols-1 gap-10">
        {sections.map((section, idx) => {
          const Icon = section.icon
          return (
            <div 
              key={section.title} 
              className="group relative bg-white rounded-[32px] border border-[var(--border)] shadow-sm transition-all duration-500 hover:shadow-premium hover:-translate-y-1"
            >
              {/* Pod Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between p-8 border-b border-[var(--border)] bg-[var(--bg-admin)]/40 rounded-t-[32px]">
                <div className="flex items-center gap-5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md transition-transform duration-500 group-hover:rotate-6 ${section.iconBg}`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="fgb-display text-xl text-[var(--black)] leading-none">{section.title}</h2>
                    <p className="fgb-label text-[var(--gray)] mt-1.5" style={{ fontSize: 10, textTransform: 'none', letterSpacing: 0, opacity: 0.7 }}>
                      {section.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Pod Fields Group */}
              <div className="p-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {section.fields.map(field => (
                    <div key={field.label} className="group/field space-y-2">
                      <label className="fgb-label text-[var(--gray)] px-1 transition-colors group-focus-within/field:text-[var(--verde)]" style={{ fontSize: 9 }}>
                        {field.label}
                      </label>
                      <div className="relative h-12">
                        <input
                          type={field.type}
                          defaultValue={field.value}
                          className="w-full h-full bg-[var(--bg-admin)] border border-[var(--border)] rounded-2xl px-5 text-sm font-semibold text-[var(--black)] transition-all focus:outline-none focus:ring-2 focus:ring-[var(--verde)]/20 focus:border-[var(--verde)] focus:bg-white"
                          readOnly
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                           <Shield className="w-4 h-4 text-[var(--gray)]/30" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pod Footer */}
              <div className="px-10 pb-10">
                <div className="p-5 bg-[var(--gray-l)]/50 border border-dashed border-[var(--border)] rounded-[24px] text-center transition-all group-hover:bg-white group-hover:border-solid group-hover:border-[var(--border)]">
                  <p className="fgb-label text-[var(--gray)]" style={{ fontSize: 10, textTransform: 'none', letterSpacing: 0 }}>
                    <span className="font-bold text-[var(--black)]">Status:</span> Controle restrito ao suporte técnico Nível 3.
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* System info bar - Enhanced */}
      <div className="relative group p-1 bg-gradient-to-r from-[var(--verde)] via-[var(--yellow)] to-[var(--red)] rounded-[28px] overflow-hidden shadow-lg transition-all hover:scale-[1.01] hover:shadow-premium">
        <div className="bg-[var(--black2)] rounded-[27px] p-7 flex items-center gap-6 relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_-20%,rgba(255,255,255,0.05)_0%,transparent_50%)]" />
          
          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 shadow-inner group-hover:bg-white/10 transition-colors">
            <Database className="w-7 h-7 text-[var(--yellow)]" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="fgb-display text-lg text-white leading-none">Núcleo Central FGB</p>
              <span className="fgb-badge fgb-badge-red text-[8px] py-0.5 px-2">v4.5 PREMIUM</span>
            </div>
            <p className="fgb-label text-white/40 mt-1.5" style={{ fontSize: 9, textTransform: 'none', letterSpacing: '0.05em' }}>
              Next.js 16 · Prisma 6 · PostgreSQL High-Availability Cluster · Edge Network Vercel
            </p>
          </div>
          <div className="hidden md:flex items-center gap-3 px-5 py-2.5 bg-green-500/10 rounded-2xl border border-green-500/20">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-400" />
            </span>
            <span className="fgb-label text-green-400" style={{ fontSize: 10, letterSpacing: '0.1em' }}>ONLINE</span>
          </div>
        </div>
      </div>
    </div>
  )
}
