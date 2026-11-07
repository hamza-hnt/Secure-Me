# Software supply chain and delivery

Use this module for source repositories, dependencies, build services, registries, release artifacts, and deployment pipelines. It applies even when hosting is fully managed. Read [audit method](../audit-method.md) and [finding rules](../findings-and-priorities.md) for shared evidence and classification rules.

## Establish the release path

Trace `source revision → dependency resolution → build identity → artifact → registry/distribution → deployment identity → running release`. Mark every missing link. Inspect manifests, lockfiles, build definitions, workflow configuration, and available artifact/deployment records before suggesting additional tools.

Treat repository scripts, installer hooks, third-party actions, build plugins, and downloaded executables as code with side effects. Do not run them merely to obtain an inventory. Prefer existing lockfiles, SBOMs, read-only metadata, and available trusted scanners; assess execution/network effects before any authorized command.

Distinguish these inventories:

| Inventory | What it establishes | What it does not establish |
|---|---|---|
| Manifest | Declared dependencies and version constraints | Exact resolution, bundled contents, or production deployment |
| Lockfile | Recorded resolution for an ecosystem/configuration | That CI used it, platform-specific resolution, or runtime reachability |
| Build/image SBOM | Components reported for a particular artifact | Completeness, exploitable use, or a verified running digest |
| Runtime/artifact evidence | Components or artifact observed at a target | Reachability of every vulnerable function or environment |
| Source-level call trace | A plausible or demonstrated execution path | Runtime conditions not examined |

## Lightweight current advisory triage

Use SC-003 for a focused current-advisory check after establishing the dependency inventory; a prior scanner alert is not required. Preserve offline/manual/network restrictions. Query only permitted public package identity/version metadata: do not upload source, secrets, private package identifiers, or the complete SBOM to a third-party service as an incidental step. Do not execute proof-of-concept code, install/update dependencies, or mutate lockfiles during triage.

1. **Select and disclose the subset.** Prioritize identity/cryptography, exposed request/file parsers, data-access components, privileged build/deploy tooling, and relevant transitive dependencies. Start with known-exploited issues and critical/high advisories; retain lower-severity issues when local authority, exposure, chaining, or business impact makes them material. Record selection rationale and the queried versus unqueried inventory; this is not an exhaustive vulnerability assessment.
2. **Resolve identity before matching.** Record ecosystem, canonical package name, exact resolved version or commit, registry/vendor/distribution source, dependency path, and runtime/build role. Follow package aliases to their actual package identity. For compromised releases or mutable tags, match the advisory's distribution channel, artifact digest, and acquisition/execution window when relevant; the version string alone does not identify the delivered bytes. A declared range, similar name, different registry, or unrelated fork does not establish an affected installed component; keep unresolved identity/version explicit.
3. **Use dated authoritative records.** Consult the maintainer/vendor advisory or security release notes, with OSV and GitHub Advisory Database records for ecosystem/package mapping and discovery. Query the exact identity/version and inspect the returned affected records; search-result snippets alone are insufficient. Follow pagination for the selected query or disclose partial results. Record queried source, retrieval date, advisory publication/modification dates, and reviewed/unreviewed status where provided.
4. **Reconcile applicability.** Verify affected ranges and branch-specific fixed versions using the ecosystem's version semantics, including prereleases, epochs/revisions, distribution packages, and vendor backports where material. An older upstream version can contain a vendor fix; obtain vendor/package-build evidence rather than assuming either vulnerability or remediation. Check withdrawn/rejected records and conflicting ranges. Deduplicate verified CVE/GHSA/OSV aliases while preserving affected-package occurrences; an upstream/bundled advisory relationship is not automatically an alias.
5. **Check exploitation evidence separately.** For a matched CVE, consult the current CISA KEV catalog or its official mirror and relevant vendor notices when permitted. Record catalog/source date and the actual match. A public PoC demonstrates availability of an example, not known exploitation in the wild or exploitability of this deployment. A missing KEV entry or missing PoC is not evidence of safety; an inaccessible catalog is `unknown`, not a negative match.
6. **Trace local preconditions.** Connect the affected feature to inspected imports/callers, configuration, privileges, attacker-controlled input, and the target artifact when available. Keep presence, feature reachability, and demonstrated exploitation distinct. A development dependency may affect a privileged build. A missing observed call path leaves reachability unresolved unless adequate analysis supports non-applicability.
7. **Verify the correction before recommending a version.** Cite the vendor/advisory's fixed release for the actual affected branch/package, or its documented mitigation and conditions. If no fix or mitigation is verified, say so; do not invent a next version or assume “latest” is compatible or fixes every issue. Record required compatibility/behavior checks and residual risk; implementation and post-change verification are separate work.

Keep these prioritization signals separate in the result:

| Signal | Record and interpretation |
| --- | --- |
| Component criticality | The component's actual role, authority, data access, exposure, and failure impact; this is not an advisory severity label. |
| Advisory severity | Published severity and, when used, scoring source/version/vector; preserve differences between sources rather than manufacturing a score. |
| Exploitation evidence | Dated KEV/vendor confirmation, sourced public-PoC availability, or unknown; do not conflate the categories. |
| Local reachability | Confirmed affected use, conditional use, adequately evidenced non-applicability, or unknown, with configuration/artifact limits. |
| Local priority | A justified P0–P3 and release consequence based on the preceding signals and the project's requirements, not the CVSS number alone. |

Add a compact advisory-result table to the report with component/ecosystem/source/version, dependency role, advisory IDs/aliases, affected-range match, severity, exploitation evidence/date, reachability/preconditions, verified fixed version or mitigation, primary links/retrieval date, and `E-###`/`F-###`/`U-###`. Reuse existing finding rows for duplicate root causes. Record a bounded “no matching advisory found in the queried sources as of this date” result only after a successful applicable query; never equate it with a secure component.

Disclose unqueried dependencies, unsupported ecosystems, unavailable/failed/rate-limited sources, incomplete pages, conflicting records, cached-data dates, and offline limitations. If network lookup is disallowed, use already available evidence with its age or record `not-verified` and a concrete follow-up; do not fabricate a current check. Recheck material advisories when the release version, artifact, or source data changes. Keep no evergreen list of specific CVEs in this skill.

## Static CI/CD review procedure

A pipeline review starts with reading definitions and their called code. It does not authorize triggering, approving, retrying, rerunning, cancelling, or deploying a pipeline; installing its dependencies; generating dynamic configuration by executing project code; or changing CI settings. Preserve any explicit authorization already supplied. Read remote definitions, settings, and existing run evidence only when access and network use are in scope; otherwise record the missing boundary as `U-###`.

1. **Discover entry points.** Inspect tracked files and accessible provider configuration for the locations below, custom pipeline paths, disabled/legacy workflows, and pipelines that publish or deploy without the main CI path. Record an absent definition separately from a provider whose settings are unavailable.
2. **Follow execution definitions.** Read local/reusable actions, nested includes, shared libraries, templates, generators, scripts, package commands, Dockerfiles, and referenced build/deploy tools. Resolve the definition revision separately from the checked-out application revision. Record remote or generated definitions not inspected; do not invent their contents or execute a generator to fill the gap.
3. **Reconstruct trust and authority per job.** Map event/caller and attacker-controlled inputs to checkout ref, conditions, matrix values, runner, job token, secrets, OIDC identity, scripts, caches/artifacts, and destinations. Inspect source-to-shell interpolation and indirect execution through repository scripts, plugins, and package hooks. A manual input, branch name, PR title, artifact, or generated matrix is not trusted merely because the platform delivers it.
4. **Trace verification and release consumption.** Follow test/scan results into required checks, then follow the exact source and artifact digest into publication, promotion, configuration changes, migrations, and deployment. Inspect failure, skip, cancellation, rerun, rollback, and bypass branches. Establish which project/provider settings enforce the gate and who may change them.
5. **Review proportionately and record gaps.** Prioritize production-capable jobs, signing/publication jobs, untrusted-to-privileged transitions, and jobs implementing release gates. Group equivalent matrix instances only when their trust, authority, and effects match. Record inspected jobs/definitions, selected variants, and omitted or inaccessible paths; do not extrapolate one safe job to the whole pipeline.

| Provider / entry point candidates | Follow beyond the entry file |
| --- | --- |
| GitHub Actions: `.github/workflows/*.yml`, `*.yaml` | `workflow_call`, local `uses` paths and `action.yml`/`action.yaml`, composite/Docker actions, remote reusable workflows, privileged follow-up workflows, called scripts, repository/environment settings. |
| GitLab CI: `.gitlab-ci.yml`, custom CI config path | Local/project/remote/component/template includes, `extends`, nested include ordering, child/downstream pipelines, generated YAML, `workflow`/job rules, protected variables/runners, project settings. |
| Jenkins: `Jenkinsfile`, custom multibranch paths | Shared libraries and their revisions, loaded Groovy, shell/batch scripts, job/controller definitions, credentials bindings, agent selection, and plugin-dependent behavior. |
| Azure Pipelines: `azure-pipelines.yml`, `*.yaml`, configured entry path | Templates, repository resources, stages/jobs, variable groups, service connections, agent pools, and resource-level approvals/checks. |
| CircleCI: `.circleci/config.yml` | Orbs, reusable commands/executors, contexts, filters, setup workflows, continuation configurations, generated configuration, and project settings. |
| Bitbucket Pipelines: `bitbucket-pipelines.yml` | Definitions, imports where used, pipes, scripts, manual/custom and branch/tag/PR paths, deployment environments, repository/workspace variables, and runners. |
| Buildkite: `.buildkite/pipeline.yml`, configured YAML/script path | Uploaded/generated steps, plugins and hooks, triggered pipelines, block/input steps, agent queues, and pipeline/team settings. |
| Google Cloud Build: `cloudbuild.yaml`, `cloudbuild.yml`, `cloudbuild.json`, configured path | Trigger definitions, substitutions/payload bindings, builder images, step scripts, service accounts, private pools, approval settings, artifacts, and deployment commands. |

Interpret each provider's actual version and settings using its primary documentation. In GitHub Actions, distinguish `pull_request`, `pull_request_target`, `workflow_run`, and dispatch/call paths, then inspect the code/ref executed and effective permissions; event names alone do not prove a defect. In GitLab, a fork merge-request pipeline run in the parent project can combine fork-defined code with parent resources, so inspect its actual context. Azure resource checks are configured outside pipeline YAML. CircleCI continuation and Buildkite uploads can add executable steps beyond the entry file. For trigger-invoked Cloud Build, inspect the trigger's service account: its selection overrides a service account in the build configuration. Treat these as routing facts, not evidence that any particular target is misconfigured.

### Per-job risk and evidence record

Include a per-job table in the report when pipelines are in scope. One row may represent equivalent jobs only with an explicit grouping rationale; preserve distinct privilege boundaries. For each row capture:

| Field | Required content |
| --- | --- |
| Pipeline / job / revision | Definition path and lines, job/stage ID, included definition revision, and selected matrix variant. |
| Trigger and executed source | Event/caller, fork/branch/tag/ref, conditions, input origins, checkout repository and resolved revision when known. |
| Runner and authority | Runner/agent trust and persistence, effective token permissions, secret access categories, OIDC/service identity, and unknown external policy; never credential values. |
| Inputs and outputs | Scripts/actions, cache/artifact producers and consumers, integrity/provenance checks, package/image selectors, and trust transitions. |
| Gate and target | Required validations and result handling, approvals/bypasses, artifact digest binding, target environment/account, configuration and migration effects. |
| Result and risk | Applicable `SC-###` controls, per-surface control status, confirmed `F-###` or unresolved `U-###`, and concise preconditions/impact. A suspicious keyword is not a confirmed exploit. |
| Evidence and coverage | `E-###`, source/configuration/run basis, actual inspection depth, executed checks if any, and inaccessible definitions/settings. |

Keep declared job behavior separate from observed runs and effective service-side policy. Reuse the report's evidence/control registers rather than copying logs or assigning a security score to every job. If no pipeline evidence is available, explain the discovery scope and release-path gap; do not invent an empty or safe pipeline.

## Control catalog

### SC-001 — Repository ownership and protected changes
- **Applies:** Source or configuration repositories influencing the release.
- **Check:** Review effective write/admin membership, branch/ruleset protection, required reviews/checks, bypass permissions, and ownership of sensitive workflow and deployment files.
- **Evidence / limits:** Repository settings and access evidence; a CONTRIBUTING file or CODEOWNERS file alone does not establish enforced review.
- **Correction / retest:** Protect release-relevant changes and limit bypass; verify the effective rules cover the actual release branch and sensitive paths.

### SC-002 — Dependency inventory and graph boundaries
- **Applies:** Third-party libraries, tools, base images, system packages, or vendored code.
- **Check:** Inventory direct and transitive dependencies from the available resolution/artifact sources. Distinguish runtime, build, development, optional, platform-specific, and vendored dependencies; record which subsets were examined.
- **Evidence / limits:** Exact package name, ecosystem, resolved version/digest, source, dependency path, and evidence ID. Do not invent transitive edges when only a manifest is available.
- **Correction / retest:** Reconcile inconsistent manifests, lockfiles, and artifact inventories; regenerate inventory through a reviewed build when authorized and confirm the resulting release contents.

### SC-003 — Vulnerability context and reachability
- **Applies:** Inventoried third-party components selected for current-advisory triage, matched advisories, or suspicious vulnerable use.
- **Check:** Follow the lightweight advisory procedure above: match exact ecosystem/package/source/resolved version, reconcile affected ranges and fixes, check dated exploitation evidence, and trace local configuration/reachability. Prioritize critical components and known-exploited or critical/high issues without discarding contextual lower-severity risk; record the queried subset and unavailable sources.
- **Evidence / limits:** An advisory or scanner hit supports a candidate, not automatic exploitability. A development dependency may still compromise CI; lack of a demonstrated call path is not proof of safety.
- **Correction / retest:** Upgrade, replace, remove, or mitigate the affected component; confirm the fixed resolved/artifact version and relevant behavioral tests. Keep unresolved preconditions as `needs-validation` or `not-verified` as appropriate.

### SC-004 — Unsupported components and update ownership
- **Applies:** Frameworks, runtimes, libraries, base images, and build tools.
- **Check:** Verify support status against the vendor's edition/version policy, maintenance activity relevant to the component, update ownership, and handling of urgent security fixes.
- **Evidence / limits:** Vendor support statements and actual deployed versions; age alone does not establish an exploitable vulnerability.
- **Correction / retest:** Move unsupported critical components to a maintained path or document a bounded mitigation; validate compatibility and the resulting version before closure.

### SC-005 — Resolution integrity and package sources
- **Applies:** Package managers, registries, source dependencies, and downloadable tools.
- **Check:** Review frozen/reproducible resolution, integrity checks, registry configuration, private package namespaces, fallback to public registries, mutable tags/branches, and unreviewed remote scripts.
- **Evidence / limits:** Lockfiles and the actual build install commands/configuration; a lockfile that CI ignores does not constrain the build. An integrity hash proves content matching, not publisher trust.
- **Correction / retest:** Constrain trusted sources and resolution, protect registry credentials, and verify a reviewed build resolves expected content without unauthorized fallbacks.

### SC-006 — Installation and build execution
- **Applies:** Lifecycle hooks, plugins, generators, native extensions, or remote build steps.
- **Check:** Identify code that executes during install/build, its origin, available credentials, network access, and write access to source or artifacts. Include developer tooling that runs in a privileged release context.
- **Evidence / limits:** Static definitions and trusted metadata; do not trigger install scripts to discover what they do in an unrestricted environment.
- **Correction / retest:** Remove unnecessary hooks, isolate necessary execution, and limit credentials and network access; inspect a bounded authorized build and its resulting outputs.

### SC-007 — Untrusted contributions and workflow injection
- **Applies:** CI triggered by pull requests, external contributions, issue content, manual inputs, or repository events.
- **Check:** Trace event payloads, PR titles/bodies, branch names, manual inputs, matrix values, and job outputs into shell/Groovy/PowerShell commands, checkout refs, paths, and action inputs. Inspect interpolation before execution, indirect calls into checked-out scripts/package hooks, fork PRs run with parent authority, and privileged follow-up jobs consuming untrusted artifacts.
- **Evidence / limits:** Event semantics, workflow permissions, code checkout, and data flow; event names alone are insufficient to prove safe or unsafe execution.
- **Correction / retest:** Separate untrusted builds from privileged stages and pass data without shell interpretation; validate representative untrusted inputs in an isolated test workflow, not a production deploy job.

### SC-008 — CI credentials and workload federation
- **Applies:** Pipeline secrets, tokens, signing keys, or federated cloud access.
- **Check:** Compare workflow/default and per-job token permissions, inherited secrets, checkout-persisted credentials, variable groups/contexts, service connections, and production signing/deploy rights. For OIDC, inspect issuer, audience, subject and applicable repository/ref/environment/workflow claims on the receiving trust policy, plus the resulting role permissions. Check fork, reusable-workflow, manual, and rerun contexts separately.
- **Evidence / limits:** Workflow definitions plus effective provider trust policy; declaring an environment or short-lived token does not establish narrow authority.
- **Correction / retest:** Limit rights and trust to intended jobs and environments; validate intended issuance and denied untrusted branch/repository contexts without exposing tokens.

### SC-009 — Runner isolation and persistence
- **Applies:** Hosted or self-hosted build runners and build workers.
- **Check:** Inspect runner/agent selection controlled by inputs or matrices, reuse across trust levels, cleanup, host privileges, mounted Docker/runtime sockets, shared workspaces/volumes, network reachability, and access to other jobs' credentials or artifacts. Include job/service containers and persistent agent hooks.
- **Evidence / limits:** Runner configuration and lifecycle evidence; an ephemeral job container may still share a privileged host or persistent cache.
- **Correction / retest:** Isolate untrusted work, remove unnecessary host access, and ensure safe cleanup; verify a subsequent job cannot read prior sensitive state using non-sensitive test markers.

### SC-010 — Third-party actions and reusable workflows
- **Applies:** External actions, reusable workflows, build plugins, or templates.
- **Check:** Review immutable source selection where supported, resolved action/workflow/template revision, publisher trust, granted permissions, inherited secrets, nested definitions, builder images, update review, and executable entry points. Inspect local action metadata and scripts as code; a pinned outer action may still download mutable dependencies or execute caller-controlled content.
- **Evidence / limits:** Resolved revision plus relevant code/metadata; pinning an action does not establish that its dependencies or behavior are safe.
- **Correction / retest:** Pin and review critical execution dependencies, narrow permissions, and verify the updated workflow still performs the intended bounded task.

### SC-011 — Cache and artifact trust boundaries
- **Applies:** Shared caches, intermediate artifacts, downloads, or multi-stage pipelines.
- **Check:** Follow cache writers/readers, restore prefixes and key collisions, artifact-producing repository/ref/run, names versus digests, download/extraction handling, retention, and trust transitions from untrusted builds into privileged jobs. Examine stale, cross-branch, fork-produced, and substituted inputs where the provider permits those paths.
- **Evidence / limits:** Cache/artifact scope and consuming workflow logic; a filename or successful download is not proof of origin.
- **Correction / retest:** Separate trust domains and verify origin/content before privileged use; demonstrate that an untrusted producer cannot replace trusted inputs.

### SC-012 — Provenance, signatures, and artifact identity
- **Applies:** Release artifacts, images, packages, or distributed clients.
- **Check:** Bind artifacts to source revision and build identity; inspect provenance/signature generation and, separately, verification before deployment. Check trusted signer identity, digest, and attestation scope.
- **Evidence / limits:** Artifact digest, attestations, trust policy, and enforcement evidence. An available signature is not verified enforcement; do not assert a SLSA level without evidence for its requirements.
- **Correction / retest:** Preserve provenance and verify trusted artifact identity at consumption; show a mismatched or unauthorized artifact is rejected in a safe validation environment.

### SC-013 — Registry, publication, and promotion
- **Applies:** Package/image registries, object stores, app distribution, or release hosting.
- **Check:** Review publisher membership, token scope, overwrite/delete rights, mutable tags, promotion between environments, and registry retention affecting rollback or investigation.
- **Evidence / limits:** Effective registry policy and deployment selectors; a tested tag can later point at different content.
- **Correction / retest:** Restrict publication and promotion, preserve release identity, and verify the production selector resolves to the reviewed digest/artifact.

### SC-014 — Deployment authority and release gates
- **Applies:** Automated or manual release processes.
- **Check:** Identify who can deploy, modify environment branch/tag restrictions, approve their own changes, alter required checks or reviewers, change protected variables/service connections, select artifacts, or bypass gates. Inspect effective provider settings as well as YAML, and trace required validations to the released revision. Use SC-017 for gate result logic and SC-018 for target/state binding.
- **Evidence / limits:** Pipeline runs, effective environment controls, deployment record, and exceptions; a green check on another commit does not validate this release.
- **Correction / retest:** Bind gates to the release artifact and control bypass, then demonstrate a failed requirement blocks the relevant promotion path under the agreed policy.

### SC-015 — Secret and sensitive-content leakage in delivery
- **Applies:** Source history, build contexts, logs, artifacts, images, or package publication.
- **Check:** Inspect inclusion rules, layer/history behavior, generated bundles, logs, source maps, and archive contents for unintended secrets or sensitive files. Never reproduce a discovered secret in the report.
- **Evidence / limits:** Redacted locations, safe identifiers, affected artifact/version, and exposure boundaries. Deleting a source file does not remove previous commits or image layers.
- **Correction / retest:** Revoke exposed credentials where warranted, correct inclusion/build handling, and confirm newly built artifacts are clean; preserve investigation evidence through the appropriate owner.

### SC-016 — Pipeline inventory and transitive definition coverage
- **Applies:** Any CI/CD definition, externally configured pipeline, reusable job, or dynamic configuration contributes to the release.
- **Check:** Reconcile discovered entry files with the release path; follow nested/local/remote includes, shared actions/libraries, generated steps, scripts, and downstream jobs. Record definition origins, revisions, overriding rules, conditional inclusion, and source checkout independently. Identify release-capable paths not using the expected pipeline.
- **Evidence / limits:** File/line inventory, resolved definition references, supplied expanded configuration, and effective pipeline settings when available. A missing conventional filename does not prove no CI exists; reading a generator does not prove its generated job set.
- **Correction / retest:** Make the release-relevant definition graph inspectable and owned; resolve missing dependencies or record their risk. Confirm each privileged/publication/deployment path maps to reviewed definitions and explicitly record unavailable generated/remote content.

### SC-017 — Verification gate integrity
- **Applies:** Tests, scanners, policy checks, attestations, or manual decisions are intended to block merge, publication, or deployment.
- **Check:** Trace check dependencies and conclusions through conditions, path filters, matrix exclusions, optional jobs, skipped/cancelled runs, `continue-on-error`/`allow_failure` equivalents, shell exit masking, stale results, and result aggregation. Check that scans cover the intended target and fail as required; required-check names alone do not prove the intended revision/artifact was examined or that a failed/absent scan blocks release.
- **Evidence / limits:** Job logic, exact command/exit handling, required-check policy, existing run outcomes, and artifact/revision linkage. An intentionally advisory scan is not automatically a defect; compare behavior with the stated release policy and distinguish deliberate non-blocking checks from accidental bypass.
- **Correction / retest:** Make required results unambiguous and bind them to the selected release; reject missing or failed required evidence while preserving documented optional jobs. With authorized isolated fixtures or existing run records, verify failed, skipped, cancelled, stale, and mismatched-artifact cases cannot promote the release.

### SC-018 — Deployment target and state-change binding
- **Applies:** Jobs promote artifacts, deploy services, apply infrastructure, run migrations, change permissions/configuration, or perform rollback.
- **Check:** Trace actor-supplied environment/account/region/namespace, branch/tag/ref, artifact version/digest, and variable/secret overrides into the actual command and credentials. Confirm the approved/tested artifact is the promoted artifact, target restrictions cannot be sidestepped by parameters, and reviewed infrastructure plans/configuration/migrations remain bound to the approved target. Inspect concurrent/stale deployments, rollback selectors, and migration or privilege side effects.
- **Evidence / limits:** Deployment scripts and effective identities/targets, plan/artifact identity, existing promotion records, and rollback procedure. An environment name, approval button, mutable tag, or successful earlier test is insufficient evidence of exact target/state binding. Do not run apply, migrate, deploy, or rollback to inspect behavior.
- **Correction / retest:** Constrain target selection and credential scope; bind approval/validation to immutable artifacts and reviewed state changes; control concurrent promotion and define compatible rollback. Verify mismatched targets/artifacts and stale plans are rejected through static policy evaluation, existing records, or separately authorized non-production checks. Coordinate recovery findings with operations.

## Graph contributions

- Record the **observed audit traversal** through manifests, lockfiles, workflow definitions, advisories, build metadata, and deployment records. Link inspection nodes to `E-###`, relevant `SC-###` controls, `F-###` findings, and `U-###` gaps.
- In the **dependency graph**, show direct/transitive package edges only when supported by resolution evidence. Include ecosystem, exact version/digest when known, runtime/build scope, and examined versus inventoried status.
- Keep package dependency edges distinct from `builds`, `publishes`, `promotes`, and `deploys` relationships. A runtime service calling another service is a separate relationship from a library importing another library.
- For a large graph, summarize clearly named groups and provide the exact examined paths in the adjacent inventory. State the source, inspected subset, exclusions, and unresolved resolution depth; never imply the visible diagram is a complete SBOM.
- Do not label every package as analyzed because it was returned by a lockfile parser. Record the actual checks performed and their evidence.
- Add a pipeline view when delivery is in scope: event/caller → definition/job → runner and identity → produced/consumed artifact → target environment. Label the distinct relations (`triggers`, `includes`, `executes`, `runs on`, `assumes identity`, `produces`, `consumes`, `promotes to`) rather than implying they are all package dependencies. A service may point to its deployment job with `deployed by`; an artifact producer points to the artifact with `produces`.
- Include transitive definitions, privileged transitions, required verification/approval gates, and material uninspected provider settings. Annotate repository/ref, identity scope, artifact digest, environment, evidence basis, and inspection depth where known; connect risks/gaps to the same `SC-###`, `F-###`, and `U-###` records as the per-job table. Never publish secret values or invent an observed run from YAML.

## Reference selection

Use ecosystem/provider documentation and advisories matching the inspected component. Record the consulted version/date and distinguish current external intelligence from cached results.

- [NIST Secure Software Development Framework](https://csrc.nist.gov/Projects/ssdf): development and vulnerability-management practices.
- [SLSA](https://slsa.dev/): source/build provenance and artifact integrity; select a version explicitly if mapping requirements.
- [OSV query API](https://google.github.io/osv.dev/post-v1-query/) and [OSV schema](https://ossf.github.io/osv-schema/): package/version matching, pagination, affected records, aliases, and withdrawn advisories.
- [GitHub Advisory Database](https://docs.github.com/en/code-security/concepts/vulnerability-reporting-and-management/github-advisory-database): ecosystem mapping, reviewed/unreviewed records, affected and patched versions, and links to original advisories.
- [CISA KEV catalog](https://www.cisa.gov/known-exploited-vulnerabilities-catalog) and [official CISA mirror](https://github.com/cisagov/kev-data): dated known-exploitation evidence for prioritization, not proof of local exploitability or completeness.
- [Red Hat backporting guidance](https://access.redhat.com/security/updates/backporting): an example of why distribution/vendor build advisories take precedence over a bare upstream-version comparison; use the actual vendor's records for the assessed package.
- [GitHub Actions secure use reference](https://docs.github.com/en/actions/reference/security/secure-use): GitHub-specific workflow and execution boundaries when that platform is used.
- [GitHub workflow syntax](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax), [triggering events](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows), and [OIDC reference](https://docs.github.com/en/actions/reference/security/oidc): job result handling, event context, and trust claims; match the effective repository/provider settings.
- [GitLab includes](https://docs.gitlab.com/ci/yaml/includes/) and [merge-request pipelines](https://docs.gitlab.com/ci/pipelines/merge_request_pipelines/): composed configuration, override ordering, fork/parent execution context, and protected resources.
- [Jenkinsfile documentation](https://www.jenkins.io/doc/book/pipeline/jenkinsfile/): scripted execution, credentials, interpolation, and result handling; inspect applicable shared-library/plugin behavior separately.
- [Azure Pipelines approvals and checks](https://learn.microsoft.com/en-us/azure/devops/pipelines/process/approvals?view=azure-devops): resource-managed controls outside YAML.
- [CircleCI dynamic configuration](https://circleci.com/docs/guides/orchestrate/dynamic-config/): setup/continuation boundaries; inspect the actual generated or supplied continuation definition.
- [Bitbucket Pipelines configuration reference](https://support.atlassian.com/bitbucket-cloud/docs/bitbucket-pipelines-configuration-reference/): pipeline entry points and execution configuration.
- [Buildkite dynamic pipelines](https://buildkite.com/docs/pipelines/configure/dynamic-pipelines): uploaded/generated execution definitions and their origins.
- [Cloud Build service accounts](https://docs.cloud.google.com/build/docs/securing-builds/configure-user-specified-service-accounts): build versus trigger identity configuration; obtain the effective trigger settings.
- [CWE](https://cwe.mitre.org/about/index.html): weakness classification, not an advisory database or exploitability score.
