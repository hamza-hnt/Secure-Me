![Baroque gilded shield, lock and key representing software security](https://raw.githubusercontent.com/hamza-hnt/Secure-Me/main/docs/assets/security-baroque.png)

# Secure-Me

**Know what to fix before production—and how to verify the fix.**

Secure-Me is an agent skill for reviewing application security before a release. It adapts to your stack, hosting model, and available evidence, then delivers a Markdown report with traceable findings, two analysis graphs, and a prioritized correction plan.

Use it for a repository review, selected components or pipelines, supplied architecture evidence, or a broader release-readiness assessment. **Nine modules cover 35 security domains through 167 original controls.** Missing evidence stays visible throughout the review.

The [secure-me-skill npm package](https://www.npmjs.com/package/secure-me-skill) is a **zero-dependency installer and exporter** for Codex, Claude Code, and Claude Desktop. It distributes the same `preprod-security-audit` instructions; your agent conducts the assessment using its available tools. Scanners and connected services are optional and are not bundled. Documentation is in English; reports default to English and can use another requested language.

## Quick navigation

| Start here | Explore the review | Project information |
| --- | --- | --- |
| [Install](#install) | [How a review works](#how-a-review-works) | [Scope and limitations](#scope-and-limitations) |
| [Example usage](#example-usage) | [Audit coverage](#audit-coverage) | [Tests and releases](#tests-and-releases) |
| [Installation options](#installation-options) | [Focused checks](#focused-checks) | [Maintaining the skill](#maintaining-the-skill) |
| [Report output](#report-output) | [Optional tools](#optional-tools) | [Repository guide](#repository-guide) |

## Install

CLI commands require **Node.js 22 or newer** and npm. A ready-made Desktop ZIP can be downloaded without Node.js.

### Codex

```sh
npx secure-me-skill@latest install
```

The default remains `~/.agents/skills/preprod-security-audit`.

### Claude Code

```sh
npx secure-me-skill@latest install --agent claude-code
```

The personal target is `~/.claude/skills/preprod-security-audit`. Add `--project` to use `.claude/skills/preprod-security-audit` under the current project. Invoke it with `/preprod-security-audit`. See the [official Claude Code skill documentation](https://code.claude.com/docs/en/skills).

### Claude Desktop

Download the latest [Claude Desktop ZIP](https://github.com/hamza-hnt/Secure-Me/releases/latest/download/secure-me-claude-desktop.zip) and [SHA256SUMS](https://github.com/hamza-hnt/Secure-Me/releases/latest/download/SHA256SUMS), select a specific [GitHub release](https://github.com/hamza-hnt/Secure-Me/releases), or generate a ZIP locally:

```sh
npx secure-me-skill@latest export --output secure-me-claude-desktop.zip
```

Without `--output`, `export` uses that filename in the current directory. It creates a ZIP for manual import; it does not change Claude account settings. The ZIP contains the `preprod-security-audit/` folder with `SKILL.md`, `assets/`, and `references/`; it omits Codex's `agents/openai.yaml`. The shared audit content is unchanged by export.

In Claude Desktop, open **Customize > Skills**, use the add/upload option to import the ZIP, then enable the skill. Claude's custom Skills feature requires **code execution** to be enabled. Account, administrator, hosting, and product settings can affect availability. [Official custom skill instructions](https://support.claude.com/en/articles/12512198-how-to-create-custom-skills), checked November 7, 2026.

Installing files for Claude Code does not by itself enable a skill in Desktop Cowork: Cowork uses the account's enabled skills. Import the ZIP for that route. [Claude Code guidance on Cowork and cloud sessions](https://code.claude.com/docs/en/skills#use-skills-in-cowork-and-cloud-sessions), checked November 7, 2026.

## Example usage

| Host | Start the review |
| --- | --- |
| Codex | `Use $preprod-security-audit to review this repository before production.` |
| Claude Code | `/preprod-security-audit Review this repository before production.` |
| Claude Desktop | Enable the imported skill, then ask: `Use preprod-security-audit to review these supplied files before production.` |

Add the same release context and boundaries in any host:

```text
We are releasing a multi-tenant API on a managed platform, with PostgreSQL
and an external identity provider.
Review the source, configuration, dependencies, and CI/CD evidence available here.
Ask only unanswered questions that materially change the review.
Write a Markdown report with findings, coverage limits, both graphs,
and a prioritized correction and verification plan.
```

For a bounded review, state the limits directly—for example, “manual local inspection only; no network, scanners, or project execution.” The skill preserves that scope and records what cannot be verified.

Claude Code can review a repository made available to its session. In Desktop, provide files or use [Cowork with the chosen local folder access](https://support.claude.com/en/articles/13345190-get-started-with-claude-cowork). Enabling a skill alone grants no repository, cloud, shell, or scanner access. Available tools determine whether checks run or remain evidence gaps; a document-only review is still useful.

You can also use the [self-contained skill folder](https://github.com/hamza-hnt/Secure-Me/blob/main/preprod-security-audit/SKILL.md) without the installer:

```text
Read /path/to/secureme/preprod-security-audit/SKILL.md and use that skill
to assess /path/to/my-project. Review only the source available locally;
production configuration and active test access are unavailable.
Write the report to /path/to/my-project/security-audits/release-review.md.
```

## Installation options

```sh
# Install beneath the current project
npx secure-me-skill@latest install --project

# Install for Claude Code in the current project
npx secure-me-skill@latest install --agent claude-code --project

# Choose a skills parent directory
npx secure-me-skill@latest install --dest "./custom-skills"

# Preview an update, then replace a differing installation with a backup
npx secure-me-skill@latest install --force --dry-run
npx secure-me-skill@latest install --force

npx secure-me-skill@latest --help
```

| Option | Behavior |
| --- | --- |
| `--agent codex\|claude-code` | Selects the install target convention. `codex` is the default. |
| `--project` | Uses `.agents/skills` for Codex or `.claude/skills` for Claude Code beneath the current directory. |
| `--dest <directory>` | Selects the **parent** directory; the installer appends `preprod-security-audit`. Relative paths resolve from the current directory. Cannot be combined with `--project`. |
| `--dry-run` | Describes the result without writing installation files, locks, or backups. `npx` may still download/cache the installer itself. |
| `--force` | Replaces differing content after preserving the complete previous installation. Identical content stays unchanged. |

Without `--force`, differing existing files are preserved and installation stops with an explanation. Backups are stored **outside the skills parent** and their exact location is printed. For the default installation, the backup is under `~/.agents/.secureme-backup-preprod-security-audit-<random>/preprod-security-audit`, outside the skill discovery tree. Symbolic-link targets and unsupported file types are rejected.

Codex resolves home from `HOME`, then `USERPROFILE`, then the operating system. Claude Code uses `USERPROFILE` first on Windows and `HOME` first elsewhere. For a personal Claude Code install, an absolute `CLAUDE_CONFIG_DIR`, when set, selects `<CLAUDE_CONFIG_DIR>/skills`; `--project` and `--dest` override that choice. `CODEX_HOME` does not change the Codex default. To select a legacy Codex directory explicitly in a POSIX shell:

```sh
npx secure-me-skill@latest install --dest "${CODEX_HOME:-$HOME/.codex}/skills"
```

Replace `latest` with an exact published version to pin the installer, or use `next` for a published prerelease. You can also copy the entire skill folder into another supported directory, preserving its name and relative structure.

For ZIP export, `--output <zip>` selects the file and `--dry-run` previews without writing it. Export does not use install options such as `--agent`, `--project`, or `--force`; choose a new output filename if one already exists.

## How a review works

| Stage | What the agent does |
| --- | --- |
| Scope | Establishes the release, selected paths/evidence, environment, and permitted methods. |
| Calibrate | Reads available context and asks only material unanswered questions. |
| Inspect | Selects applicable controls and examines source, configuration, documentation, and authorized runtime evidence. |
| Assess | Separates confirmed findings, provisional leads, rejected matches, and unknowns. |
| Report | Produces the evidence-backed report, two graphs, and correction/verification plan. |
| Re-audit | Preserves finding IDs and distinguishes proposed, implemented, verified, and regressed fixes. |

### Adaptive questions

The [branching questionnaire](https://github.com/hamza-hnt/Secure-Me/blob/main/preprod-security-audit/references/scoping-questions.md) focuses on the release and critical actions, hosting, users/roles/tenants, sensitive data and integrations, and available access. Follow-ups activate only relevant branches: Kubernetes, managed hosting, multi-tenancy, AI agents, installed clients, and others.

Repository review is an explicit scope choice: **the repository**, **selected paths or pipelines**, or **supplied architecture/deployment evidence only**. An existing request to audit the code already answers that question; the skill does not ask again. If repository review is excluded or remains undecided, the agent continues only the independently agreed work.

Files/history, pipeline definitions/settings, and scanner/network permissions are recorded separately. A repository-only review can be useful while production, cloud, identity-provider, and operational controls remain unverified.

## Audit coverage

The [35-domain coverage map](https://github.com/hamza-hnt/Secure-Me/blob/main/preprod-security-audit/references/coverage-map.md) connects each domain to controls across **seven core modules and two conditional AI/client modules**. Each of the **167 controls** describes applicability, checks, evidence limits, correction, and retesting. Domains, module files, and automated checks are different units.

| Module | Controls | Main surfaces |
| --- | --- | --- |
| [Architecture](https://github.com/hamza-hnt/Secure-Me/blob/main/preprod-security-audit/references/modules/architecture.md) | ARCH-001–018 | Assets, exposure, trust boundaries, tenancy, abuse scenarios, responsibilities. |
| [Identity and access](https://github.com/hamza-hnt/Secure-Me/blob/main/preprod-security-audit/references/modules/identity-access.md) | IAM-001–016 | Authentication, MFA, recovery, sessions, federation, authorization, service identities. |
| [Application and API](https://github.com/hamza-hnt/Secure-Me/blob/main/preprod-security-audit/references/modules/application-api.md) | APP-001–020 | Injection, browser/API controls, SSRF, files, webhooks, business logic, concurrency. |
| [Data and secrets](https://github.com/hamza-hnt/Secure-Me/blob/main/preprod-security-audit/references/modules/data-secrets.md) | DATA-001–017 | Data lifecycle, storage, credentials, cryptography, telemetry, exports, secret fallbacks. |
| [Infrastructure and deployment](https://github.com/hamza-hnt/Secure-Me/blob/main/preprod-security-audit/references/modules/infrastructure-deployment.md) | INFRA-001–019 | Cloud IAM, networks, hosts, containers, Kubernetes, serverless, IaC, configuration. |
| [Supply chain](https://github.com/hamza-hnt/Secure-Me/blob/main/preprod-security-audit/references/modules/supply-chain.md) | SC-001–018 | Dependencies, repositories, CI/CD trust, runners, artifacts, gates, release identity. |
| [Operations and resilience](https://github.com/hamza-hnt/Secure-Me/blob/main/preprod-security-audit/references/modules/operations-resilience.md) | OPS-001–015 | Detection, availability, cost controls, backups, restoration, incidents, rollback. |
| [AI and agents](https://github.com/hamza-hnt/Secure-Me/blob/main/preprod-security-audit/references/modules/ai-agents.md) | AI-001–020 | Prompt injection, RAG, tools/MCP, permissions, approvals, exfiltration, budgets. |
| [Mobile and desktop](https://github.com/hamza-hnt/Secure-Me/blob/main/preprod-security-audit/references/modules/mobile-desktop.md) | CLIENT-001–024 | Local storage, permissions, links, IPC, browser extensions, updates, distribution. |

Hosting branches include static/CDN sites, managed platforms, backend-as-a-service, serverless, VMs, containers, Kubernetes, and mixed deployments.

## Focused checks

### Hardcoded secrets and security configuration

The review follows values from definition to use, with dedicated coverage for:

- **DATA-005 / DATA-017:** embedded or encoded credentials, unsafe fallbacks, scoped `.env` and Git history, build arguments, and public client bundles.
- **INFRA-017:** fixed endpoints, accounts, regions, storage resources, and build-time destinations.
- **INFRA-018:** fixed administrator/tenant identities, privilege shortcuts, origins, redirects, token trust, TLS/authentication toggles, and security limits.
- **INFRA-019:** configuration precedence, missing values, malformed settings, overrides, reload behavior, and unsafe defaults.

A constant needs a demonstrated security consequence to become a finding. Moving it into an environment variable does not fix authorization or revoke an exposed credential.

### CI/CD pipeline review

Included repository reviews follow discovered pipeline definitions and their in-scope actions, includes, templates, scripts, and downstream jobs. Narrower exclusions are preserved. Supported entry points include GitHub Actions, GitLab CI, Jenkins, Azure Pipelines, CircleCI, Bitbucket Pipelines, Buildkite, and Google Cloud Build.

The [supply-chain procedure](https://github.com/hamza-hnt/Secure-Me/blob/main/preprod-security-audit/references/modules/supply-chain.md#static-cicd-review-procedure) traces untrusted inputs into runner/identity privileges, secrets and OIDC, caches/artifacts, release gates, and deployment targets. A per-job risk table and graph retain inaccessible definitions and effective platform settings as gaps. Reviewing a pipeline does not trigger it; reading YAML does not verify its actual permissions or execution.

### Dependency inventory and SBOMs

The [inventory procedure](https://github.com/hamza-hnt/Secure-Me/blob/main/preprod-security-audit/references/tooling.md#dependency-inventory-and-sboms) starts with an existing **SBOM** (Software Bill of Materials), checking its provenance, coverage, and match to the target revision or artifact. If a usable inventory is missing and generation is permitted, it uses available trusted **Trivy** to produce CycloneDX JSON. Inventory generation is separate from vulnerability scanning.

Native package-manager graphs can fill specific relationship gaps. **Syft** is an optional cataloger; **dependency-cruiser** is optional for JS/TS source imports. None is installed automatically.

Manifests, resolved lockfiles, installed trees, and release artifacts establish different facts. A flat package list does not establish dependency edges or runtime reachability. Comparisons record input/tool/configuration/platform identity and normalize volatile metadata; unresolved relationships stay unknown. Full inventories remain private, while report nodes start as `metadata-only` until deeper inspection supports more.

### Known vulnerabilities and advisory triage

[SC-003](https://github.com/hamza-hnt/Secure-Me/blob/main/preprod-security-audit/references/modules/supply-chain.md#lightweight-current-advisory-triage) examines a disclosed subset of security-critical components using maintainer/vendor advisories, OSV, and GitHub Advisory Database records. Identity/crypto, exposed parsers, data access, privileged build tools, and relevant transitive dependencies receive priority.

The review checks ecosystem, package, version, affected ranges, aliases, fixes, and local preconditions. Published severity, a public proof of concept, known exploitation such as a CISA KEV match, and local reachability remain separate signals. Critical/high and known-exploited issues receive priority, with lower-severity issues retained when local impact warrants it.

Lookup dates, queried coverage, stale caches, and failed/offline checks are disclosed. Current searches require permitted network access. Manual reviews can use supplied evidence; no private SBOM upload or dependency change is implied. The skill keeps no static CVE list.

## Optional tools

The [tooling reference](https://github.com/hamza-hnt/Secure-Me/blob/main/preprod-security-audit/references/tooling.md) provides execution recipes, prerequisites, configuration handling, result interpretation, and evidence rules.

| Tool | Use | Scope boundary |
| --- | --- | --- |
| Gitleaks | Current-file and selected-history secret checks | Explicit history scope, controlled configuration, redacted output. |
| Semgrep CE | Source analysis with reviewed local rules | Unsupported paths, suppressions, parse failures, and timeouts remain visible. |
| Trivy | SBOM generation; separate filesystem/image vulnerability and IaC checks | Target-bound inventory, reviewed configuration, explicit data freshness. |
| ZAP passive plan | Crawl and passively inspect HTTP responses | Requires an agreed live-test scope; requests can have effects. |
| ZAP active plan | Selected active application tests | Separately authorized targets, limits, and stop conditions. |

The agent uses trusted tools available within scope. The installer never runs them. Provenance and applicable upstream advisories are checked before an unverified tool distribution is executed. Missing tools, rules, caches, or access lead to an explicit gap and useful fallback.

Raw scanner output stays private. Only relevant redacted evidence enters the report; a tool hit is contextualized before becoming a confirmed finding. Proposed commands are never counted as completed checks.

## Report output

The [Markdown template](https://github.com/hamza-hnt/Secure-Me/blob/main/preprod-security-audit/assets/report-template.md) brings together:

- The bounded readiness recommendation, calibrated scope, selected controls, and actual checks.
- Findings and unknowns linked to exact evidence, with confidence, impact, and release consequences.
- Component inventories, advisory results, and per-job pipeline records where applicable.
- A prioritized correction plan with proposed/assigned owners, effort, prerequisites, acceptance tests, residual risk, and pending decisions.
- Evidence references and changes since an earlier assessment.

By default, reports are created at:

```text
security-audits/<YYYY-MM-DD>-<revision-or-target>/security-audit.md
```

You can select another destination. Existing reports are preserved; reports are not placed inside the skill, committed, uploaded, or shared automatically.

### Two graphs, with readable registers

| Graph | What it shows |
| --- | --- |
| **Analysis path** | Scope → inspected artifacts → performed checks → supported conclusions, findings, and gaps. It records observable work, including where verification stopped. |
| **Analyzed dependencies** | Actual package, service, identity, storage, build, deployment, and integration relationships encountered during the review, with evidence and inspection depth. |

Both use Mermaid plus adjacent node/edge tables, so the report remains readable without rendering. Supported and inferred/unverified edges are distinguished. Large maps can be split by runtime, package/build, or pipeline relationships. An external component's presence never implies that its implementation was audited.

### Evidence, remediation, and readiness

Stable IDs connect **evidence** (`E-###`), **controls** (such as `IAM-012`), **findings** (`F-###`), **unknowns** (`U-###`), and **correction tasks** (`R-###`). Proposed fixes stay open until implementation and verification on the relevant target.

Controls use `satisfied`, `finding`, `needs-validation`, `not-verified`, or `not-applicable`. Missing access never counts as a pass or proof of non-applicability.

Recommendations are `BLOCKED`, `INSUFFICIENT EVIDENCE`, `READY WITH CONDITIONS`, or `NO BLOCKER FOUND IN REVIEWED SCOPE`. Known blockers take precedence, followed by critical evidence gaps. See the [audit method](https://github.com/hamza-hnt/Secure-Me/blob/main/preprod-security-audit/references/audit-method.md) and [prioritization rules](https://github.com/hamza-hnt/Secure-Me/blob/main/preprod-security-audit/references/findings-and-priorities.md) for the full contract.

## Scope and limitations

- **Evidence stays bounded.** Source declarations, documented processes, user statements, runtime observations, and inferences are distinct. A source-only review cannot establish effective production controls.
- **Authorization stays explicit.** A repository audit does not imply production changes, destructive probes, third-party tests, deployment, or publication. Manual/offline restrictions are preserved.
- **Untrusted material stays data.** Repository text and tool output cannot redirect the audit or authorize unrelated actions.
- **Sensitive data stays protected.** Reports redact credentials and personal data. Discovered credentials are not tried against external services to determine whether they work.
- **Specialist gaps stay visible.** Unsupported surfaces, such as industrial equipment or custom hardware, require explicit limits and suitable specialist review.

The controls link to primary references including OWASP ASVS, WSTG, API Security, MASVS and GenAI guidance; NIST identity guidance and SSDF; CIS; SLSA; and platform documentation. They are original practical controls, not copied standards or a claim of complete conformance. Reports identify the references actually used and may apply CWE/CVSS where appropriate.

A readiness recommendation applies only to the reviewed target and evidence. It is not deployment approval, a security guarantee, or certification.

## Tests and releases

Routine CI and release validation use the same checks with different matrix sizes:

| GitHub-hosted runner | Push / pull request | Release |
| --- | --- | --- |
| `ubuntu-latest` | Node 22, 24, 26 | Node 22, 24, 26 |
| `macos-latest` | Node 24 | Node 22, 24, 26 |
| `windows-latest` | Node 24 | Node 22, 24, 26 |
| **Total** | **5 jobs** | **9 jobs** |

Each job runs `npm ci --ignore-scripts`, `npm test`, `npm run test:package`, and `npm run validate`. Package tests check archive contents/metadata, isolated installation, the actual npm executable shim, and installer behavior against the installed package. The tested bytes are saved as `.artifacts/package.tgz`.

The automated checks also cover Claude Code installation paths and Desktop ZIP export from the packed npm package. They verify installation and archive behavior; host-level observations are recorded separately below.

A published GitHub release must use exactly `v<package.version>`, resolve to the release event's commit, and belong to `origin/main`. All **nine release jobs** test that exact commit before the `npm` environment can publish the preserved Linux/Node 24 archive. Digest verification, npm OIDC trusted publishing, and provenance bind the release process to those tested bytes.

Stable releases use `latest`; prereleases use `next`. Existing versions are rejected instead of silently republished or retagged. No stored npm token is used. The [publishing guide](https://github.com/hamza-hnt/Secure-Me/blob/main/docs/publishing.md) covers setup, first-package bootstrap, and failures.

After npm publication, a separate release-assets job verifies the tested Desktop ZIP and attaches `secure-me-claude-desktop.zip` with `SHA256SUMS` to the GitHub release. The release record binds both the npm archive and Desktop ZIP to the same source version.

### Claude host validation — November 7, 2026

| Host | Observed result | Verification limit |
| --- | --- | --- |
| Claude Desktop native app | ZIP imported and enabled with all 16 files. A manual review of a synthetic two-file Node.js fixture produced a Markdown report with evidence, findings, a prioritized correction plan, and both Mermaid graphs. It identified the shell-injection path and secret fallback, and retained missing runtime/dependency evidence as unknowns. | Bounded smoke test only; no project execution, scanners, or advisory lookup. The report disclosed a failed local Mermaid render instead of claiming renderer validation. |
| Claude Code 2.1.273 | The project-installed `preprod-security-audit` appeared in the session's `init.skills` discovery list. | An audit attempt was blocked by an expired OAuth session that could not refresh; audit execution was not verified. |

## Maintaining the skill

Run the local checks before submitting a change:

```sh
npm ci --ignore-scripts
npm test
npm run test:package
npm run validate
```

Keep the entrypoint short and detailed checks in their modules. Preserve control IDs when the underlying control is unchanged. Validate metadata, links, IDs, and consistency between evidence, statuses, graphs, and report fields.

For material behavior changes, try an isolated audit fixture, including unavailable-evidence and authorization cases. Parse or locally render modified Mermaid examples. Keep real audit artifacts and sensitive data out of the repository.

Commit subjects use `type(scope) : description`, for example `fix(report) : distinguish inferred dependency edges`.

## Repository guide

| Path | Purpose |
| --- | --- |
| [preprod-security-audit/SKILL.md](https://github.com/hamza-hnt/Secure-Me/blob/main/preprod-security-audit/SKILL.md) | Agent entrypoint and routing instructions. |
| [references/](https://github.com/hamza-hnt/Secure-Me/tree/main/preprod-security-audit/references) | Questionnaire, audit method, controls, coverage map, priorities, and tooling procedures. |
| [assets/report-template.md](https://github.com/hamza-hnt/Secure-Me/blob/main/preprod-security-audit/assets/report-template.md) | Report structure and graph contracts. |
| [bin/](https://github.com/hamza-hnt/Secure-Me/tree/main/bin) and [lib/](https://github.com/hamza-hnt/Secure-Me/tree/main/lib) | Zero-dependency installer and Desktop ZIP exporter. |
| [scripts/](https://github.com/hamza-hnt/Secure-Me/tree/main/scripts), [test/](https://github.com/hamza-hnt/Secure-Me/tree/main/test), [.github/workflows/](https://github.com/hamza-hnt/Secure-Me/tree/main/.github/workflows) | Validation, packaging, tests, and release automation. |

The lightweight npm package contains the CLI, exporter, complete skill, README, and package metadata. Artwork, development tests, workflows, and publishing docs stay outside the archive. The Desktop ZIP includes only the portable skill folder. README file links use absolute GitHub URLs so they also work on npm.

The baroque banner's [exact prompt and generation method](https://github.com/hamza-hnt/Secure-Me/blob/main/docs/assets/security-baroque-prompt.txt) are recorded in the repository.
