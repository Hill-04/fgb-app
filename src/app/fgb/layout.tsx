import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FGB — Federação Gaúcha de Basketball',
  description: 'Federação Gaúcha de Basketball - Sistema de gestão de campeonatos',
}

export default function FgbLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
