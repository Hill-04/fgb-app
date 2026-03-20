'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCcw, Settings } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Server-side exception caught:', error)
  }, [error])

  const isEnvError = error.message?.includes('DATABASE_URL') || 
                    error.message?.includes('NEXTAUTH_SECRET') ||
                    error.message?.includes('Environment variable')

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-8 border border-red-500/20">
        <AlertCircle className="w-10 h-10 text-red-500" />
      </div>

      <h1 className="text-3xl font-black mb-4 tracking-tight uppercase">
        Erro de Aplicativo
      </h1>
      
      <p className="text-slate-400 max-w-md mb-8 font-medium">
        Ocorreu uma exceção no servidor. Isso geralmente acontece por falta de configuração ou conexões pendentes.
      </p>

      {isEnvError && (
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-6 mb-8 max-w-lg text-left">
          <div className="flex items-center gap-3 mb-3">
            <Settings className="w-5 h-5 text-orange-500" />
            <h3 className="font-bold text-orange-500 uppercase text-sm tracking-widest">Ação Necessária</h3>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            Parece que algumas <strong>Variáveis de Ambiente</strong> estão faltando na sua conta Vercel. 
            Verifique se <code className="text-orange-300">DATABASE_URL</code> e <code className="text-orange-300">NEXTAUTH_SECRET</code> foram configuradas.
          </p>
        </div>
      )}

      <div className="bg-[#111] border border-white/5 rounded-xl p-4 mb-10 w-full max-w-2xl overflow-hidden">
        <p className="text-[10px] font-mono text-slate-500 uppercase mb-2 tracking-widest">Mensagem Técnica</p>
        <p className="text-xs font-mono text-red-400 break-all">{error.message || 'Erro desconhecido'}</p>
        {error.digest && (
          <p className="text-[10px] font-mono text-slate-600 mt-2">Digest: {error.digest}</p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Button 
          onClick={() => reset()}
          className="bg-white text-black hover:bg-slate-200 font-bold h-12 px-8 rounded-full transition-all flex items-center gap-2"
        >
          <RefreshCcw className="w-4 h-4" />
          Tentar Novamente
        </Button>
        <Link href="/">
          <Button 
            variant="outline"
            className="border-white/10 text-white hover:bg-white/5 h-12 px-8 rounded-full font-bold transition-all"
          >
            Voltar ao Início
          </Button>
        </Link>
      </div>
      
      <p className="mt-12 text-[10px] text-slate-600 font-bold tracking-[0.2em] uppercase">
        FGB Management System • v1.0
      </p>
    </div>
  )
}
