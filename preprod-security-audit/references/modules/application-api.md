# Application and API security

## When to load

Load for applications, APIs, public pages, message consumers, document processors, or other software that accepts externally influenced input. Select protocol- and feature-specific controls; do not mark an absent feature as a vulnerability. Use [the audit method](../audit-method.md) and [finding rules](../findings-and-priorities.md).

Track `satisfied`, `finding`, `needs-validation`, `not-verified`, and `not-applicable` per control. Use `E-###` for evidence, `F-###` for findings, and `U-###` for uncertainties. Active requests, race tests, resource exhaustion tests, callback delivery, and external egress require the appropriate existing test scope; a code audit does not imply permission to run them.

## Evidence to collect

- Inventory routes, protocol handlers, consumers, uploads, outbound requests, and privileged business actions from source and available deployed configuration.
- Trace attacker-influenced input through transformations, validators, authorization, interpreters, storage, and output. Record source/sink locations and actual framework/library behavior.
- Compare API contracts, frontend assumptions, and backend enforcement. Include alternate HTTP methods, content types, legacy versions, batch endpoints, and asynchronous paths.
- Review installed/resolved library versions when relevant. Corroborate scanner patterns and advisories for the specific claim: source/configuration defects can be confirmed from sufficient local evidence while production exposure remains separately unverified.
- Prefer bounded synthetic cases. Do not access unrelated records or create unapproved effects. Command execution, metadata requests, or payment flows require explicit target and method authorization, non-sensitive test data, and the central stop conditions; a repository audit alone does not authorize them.

## Controls

### APP-001 — Endpoint inventory and protocol boundaries

- **Applies:** Network or message interfaces exist.
- **Inspect:** Documented and undocumented routes, old API versions, GraphQL resolvers, WebSocket subscriptions, gRPC methods, queue consumers, and diagnostic endpoints.
- **Evidence and limits:** Reconcile router/configuration evidence with accessible inventories; absence from documentation is not absence from production.
- **Correct and retest:** Remove or protect unintended interfaces; verify routing, authentication, authorization, and input constraints across retained methods and protocols.

### APP-002 — Validation, normalization, and ambiguity

- **Applies:** Untrusted data enters application logic.
- **Inspect:** Types, ranges, lengths, null/empty values, duplicate parameters, encodings, canonical forms, Unicode, and cross-field business constraints before sensitive use.
- **Evidence and limits:** Trace validation after relevant decoding and before the sink; client-only validation and validation of a different representation do not cover the operation.
- **Correct and retest:** Define accepted schemas and normalize consistently; verify malformed, boundary, duplicate, and unexpected-field inputs are rejected without partial side effects.

### APP-003 — Interpreter injection

- **Applies:** Inputs reach database queries, shells, templates, expression evaluators, or other interpreters.
- **Inspect:** Query construction, dynamic identifiers, subprocess arguments, template source, escaping context, and separation of code from data.
- **Evidence and limits:** Establish a source-to-sink path and effective library behavior. A dangerous API name alone does not demonstrate attacker control or exploitability.
- **Correct and retest:** Use parameterized/data-only interfaces and constrain unavoidable dynamic structure; validate benign malicious-shaped inputs cannot alter query, command, or template semantics.

### APP-004 — Output encoding and browser execution

- **Applies:** Untrusted data is rendered in HTML, JavaScript, CSS, URLs, or DOM APIs.
- **Inspect:** Context-specific encoding, unsafe rendering helpers, rich text sanitization, DOM sinks, template auto-escaping exceptions, and stored content reused elsewhere.
- **Evidence and limits:** Follow the exact output context and sanitizer configuration/version. Content security policy is additional protection, not proof the unsafe sink is fixed.
- **Correct and retest:** Use safe rendering and maintained context-appropriate sanitization; verify representative stored, reflected, and DOM paths render inert content.

### APP-005 — Cross-site request forgery

- **Applies:** Browsers automatically attach credentials to state-changing requests, including applicable login/account-link flows.
- **Inspect:** CSRF tokens or equivalent origin protections, cookie policy, method semantics, content-type handling, and exclusions.
- **Evidence and limits:** Determine actual credential transport and browser behavior; a bearer-token API without ambient credentials has a different CSRF surface.
- **Correct and retest:** Enforce suitable request-origin/token validation; verify cross-origin synthetic requests cannot perform protected actions through alternate methods or encodings.

### APP-006 — Origin and cross-context messaging

- **Applies:** CORS, `postMessage`, embedded clients, or browser WebSockets are used.
- **Inspect:** Exact allowed origins, credentialed requests, origin reflection, opaque/null origins, message source and payload checks, and WebSocket handshake/subscription authorization.
- **Evidence and limits:** Inspect deployed origin configuration where available. CORS limits browser reading; it does not replace server-side authorization.
- **Correct and retest:** Restrict origins and validate message context; verify untrusted origins and unauthorized subscriptions cannot read sensitive data or trigger privileged behavior.

### APP-007 — Browser policy, navigation, and third-party scripts

- **Applies:** Browser pages or redirects exist.
- **Inspect:** CSP suitability, framing restrictions, referrer policy, HTTPS behavior, redirect destinations, third-party script privileges, and sensitive data embedded in public assets.
- **Evidence and limits:** Evaluate policies against the actual application. Missing headers alone need a contextual impact assessment; inspect delivered headers separately from source configuration.
- **Correct and retest:** Apply supported policies and trusted redirect/script boundaries; verify effective responses and key user flows without weakening protections to silence breakage.

### APP-008 — API object shape and bulk operations

- **Applies:** APIs deserialize, update, list, batch, or serialize domain objects.
- **Inspect:** Allowed writable/readable fields, mass assignment, sensitive serialization, bulk authorization, pagination, query filters, GraphQL fields, and alternate resource representations.
- **Evidence and limits:** Link identity decisions to IAM-011/IAM-012. An endpoint-level permission does not establish authorization for each object, operation, or field.
- **Correct and retest:** Use explicit input/output contracts and per-item policy; verify unauthorized fields, mixed-authority batches, and export/list paths cannot bypass restrictions.

### APP-009 — Server-side request forgery and outbound access

- **Applies:** Users or third parties influence fetched URLs, redirects, callbacks, or remote import locations.
- **Inspect:** URL parsing, permitted schemes/destinations, resolution and redirect handling, outbound proxy/network policy, credentials attached to requests, and response exposure.
- **Evidence and limits:** Trace checks through the actual HTTP client. Prefer controlled destinations or mocks. Internal/metadata checks require explicit target authorization, bounded methods, and non-sensitive evidence; never retrieve live credentials to demonstrate impact.
- **Correct and retest:** Constrain intended outbound access and revalidate relevant resolution/redirect transitions; verify alternate schemes and prohibited destinations fail without credential forwarding.

### APP-010 — Filesystem boundaries

- **Applies:** Input influences file paths, archive members, templates, or download names.
- **Inspect:** Path canonicalization, traversal, absolute paths, symlinks, archive extraction, temporary files, and authorization before file delivery.
- **Evidence and limits:** Trace the effective root and filesystem semantics, including platform differences and concurrent changes; string-prefix checks alone may be insufficient.
- **Correct and retest:** Constrain resolved access to intended resources and safe extraction boundaries; verify traversal, symlink, collision, and cross-user cases using isolated test files.

### APP-011 — Upload lifecycle

- **Applies:** Files can be uploaded or imported.
- **Inspect:** Accepted types and content, size/count limits, generated names, quarantine/scanning where appropriate, storage permissions, public serving, and cleanup on failure.
- **Evidence and limits:** Follow upload through scanning, processing, and download; extension or MIME headers alone do not establish content safety.
- **Correct and retest:** Enforce the intended file policy at each stage; verify rejected or pending files cannot execute, become publicly accessible, or bypass checks through alternate upload routes.

### APP-012 — Risky processing and code execution

- **Applies:** Documents, media, templates, plugins, user code, or expressions are processed.
- **Inspect:** Worker isolation, filesystem/network access, privileges, resource limits, temporary storage, parser/tool versions, and control of invoked arguments.
- **Evidence and limits:** Distinguish declared sandbox settings from the effective execution environment; a separate process or container is not proof of adequate isolation.
- **Correct and retest:** Bound privileges and resource access for the workload; use harmless fixtures to confirm prohibited network/filesystem actions and excessive workloads are contained.

### APP-013 — Deserialization and structured parsing

- **Applies:** XML, object serialization, YAML, JSON merges, binary messages, or other structured formats are parsed.
- **Inspect:** Executable object construction, entity resolution, expansion, unsafe polymorphism, prototype/property pollution, depth, and parser limits.
- **Evidence and limits:** Verify parser mode and version, then follow parsed values to sensitive use. A format name alone does not imply the unsafe feature is enabled.
- **Correct and retest:** Use data-only parsing with restricted features and bounded complexity; verify malformed or specially structured fixtures remain inert and fail cleanly.

### APP-014 — Webhook authenticity and replay

- **Applies:** Inbound callbacks or event notifications affect application state.
- **Inspect:** Signature verification over the correct bytes, secret/key selection, timestamps, replay handling, event identity, ordering, and binding to the intended account/environment.
- **Evidence and limits:** Follow verification before any side effect. An IP allowlist or secret URL alone does not demonstrate event authenticity.
- **Correct and retest:** Authenticate events and handle duplicates safely; verify modified, expired, repeated, wrong-account, and out-of-order synthetic events cannot produce unauthorized state changes.

### APP-015 — Third-party responses and delegated integrations

- **Applies:** External APIs, SDKs, or connectors supply data or perform actions.
- **Inspect:** Response validation, provider identity, scopes, account binding, redirects, timeouts, failure semantics, and treatment of externally supplied links/content.
- **Evidence and limits:** Treat provider responses as untrusted input; distinguish the integration code reviewed from unaudited provider internals.
- **Correct and retest:** Validate contracts and constrain delegation; verify malformed responses, substituted accounts, provider errors, and revoked connections do not expose data or grant unintended authority.

### APP-016 — Business workflow integrity

- **Applies:** Operations have ordered steps, limits, approvals, prices, entitlements, or irreversible consequences.
- **Inspect:** Server-owned values, state transitions, skipped/reordered steps, reuse of approvals/coupons, negative or overflowing amounts, and changes between approval and execution.
- **Evidence and limits:** Derive allowed behavior from product rules. Do not invent fraud requirements; record missing business rules as uncertainty.
- **Correct and retest:** Enforce invariants at the authoritative operation; test alternative sequences and manipulated inputs using synthetic value and isolated accounts.

### APP-017 — Concurrency, replay, and idempotence

- **Applies:** Retried or concurrent actions can allocate value, mutate permissions, consume quotas, or trigger external effects.
- **Inspect:** Atomic state changes, uniqueness/locking, idempotency key scope, request binding, replay windows, partial failures, and duplicate queue delivery.
- **Evidence and limits:** Sequential tests do not establish concurrency safety. Perform bounded race tests only in an authorized environment with synthetic resources.
- **Correct and retest:** Enforce invariants transactionally and bind deduplication to the actor and operation; verify duplicates/retries cannot double-spend, double-execute, or reuse another user's result.

### APP-018 — Bounded resource consumption

- **Applies:** Requests, queries, subscriptions, parsing, uploads, or jobs consume meaningful resources or paid services.
- **Inspect:** Per-principal/tenant limits, request size, pagination, GraphQL cost, regex complexity, timeouts, concurrent work, connection limits, and cancellation.
- **Evidence and limits:** Review worst-case paths and configured limits; avoid load/DoS experiments without explicit scope. Coordinate system-wide limits with operations.
- **Correct and retest:** Bound expensive work before admission and at execution; validate safe boundary cases and confirm rejected work does not continue invisibly or charge unbounded costs.

### APP-019 — Error handling and partial failure

- **Applies:** All application paths, especially privileged or multi-step operations.
- **Inspect:** Exception handlers, safe defaults, rollback, resource cleanup, denied access on policy failures, user-visible diagnostics, and retry effects.
- **Evidence and limits:** Trace realistic failure branches; tests of the success path do not cover identity-provider outages, database errors, or failed downstream actions.
- **Correct and retest:** Preserve security invariants during failures; inject controlled errors in isolation and verify no unauthorized success, sensitive error disclosure, or unreconciled partial action occurs.

### APP-020 — HTTP intermediaries and caching

- **Applies:** Proxies, gateways, shared caches, CDN rules, or multiple HTTP parsers process requests.
- **Inspect:** Trusted forwarding headers, host handling, conflicting message framing, normalization differences, cache keys, authenticated response caching, and variant separation.
- **Evidence and limits:** Application code alone rarely proves intermediary behavior. Request-smuggling tests can affect other users; keep them out of live shared systems without dedicated authorization.
- **Correct and retest:** Align parsers and trust boundaries; validate cache isolation and ambiguous request rejection in a controlled deployment that matches the relevant intermediary configuration.

## Graph contributions and completion

In the analysis-path graph, connect inspected entry points to validators, authorization decisions, transformations, sinks, and observed results using `E-###`, `F-###`, and `U-###`. Show skipped or unavailable paths; do not present hypothesized tests as completed.

In the dependency graph, include observed clients, gateways, handlers, workers, databases, queues, storage, processing tools, and external APIs. Label data/call direction and relevant trust boundaries. Attach inspected library names and resolved versions where known; distinguish direct declarations, lockfile dependencies, and runtime observations. A lockfile edge proves resolution evidence, not that the code is deployed or reachable.

Document sampled routes, business flows, formats, and roles. Route authorization gaps to the identity module and data exposure consequences to the data module without counting one root cause multiple times.

## Primary references

- [OWASP ASVS](https://asvs.owasp.org/) and [Web Security Testing Guide](https://owasp.org/projects/web-security-testing-guide).
- [OWASP API Security Project](https://owasp.org/projects/api-security-project).
- [OWASP Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html).
- [OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html).
- [OWASP SSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html).
- Consult the official documentation for the exact framework, parser, proxy, and client versions inspected; record reference versions rather than assuming current documentation matches deployed behavior.
