# Adaptive scoping questionnaire

Use this reference to resolve information that changes the assessment. It is a branching interview, not a form the user must complete in full.

## Discover, qualify, then ask

First determine whether repository inspection is in scope using Q-00 below. An explicit or clearly implied request to review the repository/code is sufficient; retain existing authorization instead of asking for it again. A working directory or a repository mentioned as background does not by itself settle an otherwise unclear scope.

Once the scope is established, read the selected manifests, lockfiles, deployment files, CI workflows, infrastructure declarations, architecture notes, and previous answers. Without repository scope, use only the independently selected documents, exports, or environment evidence. Do not execute scripts to discover the stack or assume a file represents the actual deployment.

## Q-00 — Include repository security review?

When this choice is unanswered, ask:

> Would you also like me to inspect your repository for security issues in its source code, hardcoded values, configuration, dependencies, and CI/CD pipelines?

Offer these choices, adapting to any boundaries already given:

| Choice | Included work |
| --- | --- |
| Yes, review the repository (recommended when preparing a code release) | Review the identified repository/revision, relevant source/configuration/dependencies, and discovered CI/CD definitions. Establish path/history boundaries in the follow-up below. |
| Only selected paths or pipelines | Review the named services, files, diff, or pipeline definitions and related paths needed to explain their behavior; clarify before expanding beyond the selected boundary. |
| No, use the supplied architecture/deployment evidence only | Do not inspect repository contents or run repository scanners. Record code and pipeline-definition coverage as excluded or not verified, not satisfied. |

If the user already asked to audit their repo, record `included — user-requested` and proceed. If they explicitly exclude it, record `excluded — user-requested` and do not ask again. If the choice remains pending, continue only the other established parts of the assessment. Do not use silence as consent for the optional review.

Repository review is distinct from running the application or its pipelines. It does not imply installing dependencies, triggering workflows, deploying, uploading source to a scanning service, or probing a live URL.

## Repository and pipeline follow-up

Ask only for missing information that changes the chosen scope; infer provider/file locations from in-scope evidence when possible.

| Topic | Question | Consequence |
| --- | --- | --- |
| Target | Which local path or repository, branch/commit, services, or changed paths should be reviewed? | Bind findings and graphs to an identified snapshot; do not silently expand to neighboring repositories. |
| Files and history | Is the review limited to the current checkout or a diff? Is relevant local Git history included? Which generated, vendored, untracked, ignored, or local configuration files are excluded? | Define file/history coverage, including whether secret history or local `.env` files were inspected. Never promise a full history scan from a shallow checkout. |
| Review depth | Is this a targeted change review, a general pre-release review, or an assessment against specified controls? Is there a time/depth constraint? | Select controls and sampling explicitly; a targeted review is not a whole-system verdict. |
| CI/CD coverage | Which CI and CD systems build, test, publish, migrate, or deploy this release? Are workflows, reusable templates, external definitions, and redacted platform settings available? | Follow discovered definitions and scripts; identify unavailable included pipelines/settings as gaps. Do not request permission again to read files already inside the chosen repo scope. |
| Pipeline trust | Can forks, external PRs, manual inputs, or other repositories trigger jobs? Which jobs obtain secrets, cloud identities, signing rights, or production access? | Trace untrusted input through privileged CI/CD paths and cross-repository trust. |
| Configuration | Which security settings and destinations vary by environment? Which values are deliberately public or fixed, and what should happen when a required secret/setting is missing? | Calibrate hardcoded-value, unsafe fallback, server/client exposure, and configuration-precedence checks without requesting secret values. |
| Scanner mode | Should the review use available local scanners as well as source inspection? Are rules/advisory downloads or access to an agreed live test environment already allowed? | Apply the tooling procedures within existing scope; an offline or manual-only request must remain offline or manual-only. |

Record repository review, current-file/history coverage, pipeline-definition/settings coverage, and scanner/network mode as separate decisions. For a full repository review, discovered CI/CD definitions are included by default unless excluded; executing or rerunning them is a separate action.

For each material answer, keep:

| Field | Meaning |
| --- | --- |
| Topic and value | The question and current answer; use `unknown` rather than guessing. |
| Basis | `observed-source`, `declared-config`, `observed-runtime`, `documented-process`, `user-stated`, or `inferred`. |
| Source | File and lines, configuration resource, evidence ID, or the user's statement. |
| Target | Commit/artifact, environment, service, and observation date where relevant. |
| Audit consequence | Modules, controls, tests, impact assumptions, or conclusions affected. |
| Follow-up | Missing evidence or clarification that would materially change the assessment. |

A Dockerfile is a source fact. Deployment to a container platform is a separate claim. A CI deployment workflow may be declared but disabled. A user statement can establish intended scope without proving a control is effective.

Start with roughly four to six unanswered high-impact topics, grouped naturally. Prefer choices when useful, always allowing a free-text answer or `unknown`. Avoid asking for passwords, live tokens, production personal data, or complete credential files. Ask for redacted configuration, read-only access, or synthetic accounts instead.

Ask follow-ups only when an answer activates them. Do not repeat answered questions. If the user wants an immediate repository-only review, perform it and record operational gaps rather than making a full interview a prerequisite.

## First-pass questions

| ID | Ask when unanswered | Effect on the audit |
| --- | --- | --- |
| Q-01 | What are we releasing, and which user actions would cause the most harm if abused? Website, API, SaaS, internal tool, installed client, or AI agent? | Select product modules and business-impact scenarios. |
| Q-02 | Where and how will each component run? Name the provider and services, and whether they are managed hosting, static hosting, BaaS, serverless, VMs, containers, Kubernetes, or on-premises. | Select deployment controls and responsibility boundaries. |
| Q-03 | Which release or commit is in scope? Is production already live, and which development/staging/production environments can be inspected? | Bind evidence to a target and distinguish planned from deployed controls. |
| Q-04 | Who can reach the service, which roles exist, and do multiple customer organizations share it? | Calibrate exposure, account paths, authorization, and tenant isolation. |
| Q-05 | What sensitive data, credentials, money flows, or high-impact actions does it handle? Which external services receive data or authority? | Establish impact, data paths, and integration/AI/payment branches. |
| Q-06 | What evidence and test access are available, and what test scope is already authorized? Source, IaC, effective configuration, logs, read-only consoles, staging URL, synthetic accounts? | Define what can be verified and which actions require unresolved authorization. |

## Deployment and exposure branch

| Trigger | Follow-up questions | Result |
| --- | --- | --- |
| Any hosted service | Where do frontend, API, jobs, databases, caches, queues, and files run? Which links cross accounts, regions, networks, or providers? | Inventory components and data/trust edges. |
| Internet exposure | Which domains/endpoints are public? Where does TLS terminate? Is the origin reachable directly? How are admin and diagnostic surfaces reached? | Inspect edge/origin bypass, certificates, admin exposure, and diagnostics. |
| Managed platform or BaaS | Which security settings are customer-controlled? Who manages identity, database policies, storage access, backups, patches, and logs? Are preview environments public? | Audit actual customer controls and request evidence for provider guarantees. |
| Serverless | Which triggers are public? Which identities execute functions? What private services can they reach, and what quotas/concurrency limits apply? | Inspect trigger auth, workload scope, egress, and cost abuse. |
| VM or self-hosted | Who patches the host? How is administration authenticated? Which ports, users, services, and backups exist? | Add host/network/update/recovery checks. |
| Containers or Kubernetes | Is orchestration managed? Who can access the control plane? What privileges, host mounts, service accounts, namespaces, and network policies exist? | Add workload isolation and control-plane checks. |
| Multiple environments | Are accounts, secrets, databases, identity tenants, and deployment rights separated? Can preview/CI access production? | Trace cross-environment escalation and data leakage. |
| No runtime access | Is a redacted effective-configuration export or deployment manifest available? Who can verify the remaining controls? | Continue source/config review and create explicit runtime unknowns. |

## Identity and data branch

| Trigger | Follow-up questions | Result |
| --- | --- | --- |
| User accounts | Which identity provider and login flows? MFA/passkeys? Invitations, recovery, account linking, email changes, and session revocation? | Select identity lifecycle and session checks. |
| Multiple roles | Who can change roles, invite users, impersonate customers, export data, or perform administrative actions? | Build an action/role matrix and privilege paths. |
| Multiple tenants | Where is the tenant boundary enforced in queries, files, caches, search, queues, exports, and background jobs? Can users belong to multiple organizations? | Trace isolation beyond HTTP handlers. |
| Machine identities | Which API keys, service accounts, workload identities, connectors, and emergency accounts exist? How are they scoped, expired, and revoked? | Map non-human authority and secret lifecycle. |
| Sensitive data | What is stored, logged, backed up, sent to analytics, or copied to test environments? What retention, deletion, and location constraints apply? | Select data lifecycle controls and identify unverified requirements. |
| Money or entitlements | Who calculates prices and grants access? What confirms payment, handles retries/refunds, and prevents duplicate processing? | Add business invariants, concurrency, webhook, and reconciliation checks. |

## Specialist branches

| Trigger | Follow-up questions | Result |
| --- | --- | --- |
| LLM or RAG | Which providers/models are used? Which prompts, documents, embeddings, or conversations contain sensitive data? Are retrieval permissions tenant-aware? | Trace data disclosure, retrieval isolation, and external-model dependencies. |
| Agent, tools, or MCP | Which tools can read/write/execute/send? Under whose identity? Which actions need approval, and how are approvals bound to exact arguments? What budgets and stop conditions exist? | Assess delegated authority, injection paths, side effects, and resource abuse. |
| Mobile/desktop | Which platforms, local secrets, deep links, IPC channels, update mechanisms, and distribution channels exist? | Select platform-specific client controls. |
| Browser extension | Which origins, permissions, content scripts, message handlers, and update/distribution channels are used? | Inspect origin trust and privilege separation. |
| Specialized or regulated domain | What concrete obligations, contractual controls, data restrictions, or safety requirements apply? Which owner can confirm applicability? | Map supplied requirements; flag specialist work outside supported coverage. |

## Delivery, operations, and decision branch

| Topic | Questions | Result |
| --- | --- | --- |
| Delivery | Who can modify source, CI workflows, secrets, registries, and production releases? What artifact will actually be deployed? | Connect repository controls to build and deployment authority. |
| CI/CD evidence | Are platform-side token defaults, protected environments, approvals, branch/tag restrictions, runners, OIDC trust policies, and relevant run records available read-only? | Distinguish pipeline YAML from effective CI/CD permissions and release enforcement. Missing settings are evidence gaps. |
| Detection | Which security events generate alerts, who receives them, and what evidence shows they work? | Assess detection operation rather than configuration alone. |
| Recovery | When was the last restoration tested? Who can isolate the service, revoke credentials/sessions, and roll back safely? | Assess incident/recovery readiness and recovery dependencies. |
| Release decision | What is the target date? Are there release criteria, previous findings, accepted risks, or required reviewers? Who owns the release decision? | Prioritize fixes without weakening findings to meet a date. |
| Output | Where should the report be written, who will read it, and does it need a specific language or disclosure level? | Choose a destination and appropriate detail/redaction. |

## Missing answers and stop conditions

- Missing business context can lower confidence or leave impact provisional; it does not erase a demonstrated technical defect.
- Missing evidence becomes a `U-###` unknown with affected controls and a specific next action. Continue independent checks.
- If target identity or authorization is ambiguous, stop only the affected active test until clarified. Existing explicit authorization remains valid; do not ask again for routine steps within it.
- If production configuration is unavailable, do not report deployment controls as satisfied from source declarations. A source-only report can still contain confirmed source defects.
- If a critical decision depends on unresolved evidence, use the readiness rules in [findings and priorities](findings-and-priorities.md). An unanswered question cannot be silently converted into acceptance.
