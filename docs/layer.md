# AWS API Boundary Layer

## Responsibility

This repository exposes the browser-facing API boundary and proxies sanctioned traffic to compute. Current code provides CORS handling, body parsing and size limits, cookie/access-token transport, original-host forwarding, compute timeout normalization, response/cookie forwarding, and selected redirect behavior.

It should remain a policy and transport layer rather than become a second implementation of the platform runtime.

## Owns

- Browser-origin allowlisting and preflight behavior
- Request size and syntax rejection with structured errors
- Authentication/cookie/header transport at the public boundary
- Original-host and route normalization
- Compute upstream timeout and connectivity classification
- Stable browser-facing response and error envelopes
- Durable job submission/status transport when background contracts are centralized

## Does not own

- Natural-language interpretation, Paths, Essences, or ContextDB semantics
- Entity/JPL generation or execution
- Provider protocol discovery or provider response mapping
- Protected-asset plaintext
- User-facing repair decisions

## Boundary requirements

- CORS headers must be applied before parsing so failures are visible to the browser.
- Proxy timeouts must identify an upstream timeout without implying that durable background work was cancelled.
- Payload and status shapes must be versioned before incompatible changes.
- Cookie and token forwarding must be scoped and must avoid diagnostic leakage.
- Durable operations must separate submission, status, result, cancellation, and retry semantics.

## Verification focus

- Preflight from allowed and disallowed origins
- Invalid JSON and oversized payload responses with CORS
- Compute timeout versus other upstream errors
- Cookie and status forwarding
- Idempotent background submission and polling
- No secret-bearing logs

