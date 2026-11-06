---
name: preprod-security-audit
description: Assess an application's security readiness before production or a major release. Calibrate the review through adaptive questions, examine applicable code, identity, data, deployment, delivery, and operational controls, and produce an evidence-based Markdown report with remediation and analysis and dependency graphs. Use for requested security audits and release-readiness reviews, rather than automatically auditing ordinary feature work.
---

# Preproduction Security Audit

Produce a decision-useful security assessment of the specified release. Explain what was examined, what the evidence supports, what remains unknown, and how to remediate and verify each issue. Default to English for the report unless the user requests another language.

## Calibrate before selecting checks

1. Identify the repository, target release or commit, deployment target, available environments, and existing authorization. Preserve the user's scope and prior answers.
2. Inspect accessible project metadata and documentation without executing project code. Record discovered facts separately from inferences and user statements.
3. Read [scoping questions](references/scoping-questions.md). Ask only material unanswered questions, starting with a short batch; branch based on product, exposure, hosting, identity, data, and available access. Continue independent checks while waiting. Do not infer permission from silence.
4. Record a scope snapshot, selected modules, applicable control IDs, permitted checks, and unresolved questions in the report. Update this snapshot when answers change the scope.

## Route to relevant modules

Always use [audit method](references/audit-method.md) and [findings and priorities](references/findings-and-priorities.md). Load module details only when their surface is present or needs investigation. Do not load every module simply because it exists.

| Surface | Module | Routing guidance |
| --- | --- | --- |
| Every assessment | [Architecture](references/modules/architecture.md) | Establish assets, trust boundaries, critical actions, exposure, and responsibility. |
| Accounts, permissions, tenants, sessions, or service identities | [Identity and access](references/modules/identity-access.md) | Include infrastructure identities even if the product has no login. |
| Web interfaces, APIs, workers, files, or integrations | [Application and API](references/modules/application-api.md) | Select controls for actual input, output, protocol, and business paths. |
| Data, credentials, cryptography, databases, or storage | [Data and secrets](references/modules/data-secrets.md) | Include credentials and metadata even when personal data is absent. |
| A deployed service or planned deployment | [Infrastructure and deployment](references/modules/infrastructure-deployment.md) | Match the provider and deployment model; distinguish intended configuration from observed runtime. |
| Source, dependencies, build, or release process | [Supply chain](references/modules/supply-chain.md) | Check source-to-artifact provenance and direct/transitive dependencies within the available evidence. |
| A service entering or already in operation | [Operations and resilience](references/modules/operations-resilience.md) | Assess detection, recovery, incident handling, availability, and ownership. |
| LLMs, RAG, AI tools, agents, or MCP | [AI and agents](references/modules/ai-agents.md) | Review model inputs, data access, delegated authority, outputs, and resource limits. |
| Mobile, desktop, or browser-extension client | [Mobile and desktop](references/modules/mobile-desktop.md) | Select platform sections and audit the backend separately. |

For unsupported specialist surfaces, such as industrial equipment or custom hardware, document the coverage limit and required specialist review. Do not imply that the software modules fully assess them.

## Examine and record

- Follow the audit method's evidence, authorization, and execution rules. An audit request authorizes analysis and report creation; it does not automatically authorize production changes, destructive probes, or publishing sensitive results.
- Maintain an evidence ledger, control matrix, findings, unknowns, audit-path edges, and dependency edges while working. Tie all material claims to exact source locations or observations and the inspected version/environment.
- Treat scanner output as a lead until contextualized. Trace relevant callers, guards, data paths, configuration, and deployment assumptions before assigning a confirmed defect or release consequence.
- Use the same control ID in coverage, findings, remediation, and graphs. Deduplicate findings with the same underlying cause while preserving affected surfaces.
- For long reviews, delegate independent modules when supported. Give each reviewer the scope and ID allocation, then reconcile shared trust boundaries and conflicting claims before writing the report.
- If access or a tool is unavailable, record the limitation and continue useful work. A failed check is not a passed check. An unknown control is not non-applicable.

## Deliver the report

Use [the report template](assets/report-template.md). Default to a new file at `security-audits/<YYYY-MM-DD>-<revision-or-target>/security-audit.md` inside the audited project unless the user specifies another destination. Use a non-conflicting suffix if that destination already exists. Do not save target reports inside this skill, overwrite a prior assessment, or commit/upload reports unless requested.

Include both required Mermaid diagrams:

1. **Analysis path graph:** the observable audit trail from scope and artifacts through performed checks to findings, supported conclusions, and gaps. Show what was inspected and where a check stopped. This is an evidence map, not private reasoning or an invented chronology.
2. **Analyzed dependency graph:** the inspected components, package dependencies, services, identity systems, storage, and external integrations, with explicit edge types, evidence references, and inspection coverage. Include material uninspected boundaries as such.

Build graphs from the ledgers using the graph contract in the audit method. Include node/edge tables so the report remains usable without Mermaid rendering. Split large dependency maps by runtime/service relationships and package/build relationships; keep both under the dependency section.

The report must contain a prioritized correction plan, owners or unassigned roles, dependencies between fixes, acceptance tests, residual risks, and unresolved decisions. State a bounded readiness recommendation using the findings rules; the skill does not approve a deployment or certify compliance.

## Final quality check

- Verify scope, revision, evidence links, control statuses, and all finding/unknown IDs agree across text, tables, graphs, and plan.
- Check graph edge directions and labels. Mark declarations, observed behavior, inferences, and unavailable evidence distinctly. Remove all template example data.
- Ensure no credentials, personal data samples, sensitive prompt content, or private infrastructure identifiers are unnecessarily disclosed.
- Every finding needs a concrete correction and verification criterion. Every critical unknown needs a next action and its release-decision consequence.
- State which checks actually ran, which failed or were skipped, and whether diagrams were rendered or only syntax-reviewed. Never claim a test, render, or runtime verification that did not happen.
- Deliver the file location, major release blockers, and coverage limits concisely. Leave implementation of fixes to an authorized follow-up unless already included in the request.
