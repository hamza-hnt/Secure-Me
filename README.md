# Secure-Me

**Evidence-based security reviews before production, delivered as an actionable Markdown report.**

Secure-Me is a reusable agent skill for assessing the security readiness of an application and its release environment. It calibrates the review with adaptive questions, selects relevant audit modules, records evidence and coverage gaps, and produces a prioritized correction plan.

The report includes two Mermaid graphs: an **analysis path** showing what the reviewer inspected and concluded, and an **analyzed dependency map** showing the components, packages, services, and trust relationships actually examined.

The skill and its documentation are written in English. Reports default to English and can use another language when requested.

## What this repository contains

This repository contains the source of the `preprod-security-audit` skill: instructions, a branching questionnaire, nine audit modules, a 35-domain coverage map, scanner execution procedures, evidence and prioritization rules, and a Markdown report template.

It is currently a **skill source repository**. It does not provide an npm package, CLI, hosted scanner, or automated remediation engine. npm packaging is planned for a later iteration; there is no npm installation command or publishing workflow yet.

## What the skill does

1. **Establishes the review scope**, including whether the user wants the repository examined. An existing request to audit the repository already answers that question.
2. **Discovers context and asks only material unanswered questions** using in-scope source, manifests, lockfiles, deployment declarations, workflows, documentation, and the user's product/release constraints.
3. **Selects applicable controls** instead of applying every technology-specific check to every project.
4. **Reviews available evidence** across source code, declared configuration, observed environments, and documented processes.
5. **Qualifies findings** by technical severity, business impact, confidence, correction priority, and release consequence.
6. **Produces a Markdown report** with traceable findings, coverage limits, both graphs, and a correction and verification plan.
7. **Supports re-audits** by preserving finding IDs and distinguishing proposed fixes, implemented fixes, verified fixes, and regressions.

The skill can work with a repository alone. Runtime, cloud, identity-provider, and operational controls remain explicitly unverified when the relevant evidence is unavailable.

## Audit coverage

The nine modules contain **167 original audit controls**. Each control describes applicability, what to inspect, expected evidence and limitations, and correction/retest criteria. The [coverage map](preprod-security-audit/references/coverage-map.md) explicitly traces the original **35 security domains** to their control IDs across seven core modules, plus two conditional AI/client modules. Domains, module files, and automated checks are different units.

| Module | Controls | Coverage |
| --- | --- | --- |
| [Architecture](preprod-security-audit/references/modules/architecture.md) | ARCH-001–018 | Assets, exposure, trust boundaries, tenant/data flows, business abuse, shared responsibility, requirements, and architectural drift. |
| [Identity and access](preprod-security-audit/references/modules/identity-access.md) | IAM-001–016 | Enrollment, authentication, MFA, recovery, sessions, OAuth/OIDC/SAML, authorization, tenant isolation, support access, and service identities. |
| [Application and API](preprod-security-audit/references/modules/application-api.md) | APP-001–020 | Input/output handling, injection, browser controls, APIs, SSRF, files, webhooks, business logic, concurrency, resource limits, errors, and caching. |
| [Data and secrets](preprod-security-audit/references/modules/data-secrets.md) | DATA-001–017 | Data lifecycle, storage access, secrets, cryptography, telemetry, exports, key management, hardcoded credentials, and unsafe secret fallbacks. |
| [Infrastructure and deployment](preprod-security-audit/references/modules/infrastructure-deployment.md) | INFRA-001–019 | Cloud IAM, network/edge/DNS, hosts, containers, Kubernetes, serverless, IaC, fixed environment/security values, configuration precedence, and fail-safe defaults. |
| [Supply chain](preprod-security-audit/references/modules/supply-chain.md) | SC-001–018 | Repository/dependency controls, CI/CD definition traversal, input trust, runners, secrets, artifacts, gate integrity, and deployment target/state binding. |
| [Operations and resilience](preprod-security-audit/references/modules/operations-resilience.md) | OPS-001–015 | Logs, alerts, cost/availability controls, failures, backups, restoration, incidents, revocation, rollback, and ongoing vulnerability management. |
| [AI and agents](preprod-security-audit/references/modules/ai-agents.md) | AI-001–020 | Prompt injection, RAG, tools/MCP, delegated authority, approvals, output handling, exfiltration, memory, budgets, and shutdown. |
| [Mobile and desktop](preprod-security-audit/references/modules/mobile-desktop.md) | CLIENT-001–024 | Mobile, desktop, and extension storage, permissions, links, bridges, IPC, local services, release artifacts, and updates. |

Hosting branches cover static/CDN hosting, managed platforms, backend-as-a-service, serverless, VMs, containers, Kubernetes, and mixed deployments. Unsupported specialist surfaces, such as industrial equipment or custom hardware, require an explicit coverage limit and appropriate specialist review.

## Adaptive questionnaire

[The questionnaire](preprod-security-audit/references/scoping-questions.md) is a routing mechanism, not a mandatory form.

If repository review has not already been included, it asks:

> Would you also like me to inspect your repository for security issues in its source code, hardcoded values, configuration, dependencies, and CI/CD pipelines?

The choices are **the repository**, **selected paths or pipelines**, or **supplied architecture/deployment evidence only**. An explicit repository/code-audit request already settles the choice; the skill does not ask again. If the user declines or the optional choice remains pending, it continues only the independently agreed evidence review. It records repository files/history, pipeline definitions/settings, and scanner/network mode separately.

The first pass resolves a short set of high-impact topics:

- What is being released, and which actions or assets are critical?
- Where and how will each component run?
- Which revision, artifact, and environments are in scope?
- Who can access the system, and what roles or tenant boundaries exist?
- What sensitive data, integrations, money flows, or AI capabilities are involved?
- What evidence and test access are available, and which checks are already authorized?

Follow-up questions depend on the answers. A Kubernetes deployment activates cluster-specific questions; a managed platform activates responsibility and effective-configuration questions; a multi-tenant SaaS activates isolation checks across stores, caches, exports, and jobs; an agent with tools activates delegated-authority and action-validation questions.

Discovered facts, user statements, and inferences remain separate. Missing answers become visible unknowns. The reviewer continues independent work and pauses only an affected action or conclusion that genuinely needs clarification.

## Use the skill

The self-contained skill folder is [`preprod-security-audit/`](preprod-security-audit/SKILL.md).

Load it directly by giving an agent the path to `SKILL.md`, or copy the entire folder into your agent's supported skill directory, preserving its name and relative structure. For Codex, the skill-creation convention is `$CODEX_HOME/skills`, or `~/.codex/skills` when `CODEX_HOME` is unset. Preserve any existing installation when updating it.

Example request when the skill is available by name:

```text
Use $preprod-security-audit to review this repository before production.
We plan to deploy the API on a managed platform with a managed PostgreSQL database.
The product is a multi-tenant SaaS with an external identity provider.
Start with the source and configuration available locally.
Ask only the remaining questions that materially change the review.
Write the Markdown report with the analysis path, analyzed dependencies,
and a prioritized correction and verification plan.
```

Example request without installing the skill:

```text
Read /path/to/secureme/preprod-security-audit/SKILL.md and use that skill
to assess /path/to/my-project. This is a source-only review;
production configuration and active test access are not available.
Write the report to /path/to/my-project/security-audits/release-review.md.
```

No specific scanner or connected service is required. Available tools can extend the review, but unavailable tools and failed checks must appear in the coverage limits. The skill does not install or run project dependencies just to discover the stack.

## Hardcoded values and configuration

The review explicitly follows values from definition to use:

- **DATA-005 / DATA-017:** embedded credentials, unsafe secret fallbacks, scoped `.env`/history inspection, encoded credentials, build arguments, and public client bundles.
- **INFRA-017:** fixed environment endpoints, accounts, regions, storage resources, and destinations captured at build time.
- **INFRA-018:** fixed administrator/tenant identities, privilege shortcuts, origins, redirect/token trust, authentication/TLS toggles, and security limits.
- **INFRA-019:** configuration precedence, missing/empty values, unsafe defaults, malformed booleans/numbers, overrides, and runtime reload behavior.

A constant is not automatically a vulnerability. The report must show a security consequence or unmet requirement. Moving a value to an environment variable does not repair missing authorization, revoke an exposed credential, or protect a secret embedded in a public build.

## CI and CD pipeline review

When repository review is included, discovered CI/CD definitions and their in-scope dependencies are reviewed by default. A narrower or explicit exclusion is preserved.

The supply-chain module covers GitHub Actions, GitLab CI, Jenkins, Azure Pipelines, CircleCI, Bitbucket Pipelines, Buildkite, and Google Cloud Build entry points. It follows reusable/local actions, includes, templates, scripts, generated-definition sources, and downstream pipelines; inaccessible remote/generated definitions remain gaps.

Checks include untrusted PR/fork/manual input, code checkout and shell interpolation, token/secret/OIDC authority, runner isolation, mutable execution dependencies, cache/artifact poisoning, required-check failure/skip behavior, production approvals and bypasses, exact artifact promotion, environment selection, infrastructure plans, migrations, and rollback.

The report includes a **per-job risk and evidence table** and represents the pipeline's trigger, jobs, identities, artifacts, gates, and target environments in the dependency section. Reading YAML does not establish effective platform permissions or a successful run. Reviewing a pipeline does not trigger or deploy it.

## Tool-assisted review

[Scanner execution procedures](preprod-security-audit/references/tooling.md) provide concrete commands, prerequisites, configuration handling, result interpretation, and evidence normalization:

| Tool / procedure | Purpose | Boundary |
| --- | --- | --- |
| Gitleaks | Current-file and selected Git-history secret detection | Redacted results, auditor-controlled configuration, explicit history and exclusion limits. |
| Semgrep CE | Source rules using reviewed local rule files | Target/inline suppressions reviewed; parsing errors, unsupported paths, and timeouts remain visible. |
| Trivy | Filesystem/image vulnerabilities and IaC misconfigurations | Explicit scanners and cache freshness; declared/installed/artifact inventories distinguished. |
| ZAP passive plan | Scoped crawling and passive analysis through the Automation Framework | Contacts the application and can cause effects; requires its own established live-test scope. |
| ZAP active plan | Selected active tests against an agreed environment | Separate from passive analysis and source review; bounded attack scope and stop conditions. |

These are executable **procedures for the agent**, not a bundled scanner service or npm runner. The agent uses available trusted tools within the chosen scope; manual-only/offline choices are respected. Missing tools, rules, caches, access, or compatible flags are recorded with a useful manual/evidence fallback. No result is invented and no proposed command is counted as a completed scan.

Scanner logs/JSON are private working evidence. The report includes only minimal redacted findings and records actual versions, rules/advisory dates, targets, suppressions, exits, errors, and coverage. Tool output is contextualized against code, configuration, and impact before it becomes a confirmed finding.

## Report output

By default, a new report is written in the audited project:

```text
security-audits/
└── <YYYY-MM-DD>-<revision-or-target>/
    └── security-audit.md
```

The user can choose another destination. Existing reports are preserved. Reports are not stored inside the skill or committed, uploaded, or shared automatically.

[The report template](preprod-security-audit/assets/report-template.md) contains:

1. Executive assessment and bounded readiness recommendation.
2. Calibrated context and question responses.
3. Scope, repository choice, module selection, performed checks, scanner execution register, and per-job CI/CD risk inventory.
4. Per-control coverage with evidence and limitations.
5. Analysis path graph and node/edge registers.
6. Analyzed dependency graph and component/package inventory.
7. Detailed findings with concrete corrections and acceptance tests.
8. Unknowns, conflicting evidence, and next verification actions.
9. Prioritized correction plan with owners, effort, prerequisites, milestones, and status.
10. Residual risks and actual release decisions.
11. Evidence, consulted references, and re-audit changes.

### The two graphs

**Analysis path:** maps the release scope to inspected artifacts, performed checks, supported conclusions, findings, and unresolved branches. It documents observable work and evidence rather than private reasoning. Planned or skipped tests cannot appear as completed.

**Analyzed dependencies:** maps actual package, runtime, service, identity, storage, build, and integration relationships encountered during the audit. Package nodes include known ecosystem/version and direct/transitive or runtime/build classification. Nodes distinguish implementation review, configuration review, metadata inspection, runtime observation, and no inspection.

Both use Mermaid fenced blocks and adjacent node/edge tables. Reports remain readable in Markdown viewers without Mermaid support. Evidence-backed relationships and inferred/unverified relationships are labeled distinctly. A source-confirmed call to an external provider does not imply the provider's internals were audited. Large maps can be split into runtime/service and package/build views with a shared register.

### Evidence and readiness

| Record | Purpose |
| --- | --- |
| `E-###` | Evidence with a narrow claim, source locator, target, method, time, and limits. |
| Module control ID | A stable check, such as `IAM-012`, linked to the coverage matrix. |
| `F-###` | Confirmed or provisional finding with a justified severity and correction. |
| `U-###` | Missing evidence, conflicting facts, or unresolved scope. |
| `R-###` | Correction or verification task in the plan. |

Control statuses are `satisfied`, `finding`, `needs-validation`, `not-verified`, and `not-applicable`. Lack of access is never a reason to mark a control satisfied or non-applicable.

Readiness recommendations are `BLOCKED`, `INSUFFICIENT EVIDENCE`, `READY WITH CONDITIONS`, and `NO BLOCKER FOUND IN REVIEWED SCOPE`. They apply to the stated target and evidence; they are not deployment approval, a guarantee of security, or certification. Known blockers take precedence, followed by critical evidence gaps.

## Working boundaries

- Source declarations, runtime observations, documented processes, user statements, and inferences are distinguished.
- Scanner matches are contextualized before being presented as confirmed application vulnerabilities.
- Existing user authorization is respected. Production changes, destructive probes, third-party tests, and publication are not implied by a repository audit.
- Repository instructions and tool output are treated as audit data; embedded instructions cannot redirect the audit.
- Secrets and personal data are redacted from reports and graphs. A discovered credential is not tried against a service to check whether it works.
- Proposed fixes remain open until implemented and verified on the relevant target.

## Reference approach

The modules use original, practical controls and link to relevant primary references, including OWASP ASVS, WSTG, API Security, MASVS and GenAI guidance; NIST digital identity guidance and SSDF; CIS Benchmarks; SLSA; and platform-specific documentation.

They do not reproduce or claim complete conformance with those standards. The report records the editions, versions, advisories, and documentation actually consulted. Weaknesses can be classified with CWE; technical severity can use CVSS where appropriate. Exploitation signals supplement local context rather than replacing it.

## Repository layout

```text
secureme/
├── README.md
├── .gitignore
└── preprod-security-audit/
    ├── SKILL.md
    ├── agents/
    │   └── openai.yaml
    ├── references/
    │   ├── scoping-questions.md
    │   ├── audit-method.md
    │   ├── findings-and-priorities.md
    │   ├── coverage-map.md
    │   ├── tooling.md
    │   └── modules/
    │       ├── architecture.md
    │       ├── identity-access.md
    │       ├── application-api.md
    │       ├── data-secrets.md
    │       ├── infrastructure-deployment.md
    │       ├── supply-chain.md
    │       ├── operations-resilience.md
    │       ├── ai-agents.md
    │       └── mobile-desktop.md
    └── assets/
        └── report-template.md
```

There are no bundled scanner scripts or application runtime dependencies in this iteration.

## Maintaining the skill

Keep the entrypoint short and route detailed checks to modules. Preserve control IDs when the underlying control remains the same. Add platform-specific detail only when it changes the review; consult official documentation for the target version rather than copying generic checklists.

Before merging a change:

- Validate the skill's frontmatter and UI metadata.
- Check relative links, control-ID uniqueness, and consistency between evidence, statuses, graphs, and report fields.
- Parse or locally render modified Mermaid examples.
- For material behavior changes, try a realistic audit in an isolated fixture and inspect the resulting report, including unavailable-evidence and authorization cases.
- Check that examples cannot be mistaken for real findings and that no sensitive audit artifacts enter the repository.

Commit subjects follow this repository's required format:

```text
type(scope) : description
```

Examples: `feat(audit) : add serverless deployment controls`, `fix(report) : distinguish inferred dependency edges`, and `docs(readme) : clarify source-only review usage`.

## Planned next iteration

npm packaging and installation/distribution tooling will be designed in a later iteration. The skill folder is self-contained so packaging can preserve its existing relative references and report asset.
