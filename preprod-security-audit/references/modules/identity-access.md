# Identity and access

## When to load

Load for authenticated users, protected resources, organization boundaries, administrative access, or machine identities. A public frontend does not make backend identity controls inapplicable. Mark individual controls `not-applicable` only with a recorded reason. For a static public site, infrastructure and publishing identities still belong in the infrastructure and supply-chain modules.

Use [the audit method](../audit-method.md) and [finding rules](../findings-and-priorities.md). Record control status as `satisfied`, `finding`, `needs-validation`, `not-verified`, or `not-applicable`; connect evidence `E-###`, findings `F-###`, and uncertainties `U-###`.

## Evidence to collect

- Map human roles, service identities, identity providers, token issuers, session stores, and administrative/support paths.
- Trace representative entry points through authentication middleware, identity/tenant resolution, authorization decisions, and the final data operation. Include background jobs and direct storage access.
- Build a permission matrix from actual product rules: principal, organization, resource, action, fields, expected decision, observed evidence. Include anonymous, another user, another tenant, revoked membership, and administrative cases where relevant.
- Record whether provider configuration and policies were observed in the target environment or merely declared in source. A login SDK or middleware import is not proof of enforcement.
- Use authorized test identities and synthetic records for runtime checks. Do not try recovered credentials, lock out real accounts, send recovery emails, or modify memberships outside the agreed test scope.

## Controls

### IAM-001 — Identity inventory and lifecycle

- **Applies:** Human or machine accounts exist.
- **Inspect:** Account ownership, activation, suspension, deletion, employee departures, dormant identities, shared accounts, and propagation to downstream services.
- **Evidence and limits:** Link identity records/configuration and deprovisioning code or operational evidence. A documented policy alone does not prove revocation occurs.
- **Correct and retest:** Define owners and lifecycle transitions; verify a disabled test principal loses access through existing sessions, API keys, jobs, and connected systems within the documented bound.

### IAM-002 — Enrollment and invitations

- **Applies:** Registration, invitation, guest membership, or organization onboarding is supported.
- **Inspect:** Who chooses roles and tenant membership; invitation binding, expiry, single use, email verification assumptions, and domain-based auto-join behavior.
- **Evidence and limits:** Trace invitation creation and acceptance to membership writes. Do not assume control of an email address establishes organizational authority.
- **Correct and retest:** Bind invitations to intended identities, organization, and permissions; reject altered roles, expired/reused tokens, and enrollment into unauthorized organizations.

### IAM-003 — Login and credential defenses

- **Applies:** Password or other credential authentication is implemented or configured.
- **Inspect:** Verification through a maintained provider/library, enumeration in responses and timing, throttling strategy, credential stuffing controls, and bypass paths.
- **Evidence and limits:** Review effective provider settings and application paths. Assess lockout denial-of-service tradeoffs; avoid live brute-force testing. Password storage belongs in DATA-009.
- **Correct and retest:** Apply risk-appropriate provider controls; use bounded synthetic tests to verify invalid credentials and alternate endpoints cannot bypass protections.

### IAM-004 — MFA, passkeys, and authenticator lifecycle

- **Applies:** Strong authentication is required by risk or product policy, or MFA/passkeys are offered.
- **Inspect:** Enrollment, replacement, recovery codes, lost devices, downgrade paths, step-up freshness, and protection of administrative accounts.
- **Evidence and limits:** Trace server-side assurance checks and provider configuration. A frontend MFA screen or stored `mfa_enabled` flag does not prove enforcement.
- **Correct and retest:** Enforce required assurance at sensitive operations; verify a lower-assurance session cannot enroll a replacement, disable MFA, or perform protected actions without the required checks.

### IAM-005 — Recovery and identity changes

- **Applies:** Password reset, email/phone change, account recovery, or account linking exists.
- **Inspect:** Token generation, expiry, single use, identity binding, reset-link host construction, recent authentication, and recovery bypasses.
- **Evidence and limits:** Trace the complete request-to-consumption flow, including notifications and session revocation. Never deliver test messages to unrelated people.
- **Correct and retest:** Bind recovery to the intended account and approved origin; verify reused/expired tokens fail and identity changes do not inherit unauthorized privileges or leave prohibited sessions active.

### IAM-006 — Session creation and client storage

- **Applies:** Browser sessions, bearer tokens, or persistent login are used.
- **Inspect:** Session identifier generation, rotation after login/privilege change, cookie scope and attributes, transport, browser storage, URL exposure, and fixation.
- **Evidence and limits:** Record sanitized response metadata and storage code. Choose storage controls for the actual client architecture; do not prescribe one token storage pattern universally.
- **Correct and retest:** Restrict token exposure and session scope; verify pre-authentication identifiers cannot retain privileged sessions and cookies behave correctly across the deployed domains.

### IAM-007 — Expiration, renewal, and revocation

- **Applies:** Sessions, refresh tokens, API keys, or cached authorization decisions persist.
- **Inspect:** Idle/absolute expiry, refresh rotation and replay, logout, password reset, membership changes, compromised token response, and authorization cache invalidation.
- **Evidence and limits:** Trace old-token behavior after each event. Record accepted exposure windows; removing a token from the browser does not revoke server acceptance.
- **Correct and retest:** Implement bounded expiry and required revocation; verify old and concurrently reused tokens against all relevant API, worker, and WebSocket paths.

### IAM-008 — Token validation and trust

- **Applies:** JWTs, signed assertions, opaque tokens, or externally issued identity claims are accepted.
- **Inspect:** Trusted issuers, audience, expiry, permitted algorithms, key selection/rotation, token purpose, introspection, and claim-to-principal mapping.
- **Evidence and limits:** Trace verification before claims are consumed. Decoding a token is not signature verification; a valid signature does not establish the correct audience or permissions.
- **Correct and retest:** Use maintained validators with explicit trust configuration; verify altered, expired, wrong-issuer, wrong-audience, and wrong-purpose test tokens are rejected.

### IAM-009 — OAuth and OpenID Connect

- **Applies:** OAuth/OIDC login, delegated access, or third-party account connections exist.
- **Inspect:** Flow selection, redirect registration, authorization response binding, PKCE where applicable, nonce/state handling, client authentication, scopes, consent, and token storage.
- **Evidence and limits:** Inspect both application and provider settings. Assess account linking separately; matching an unverified email claim must not silently merge identities.
- **Correct and retest:** Constrain redirects and grants; verify swapped/replayed callbacks, wrong-client responses, and overbroad scopes cannot produce unintended account or tenant access.

### IAM-010 — SAML federation

- **Applies:** SAML assertions are accepted.
- **Inspect:** Trusted metadata and keys, signature validation, recipient/audience, assertion lifetime, request correlation where applicable, replay prevention, and attribute mapping.
- **Evidence and limits:** Identify the maintained parser/validator and actual configuration. Review unsolicited login behavior against the intended flow rather than treating all flows as identical.
- **Correct and retest:** Constrain assertion trust and use; verify wrong-destination, expired, reused, and invalidly signed synthetic assertions fail before identity creation or privilege assignment.

### IAM-011 — Server-side authorization

- **Applies:** Any operation or data requires restricted access.
- **Inspect:** Function, object, relationship, and field-level decisions; list/search/export paths; bulk operations; alternate methods; direct object lookup; and default handling for new routes.
- **Evidence and limits:** Follow untrusted identifiers to the enforcing decision and data sink. Hidden buttons, opaque IDs, or authentication alone are not authorization evidence.
- **Correct and retest:** Centralize enforceable policy where appropriate; exercise the permission matrix with cross-user, read/write, bulk, and newly added route cases.

### IAM-012 — Tenant isolation

- **Applies:** Multiple organizations, workspaces, or customers share components.
- **Inspect:** Tenant derivation and membership checks through database queries, storage keys, caches, search, exports, queues, scheduled jobs, and restoration paths.
- **Evidence and limits:** Trace the tenant context end to end, including connection pooling and background work. A tenant column or frontend selector does not prove isolation.
- **Correct and retest:** Derive authorized tenant scope server-side and preserve it downstream; verify another tenant's IDs, stale contexts, cache entries, and async jobs cannot cross the boundary.

### IAM-013 — Privilege management and support access

- **Applies:** Administrators, delegated roles, support impersonation, or emergency access exist.
- **Inspect:** Who can grant privileges, self-escalation, role inheritance, approval/separation where required, temporary access, impersonation boundaries, and attribution of actions.
- **Evidence and limits:** Inspect effective policy and administrative endpoints, not role names alone. Record the human or service behind an impersonated action without exposing personal data.
- **Correct and retest:** Restrict grant authority and bound exceptional access; verify role edits cannot exceed the grantor's authority and support access expires with an attributable audit trail.

### IAM-014 — Service identities and API credentials

- **Applies:** Workloads, scheduled tasks, integrations, or external API clients authenticate.
- **Inspect:** Per-workload identity, scopes, environment separation, lifetime, audience, workload federation, credential distribution, and unused credentials.
- **Evidence and limits:** Compare declared permissions to actual call paths and effective policy where available. Never use a discovered key to establish whether it is live.
- **Correct and retest:** Narrow privileges and adopt suitable short-lived identity mechanisms; validate necessary operations still work and unauthorized resources/actions are denied using approved test identities.

### IAM-015 — Identity context and failure handling

- **Applies:** Identity passes through proxies, gateways, middleware, jobs, or caches.
- **Inspect:** Trust in forwarded identity headers, gateway bypass, tenant/header spoofing, stale claims, missing context, provider outages, and middleware ordering.
- **Evidence and limits:** Trace where context is established and which callers may set it. An infrastructure gateway policy cannot be assumed from an application comment.
- **Correct and retest:** Authenticate each trust boundary and fail safely when required identity checks fail; verify direct backend paths and malformed/missing context do not inherit trusted access.

### IAM-016 — Shared resources and public access grants

- **Applies:** Share links, guest access, public documents, or signed access URLs exist.
- **Inspect:** Scope, expiry, revocation, token leakage, indexing, downstream downloads, and whether public sharing accidentally grants editing or organization membership.
- **Evidence and limits:** Trace the grant to every resource it exposes; distinguish deliberate product sharing from accidental disclosure.
- **Correct and retest:** Bind grants to intended resources/actions and lifecycle; verify revoked links and unauthorized child resources remain inaccessible, including caches and exports.

## Graph contributions and completion

For the analysis-path graph, record which entry points, policies, provider configurations, permission cases, and data sinks were actually inspected. Link them to `E-###`, `F-###`, and `U-###`; describe observable audit steps, not private reasoning.

For the dependency graph, add the client, identity provider, gateway, session store, policy engine, API, jobs, and relevant data stores only when observed or explicitly marked inferred/unknown. Label edges such as `issues token`, `validates token`, `resolves tenant`, and `authorizes read`. Record authentication libraries with observed version/source when inspected; do not invent transitive packages or imply that a provider's internal implementation was audited.

Record which permission-matrix cases and tenant paths were sampled and which remain unverified. Cross-link related data or application findings instead of duplicating the same root cause.

## Primary references

- [OWASP ASVS](https://asvs.owasp.org/) — select applicable requirements and record the edition actually used.
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html).
- [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html).
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html).
- [NIST Digital Identity Guidelines](https://pages.nist.gov/800-63-4/sp800-63.html) — apply assurance guidance to the actual identity context.
- [OAuth 2.0 Security Best Current Practice, RFC 9700](https://www.rfc-editor.org/rfc/rfc9700.html).
