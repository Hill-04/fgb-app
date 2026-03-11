type LogLevel = 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  data?: unknown
  timestamp: string
}

export const logger = {
  info: (message: string, data?: unknown) => {
    log('info', message, data)
  },

  warn: (message: string, data?: unknown) => {
    log('warn', message, data)
  },

  error: (message: string, error?: unknown) => {
    log('error', message, error)
  }
}

function log(level: LogLevel, message: string, data?: unknown) {
  const entry: LogEntry = {
    level,
    message,
    data,
    timestamp: new Date().toISOString()
  }

  if (level === 'error') {
    console.error(`[${entry.timestamp}] ERROR:`, message, data)
  } else if (level === 'warn') {
    console.warn(`[${entry.timestamp}] WARN:`, message, data)
  } else {
    console.log(`[${entry.timestamp}] INFO:`, message, data)
  }

  // TODO: Store critical errors in Event table when needed
}
