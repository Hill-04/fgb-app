'use client'

import { useEffect } from 'react'

export default function AdminError({
  error,
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Admin Error Boundary]', error)
  }, [error])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '64px 24px',
      textAlign: 'center'
    }}>
      <div style={{
        width: 48,
        height: 48,
        background: 'var(--red-light)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        fontSize: 20
      }}>
        ⚠
      </div>
      <h2 className="fgb-heading" style={{ fontSize: 18, marginBottom: 8 }}>
        Algo deu errado
      </h2>
      <p className="fgb-label" style={{
        color: 'var(--gray)',
        marginBottom: 24,
        fontSize: 11,
        textTransform: 'none',
        letterSpacing: 0
      }}>
        {error.message || 'Erro inesperado. Tente novamente.'}
      </p>
      <button onClick={reset} className="fgb-btn-primary">
        Tentar novamente
      </button>
    </div>
  )
}

