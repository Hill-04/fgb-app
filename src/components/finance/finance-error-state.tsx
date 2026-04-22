'use client'

import { AlertTriangle, RefreshCcw } from 'lucide-react'

import { Button } from '@/components/ui/button'

type FinanceErrorStateProps = {
  title?: string
  message?: string
  detail?: string
}

export function FinanceErrorState({
  title = 'Nao foi possivel carregar o financeiro',
  message = 'A central financeira encontrou uma falha de carregamento ou configuracao.',
  detail,
}: FinanceErrorStateProps) {
  return (
    <div className="rounded-[32px] border border-red-200 bg-white p-6 shadow-sm md:p-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-start">
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-3xl bg-red-50 text-[var(--red)]">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--red)]">Falha operacional</p>
          <h2 className="fgb-display mt-2 text-3xl leading-none text-[var(--black)]">{title}</h2>
          <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[var(--gray)]">{message}</p>
          {detail ? (
            <pre className="mt-4 max-h-36 overflow-auto rounded-2xl border border-red-100 bg-red-50 p-4 text-left text-xs text-red-800">
              {detail}
            </pre>
          ) : null}
          <div className="mt-5 flex flex-wrap gap-3">
            <Button onClick={() => window.location.reload()} className="h-11 rounded-2xl bg-[var(--black)] text-white hover:bg-black/85">
              <RefreshCcw className="mr-2 h-4 w-4" />
              Tentar novamente
            </Button>
            <span className="inline-flex items-center rounded-2xl border border-[var(--border)] bg-[var(--gray-l)] px-4 text-xs font-bold text-[var(--gray)]">
              Verifique migration, conexao do banco e permissoes.
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
