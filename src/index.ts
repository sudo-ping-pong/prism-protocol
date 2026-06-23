/** Current wire protocol version — bump on breaking envelope changes */
export const PRISM_PROTOCOL_VERSION = '1.0.0';

export const PRISM_DEFAULT_PORT = 8080;
export const PRISM_MAX_BUFFER_SIZE = 100;

export type PrismCategory = 'NETWORK' | 'STATE' | 'LOG' | 'PERFORMANCE';

export interface PrismEnvelope<T = unknown> {
  id: string;
  version: string;
  timestamp: number;
  category: PrismCategory;
  payload: T;
}

// ─── Network ───────────────────────────────────────────────────────────────

export type NetworkInitiator = 'fetch' | 'xhr' | 'axios';

export interface NetworkPayload {
  method: string;
  url: string;
  status: number;
  statusText: string;
  requestHeaders: Record<string, string>;
  responseHeaders: Record<string, string>;
  requestBody?: string;
  responseBody?: string;
  durationMs: number;
  initiator: NetworkInitiator;
}

// ─── State ───────────────────────────────────────────────────────────────────

export type StateSource = 'redux' | 'zustand';

export interface StatePayload {
  actionLabel: string;
  payload: unknown;
  prevState: unknown;
  nextState: unknown;
  storeId: string;
  source?: StateSource;
}

// ─── Log ─────────────────────────────────────────────────────────────────────

export type LogLevel = 'log' | 'warn' | 'error';

export interface LogPayload {
  level: LogLevel;
  args: unknown[];
  stack?: string;
}

// ─── Performance ─────────────────────────────────────────────────────────────

export type PerformanceType = 'render' | 'heartbeat';

export interface PerformancePayload {
  type: PerformanceType;
  componentId?: string;
  phase?: 'mount' | 'update' | 'nested-update';
  actualDurationMs: number;
  baseDurationMs?: number;
}

// ─── Wire messages (server ↔ clients) ────────────────────────────────────────

export type ClientRole = 'sdk' | 'desktop';

export interface PrismHandshake {
  type: 'handshake';
  role: ClientRole;
  /** @deprecated Ignored — kept for older clients */
  pairingCode?: string;
}

export interface PrismHandshakeAck {
  type: 'handshake_ack';
  success: boolean;
  message?: string;
  port: number;
}

export interface PrismServerInfo {
  type: 'server_info';
  port: number;
  connectedClients: { sdk: number; desktop: number };
  lanAddresses: string[];
}

// ─── Mobile connect (QR / deep link) ─────────────────────────────────────────

export interface PrismConnectConfig {
  port: number;
  host?: string;
}

// ─── Desktop → SDK commands (time-travel) ────────────────────────────────────

export type PrismCommandName = 'dispatch' | 'replace_state';

export interface PrismDispatchCommand {
  type: 'command';
  command: 'dispatch';
  storeId: string;
  action: unknown;
}

export interface PrismReplaceStateCommand {
  type: 'command';
  command: 'replace_state';
  storeId: string;
  state: unknown;
}

export type PrismCommand = PrismDispatchCommand | PrismReplaceStateCommand;

export function isPrismCommand(msg: unknown): msg is PrismCommand {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'type' in msg &&
    (msg as PrismCommand).type === 'command' &&
    'command' in msg
  );
}

export type PrismWireMessage =
  | PrismHandshake
  | PrismHandshakeAck
  | PrismServerInfo
  | PrismCommand
  | PrismEnvelope;

export function encodePrismConnectUri(config: PrismConnectConfig): string {
  const params = new URLSearchParams({
    port: String(config.port),
  });
  if (config.host) params.set('host', config.host);
  return `prism://connect?${params.toString()}`;
}

export function parsePrismConnectUri(uri: string): PrismConnectConfig | null {
  try {
    const url = new URL(uri);
    if (url.protocol !== 'prism:' || url.hostname !== 'connect') return null;
    const port = parseInt(url.searchParams.get('port') ?? String(PRISM_DEFAULT_PORT), 10);
    if (!Number.isFinite(port)) return null;
    return {
      port,
      host: url.searchParams.get('host') ?? undefined,
    };
  } catch {
    return null;
  }
}

export function isPrismEnvelope(msg: unknown): msg is PrismEnvelope {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'id' in msg &&
    'category' in msg &&
    'payload' in msg
  );
}

export function createEnvelope<T>(
  category: PrismCategory,
  payload: T,
  id?: string,
): PrismEnvelope<T> {
  return {
    id: id ?? generateId(),
    version: PRISM_PROTOCOL_VERSION,
    timestamp: Date.now(),
    category,
    payload,
  };
}

export function generateId(): string {
  const g = globalThis as { crypto?: { randomUUID?: () => string } };
  if (g.crypto?.randomUUID) {
    return g.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export {
  PRISM_SESSION_FORMAT,
  PRISM_SESSION_VERSION,
  createPrismSession,
  isPrismSession,
  parsePrismSession,
  serializePrismSession,
  validatePrismSessionImport,
} from './session.js';
export type {
  PrismSession,
  PrismSessionMeta,
  PrismSessionImportResult,
} from './session.js';
