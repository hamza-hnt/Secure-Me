# Operations, detection, and resilience

Use this module to assess whether the service can withstand abuse, detect security events, respond to incidents, and recover. Calibrate expectations to business impact, service commitments, data criticality, and deployment scale. Read [audit method](../audit-method.md) and [finding rules](../findings-and-priorities.md) for evidence and classification conventions.

## Inputs and scope

Request existing monitoring configuration, representative redacted event records, alert routing, runbooks, access procedures, backup settings, restore exercise records, incident contacts, and release/rollback evidence. Prefer existing exercises and safe staging checks over triggering production events.

Distinguish **documented procedure**, **configured capability**, and **demonstrated operation**. A backup schedule does not prove restorability; an alert rule does not prove someone receives and acts on it. If operational evidence is unavailable, record the affected control as `not-verified`, not automatically as a confirmed failure.

## Control catalog

### OPS-001 — Security event coverage
- **Applies:** Authentication, access control, administration, sensitive data, and critical business actions.
- **Check:** Trace meaningful success/failure events for login/recovery, privilege changes, sensitive exports, denied access, configuration changes, and administrative/support activity. Identify actor, tenant, action, result, resource, and correlation context where appropriate.
- **Evidence / limits:** Instrumentation plus redacted example records or bounded authorized tests; logging code alone does not establish production collection.
- **Correction / retest:** Add missing events with useful attribution; validate a representative allowed/denied workflow reaches the expected destination without exposing secrets.

### OPS-002 — Log confidentiality, integrity, and retention
- **Applies:** Application logs, audit trails, traces, analytics, error reporting, and security telemetry.
- **Check:** Review secrets/PII redaction, injection-safe structured fields, read/write/delete permissions, retention, transport, time synchronization, and protection from an attacker modifying the service's own audit trail.
- **Evidence / limits:** Redacted records and effective sink/retention policies; do not export unrestricted production logs or assume masking handles transformed secrets.
- **Correction / retest:** Minimize sensitive content, restrict access and alteration, and validate retention and safe handling of crafted non-sensitive input.

### OPS-003 — Alert delivery and response ownership
- **Applies:** Security events that require timely intervention.
- **Check:** Match important abuse/compromise scenarios to detection rules, routing, ownership, escalation, and expected response. Review noisy alerts, blind spots, and out-of-hours coverage proportionate to the service.
- **Evidence / limits:** Rule definitions plus recent delivery/exercise records; a dashboard, email address, or policy is not evidence of successful alert delivery.
- **Correction / retest:** Assign actionable signals and recipients; use an authorized synthetic event or existing exercise to verify delivery, acknowledgment, and escalation.

### OPS-004 — Rate, quota, and concurrency controls
- **Applies:** Public or costly endpoints, authentication, exports, uploads, compute jobs, and billable integrations.
- **Check:** Review limits at user/tenant/key/IP/global scopes as relevant, bypass paths, distributed consistency, trusted client identity, and unauthenticated consumption. Include provider quotas and service exhaustion by one tenant.
- **Evidence / limits:** Enforcement code/configuration and bounded checks. A provider quota may constrain cost while still allowing total service denial; an IP-only limiter may not address authenticated abuse.
- **Correction / retest:** Enforce appropriate bounded consumption and tenant fairness; verify the boundary and recovery with small controlled requests, not a stress test unless specifically in scope.

### OPS-005 — Timeouts, retries, and queue pressure
- **Applies:** External calls, databases, asynchronous jobs, message queues, and background workers.
- **Check:** Inspect timeout budgets, retry bounds/backoff, duplicate delivery, poison-message handling, queue growth, backpressure, cancellation, and resource release. Trace cascading effects from a slow or unavailable dependency.
- **Evidence / limits:** Code and effective worker/queue settings; retries without observed failure tests establish design intent only.
- **Correction / retest:** Bound work and retries, isolate failures, and validate safe recovery using a controlled failing dependency or representative recorded exercise.

### OPS-006 — Secure error and degraded-mode behavior
- **Applies:** Authorization services, secret/configuration stores, billing checks, transactions, and security middleware.
- **Check:** Trace exceptional conditions and partial failure: missing config, denied dependencies, failed policy lookup, transaction rollback, cleanup, and startup defaults. Look for sensitive data in errors or a fallback that grants unintended access.
- **Evidence / limits:** Specific error branches and safe negative-path evidence; a generic exception handler is not proof that authorization fails safely.
- **Correction / retest:** Preserve security decisions through failures and make partial work recoverable; test the implicated branch and normal behavior without disabling production dependencies.

### OPS-007 — Cost abuse and emergency consumption controls
- **Applies:** Metered APIs, AI, email/SMS, cloud compute, storage, or expensive data processing.
- **Check:** Map callers to billable work, attribution, budget monitoring, caps where supported, abuse response, and who can disable a compromised integration. Consider retries and asynchronous amplification.
- **Evidence / limits:** Application limits and provider budget configuration; budget alerts are not necessarily spending caps, and delayed billing data may not prevent overspend.
- **Correction / retest:** Bound consumption at the relevant control point and establish a safe stop mechanism; validate using low-cost synthetic work or documented configuration evaluation.

### OPS-008 — Backup scope and protection
- **Applies:** Data or configuration whose loss would materially affect the service.
- **Check:** Inventory covered databases, files, configuration, encryption keys, and recovery dependencies. Review frequency, access, retention, isolation, deletion permissions, and immutability where justified by ransomware or administrator-compromise risk.
- **Evidence / limits:** Backup inventory/settings and recent execution records; a successful job does not prove complete or usable recovery material.
- **Correction / retest:** Close coverage gaps and restrict destructive access; confirm required recovery data exists and is accessible only to the intended recovery roles.

### OPS-009 — Restoration and recovery objectives
- **Applies:** Stateful services and business-critical configuration.
- **Check:** Compare agreed recovery time and tolerable data loss with actual restore exercises; include key recovery, version compatibility, external dependencies, tenant boundaries, and integrity checks after restoration.
- **Evidence / limits:** Dated restore record identifying dataset/artifact, isolated destination, elapsed time, recovery point, and validation results. A backup dashboard cannot satisfy this control.
- **Correction / retest:** Perform an authorized isolated restore exercise with representative data and measure the agreed objectives; report untested portions explicitly.

### OPS-010 — Incident responsibilities and procedures
- **Applies:** Services processing user data or exposing meaningful security/business impact.
- **Check:** Identify accountable responders, contact paths, triage criteria, containment options, evidence preservation, provider escalation, and communications ownership. Check access when primary identity/communication services are unavailable.
- **Evidence / limits:** Current runbooks, assignments, access records, and exercises; do not invent named owners or claim a documented process has been rehearsed.
- **Correction / retest:** Assign responsibilities and practical procedures; validate with a tabletop or safe exercise appropriate to the service's scale and risk.

### OPS-011 — Emergency revocation and containment
- **Applies:** Sessions, API keys, service credentials, signing keys, integrations, and privileged identities.
- **Check:** Trace ability to revoke compromised access across caches, replicas, offline tokens, active sessions, queued work, and external integrations. Review access needed to execute revocation if the usual administrator account is compromised.
- **Evidence / limits:** Revocation implementation and previous/safe test evidence; deleting an account record may not invalidate issued credentials.
- **Correction / retest:** Establish effective invalidation and containment paths; verify non-sensitive test credentials lose access within the required response window across relevant entry points.

### OPS-012 — Rollback, migrations, and release recovery
- **Applies:** Releases changing application behavior, schema, permissions, or infrastructure.
- **Check:** Inspect rollback targets, artifact availability, database compatibility, migration failure behavior, feature disablement, and the possibility of restoring a known security flaw during rollback.
- **Evidence / limits:** Release procedures and exercise/deployment records; retaining an older image does not demonstrate safe rollback of state or access policy.
- **Correction / retest:** Define a compatible recovery path and security-aware release selection; validate with a representative authorized staging release and recovery exercise.

### OPS-013 — Vulnerability intake and remediation ownership
- **Applies:** Services with maintained code, dependencies, infrastructure, or external users.
- **Check:** Review how reports/advisories arrive, who triages them, how impacted deployments are identified, correction expectations, exception expiry, and verification after rollout.
- **Evidence / limits:** Current contact/process and representative issue lifecycle; do not equate the existence of a scanner with an operating remediation process.
- **Correction / retest:** Assign intake and remediation ownership with risk-based deadlines; trace a sample issue from receipt through validated deployment or explicit time-bounded acceptance.

### OPS-014 — Third-party and support operations
- **Applies:** External operators, customer support, provider access, and integrations with operational privileges.
- **Check:** Review access attribution, user impersonation, ticket-based justification where used, scope, expiry, review, revocation, and security notification paths. Identify dependencies that can access customer data during support or incidents.
- **Evidence / limits:** Effective permissions and access records; supplier marketing or an assurance report does not establish the application's own settings or support behavior.
- **Correction / retest:** Limit and log sensitive access, remove stale permissions, and verify revocation and attributable support workflows with safe test accounts.

### OPS-015 — Readiness decisions and exceptions
- **Applies:** The requested production release.
- **Check:** Connect unresolved findings and critical unknowns to business impact, release criteria, mitigation evidence, accountable decision makers, review dates, and follow-up validation.
- **Evidence / limits:** Recorded user/owner decisions and applicable criteria. The audit recommends readiness within its evidence boundary; it does not authorize deployment, accept risk on the user's behalf, or certify compliance.
- **Correction / retest:** Resolve blockers or obtain a documented decision from the responsible owner through the user's workflow; verify compensating measures and reassess after the stated expiry or change.

## Graph contributions

- In the **analysis traversal graph**, show inspected log sources, rules, runbooks, backup/restore records, release evidence, and authorized exercises. Connect the observed artifacts/actions to `E-###`, controls, findings (`F-###`), and unknowns (`U-###`).
- In the **dependency graph**, include operational dependencies actually examined: telemetry sinks, alert destinations, backup stores, key services, identity systems, incident tooling, and critical third-party APIs.
- Label relationships such as `emits events to`, `alerts`, `backs up to`, `requires for restore`, or `revokes`. Distinguish a configured route from an exercised route and keep unknown recipients or recovery dependencies visible.
- Include only factual investigation steps and evidence provenance; the analysis graph is not a transcript of private reasoning. Redact personal contact details and unnecessary internal infrastructure identifiers.

## Reference selection

Use provider-specific operational documentation for actual settings and record the consulted version/date. Service objectives and release criteria come from the project, not from an invented universal threshold.

- [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html): application event design and logging protection.
- [NIST SP 800-61 Rev. 3](https://csrc.nist.gov/pubs/sp/800/61/r3/final): incident response integrated with cybersecurity risk management.
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework): organizational risk, detection, response, and recovery context.
