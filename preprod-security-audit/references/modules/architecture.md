# Architecture and threat context

Load for every audit; scale detail to the system and available evidence. This module establishes which controls matter and which claims the audit can support.

## Evidence and coverage

- Assign each applicable control one status: `satisfied`, `finding`, `needs-validation`, `not-verified`, or `not-applicable` with a reason.
- Link evidence as `E-###`, confirmed findings as `F-###`, and unresolved evidence or scope gaps as `U-###`; use the report's shared register.
- Distinguish source behavior, declared configuration, runtime observation, and documentation assertions. Record environment, version, locator, and observation date where available.
- A repository inventory does not establish the complete production inventory. A diagram documents a claim until its relevant relationships have been checked.
- Review accessible artifacts first. Broad discovery, third-party probes, and infrastructure changes are outside a repository review unless separately authorized for exact targets and bounded methods. Preserve existing authorization and the central audit method's stop conditions.

## Controls

### ARCH-001 — Release and assessment boundary
- Applies: every audit, including a code-only review.
- Check/evidence: identify repository, commit, included services, target environment, release artifact, exclusions, and authorized methods. Missing deployed-artifact identity limits production conclusions.
- Remediate: record the release boundary and obtain an artifact-to-source mapping from the release owner.
- Retest: reconcile the assessed commit/configuration with the intended release and record remaining differences as `U-###`.

### ARCH-002 — Component and asset inventory
- Applies: every system; include managed services and asynchronous workers when present.
- Check/evidence: compare manifests, imports, deployment declarations, service catalogs, and supplied runtime inventories; identify owners and security-relevant versions. An import alone does not prove deployment.
- Remediate: add missing services, stores, queues, administrative components, and dependencies to an owned inventory.
- Retest: trace representative release components to inventory entries; account explicitly for uninspected dependencies.

### ARCH-003 — Entry points and exposure
- Applies: networked, locally callable, or file-processing components.
- Check/evidence: enumerate routes, listeners, callbacks, uploads, scheduled jobs, management paths, and public asset stores; distinguish declared exposure from observed reachability.
- Remediate: remove unused entry points, constrain access at the appropriate boundary, and document intentional public surfaces.
- Retest: verify the relevant declaration and, only within an authorized environment, confirm expected access and denied access.

### ARCH-004 — Data flows and trust boundaries
- Applies: data crosses a process, identity, tenant, network, device, or provider boundary.
- Check/evidence: trace selected sensitive inputs through handlers, transformations, storage, and outputs; cite callsites/configuration for each asserted boundary crossing.
- Remediate: make each crossing explicit and place validation, authentication, authorization, or encryption where that crossing requires it.
- Retest: follow the same flow end to end and verify controls before the sensitive operation, including alternate paths.

### ARCH-005 — Principals and trust relationships
- Applies: human users, services, workloads, integrations, or delegated agents act on assets.
- Check/evidence: map who authenticates whom, whose privileges an action uses, and how identity survives delegation. Names in an architecture document do not establish effective permissions.
- Remediate: separate principals with different responsibilities and replace implicit trust with explicit identity and permission checks.
- Retest: trace one permitted and one forbidden action for each critical principal class using available implementation or bounded test evidence.

### ARCH-006 — Tenant and organization boundaries
- Applies: shared infrastructure serves multiple organizations, accounts, projects, or workspaces with isolation requirements.
- Check/evidence: map tenant context through databases, caches, blobs, search, queues, exports, and support tools; identify where context is created or lost.
- Remediate: bind resource access and background work to authenticated tenant context; correct shared stores and keys that omit isolation dimensions.
- Retest: use isolated test tenants to check representative read, write, asynchronous, and export paths; record untested stores separately.

### ARCH-007 — Sensitive data lifecycle
- Applies: the system handles confidential, personal, credential, financial, or otherwise restricted data.
- Check/evidence: identify collection, transformation, copies, retention, deletion, recovery, analytics, and provider transfers; classify data with an accountable owner.
- Remediate: reduce unnecessary copies and define access, retention, deletion, and recovery rules for each material store.
- Retest: trace a synthetic record across selected lifecycle paths and reconcile implementation with declared retention and access rules.

### ARCH-008 — Critical business actions and abuse
- Applies: the system changes money, access, ownership, entitlements, publication, or other consequential state.
- Check/evidence: identify required preconditions, actors, sequence, limits, and invariants; inspect alternate APIs, retries, concurrency, and administrative shortcuts.
- Remediate: enforce business invariants at the authoritative state transition and constrain exceptional paths.
- Retest: check a legitimate path and bounded negative cases for skipped steps, repeated requests, stale state, and inappropriate actors.

### ARCH-009 — Impact and attacker context
- Applies: every audit; calibrate depth to plausible exposure and business consequence.
- Check/evidence: connect realistic attacker access and preconditions to confidentiality, integrity, availability, financial, and operational effects; separate stakeholder assertions from measured exposure.
- Remediate: obtain missing impact assumptions and prioritize controls around credible high-consequence paths.
- Retest: ensure finding priorities state the relevant asset, actor, prerequisites, and consequence rather than relying only on a generic category.

### ARCH-010 — Asynchronous and service-to-service flows
- Applies: queues, event buses, scheduled tasks, batch jobs, or internal RPC exist.
- Check/evidence: identify producer/consumer identities, tenant propagation, message trust, replay, retries, and dead-letter handling; a protected public API does not prove protected consumers.
- Remediate: validate and authorize at the consumer, constrain publishers, and preserve required identity and idempotency context.
- Retest: inspect or safely exercise unauthorized, duplicated, and mismatched-tenant messages using isolated test queues and synthetic data. Production checks require explicit scope, bounded effects, and the central stop conditions.

### ARCH-011 — Outbound trust and external dependencies
- Applies: outbound HTTP, callbacks, remote resources, provider APIs, or federated identity exist.
- Check/evidence: map destination selection, data sent, credentials used, redirects, fallback endpoints, and provider failure assumptions; identify uninspected providers explicitly.
- Remediate: constrain destination and credential scope, minimize exported data, and define safe failure behavior.
- Retest: validate the selected outbound path with approved test destinations or mocks; internal destinations require explicit target authorization and bounded non-sensitive evidence.

### ARCH-012 — Ownership and shared responsibility
- Applies: every deployed system, especially managed infrastructure and SaaS dependencies.
- Check/evidence: assign responsibility for patching, access, configuration, logs, backup, incident response, and provider escalation; cite contracts/docs as documentation assertions.
- Remediate: name accountable owners and obtain evidence for controls delegated to another team or provider.
- Retest: confirm that each critical control has an owner and evidence, or a visible `U-###`; provider marketing is not operational verification.

### ARCH-013 — Applicable constraints and commitments
- Applies: business, contractual, privacy, regional, industry, or internal security requirements influence the release.
- Check/evidence: identify confirmed requirements, scope, owner, and technical implications; distinguish user-provided obligations from assumptions. Do not infer legal compliance from code review.
- Remediate: map confirmed requirements to controls and ask the appropriate owner to resolve ambiguous applicability.
- Retest: ensure each material commitment has a control/evidence mapping or an explicit unresolved requirement and release consequence.

### ARCH-014 — Environment and administrative separation
- Applies: development, test, staging, production, support, or management environments coexist.
- Check/evidence: inspect trust links, shared credentials, shared datasets, deployment identities, and management access; document any unavailable runtime boundary evidence.
- Remediate: separate privileges and sensitive data according to environment risk; close unintended trust paths into production.
- Retest: verify the relevant access policies and identity scopes; use authorized non-destructive checks only where runtime validation is needed.

### ARCH-015 — Failure modes and dependency assumptions
- Applies: security controls depend on external services, policy checks, caches, or distributed state.
- Check/evidence: inspect timeout, stale-cache, partial-failure, fallback, and recovery paths; identify where failure bypasses authorization or loses integrity.
- Remediate: define safe behavior per operation, enforce invariants across partial failures, and bound retries and stale decisions.
- Retest: use focused unit/integration checks or isolated fault simulation; do not interrupt a live dependency to establish coverage.

### ARCH-016 — Legacy, orphaned, and exceptional surfaces
- Applies: older APIs, migration paths, temporary features, abandoned resources, or exceptional support flows exist.
- Check/evidence: compare route/configuration history and supplied asset records with the intended architecture; absence from the current repository does not prove retirement.
- Remediate: remove or constrain obsolete surfaces and assign expiry/ownership to temporary exceptions.
- Retest: verify removal from release declarations and obtain environment evidence for externally hosted remnants where relevant.

### ARCH-017 — Architecture drift and release changes
- Applies: the release changes trust, exposure, data handling, dependencies, or privilege.
- Check/evidence: compare the intended release with an identified baseline; isolate changed boundaries and note when the deployed baseline is unavailable.
- Remediate: update the threat model and control ownership for material changes; reconcile undocumented implementation differences.
- Retest: map each security-relevant change to reviewed artifacts and applicable controls; retain drift that cannot be resolved as `U-###`.

### ARCH-018 — Control placement and bypass routes
- Applies: a security guarantee depends on gateways, middleware, shared libraries, or infrastructure policy.
- Check/evidence: trace the protected operation and every identified invocation path; determine whether the supposed control is mandatory or can be bypassed.
- Remediate: enforce the guarantee at a boundary shared by all relevant paths, or apply equivalent checks to the exceptions.
- Retest: inspect the direct/internal path as well as the normal entry point; explain the evidence scope if complete path coverage is unavailable.

## Traceability graph contribution

- Add nodes for inspected components, external/uninspected dependencies, relevant artifacts, trust boundaries, and sensitive assets; preserve the report's stable node identifiers.
- Use labeled relationships such as `calls`, `publishes to`, `stores in`, `authenticates via`, `deployed by`, and `configured by` with supporting `E-###` references.
- Use the central evidence-basis vocabulary: `observed-source`, `declared-config`, `observed-runtime`, `documented-process`, `user-stated`, or `inferred`. Do not relabel a declaration as runtime evidence.
- Represent unresolved relationships separately, labeled `unverified` and linked to `U-###`. A supported incoming call may be solid even if the destination's implementation is `not-inspected`; do not invent or assert paths inside that destination.
- Link relevant nodes/edges to `F-###` and control IDs. Show evidence and concise conclusions, not hidden deliberation or an invented exhaustive call graph.
- Keep confidential hostnames, identifiers, and data samples redacted consistently with the report's distribution scope.

## Primary references

- [OWASP Threat Modeling](https://owasp.org/www-community/Threat_Modeling) — threat context and boundary review.
- [OWASP Application Security Verification Standard](https://owasp.org/www-project-application-security-verification-standard/) — application control reference; select a version explicitly when mapping requirements.
- Treat these links as references to consult for relevant controls, not claims that this module implements or certifies an entire standard.
