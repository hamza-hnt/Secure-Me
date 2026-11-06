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

## Graph contributions

- In the **analysis traversal graph**, connect each inspected configuration, deployment record, or authorized observation to its control IDs, evidence IDs (`E-###`), findings (`F-###`), and unresolved questions (`U-###`). Show unavailable live configuration as an unverified branch.
- In the **dependency graph**, add runtime services, hosting resources, identity providers, secret stores, and edge components actually examined. Label edges by their meaning: `routes to`, `runs on`, `assumes role`, `reads from`, or `invokes`.
- Label environment and evidence basis; distinguish a declared connection from an observed one. Never draw an inferred production resource as an inspected resource or publish credentials, account secrets, or unnecessary internal addresses in node labels.

## Reference selection

Use the target provider's official documentation and a benchmark matching the actual technology/version. Record the reference and version/date used; do not apply another provider's defaults as facts.

- [CIS Benchmarks](https://resources.cisecurity.org/benchmarks): technology-specific configuration guidance.
- [Kubernetes Security Checklist](https://kubernetes.io/docs/concepts/security/security-checklist/): Kubernetes-specific review areas; select documentation for the deployed version.
- [AWS Well-Architected Security Pillar](https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/welcome.html): AWS responsibility, identity, protection, and operational considerations when AWS is in scope.
