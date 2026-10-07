# Manifest transport and HMAC protocol v1

`POST /v1/ingest`, UTF-8 JSON, `Content-Type: application/json`, maximum 65,536 bytes. JSON duplicate keys are rejected. Schema: `schema/manifest-v1.json`. The signed body includes metadata `signature:{algorithm:"hmac-sha256",keyId:<safe registered identity>}`; the actual MAC lives only in a request header, preventing recursive signing.

Headers: `X-Evidence-Source`, `X-Evidence-Key`, `X-Evidence-Timestamp`, `X-Evidence-Nonce`, `X-Evidence-Signature`. Timestamp is 13 decimal Unix milliseconds; nonce is 16–100 ASCII letters/digits/hyphens (UUID recommended). Signature is 64 lowercase hex characters.

Join these exact strings with a single LF and **no trailing LF**:

```text
SYNAPZ-EVIDENCE-V1
POST
/v1/ingest
<source system>
<key ID>
<Unix timestamp milliseconds>
<nonce>
<SHA-256 hex of exact UTF-8 body bytes>
```

Compute HMAC-SHA256 of those UTF-8 bytes using the per-source secret. Send the exact serialized body used for the hash. There is no cross-language JSON canonicalization requirement. Python may send literal Unicode and Node may escape it differently; each signs its own exact bytes. The server verifies using a timing-safe byte comparison before parsing untrusted JSON.

The source allowlist binds source system, safe repository key, signing key ID, allowed tier and server-side secret. Both transport timestamp and manifest emission time must be within five minutes of the server. `observedAt` may be historical but cannot follow `emittedAt`; freshness uses the observation timestamp. Synchronize source/server clocks. HTTPS is mandatory away from loopback. Never retry by changing an already accepted event's ID: the producer must preserve event identity for a given observation.

Replay state and event uniqueness live in Postgres and survive process restarts. A repeated `(source,nonce)` returns `409 replay_rejected`; a repeated `eventId` with a new nonce returns `409 duplicate_event`. Acceptance returns `202 {eventId,status,decision}`; both emitters verify the event ID and recognized status/decision. There are no duplicate publication effects. Source/peer limits are 60/300 requests per minute, stored in Postgres. Forwarded IP headers are ignored; configure the trusted front proxy with its own per-client limits when deployed behind a shared proxy.

Rejections expose stable codes, never request bodies/headers, tokens, or cryptographic material. Unsupported algorithms fail schema validation. OIDC/JWT requires a separately reviewed verifier and corresponding manifest schema extension; it is not silently accepted as HMAC.

Key rotation: pause the source emitter, drain in-flight requests, replace the source's key ID/secret together in server and CI secret configuration, restart the service, then resume. Old keys immediately stop verifying. Nonce/event history remains retained. Do not reuse another source's credential or expose source secrets to a browser.
