# AWS API Boundary Layer

## Responsibility

This repository exposes the browser-facing API boundary and proxies sanctioned traffic to compute. Current code provides CORS handling, body parsing and size limits, cookie/access-token transport, original-host forwarding, compute timeout normalization, response/cookie forwarding, and selected redirect behavior.

It should remain a policy and transport layer rather than become a second implementation of the platform runtime.

The `testing` repository is an additional client of this same public boundary. It must not receive a privileged transport shortcut; its session cookies, action routing, response envelopes, timeouts, and authorization failures follow the same contract as the website.

## Owns

- Browser-origin allowlisting and preflight behavior
- Request size and syntax rejection with structured errors
- Authentication/cookie/header transport at the public boundary
- Original-host and route normalization
- Compute upstream timeout and connectivity classification
- Stable browser-facing response and error envelopes
- Durable job submission/status transport when background contracts are centralized
- Versioned entity-publication/acknowledgement and authorized graph-hydration transport
- Protected-envelope/grant lifecycle transport without plaintext inspection
- Transparent forwarding of sanitized versioned model-usage metadata without cost recalculation
- Transparent forwarding of the validated LLM template identifier without resolving model policy
- Versioned transport of intent-jurisdiction decisions, capability contract/version references, fork lineage operations, and their idempotency keys without reinterpreting semantics

## Does not own

- Natural-language interpretation, Paths, Essences, or ContextDB semantics
- Entity/JPL generation or execution
- Provider protocol discovery or provider response mapping
- Protected-asset plaintext
- User-facing repair decisions
- Fact-versus-capability classification or repair-versus-fork contract comparison

## Boundary requirements

- CORS headers must be applied before parsing so failures are visible to the browser.
- Proxy timeouts must identify an upstream timeout without implying that durable background work was cancelled.
- Payload and status shapes must be versioned before incompatible changes.
- Cookie and token forwarding must be scoped and must avoid diagnostic leakage.
- Browser sessions prefer the `accessToken` cookie; non-browser clients may replay the same bearer value through the existing `X-accessToken` header. Both resolve to one Compute identity contract.
- Durable operations must separate submission, status, result, cancellation, and retry semantics.
- Publication retries must preserve the browser's idempotency key and return authoritative server IDs/versions without response-shape ambiguity.
- Recipient envelope routes must carry authenticated principal/device context; the API boundary must never infer access from recipient IDs inside encrypted payloads.
- Model cost traces are opaque response metadata at this layer. The proxy must neither add prompt/output content nor convert estimates into authoritative billing claims.
- `llmTemplateId` is opaque transport at this layer. The proxy does not translate it into a model name or reasoning setting; the model-owning service validates and resolves it.
- Intent effect classes, routing reason codes, capability IDs, contract versions, and evolution outcomes are typed transport fields. The proxy validates their envelope shape and authorization context but does not promote a fact mutation into capability creation or reinterpret a repair as a fork.

## Verification focus

- Preflight from allowed and disallowed origins
- Invalid JSON and oversized payload responses with CORS
- Compute timeout versus other upstream errors
- Cookie and status forwarding
- Idempotent background submission and polling
- No secret-bearing logs
- Entity-publication retry/acknowledgement and recipient-envelope authorization failures without plaintext leakage
- Stable forwarding of jurisdiction/evolution envelopes and idempotency across retry, background status, clarification, repair, fork, and result responses
- Headless-client parity for original-host routing, session-cookie forwarding, response envelopes, and reset authorization failures
