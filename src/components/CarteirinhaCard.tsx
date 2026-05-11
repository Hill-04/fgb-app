import Image from 'next/image'
import { VerifiedBadge } from '@/components/VerifiedBadge'

type Props = {
  type: 'athlete' | 'coach' | 'referee'
  name: string
  registrationNumber?: number | null
  photoUrl?: string | null
  teamName?: string
  categoryName?: string
  role?: string
  situation: string
  season: number
  athleteId?: string
  showQR?: boolean
  verified?: boolean | null
}

const SITUATION_CONFIG: Record<string, { label: string; bg: string; dot: string }> = {
  ACTIVE:      { label: 'ATIVO',      bg: 'bg-fgb-green-500/20 text-fgb-green-100',   dot: 'bg-fgb-green-400' },
  PENDING:     { label: 'PENDENTE',   bg: 'bg-fgb-yellow-500/20 text-fgb-yellow-100', dot: 'bg-fgb-yellow-400' },
  INACTIVE:    { label: 'INATIVO',    bg: 'bg-fgb-ink-400/20 text-fgb-ink-200',       dot: 'bg-fgb-ink-300' },
  TRANSFERRED: { label: 'TRANSFERIDO',bg: 'bg-fgb-navy-500/20 text-fgb-navy-100',     dot: 'bg-fgb-navy-400' },
}

const TYPE_LABEL: Record<string, string> = {
  athlete:  'ATLETA',
  coach:    'COMISSÃO TÉCNICA',
  referee:  'ÁRBITRO',
}

export default function CarteirinhaCard({
  type, name, registrationNumber, photoUrl, teamName, categoryName,
  role, situation, season, athleteId, showQR = true, verified,
}: Props) {
  const sit = SITUATION_CONFIG[situation] || SITUATION_CONFIG.PENDING
  const qrUrl = athleteId
    ? `https://fgb-app.vercel.app/atletas/${athleteId}/carteirinha`
    : null

  return (
    <div
      className="relative overflow-hidden rounded-2xl shadow-lg"
      style={{ width: '100%', aspectRatio: '85.6/54', background: 'linear-gradient(135deg, var(--fgb-green-900) 0%, var(--fgb-green-800) 60%, var(--fgb-green-700) 100%)' }}
    >
      {/* Grid decorativo */}
      <div className="pointer-events-none absolute inset-0 opacity-10"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 18px,rgba(255,255,255,.3) 18px,rgba(255,255,255,.3) 19px),repeating-linear-gradient(90deg,transparent,transparent 18px,rgba(255,255,255,.3) 18px,rgba(255,255,255,.3) 19px)' }} />

      {/* Círculo decorativo */}
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full border border-white/10" />
      <div className="pointer-events-none absolute -right-2 -bottom-4 h-16 w-16 rounded-full border border-white/8" />

      <div className="relative flex h-full items-stretch px-3 py-2.5">
        {/* Coluna esquerda — foto + nº */}
        <div className="flex w-14 shrink-0 flex-col items-center justify-center gap-1.5 mr-2.5">
          <div className="h-12 w-12 rounded-full border-2 border-white/30 bg-white/10 overflow-hidden flex items-center justify-center">
            {photoUrl ? (
              <img src={photoUrl} alt={name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-white/60 text-xl font-black">{name[0]?.toUpperCase()}</span>
            )}
          </div>
          {registrationNumber && (
            <span className="text-[8px] font-black text-fgb-yellow-400 leading-none">#{registrationNumber}</span>
          )}
        </div>

        {/* Coluna central — info */}
        <div className="flex flex-1 flex-col justify-between py-0.5 min-w-0">
          <div>
            <p className="text-[6px] font-black uppercase tracking-[0.25em] text-fgb-yellow-400 leading-none">
              Federação Gaúcha de Basquete
            </p>
            <p className="text-[5px] font-bold uppercase tracking-[0.15em] text-white/50 mt-0.5">{TYPE_LABEL[type]}</p>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1 min-w-0">
              <p className="text-[10px] font-black uppercase text-white leading-tight truncate flex-1" title={name}>{name}</p>
              {verified && (
                <VerifiedBadge verified variant="icon" size="sm" tone="solid" className="shrink-0" />
              )}
            </div>
            {teamName && (
              <p className="text-[7px] text-white/70 truncate mt-0.5">{teamName}</p>
            )}
            {(categoryName || role) && (
              <span className="mt-1 inline-flex items-center rounded-full bg-fgb-yellow-400/20 px-1.5 py-0.5 text-[6px] font-black uppercase tracking-wide text-fgb-yellow-400">
                {categoryName || role}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[6px] font-black uppercase ${sit.bg}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${sit.dot}`} />
              {sit.label}
            </span>
            <span className="text-[6px] text-white/40">TEMP. {season}</span>
          </div>
        </div>

        {/* QR code */}
        {showQR && qrUrl && (
          <div className="flex w-10 shrink-0 flex-col items-center justify-center ml-2">
            <div className="rounded-lg bg-white p-0.5">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=64x64&data=${encodeURIComponent(qrUrl)}`}
                alt="QR"
                width={36}
                height={36}
                className="block"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
