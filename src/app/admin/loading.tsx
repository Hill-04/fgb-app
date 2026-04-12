export default function AdminLoading() {
  return (
    <div style={{ padding: 24 }}>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            height: 60,
            background: 'var(--gray-l)',
            borderRadius: 12,
            marginBottom: 12,
            animation: 'pulse 1.5s ease-in-out infinite'
          }}
        />
      ))}
      <style>{`
        @keyframes pulse {
          0%,100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}

