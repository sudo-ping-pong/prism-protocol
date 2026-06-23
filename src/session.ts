import type { LogPayload, NetworkPayload, PerformancePayload, StatePayload } from './index';
import type { PrismEnvelope } from './index';

const PROTOCOL_VERSION = '1.0.0';

export const PRISM_SESSION_FORMAT = 'prism-session' as const;
export const PRISM_SESSION_VERSION = '1.0.0';

export interface PrismSessionMeta {
  serverPort?: number;
  pairingCode?: string;
  sdkConnected?: boolean;
  eventCounts: {
    network: number;
    logs: number;
    state: number;
    performance: number;
  };
}

export interface PrismSession {
  format: typeof PRISM_SESSION_FORMAT;
  version: string;
  protocolVersion: string;
  exportedAt: number;
  meta: PrismSessionMeta;
  network: PrismEnvelope<NetworkPayload>[];
  logs: PrismEnvelope<LogPayload>[];
  state: PrismEnvelope<StatePayload>[];
  performance: PrismEnvelope<PerformancePayload>[];
}

export function createPrismSession(data: {
  network: PrismEnvelope<NetworkPayload>[];
  logs: PrismEnvelope<LogPayload>[];
  state: PrismEnvelope<StatePayload>[];
  performance: PrismEnvelope<PerformancePayload>[];
  meta?: Partial<PrismSessionMeta>;
}): PrismSession {
  return {
    format: PRISM_SESSION_FORMAT,
    version: PRISM_SESSION_VERSION,
    protocolVersion: PROTOCOL_VERSION,
    exportedAt: Date.now(),
    meta: {
      serverPort: data.meta?.serverPort,
      pairingCode: data.meta?.pairingCode,
      sdkConnected: data.meta?.sdkConnected,
      eventCounts: {
        network: data.network.length,
        logs: data.logs.length,
        state: data.state.length,
        performance: data.performance.length,
      },
    },
    network: data.network,
    logs: data.logs,
    state: data.state,
    performance: data.performance,
  };
}

export function isPrismSession(data: unknown): data is PrismSession {
  if (typeof data !== 'object' || data === null) return false;
  const s = data as PrismSession;
  return (
    s.format === PRISM_SESSION_FORMAT &&
    typeof s.version === 'string' &&
    Array.isArray(s.network) &&
    Array.isArray(s.logs) &&
    Array.isArray(s.state) &&
    Array.isArray(s.performance)
  );
}

export function parsePrismSession(json: string): PrismSession | null {
  try {
    const data = JSON.parse(json) as unknown;
    if (!isPrismSession(data)) return null;
    return data;
  } catch {
    return null;
  }
}

export function serializePrismSession(session: PrismSession, pretty = true): string {
  return JSON.stringify(session, null, pretty ? 2 : 0);
}

export type PrismSessionImportResult =
  | { ok: true; session: PrismSession }
  | { ok: false; error: string };

export function validatePrismSessionImport(json: string): PrismSessionImportResult {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    return { ok: false, error: 'Invalid JSON file' };
  }

  if (!isPrismSession(data)) {
    return { ok: false, error: 'Not a valid Prism session file' };
  }

  const total =
    data.network.length + data.logs.length + data.state.length + data.performance.length;

  if (total === 0) {
    return { ok: false, error: 'Session file contains no events' };
  }

  return { ok: true, session: data };
}
