# Infrastructure and deployment

Use this module when the release has a hosting environment, deployment configuration, or infrastructure dependency. A static site still has deployment credentials, DNS, an origin, and possibly a managed backend. Read [audit method](../audit-method.md) and [finding rules](../findings-and-priorities.md) for evidence handling and shared statuses.

## Route by the actual deployment

Establish provider, product/service, region, account/project, environment, workload type, and the exact release artifact. Record whether each fact is observed, user-reported, or inferred. A Dockerfile does not establish that production uses containers; a Terraform file does not establish the deployed policy.

| Deployment profile | Prioritize | Evidence to request when absent |
|---|---|---|
| Static site / CDN | Build-time secrets, origin access, domains, headers, deployment identity | Hosting settings, build output inventory, origin/CDN configuration |
| Managed platform / PaaS | Project membership, previews, environment scope, networking, platform overrides | Read-only configuration export, service inventory, deployment record |
| Serverless / functions | Invocation policy, execution identity, event sources, public URLs, concurrency | Function configuration, resource policies, trigger mappings |
| VM / self-hosted service | Host lifecycle, administrative access, patching, process identity, firewall | OS/runtime versions, service configuration, effective firewall rules |
| Containers without Kubernetes | Image digest, process privileges, host mounts, daemon access, network | Runtime settings, image metadata, service configuration |
| Kubernetes | API exposure, RBAC, admission, workload privilege, network policy, node identity | Effective objects and policies from the relevant cluster/namespace |
| Backend as a service | Anonymous versus privileged keys, database/storage rules, service identity | Effective access rules and project settings, representative authorization evidence |

Apply all relevant profiles for mixed deployments. Identify which controls belong to the project, the provider, or a shared responsibility. Provider documentation supports the responsibility model, not a claim that a tenant's configuration is correct.

## Control catalog

### INFRA-001 — Deployment identity and responsibility
- **Applies:** Every release target.
- **Check:** Trace the intended commit/artifact to the target service and environment; identify ownership of patching, network policy, identities, data protection, and recovery.
- **Evidence / limits:** Deployment record and settings with environment, timestamp, artifact digest/version, and evidence IDs. A plan or README alone is declared intent.
- **Correction / retest:** Establish a documented target and responsible owner; reconcile the exact artifact and effective configuration before treating deployment controls as satisfied.

### INFRA-002 — Environment and account separation
- **Applies:** Multiple environments, previews, tenants, or shared accounts.
- **Check:** Follow credentials, data, networks, registries, and deployment permissions across development, staging, preview, and production. Look for test jobs or branches that can reach production resources.
- **Evidence / limits:** Effective account/project boundaries and access policies; distinct names alone do not demonstrate isolation.
- **Correction / retest:** Separate identities and sensitive resources; demonstrate that lower-trust environments cannot access or deploy to production through unintended paths.

### INFRA-003 — Cloud and platform identities
- **Applies:** Provider accounts, deployment agents, workloads, or managed services.
- **Check:** Review human and machine permissions, resource scope, role assumption, trust conditions, emergency access, and paths to permission escalation. Include indirect rights to change policies, attach roles, or read secrets.
- **Evidence / limits:** Effective policies, bindings, trust relationships, and membership; account-owner claims are not policy evidence.
- **Correction / retest:** Narrow the required operations and resources, remove unused grants, and verify allowed operations still work while unintended privilege transitions are denied.

### INFRA-004 — Public exposure and administrative access
- **Applies:** Any network-addressable service or management interface.
- **Check:** Map ingress to listeners and application routes, including debug ports, databases, dashboards, control planes, alternate domains, and preview deployments. Distinguish intentionally public services from accidental exposure.
- **Evidence / limits:** Listener, firewall, load-balancer, and service policy configuration; authorized observations may confirm reachability. Lack of an observed connection is not proof of inaccessibility.
- **Correction / retest:** Limit exposure to intended entry points and authenticated administration; verify relevant allowed and denied paths in the authorized environment.

### INFRA-005 — Segmentation, egress, and metadata access
- **Applies:** Workloads with access to networks or remote URLs.
- **Check:** Trace outbound access to databases, administrative networks, provider metadata, internal services, and the Internet. Examine whether a compromised workload or URL-fetching feature can reach credentials or higher-trust services.
- **Evidence / limits:** Routes, network policies, proxy settings, metadata protections, and caller code. Coordinate application SSRF findings with the application module rather than duplicating them.
- **Correction / retest:** Constrain sensitive destinations and credential exposure; demonstrate intended integrations work and prohibited internal/metadata paths are blocked using bounded authorized checks.

### INFRA-006 — DNS, certificates, and service ownership
- **Applies:** Custom domains, external hosting bindings, or TLS endpoints.
- **Check:** Review authoritative DNS, domain ownership, renewal responsibility, abandoned resource references, certificate coverage, and the provider-specific conditions for reassigning a hostname.
- **Evidence / limits:** DNS/configuration records and certificate observations. A dangling record is not confirmed takeover without evidence of the provider's claim conditions; do not claim or register the resource.
- **Correction / retest:** Remove stale bindings, retain ownership controls, and repair certificate lifecycle; recheck DNS resolution, intended binding, and certificate validity.

### INFRA-007 — Edge, proxy, and origin consistency
- **Applies:** CDN, API gateway, ingress, reverse proxy, or load balancer.
- **Check:** Compare edge and direct-origin access, trusted forwarding headers, TLS termination, routing, request size limits, and caching of authenticated responses. Review parsing differences where multiple HTTP intermediaries exist.
- **Evidence / limits:** Both sides of the configuration and relevant request handling; testing only the public hostname cannot establish origin restrictions.
- **Correction / retest:** Align trust and parsing rules, restrict unintended origin bypass, and prevent shared caching of private data; verify through intended and alternate paths without disruptive probes.

### INFRA-008 — Production settings and feature exposure
- **Applies:** Application runtimes and platform configuration.
- **Check:** Inspect effective debug flags, default credentials, sample data, diagnostic endpoints, development servers, feature flags, secret injection, and environment-variable scope across server and client builds.
- **Evidence / limits:** Effective settings or deployment-specific exports; repository defaults can identify a risk but may be overridden at runtime.
- **Correction / retest:** Remove insecure defaults and restrict diagnostics; inspect the resulting release configuration and public build output, without printing secret values.

### INFRA-009 — Hosts and runtime lifecycle
- **Applies:** Project-managed VMs, operating systems, runtimes, or nodes.
- **Check:** Identify exact supported versions, patch responsibility, administrative login paths, service users, unnecessary daemons, filesystem permissions, and access to runtime sockets.
- **Evidence / limits:** Version/configuration evidence and vendor support notices matched to the installed edition; a base-image tag does not establish host patch state.
- **Correction / retest:** Upgrade supported components, reduce privileged execution and management exposure, then verify the running versions and restricted service permissions.

### INFRA-010 — Container privilege and host boundaries
- **Applies:** Containerized workloads.
- **Check:** Review user identity, Linux capabilities where relevant, privileged mode, writable filesystems, host namespaces, host mounts, daemon sockets, and resource limits. Trace why any elevated capability is needed.
- **Evidence / limits:** Runtime configuration and deployed image digest; build instructions alone cannot prove runtime confinement. Non-root execution alone does not establish isolation.
- **Correction / retest:** Remove unnecessary privilege and host access, scope writable paths, and verify application behavior under the reduced runtime permissions.

### INFRA-011 — Kubernetes identity and admission
- **Applies:** Kubernetes clusters.
- **Check:** Review API access, RBAC including escalation/bind/impersonation paths, service-account token exposure, admission enforcement, privileged workloads, and control-plane/node access.
- **Evidence / limits:** Effective cluster/namespace policy and workload objects; a policy manifest is insufficient if it is not enforced in the target namespace.
- **Correction / retest:** Restrict identities and enforce appropriate workload policies; use authorized policy evaluation or an isolated validation namespace to show unwanted permissions/configurations are rejected.

### INFRA-012 — Kubernetes network and workload separation
- **Applies:** Kubernetes workloads with differing trust or data boundaries.
- **Check:** Trace namespace boundaries, ingress/egress policies, the network implementation's enforcement, node placement constraints where required, and shared volumes or credentials.
- **Evidence / limits:** Effective policies plus enforcement capability; namespaces alone are not a security boundary, and a NetworkPolicy object alone does not prove enforcement.
- **Correction / retest:** Define required flows and isolate sensitive workloads; verify allowed and prohibited communication in an authorized environment.

### INFRA-013 — Serverless events and managed backend access
- **Applies:** Functions, event-driven services, or backend-as-a-service products.
- **Check:** Review direct invocation as well as gateway routes, event-source permissions, execution identities, database/storage rules, privileged service keys, retries, and unauthenticated/default access.
- **Evidence / limits:** Resource policies and effective rules tied to the target project. A public client identifier is not automatically a secret; evaluate its actual privileges.
- **Correction / retest:** Align entry-point and backend authorization, narrow execution privileges, and confirm anonymous and low-privilege callers cannot invoke privileged paths or access other users' data.

### INFRA-014 — Infrastructure state, plans, and drift
- **Applies:** Infrastructure as code or configuration management.
- **Check:** Inspect state/plan access, embedded credentials, provider/module sources, change permissions, and differences between declared and effective security settings. Avoid running apply or a command that refreshes/writes state without an appropriate scope.
- **Evidence / limits:** Repository revision, state metadata, and safe read-only comparison or supplied plan. Record unavailable live configuration as an unknown.
- **Correction / retest:** Protect state and reconcile material drift through the normal change process; verify both the reviewed declaration and the resulting configuration.

### INFRA-015 — Persistent resources and managed-service settings
- **Applies:** Databases, object stores, caches, queues, disks, or search services.
- **Check:** Review public access, transport settings, resource policies, cross-account sharing, key access, snapshots, and deletion protection when loss would be material. Coordinate content/row-level authorization with the data module.
- **Evidence / limits:** Effective resource settings and bindings; encryption does not compensate for excessive read permissions.
- **Correction / retest:** Restrict resource access and sensitive operations; validate the intended application identity and rejected unauthorized access without reading unnecessary production data.

### INFRA-016 — Provider, support, and emergency access
- **Applies:** Hosting operators, managed support, break-glass access, or external administrators.
- **Check:** Identify approval/expiry, identity verification, privilege, audit records, revocation, and dependency on provider support during an incident.
- **Evidence / limits:** Membership, support settings, access records, and rehearsed procedures where available. A contractual statement is different from operational evidence.
- **Correction / retest:** Make exceptional access attributable, limited, and revocable; verify removal and logging with safe test identities or existing exercise evidence.

### INFRA-017 — Hardcoded environment destinations and resources
- **Applies:** Source, configuration, deployment templates, or generated artifacts select endpoints, storage resources, accounts/projects, regions, or environment-specific filesystem locations.
- **Check:** Inventory relevant literal or assembled URIs, hostnames/IPs, API/database endpoints, bucket/queue names, resource identifiers, and absolute paths. Trace their consumers and overrides, including development/test destinations, localhost/private addresses, fallback targets, and values captured during a build rather than read at runtime. Compare the intended release environment with the selected resource and any data or credential sent there; do not probe a discovered destination merely because it appears in source.
- **Evidence / limits:** Record a suitably redacted definition/use site, configuration source, resolution stage, intended environment, and supported relationship. A fixed endpoint, resource ID, or reviewed single-environment constant can be legitimate; demonstrate wrong-environment access, unsafe exposure, inappropriate credential forwarding, or another concrete consequence before raising a finding. A literal is not proof the destination is active, attacker-controlled, reachable, or used by production. Link missing runtime/artifact corroboration to `U-###`; coordinate with INFRA-002, APP-009, and DATA-017 when they describe the same path.
- **Correction / retest:** Correct unsafe resource selection and establish an explicit, validated environment-to-resource mapping through trusted configuration where variation is needed; retain justified constants. Constrain destinations and resource permissions independently of configuration location. Inspect resolution for development, staging, and production fixtures and reject unexpected destinations using mocks or isolated tests within scope. Check generated assets for values frozen at build time; an environment-variable change after build may not alter the shipped artifact. Do not send real credentials or data to alternate targets during validation.

### INFRA-018 — Hardcoded identities and security-policy constants
- **Applies:** Constants or configuration values influence privileges, tenant/account selection, trusted parties, authentication, browser policy, or security-related limits.
- **Check:** Trace administrator/user/email/role and tenant/account/project IDs, bypass lists, default owner identities, CORS origins, redirect allowlists, trusted token issuers/audiences, debug/auth-bypass flags, `verifyTLS`-style toggles, token/session lifetimes, and quotas/timeouts to the enforcing component. Determine whether values are appropriate for the actual security model, whether lower-trust callers can override them, and whether client-visible values are wrongly treated as authority. Review broad toggles with INFRA-008, token trust with IAM-008/009, tenant/role enforcement with IAM-011/012/013, browser rules with APP-006/007, and limits with OPS-004/005; avoid duplicate findings.
- **Evidence / limits:** Connect the definition to an authorization, trust, or resource-control decision and identify the affected principal/environment. Static allowlists and bounded defaults can be intentional and secure; hardcoding alone is not a defect. A hardcoded tenant in a deliberately isolated single-tenant service has different implications from a shared service trusting an arbitrary client tenant ID. Source evidence does not establish effective production settings. Record the exact unsafe decision and unavailable corroboration without publishing sensitive identifiers.
- **Correction / retest:** Remove unjustified identity shortcuts and bypasses; derive authority from a verified principal and trusted server-side policy, and enforce object/tenant/resource scope at the sensitive operation. Correct inappropriate trust rules and limits while preserving legitimate narrowly scoped constants. Moving an administrator ID, tenant ID, or permissive rule into an environment variable does not repair missing authorization. Verify permitted behavior plus unauthorized roles, mismatched tenants, wrong issuers/audiences/origins, and relevant limit boundaries with synthetic cases where authorized; document static-only verification limits when execution is excluded.

### INFRA-019 — Configuration precedence, validation, and fail-safe defaults
- **Applies:** Security-relevant values can come from defaults, files, environment variables, command arguments, build substitution, deployment settings, remote configuration, or runtime reloads.
- **Check:** Trace actual precedence and parsing for the target stack/version, including `.env` variants, build versus runtime values, orchestrator/CLI overrides, duplicate names, empty/whitespace values, malformed booleans/numbers, unknown modes, and stale values after reload. Determine who can write each source and whether a missing variable silently enables a development mode, disables authentication/TLS verification, widens access, selects a default identity, or removes a necessary bound. Environment variables are configuration inputs, not inherently trusted or secret.
- **Evidence / limits:** Record the source chain, parser/default branch, winning value's non-sensitive meaning, consuming control, and environment/artifact. Do not execute or source `.env` or configuration files merely to inspect them, or dump the process environment. A generic framework precedence rule cannot prove this application's effective configuration; unavailable deployment overrides remain unknown. Do not report a safe explicit default as a defect solely because it is a constant, and do not infer all settings are safe from one validated value.
- **Correction / retest:** Define typed, constrained security configuration; reject invalid combinations and unsafe required-value omissions before the dependent operation, with redacted diagnostics. Protect write access to authoritative sources, make precedence explicit, separate build/public/server settings, and choose fail-safe behavior appropriate to each capability without unnecessarily stopping unrelated safe features. With authorized isolated execution, exercise valid, missing, empty, malformed, conflicting, and reload cases; verify the intended source wins and no less-trusted override grants authority or weakens the required boundary. Otherwise inspect the resolution paths and record the remaining runtime gap. Coordinate secret fallbacks with DATA-017 rather than duplicating the finding.

## Graph contributions

- In the **analysis traversal graph**, connect each inspected configuration, deployment record, or authorized observation to its control IDs, evidence IDs (`E-###`), findings (`F-###`), and unresolved questions (`U-###`). Show unavailable live configuration as an unverified branch.
- In the **dependency graph**, add runtime services, hosting resources, identity providers, secret stores, and edge components actually examined. Label edges by their meaning: `routes to`, `runs on`, `assumes role`, `reads from`, or `invokes`.
- Label environment and evidence basis; distinguish a declared connection from an observed one. Never draw an inferred production resource as an inspected resource or publish credentials, account secrets, or unnecessary internal addresses in node labels.

## Reference selection

Use the target provider's official documentation and a benchmark matching the actual technology/version. Record the reference and version/date used; do not apply another provider's defaults as facts.

- [CIS Benchmarks](https://resources.cisecurity.org/benchmarks): technology-specific configuration guidance.
- [Kubernetes Security Checklist](https://kubernetes.io/docs/concepts/security/security-checklist/): Kubernetes-specific review areas; select documentation for the deployed version.
- [AWS Well-Architected Security Pillar](https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/welcome.html): AWS responsibility, identity, protection, and operational considerations when AWS is in scope.
