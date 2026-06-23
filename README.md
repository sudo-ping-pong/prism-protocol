# @sudo-ping-pong/prism-protocol

Shared **TypeScript wire protocol** for [Prism DevTools](https://github.com/sudo-ping-pong/prism-expo-client) — types and helpers for envelopes, WebSocket messages, connect URIs, Redux commands, and session export/import.

Used by [`@sudo-ping-pong/prism-expo-client`](https://github.com/sudo-ping-pong/prism-expo-client) and the Prism macOS desktop app.

## Install

```bash
npm install @sudo-ping-pong/prism-protocol
# or
pnpm add @sudo-ping-pong/prism-protocol
```

## Overview

Prism streams debug events from an Expo/React Native app to a desktop client over WebSocket. Every event is a **`PrismEnvelope`** with a typed **`payload`**:

| Category | Payload type | Description |
|----------|--------------|-------------|
| `NETWORK` | `NetworkPayload` | HTTP request/response (fetch, XHR, axios) |
| `LOG` | `LogPayload` | `console.log` / `warn` / `error` |
| `STATE` | `StatePayload` | Redux or Zustand snapshots |
| `PERFORMANCE` | `PerformancePayload` | React render timings |

## Quick example

```ts
import {
  createEnvelope,
  PRISM_PROTOCOL_VERSION,
  type NetworkPayload,
} from '@sudo-ping-pong/prism-protocol';

const payload: NetworkPayload = {
  method: 'GET',
  url: 'https://api.example.com/users',
  status: 200,
  statusText: 'OK',
  requestHeaders: {},
  responseHeaders: { 'content-type': 'application/json' },
  responseBody: '[]',
  durationMs: 42,
  initiator: 'fetch',
};

const envelope = createEnvelope('NETWORK', payload);
// { id, version, timestamp, category, payload }
```

## Wire messages

Clients connect with a handshake, then exchange JSON over WebSocket:

```ts
// SDK → server
{ type: 'handshake', role: 'sdk' }

// Server → client
{ type: 'handshake_ack', success: true, port: 8080 }

// Server → all clients
{ type: 'server_info', port: 8080, connectedClients: { sdk: 1, desktop: 0 }, lanAddresses: ['192.168.1.100'] }

// SDK → desktop (via server relay)
PrismEnvelope<NetworkPayload | LogPayload | StatePayload | PerformancePayload>

// Desktop → SDK (time-travel)
{ type: 'command', command: 'dispatch', storeId: 'app', action: { type: 'INCREMENT' } }
{ type: 'command', command: 'replace_state', storeId: 'app', state: { count: 0 } }
```

## Connect URI (QR / deep link)

```ts
import { encodePrismConnectUri, parsePrismConnectUri } from '@sudo-ping-pong/prism-protocol';

encodePrismConnectUri({ port: 8080, host: '192.168.1.100' });
// prism://connect?port=8080&host=192.168.1.100

parsePrismConnectUri('prism://connect?port=8080&host=192.168.1.100');
// { port: 8080, host: '192.168.1.100' }
```

## Session export / import

```ts
import {
  createPrismSession,
  serializePrismSession,
  validatePrismSessionImport,
} from '@sudo-ping-pong/prism-protocol';

const session = createPrismSession({
  network: [],
  logs: [],
  state: [],
  performance: [],
});

const json = serializePrismSession(session);
const result = validatePrismSessionImport(json);
```

## Type guards & helpers

```ts
import { isPrismEnvelope, isPrismCommand, generateId } from '@sudo-ping-pong/prism-protocol';
```

## Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `PRISM_PROTOCOL_VERSION` | `1.0.0` | Envelope wire version |
| `PRISM_DEFAULT_PORT` | `8080` | Default WebSocket port |
| `PRISM_MAX_BUFFER_SIZE` | `100` | SDK offline buffer limit |

## Network initiators

`NetworkPayload.initiator` is one of:

- `fetch`
- `xhr`
- `axios`

## Related packages

- [`@sudo-ping-pong/prism-expo-client`](https://www.npmjs.com/package/@sudo-ping-pong/prism-expo-client) — Expo/RN SDK (depends on this package)

## License

MIT © Prism DevTools
