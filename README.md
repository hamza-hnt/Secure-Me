# Secure-Me

**Evidence-based security reviews before production, delivered as an actionable Markdown report.**

Secure-Me is a reusable agent skill for assessing the security readiness of an application and its release environment. It calibrates the review with adaptive questions, selects relevant audit modules, records evidence and coverage gaps, and produces a prioritized correction plan.

The report includes two Mermaid graphs: an **analysis path** showing what the reviewer inspected and concluded, and an **analyzed dependency map** showing the components, packages, services, and trust relationships actually examined.

The skill and its documentation are written in English. Reports default to English and can use another language when requested.

## What this repository contains

This repository contains the source of the `preprod-security-audit` skill: instructions, a branching questionnaire, nine audit modules, evidence and prioritization rules, and a Markdown report template.

It is currently a **skill source repository**. It does not provide an npm package, CLI, hosted scanner, or automated remediation engine. npm packaging is planned for a later iteration; there is no npm installation command or publishing workflow yet.

## What the skill does

1. **Discovers context** from accessible source, manifests, lockfiles, deployment configuration, infrastructure declarations, workflows, and documentation.
2. **Asks only material unanswered questions** about the product, deployment, identities, sensitive data, integrations, available evidence, and release constraints.
3. **Selects applicable controls** instead of applying every technology-specific check to every project.
4. **Reviews available evidence** across source code, declared configuration, observed environments, and documented processes.
5. **Qualifies findings** by technical severity, business impact, confidence, correction priority, and release consequence.
6. **Produces a Markdown report** with traceable findings, coverage limits, both graphs, and a correction and verification plan.
7. **Supports re-audits** by preserving finding IDs and distinguishing proposed fixes, implemented fixes, verified fixes, and regressions.

The skill can work with a repository alone. Runtime, cloud, identity-provider, and operational controls remain explicitly unverified when the relevant evidence is unavailable.

## Audit coverage

The nine modules contain **160 original audit controls**. Each control describes applicability, what to inspect, expected evidence and limitations, and correction/retest criteria.

| Module | Controls | Coverage |
| --- | --- | --- |
| [Architecture](preprod-security-audit/references/modules/architecture.md) | ARCH-001–018 | Assets, exposure, trust boundaries, tenant/data flows, business abuse, shared responsibility, requirements, and architectural drift. |
| [Identity and access](preprod-security-audit/references/modules/identity-access.md) | IAM-001–016 | Enrollment, authentication, MFA, recovery, sessions, OAuth/OIDC/SAML, authorization, tenant isolation, support access, and service identities. |
| [Application and API](preprod-security-audit/references/modules/application-api.md) | APP-001–020 | Input/output handling, injection, browser controls, APIs, SSRF, files, webhooks, business logic, concurrency, resource limits, errors, and caching. |
| [Data and secrets](preprod-security-audit/references/modules/data-secrets.md) | DATA-001–016 | Data lifecycle, database/storage access, secrets, cryptography, telemetry, exports, test data, and key management. |
| [Infrastructure and deployment](preprod-security-audit/references/modules/infrastructure-deployment.md) | INFRA-001–016 | Cloud IAM, network/edge/DNS, production settings, hosts, containers, Kubernetes, serverless, managed backends, IaC, and support access. |
| [Supply chain](preprod-security-audit/references/modules/supply-chain.md) | SC-001–015 | Repository controls, dependencies, advisories, installers, CI trust, runners, artifacts, registries, provenance, and deployment authority. |
| [Operations and resilience](preprod-security-audit/references/modules/operations-resilience.md) | OPS-001–015 | Logs, alerts, cost/availability controls, failures, backups, restoration, incidents, revocation, rollback, and ongoing vulnerability management. |
| [AI and agents](preprod-security-audit/references/modules/ai-agents.md) | AI-001–020 | Prompt injection, RAG, tools/MCP, delegated authority, approvals, output handling, exfiltration, memory, budgets, and shutdown. |
| [Mobile and desktop](preprod-security-audit/references/modules/mobile-desktop.md) | CLIENT-001–024 | Mobile, desktop, and extension storage, permissions, links, bridges, IPC, local services, release artifacts, and updates. |

Hosting branches cover static/CDN hosting, managed platforms, backend-as-a-service, serverless, VMs, containers, Kubernetes, and mixed deployments. Unsupported specialist surfaces, such as industrial equipment or custom hardware, require an explicit coverage limit and appropriate specialist review.

## Adaptive questionnaire

[The questionnaire](preprod-security-audit/references/scoping-questions.md) is a routing mechanism, not a mandatory form.

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
3. Scope, authorization, module selection, and performed checks.
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

They do not reproduce or claim complete conformance with those standards. The report records the editions, versions, advisories, and documentation actually consulted. Technical severity can use CWE and CVSS where appropriate; exploitation signals supplement local context rather than replacing it.

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
