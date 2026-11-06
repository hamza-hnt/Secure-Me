# Data, secrets, and cryptography

## When to load

Load when the system stores or transmits data, manages credentials/keys, uses storage services, or sends information to external processors. Public data can still have integrity and availability requirements. Select controls according to the data actually handled and the responsible component.

Use [the audit method](../audit-method.md) and [finding rules](../findings-and-priorities.md). Record `satisfied`, `finding`, `needs-validation`, `not-verified`, or `not-applicable`; cite evidence `E-###`, findings `F-###`, and uncertainties `U-###`.

## Evidence to collect

- Map data classes, owners, sources, stores, recipients, retention, and sensitive actions. Use schemas and synthetic examples rather than bulk production records.
- Identify databases, object stores, caches, queues, search indexes, logs, analytics, backups, and local/client storage. Separate declared resources from observed deployment.
- Trace sensitive data through queries, serialization, telemetry, export, deletion, and third-party calls. Include derived copies, embeddings, thumbnails, and temporary files when present.
- Record encryption/key-management evidence at the correct layer. Provider defaults, source declarations, and operational configuration are different evidence classes.
- Collect minimal, redacted evidence. Do not print secret values, tokens, private keys, customer records, or credential-bearing URLs in commands, reports, screenshots, or graphs.

## Controls

### DATA-001 — Data inventory and purpose

- **Applies:** Data is collected, generated, stored, or transmitted.
- **Inspect:** Data classes, business purpose, collection fields, derived copies, owners, destinations, and where sensitivity changes through aggregation.
- **Evidence and limits:** Reconcile schemas and observed flows with stated product requirements. Unknown sensitivity remains an uncertainty rather than an assumption of public data.
- **Correct and retest:** Remove unnecessary collection/copies and document remaining flows; verify representative operations process only the intended fields and destinations.

### DATA-002 — Database access and isolation

- **Applies:** Structured or document databases exist.
- **Inspect:** Effective users/grants, network exposure, service-specific identities, row/tenant policies, administrative access, migrations, and privileged bypass roles.
- **Evidence and limits:** Distinguish schema/policy declarations from policies enabled on the actual database; connection pooling and privileged backend credentials can change enforcement.
- **Correct and retest:** Restrict credentials and access paths; verify necessary operations succeed and prohibited role/tenant queries fail through the same connection context used by the application.

### DATA-003 — Caches, search, and messaging stores

- **Applies:** Caches, search indexes, queues, streams, or vector stores hold application data.
- **Inspect:** Authentication, transport, network exposure, namespace/tenant keys, consumer permissions, retained messages, dead-letter queues, and shared-cache behavior.
- **Evidence and limits:** Trace authorization through secondary stores; protecting the primary database does not establish equivalent protection for copied data.
- **Correct and retest:** Scope principals and namespaces and bound retention; verify cross-user/tenant retrieval, stale membership, and unauthorized consumers cannot access secondary copies.

### DATA-004 — Object storage and signed access

- **Applies:** Files, objects, downloads, or signed URLs are used.
- **Inspect:** Effective public access, bucket/object policies, upload ownership, listing, signed URL scope/expiry, object naming, content delivery, and cache exposure.
- **Evidence and limits:** Inspect effective settings when available. An opaque key is not an authorization control; a signed URL may intentionally grant access without a separate login.
- **Correct and retest:** Limit access to intended objects/actions and lifetimes; verify private objects cannot be listed or fetched through alternate origins, stale links, or another tenant's context.

### DATA-005 — Secret discovery and exposure evidence

- **Applies:** Repositories, configuration, histories, images, logs, or build artifacts may contain credentials.
- **Inspect:** Scoped secret scans and relevant history/artifacts available within the audit; distinguish placeholders, public identifiers, synthetic fixtures, and plausible secrets.
- **Evidence and limits:** Record location, type, exposure context, and a non-sensitive identifier only. A pattern match is a candidate; never authenticate with a found secret or upload it to a validation service.
- **Correct and retest:** For confirmed exposure, revoke/rotate through the owner and remove dissemination paths; verify clean artifacts and revocation evidence. Deleting the current line does not invalidate an exposed credential.

### DATA-006 — Secret delivery, ownership, and rotation

- **Applies:** Runtime or build credentials exist.
- **Inspect:** Owners, least-privilege access, environment separation, secret-manager integration, runtime injection, logs/errors, rotation, expiry, and emergency revocation procedures.
- **Evidence and limits:** Follow the credential from storage to use without collecting its value. A secret-manager SDK import does not establish effective access restrictions or rotation.
- **Correct and retest:** Reduce scope/lifetime and implement supported rotation; use owner-provided evidence or approved synthetic credentials to verify new access works and retired access no longer does.

### DATA-007 — Encryption at rest and key authority

- **Applies:** Stored data requires confidentiality or integrity protection.
- **Inspect:** Relevant storage layers, encryption configuration, key ownership, grants, separation from encrypted data, backups/snapshots, and administrative bypass capabilities.
- **Evidence and limits:** State which threat encryption addresses. Storage encryption does not prevent an application account with valid read permissions from retrieving plaintext.
- **Correct and retest:** Enable appropriate encryption and restrict key operations; verify storage configuration and that unauthorized principals cannot decrypt or change key policy.

### DATA-008 — Transport protection and certificate trust

- **Applies:** Sensitive data or credentials cross a network boundary.
- **Inspect:** Client-to-edge and service-to-service TLS, certificate validation, hostname checks, plaintext fallbacks, internal hops, and renewal/expiry ownership.
- **Evidence and limits:** Follow termination points; a public HTTPS endpoint does not prove protection between the gateway and backend. Source settings do not prove deployed protocol negotiation.
- **Correct and retest:** Protect relevant hops and validate peers; verify trusted connections succeed and invalid certificates, wrong hostnames, or prohibited plaintext paths fail in an authorized environment.

### DATA-009 — Cryptographic implementation and password storage

- **Applies:** Password verification, encryption, signing, integrity checks, or security tokens are implemented.
- **Inspect:** Maintained cryptographic libraries, suitable algorithms/modes, password hashing parameters, salts, secure randomness, nonces, authentication of ciphertext, and error handling.
- **Evidence and limits:** Evaluate against current primary guidance and the actual threat model; do not invent custom cryptography or equate hashing with encryption. Record observed configuration, not secret material.
- **Correct and retest:** Replace unsafe primitives or constructions with supported patterns; verify round trips, tamper rejection, migration behavior, and password verification under appropriate resource limits.

### DATA-010 — Retention, deletion, and data lifecycle

- **Applies:** Data is retained beyond a single transient operation.
- **Inspect:** Defined retention, deletion propagation, derived datasets, caches, indexes, backups, account closure, failed deletion jobs, and exceptions such as legal holds when applicable.
- **Evidence and limits:** Distinguish product requirements, contractual/legal inputs, and observed behavior. Do not claim regulatory compliance from a code path or invent retention periods.
- **Correct and retest:** Implement the agreed lifecycle and make exceptions visible; verify deletion/expiry across representative primary and derived stores, including what happens after restoration.

### DATA-011 — Non-production and developer copies

- **Applies:** Development, previews, test, analytics, demos, or support environments use copied data.
- **Inspect:** Production exports, test fixtures, database clones, masking quality, preview exposure, developer permissions, and deletion of temporary copies.
- **Evidence and limits:** Prefer metadata and synthetic samples. Do not create new copies of sensitive data to perform the audit.
- **Correct and retest:** Use synthetic or suitably minimized data and separated access; verify new refresh/preview pipelines cannot reintroduce prohibited production fields or credentials.

### DATA-012 — Leakage through observability and client surfaces

- **Applies:** Logs, traces, analytics, errors, URLs, emails, or client assets contain application context.
- **Inspect:** Request/response logging, tokens in URLs, query strings, referrers, crash dumps, debug endpoints, source maps/bundles, browser caches, and analytics payloads.
- **Evidence and limits:** Record redacted schema/field evidence, not raw customer content. Public source maps alone are not proof of sensitive exposure; identify the actual disclosed material and impact.
- **Correct and retest:** Minimize/redact at collection and restrict access/retention; verify synthetic sensitive markers are absent from prohibited destinations and error paths.

### DATA-013 — Exports, bulk reads, and outbound transfers

- **Applies:** Data can be exported, downloaded in bulk, emailed, synchronized, or sent to a processor.
- **Inspect:** Requester authorization, tenant scope, destination binding, generated file lifetime, spreadsheet formula handling where relevant, delivery logs, and revalidation before async execution.
- **Evidence and limits:** Trace the generated content and delivery, not just the initiation endpoint; assess formula risks against the export format and expected consumer.
- **Correct and retest:** Constrain scope and destinations and encode for the output format; verify revoked or cross-tenant export requests cannot leak data through jobs, attachments, or stale links.

### DATA-014 — Backups, snapshots, and restoration data

- **Applies:** Backups, replicas, snapshots, or recovery exports exist.
- **Inspect:** Data/key access, encryption, cross-account/region copies, retention, deletion rights, restore permissions, and restored identity/tenant policies.
- **Evidence and limits:** Coordinate restore-readiness evidence with the operations module; a successful backup job is not evidence of recoverability or confidentiality.
- **Correct and retest:** Protect backup access independently where appropriate; verify restoration through approved procedures preserves intended permissions and handles deleted or revoked data consistently.

### DATA-015 — Data integrity and privileged transformations

- **Applies:** Imported, migrated, synchronized, or administrative data affects permissions, money, executable content, or trusted configuration.
- **Inspect:** Source authenticity, schema validation, transformation privileges, auditability, integrity checks, rollback, and separation between user-editable fields and trusted state.
- **Evidence and limits:** A checksum detects some changes but does not prove who supplied data; distinguish authenticity requirements from accidental-corruption checks.
- **Correct and retest:** Authenticate trusted sources and validate transitions; verify altered imports and interrupted migrations cannot silently rewrite protected fields or leave inconsistent authorization state.

### DATA-016 — Key lifecycle and recovery

- **Applies:** The project owns or configures encryption/signing keys or certificates.
- **Inspect:** Creation, distribution, permitted uses, rotation, retired key handling, compromise response, backup/recovery, deletion, and dependencies on key availability.
- **Evidence and limits:** Record key identifiers/policy metadata only where safe; do not export key material. Document the expected impact of key loss, revocation, and signing-key rotation.
- **Correct and retest:** Define lifecycle ownership and safe migration; verify approved rotation/recovery evidence covers existing ciphertext and token validation without retaining retired authority indefinitely.

## Graph contributions and completion

In the analysis-path graph, show the schemas, stores, policies, flows, configurations, and redacted samples actually inspected, linked to evidence and outcomes. Mark unavailable runtime policy or lifecycle evidence as `U-###` rather than a successful check.

In the dependency graph, connect observed producers, APIs, jobs, stores, secret managers, key services, telemetry, backups, and external processors. Label data class, direction, and trust boundary without exposing personal data, credentials, internal secret names, or signed URLs. Attach inspected data/crypto SDK versions and the source of version evidence where relevant. Distinguish declared storage, observed storage, and inferred destinations.

Record excluded stores and copies, incomplete history scans, unknown retention, and unverified deployment settings. Combine related leakage symptoms into one root-cause finding when they share a corrective action; retain each affected location as evidence.

## Primary references

- [OWASP ASVS](https://asvs.owasp.org/).
- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html).
- [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html).
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html).
- [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html).
- Use official database, storage, secret-manager, and key-service documentation for the specific deployment and version; record applicable requirements supplied by the organization separately from technical guidance.
