import type { LiveEnvelope } from '../types/live-admin'

export function normalizeEnvelope(payload: any): LiveEnvelope {
  if (payload?.snapshot) {
    return payload as LiveEnvelope
  }

  const lastEvent = Array.isArray(payload?.events) && payload.events.length > 0
    ? payload.events[payload.events.length - 1]
    : null

  return {
    snapshot: payload,
    lastSequenceNumber: lastEvent?.sequenceNumber ?? 0,
    serverUpdatedAt: new Date().toISOString(),
    lastEventId: lastEvent?.id ?? null,
  }
}

export function shouldUseResponseEnvelope(currentConfirmed: LiveEnvelope | null, responseEnvelope: LiveEnvelope) {
  return currentConfirmed && currentConfirmed.lastSequenceNumber > responseEnvelope.lastSequenceNumber
    ? currentConfirmed
    : responseEnvelope
}

export function shouldDeferRemote(currentDeferred: LiveEnvelope | null, envelope: LiveEnvelope) {
  return !currentDeferred || envelope.lastSequenceNumber >= currentDeferred.lastSequenceNumber
}
