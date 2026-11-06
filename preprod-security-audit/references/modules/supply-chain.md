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
- **Applies:** Components with a matched advisory or suspicious vulnerable use.
- **Check:** Match ecosystem, package identity, affected range, fix status, runtime/build location, configuration, and reachable behavior. Use vendor advisories and current vulnerability sources; record lookup date and unavailable sources.
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
- **Check:** Trace untrusted content into shell commands, checkout selection, workflow files, actions, and artifact inputs. Review privileged follow-up workflows and external-PR code executed with base-repository privileges.
- **Evidence / limits:** Event semantics, workflow permissions, code checkout, and data flow; event names alone are insufficient to prove safe or unsafe execution.
- **Correction / retest:** Separate untrusted builds from privileged stages and pass data without shell interpretation; validate representative untrusted inputs in an isolated test workflow, not a production deploy job.

### SC-008 — CI credentials and workload federation
- **Applies:** Pipeline secrets, tokens, signing keys, or federated cloud access.
- **Check:** Review default/job token permissions, secret scope, credential lifetime, federation issuer/audience/subject conditions, branch/environment restrictions, and access to production keys.
- **Evidence / limits:** Workflow definitions plus effective provider trust policy; declaring an environment or short-lived token does not establish narrow authority.
- **Correction / retest:** Limit rights and trust to intended jobs and environments; validate intended issuance and denied untrusted branch/repository contexts without exposing tokens.

### SC-009 — Runner isolation and persistence
- **Applies:** Hosted or self-hosted build runners and build workers.
- **Check:** Inspect reuse across trust levels, cleanup, host privileges, Docker sockets, shared workspaces, network reachability, and access to other jobs' credentials or artifacts.
- **Evidence / limits:** Runner configuration and lifecycle evidence; an ephemeral job container may still share a privileged host or persistent cache.
- **Correction / retest:** Isolate untrusted work, remove unnecessary host access, and ensure safe cleanup; verify a subsequent job cannot read prior sensitive state using non-sensitive test markers.

### SC-010 — Third-party actions and reusable workflows
- **Applies:** External actions, reusable workflows, build plugins, or templates.
- **Check:** Review immutable source selection where supported, owner trust, granted permissions, nested dependencies, update review, and what code a referenced release actually executes.
- **Evidence / limits:** Resolved revision plus relevant code/metadata; pinning an action does not establish that its dependencies or behavior are safe.
- **Correction / retest:** Pin and review critical execution dependencies, narrow permissions, and verify the updated workflow still performs the intended bounded task.

### SC-011 — Cache and artifact trust boundaries
- **Applies:** Shared caches, intermediate artifacts, downloads, or multi-stage pipelines.
- **Check:** Follow who can write/read caches and artifacts, key collisions, content validation, retention, and trust transitions from untrusted builds to privileged jobs.
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
- **Check:** Identify who can deploy, alter gates, select artifacts, change production variables, or bypass checks. Trace whether required validations ran on the actual released revision.
- **Evidence / limits:** Pipeline runs, effective environment controls, deployment record, and exceptions; a green check on another commit does not validate this release.
- **Correction / retest:** Bind gates to the release artifact and control bypass, then demonstrate a failed requirement blocks the relevant promotion path under the agreed policy.

### SC-015 — Secret and sensitive-content leakage in delivery
- **Applies:** Source history, build contexts, logs, artifacts, images, or package publication.
- **Check:** Inspect inclusion rules, layer/history behavior, generated bundles, logs, source maps, and archive contents for unintended secrets or sensitive files. Never reproduce a discovered secret in the report.
- **Evidence / limits:** Redacted locations, safe identifiers, affected artifact/version, and exposure boundaries. Deleting a source file does not remove previous commits or image layers.
- **Correction / retest:** Revoke exposed credentials where warranted, correct inclusion/build handling, and confirm newly built artifacts are clean; preserve investigation evidence through the appropriate owner.

## Graph contributions

- Record the **observed audit traversal** through manifests, lockfiles, workflow definitions, advisories, build metadata, and deployment records. Link inspection nodes to `E-###`, relevant `SC-###` controls, `F-###` findings, and `U-###` gaps.
- In the **dependency graph**, show direct/transitive package edges only when supported by resolution evidence. Include ecosystem, exact version/digest when known, runtime/build scope, and examined versus inventoried status.
- Keep package dependency edges distinct from `builds`, `publishes`, `promotes`, and `deploys` relationships. A runtime service calling another service is a separate relationship from a library importing another library.
- For a large graph, summarize clearly named groups and provide the exact examined paths in the adjacent inventory. State the source, inspected subset, exclusions, and unresolved resolution depth; never imply the visible diagram is a complete SBOM.
- Do not label every package as analyzed because it was returned by a lockfile parser. Record the actual checks performed and their evidence.

## Reference selection

Use ecosystem/provider documentation and advisories matching the inspected component. Record the consulted version/date and distinguish current external intelligence from cached results.

- [NIST Secure Software Development Framework](https://csrc.nist.gov/Projects/ssdf): development and vulnerability-management practices.
- [SLSA](https://slsa.dev/): source/build provenance and artifact integrity; select a version explicitly if mapping requirements.
- [GitHub Actions secure use reference](https://docs.github.com/en/actions/reference/security/secure-use): GitHub-specific workflow and execution boundaries when that platform is used.
- [CWE](https://cwe.mitre.org/about/index.html): weakness classification, not an advisory database or exploitability score.
