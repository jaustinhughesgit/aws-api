# AWS API Layer Instructions

This repository is the controlled browser-to-compute boundary for the larger 1var platform. Read `../architecture/README.md`, `../architecture/docs/cross-layer-flows.md`, `../architecture/docs/security-and-trust.md`, and `docs/layer.md` before changing routing, CORS, authentication transport, request envelopes, or timeouts.

## Guardrails

- Keep the layer thin: enforce and translate transport contracts; do not duplicate Path, ContextDB, JPL, or provider business logic.
- Preserve CORS and structured error envelopes on success, parse failure, upstream failure, and timeout.
- Never log access tokens, protected values, request bodies that may contain secrets, or raw upstream diagnostics.
- A long-running operation should return a durable job ID rather than rely on one API Gateway/Lambda response window.
- Retries and polling must be idempotent and must not duplicate entity creation, Path installation, ContextDB changes, or protected actions.
- Validate original host, authentication, route, payload size, and allowed transport headers deliberately.
- Do not turn upstream errors into ambiguous HTML or shape-changing responses.
- Preserve idempotency and typed acknowledgements for entity publication; do not inspect or reinterpret graph semantics in the proxy.
- Protected-envelope transport may carry ciphertext, salts, and key wraps, but never plaintext or private keys. Recipient identifiers in an envelope are not authorization.

Update `docs/layer.md`, shared contracts, and architecture decisions when the proxy boundary changes.
