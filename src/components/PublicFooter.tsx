import Link from 'next/link'
import Image from 'next/image'

const FGB_LOGO = 'https://basquetegaucho.com.br/wp-content/uploads/2023/09/Federacao-Gaucha-de-Basketball-Logo-01.png'

export function PublicFooter() {
  return (
    <footer className="bg-[#0D0D0D] border-t border-white/[0.08] mt-20">
      <div className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">

          {/* Logo + Info */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-5">
              <div className="relative w-12 h-12 flex-shrink-0">
                <Image
                  src={FGB_LOGO}
                  alt="FGB Logo"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
              <div>
                <p className="text-white font-black text-sm uppercase tracking-tight leading-none">Federação Gaúcha</p>
                <p className="text-[10px] text-[#FF6B00] uppercase tracking-[0.2em] mt-0.5">de Basketball</p>
              </div>
            </div>
            <div className="text-xs text-slate-500 leading-relaxed space-y-1">
              <p>Rua Marechal Floriano, 388</p>
              <p>Centro, Caxias do Sul - RS</p>
              <p className="pt-1">(54) 3223-3858</p>
              <p>8h às 12h · 13h às 17h</p>
              <p className="pt-1">fgb@basquetegaucho.com.br</p>
            </div>
          </div>

          {/* FGB */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-5">FGB</p>
            <div className="space-y-2.5">
              {[
                { label: 'Diretoria', href: '/fgb/diretoria' },
                { label: 'Fundação', href: '/fgb/fundacao' },
                { label: 'História da Federação', href: '/fgb/historia' },
                { label: 'Regulamento Desportivo', href: '/fgb/regulamento' },
                { label: 'Categorias e Idades', href: '/fgb/categorias' },
                { label: 'Arbitragem', href: '/fgb/arbitragem' },
                { label: 'Notas Oficiais', href: '/fgb/notas' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block text-xs text-slate-500 hover:text-white hover:translate-x-0.5 transition-all"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Campeonatos */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-5">Campeonatos</p>
            <div className="space-y-2.5">
              {[
                { label: 'Todos os Campeonatos', href: '/campeonatos' },
                { label: 'Estadual Feminino', href: '/campeonatos?filtro=feminino' },
                { label: 'Estadual Masculino', href: '/campeonatos?filtro=masculino' },
                { label: 'Cestinhas', href: '/campeonatos/cestinhas' },
                { label: 'Seleção Gaúcha', href: '/selecao-gaucha' },
                { label: 'Galeria de Fotos', href: '/galeria' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block text-xs text-slate-500 hover:text-white hover:translate-x-0.5 transition-all"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Redes Sociais */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-5">Redes Sociais</p>
            <div className="space-y-2.5">
              <a
                href="https://www.facebook.com/fgb.basquetegaucho"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-slate-500 hover:text-[#FF6B00] transition-colors"
              >
                <span className="w-6 h-6 rounded-lg bg-white/[0.04] flex items-center justify-center text-[10px] font-black">f</span>
                Facebook
              </a>
              <a
                href="https://www.instagram.com/fg_basquete/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-slate-500 hover:text-[#FF6B00] transition-colors"
              >
                <span className="w-6 h-6 rounded-lg bg-white/[0.04] flex items-center justify-center text-[10px] font-black">ig</span>
                Instagram
              </a>
              <a
                href="https://api.whatsapp.com/send?phone=555432233858&text=Olá!%20Tudo%20Bem?"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-slate-500 hover:text-[#FF6B00] transition-colors"
              >
                <span className="w-6 h-6 rounded-lg bg-white/[0.04] flex items-center justify-center text-[10px] font-black">W</span>
                WhatsApp
              </a>
            </div>
            <div className="mt-8 pt-6 border-t border-white/[0.05]">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-3">Área Restrita</p>
              <Link
                href="/login"
                className="inline-block bg-[#FF6B00]/10 border border-[#FF6B00]/20 hover:bg-[#FF6B00]/20 text-[#FF6B00] font-black text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all"
              >
                Acessar Painel
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/[0.06] pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-[10px] text-slate-600">
            © {new Date().getFullYear()} Federação Gaúcha de Basketball. Todos os direitos reservados.
          </p>
          <p className="text-[10px] text-slate-700 uppercase tracking-widest">FGB Season 26 · Plataforma Oficial</p>
        </div>
      </div>
    </footer>
  )
}
