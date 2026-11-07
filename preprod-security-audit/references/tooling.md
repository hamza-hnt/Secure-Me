# Scanner execution procedures

Use these procedures when a relevant scanner is available and its execution fits the established scope. Run applicable checks, inspect their actual results, and record gaps; do not present a list of proposed commands as completed testing. No scanner replaces the module controls or establishes production readiness by itself. Follow [audit method](audit-method.md) and [findings and priorities](findings-and-priorities.md).

## Dispatch and preflight

| Available evidence / scope | Procedure | Main controls |
| --- | --- | --- |
| Local files; Git history only when included | Gitleaks current files and/or selected history | DATA-005, SC-015 |
| Supported source languages and reviewed local rules | Semgrep CE local scan | Applicable APP/IAM/DATA controls; map each rule separately |
| Existing target-matched SBOM; otherwise local package metadata/artifact | Dependency inventory and optional Trivy SBOM generation | SC-002–004; metadata for the dependency graph |
| Lockfiles or installed-package metadata | Trivy filesystem vulnerability scan | SC-002–004 |
| Existing release image archive | Trivy image vulnerability scan | SC-002–004, INFRA-009–010 |
| IaC / deployment declarations | Trivy filesystem misconfiguration scan | Relevant INFRA controls; declarations only |
| Explicitly authorized URL crawling | ZAP passive Automation Framework plan | Selected browser/HTTP controls; observed runtime only |
| Explicitly authorized active attack testing | Scoped ZAP active scan | Selected application controls; never implied by passive scope |

1. Resolve the intended repository/revision, current-file versus history scope, deployment artifact, languages, and existing authorization. Inventory tracked, untracked, ignored, generated, vendored, submodule, and symlink boundaries before accepting scanner coverage.
2. Discover trusted executables with `command -v gitleaks semgrep trivy docker`. Do not execute a repository-provided binary or let a target-controlled `PATH` select one. Verify executable/image provenance and applicable upstream security advisories **before even invoking `--version` when trust is unestablished**; unknown or suspect distributions remain unavailable, while an already verified distribution can proceed. Consult, for example, [Trivy's upstream advisories](https://github.com/aquasecurity/trivy/security/advisories). Record versions and inspect the installed subcommand's `--help`; these recipes describe documented capabilities, not a guarantee about an arbitrary installation.
3. Run from a private work directory outside the target. Keep rules, configuration, output, and caches outside the scanned tree. Review inherited scanner settings without printing credentials or dumping the environment. Remove unreviewed scanner overrides from the child process; preserve explicitly needed trusted proxy/certificate settings.
4. Do not install tools, fetch project dependencies, run hooks/builds, or start the application just to make these recipes work. Use existing tools/evidence or record the unavailable prerequisite. Never use `eval` or interpolate repository content into a command.
5. Separate permission to inspect source from permission to contact advisory/rule registries, pull images, or probe an application. For strict offline work, use an existing network-isolated execution environment; scanner flags are not a network firewall.

The examples use POSIX-style shell syntax. Replace literal absolute paths with known paths, quote each argument, and create a fresh work directory for every run. Stop if directory creation fails; never reuse stale output as a new result.

```sh
audit_target='/absolute/path/to/assessed-project'
audit_work='/absolute/private/path/to/new-audit-run'
umask 077
mkdir -m 700 "$audit_work" || exit 1
cd "$audit_work" || exit 1
rg --files --hidden --no-ignore -0 -g '!.git' "$audit_target" > "$audit_work/files.nul"
```

For Git targets, first record `git --version` and verify `GIT_NO_LAZY_FETCH` support: upstream Git **2.45.1 or newer**, or an independently verified vendor/security backport. Use a maintained patched Git, not an old release merely because it meets this feature minimum. The guard is present in [2.45.1 source](https://github.com/git/git/blob/v2.45.1/promisor-remote.c) and absent in [2.45.0](https://github.com/git/git/blob/v2.45.0/promisor-remote.c); the [environment definition](https://github.com/git/git/blob/v2.45.1/environment.h) identifies its name. If support is unverified, retain the filesystem inventory and mark Git-derived coverage unavailable.

```sh
GIT_NO_LAZY_FETCH=1 git -c core.fsmonitor=false -C "$audit_target" rev-parse HEAD > "$audit_work/revision.txt"
GIT_NO_LAZY_FETCH=1 git -c core.fsmonitor=false -C "$audit_target" rev-parse --is-shallow-repository > "$audit_work/shallow.txt"
GIT_NO_LAZY_FETCH=1 git -c core.fsmonitor=false -C "$audit_target" ls-files --sparse --cached --stage -z > "$audit_work/index.nul"
GIT_NO_LAZY_FETCH=1 git -c core.fsmonitor=false -C "$audit_target" ls-files --sparse --others --exclude-standard -z > "$audit_work/untracked.nul"
GIT_NO_LAZY_FETCH=1 git -c core.fsmonitor=false -C "$audit_target" ls-files --sparse --others --ignored --exclude-standard -z > "$audit_work/ignored.nul"
```

Inspect every command's outcome. These listings use index/path metadata; `--sparse` preserves sparse-directory entries. Do not substitute `status`, worktree `diff`, `--modified`, `--eol`, or indexed-blob materialization: content comparisons can invoke clean/process filters, even with fsmonitor disabled. The inventory does **not** establish whether tracked worktree content matches `HEAD`; record that limitation. Review sparse, missing, symlink, submodule, and ignore boundaries separately without traversing outside scope. [Git listing options](https://git-scm.com/docs/git-ls-files). Keep inventories and diagnostics private.

## Gitleaks: present files and selected history

Prerequisites: trusted Gitleaks supporting `dir`, `git`, full redaction, external configuration, and explicit ignore handling; Git for history. Capture `gitleaks version`, `gitleaks dir --help`, and `gitleaks git --help`. Do not fall back silently to deprecated commands or repository-supplied configuration. [Official usage and configuration](https://github.com/gitleaks/gitleaks/blob/master/README.md).

Create an auditor-controlled configuration that extends the installed binary's built-in rules, and an empty external ignore file. Review any additional rules/allowlists before adding them; record their source and version.

```sh
cat > "$audit_work/gitleaks.toml" <<'TOML'
title = "Audit-controlled built-in rules"
[extend]
useDefault = true
TOML
: > "$audit_work/empty.gitleaksignore"
if gitleaks dir "$audit_target" \
  --config "$audit_work/gitleaks.toml" \
  --gitleaks-ignore-path "$audit_work/empty.gitleaksignore" \
  --ignore-gitleaks-allow --redact=100 --exit-code 10 --timeout 300 \
  --report-format json --report-path "$audit_work/gitleaks-files.json" \
  > "$audit_work/gitleaks-files.log" 2>&1
then audit_exit=0; else audit_exit=$?; fi
printf '%s\n' "$audit_exit" > "$audit_work/gitleaks-files.exit"
```

The directory scan covers accessible current files, including untracked files subject to tool filters; it does not assess deleted historical content. Inspect the reported scope, limits, and errors. Do not enable symlink traversal outside the agreed target.

When history is included, require the verified Git support above and preserve `GIT_NO_LAZY_FETCH=1` in Gitleaks' Git subprocess environment. Git log can otherwise fetch missing partial-clone objects and invoke configured transports/helpers. Strict offline history scans additionally require an existing network-isolated environment; without the guard or required isolation, skip history as unavailable and continue current-file review. Never fetch to repair missing history. The following uses local `HEAD`; replace it only with a verified in-scope revision, not arbitrary log options.

```sh
if GIT_NO_LAZY_FETCH=1 gitleaks git "$audit_target" --log-opts='--no-ext-diff --no-textconv HEAD' \
  --config "$audit_work/gitleaks.toml" \
  --gitleaks-ignore-path "$audit_work/empty.gitleaksignore" \
  --ignore-gitleaks-allow --redact=100 --exit-code 10 --timeout 300 \
  --report-format json --report-path "$audit_work/gitleaks-history.json" \
  > "$audit_work/gitleaks-history.log" 2>&1
then audit_exit=0; else audit_exit=$?; fi
printf '%s\n' "$audit_exit" > "$audit_work/gitleaks-history.exit"
```

History scans inspect Git patches, not current uncommitted/untracked content. A commit range, shallow clone, missing submodule, or unavailable ref limits coverage. Use `--all` only if all local refs are in scope; do not fetch automatically. Archive/decoding and size limits are part of the recorded scope. [Git command behavior](https://github.com/gitleaks/gitleaks/blob/master/cmd/git.go), [directory behavior](https://github.com/gitleaks/gitleaks/blob/master/cmd/directory.go).

Here, exit `10` means candidate leaks; `0` means no candidates reported for the completed scope. Inspect diagnostics and JSON even with those codes: partial scans remain partial. Other codes require error triage. Verify redaction before reading snippets into the report; filenames, commit messages, and surrounding context may still be sensitive. Never try a discovered credential against a service.

## Semgrep CE: local, reviewed rules

Prerequisites: supported languages, trusted CE engine, and an auditor-reviewed local rule file/directory outside the target. Record the rule revision/digest, languages, rule-level exclusions, and engine version. Use `semgrep scan --disable-version-check --version` and `semgrep scan --help`; do not use `ci`, `--config auto`, registry shortcuts, Secrets validation, or autofix for this local procedure. [CLI reference](https://docs.semgrep.dev/cli-reference).

`--no-git-ignore` does not disable `.semgrepignore`; `--disable-nosem` separately prevents inline suppression. The documented `--x-ignore-semgrepignore-files` is an **internal, unstable option**: confirm it exists in installed help before using this recipe. If absent, do not silently drop it. Use an inventoried, read-only audit copy with reviewed ignore files and original-path mapping, or record the excluded paths and perform manual review. Do not change the assessed checkout to bypass ignores. [Ignore behavior](https://docs.semgrep.dev/ignoring-files-folders-code), [target filtering](https://docs.semgrep.dev/semgrepignore-v2-reference).

```sh
audit_rules='/absolute/path/to/reviewed-local-semgrep-rules'
if semgrep scan --oss-only --config "$audit_rules" \
  --metrics=off --disable-version-check --no-autofix \
  --no-git-ignore --disable-nosem --x-ignore-semgrepignore-files \
  --max-target-bytes 1000000 --timeout 5 --timeout-threshold 3 --jobs 2 \
  --strict --error --json --output "$audit_work/semgrep.json" \
  "$audit_target" > "$audit_work/semgrep.log" 2>&1
then audit_exit=0; else audit_exit=$?; fi
printf '%s\n' "$audit_exit" > "$audit_work/semgrep.exit"
```

These are bounded example limits, not an exhaustive-scan claim. Compare the expected inventory with JSON `paths`, `errors`, and the scan summary; inspect skipped/unsupported/binary/minified/oversized files, rule filters, parse failures, and timeouts. If available, the similarly unstable `--x-ls-long` can help diagnose target selection, but it is not proof that parsing/rule execution completed.

With `--error`, exit `1` indicates findings; `0` alone is not complete coverage. Other exits or reported errors require triage; preserve partial findings. CE does not establish whole-program authorization, tenant isolation, or every cross-file data path. JSON may contain source snippets: normalize and redact it before quoting. Local rules plus disabled metrics/version checks avoid the ordinary registry/telemetry path; enforce isolation if no network access is allowed.

## Trivy: filesystem, image, and IaC evidence

Inspecting an existing SBOM needs no scanner. Trivy recipes require a trusted binary and supported inputs; vulnerability/IaC scans additionally need the relevant reviewed databases/checks. Inventory generation does not require a vulnerability database. Record `trivy --version`, relevant cache metadata dates, and help for `filesystem` and `image`. Missing/incompatible/stale data must remain visible; do not report failed initialization as a clean scan.

Use a reviewed configuration outside the target. The empty configuration below has no target-supplied filters. Explicitly disable external ignore/secret configuration loading; do not load target templates, custom Rego, plugins, or executable modules. Check installed help for these flags before proceeding. [Configuration and precedence](https://trivy.dev/docs/latest/guide/configuration/).

```sh
audit_trivy_cache='/absolute/path/to/reviewed-trivy-cache'
printf '{}\n' > "$audit_work/trivy.yaml"
mkdir -m 700 "$audit_work/empty-trivy-modules" || exit 1
```

### Dependency inventory and SBOMs

Use the lightest adequate evidence: **existing target-matched SBOM first**, then optional Trivy inventory generation, then a targeted optional tool only for a remaining gap. In manual-only mode, inspect supplied SBOM/manifest/lockfile evidence without executing generators. Do not install a generator, resolve/install dependencies, build an image, or fetch a remote SBOM as an incidental step.

For a supplied SBOM, record its path/source, raw-file SHA-256, format/schema version, generator/version, generation time, subject identity and platform. Match it to the assessed revision/lockfile hashes or release artifact digest using provenance; a filename, tag, timestamp or valid schema alone cannot establish that match. Check whether the inputs changed after generation. Preserve mismatches/staleness as `U-###`; do not silently substitute a different release's inventory.

Parse privately and validate against its **declared** schema with an already available trusted validator and local schema. Do not fetch `$schema`, external references or remote components automatically. Record parse/schema/reference-integrity results separately; missing validation support is an explicit limit, not permission to call parsing validation. Check unique component IDs, resolvable relationship references, root identity, omissions and completeness assertions. Use the applicable [CycloneDX specification](https://cyclonedx.org/specification/overview/) or [SPDX specification](https://spdx.github.io/spdx-spec/).

Keep the evidence basis explicit:

| Basis | What it establishes | What remains unproven |
| --- | --- | --- |
| Declared manifest | Requested packages/ranges and declared scope | Selected versions, installed or shipped contents |
| Resolved lockfile | Recorded resolution for that input/workspace | Current install, platform-specific inclusion, release contents |
| Installed package metadata | Packages identified in the inspected environment | Build inclusion, runtime loading, deployment equivalence |
| Release artifact SBOM | Identified components of the matched artifact/platform | Complete detection, deployed identity, reachable vulnerable paths |

If generation is useful and authorized, reuse the reviewed configuration above. The cache may be an empty private directory for non-Java inventory; do not make vulnerability-DB availability a prerequisite. Ensure neither the configuration nor the child environment supplies a scanner override (including `TRIVY_SCANNERS`); omit `--scanners` deliberately. With `--format cyclonedx`, Trivy disables security scanning by default, and its runner bypasses vulnerability-DB initialization without the vulnerability scanner. Confirm this behavior for the installed version; do not enable `vuln` merely to obtain a package list. [SBOM generation](https://trivy.dev/docs/latest/guide/supply-chain/sbom/), [option handling](https://github.com/aquasecurity/trivy/blob/main/pkg/flag/options.go), [DB initialization](https://github.com/aquasecurity/trivy/blob/main/pkg/commands/artifact/run.go).

```sh
if trivy filesystem --config "$audit_work/trivy.yaml" \
  --ignorefile='' --secret-config='' \
  --module-dir "$audit_work/empty-trivy-modules" --cache-dir "$audit_trivy_cache" \
  --skip-db-update --skip-java-db-update --skip-check-update \
  --skip-version-check --disable-telemetry --offline-scan --include-dev-deps \
  --format cyclonedx --timeout 5m --output "$audit_work/inventory-filesystem.cdx.json" \
  "$audit_target" > "$audit_work/inventory-filesystem.log" 2>&1
then audit_exit=0; else audit_exit=$?; fi
printf '%s\n' "$audit_exit" > "$audit_work/inventory-filesystem.exit"
```

For an already available release image archive, select the artifact itself; this does not pull, build, execute, or deploy it. Record its digest and the platform selected from any multi-platform archive; use the installed version's documented platform selector if needed.

```sh
audit_image_archive='/absolute/path/to/assessed-release-image.tar'
if trivy image --input "$audit_image_archive" --config "$audit_work/trivy.yaml" \
  --ignorefile='' --secret-config='' \
  --module-dir "$audit_work/empty-trivy-modules" --cache-dir "$audit_trivy_cache" \
  --skip-db-update --skip-java-db-update --skip-check-update \
  --skip-version-check --disable-telemetry --offline-scan \
  --format cyclonedx --timeout 5m --output "$audit_work/inventory-image.cdx.json" \
  > "$audit_work/inventory-image.log" 2>&1
then audit_exit=0; else audit_exit=$?; fi
printf '%s\n' "$audit_exit" > "$audit_work/inventory-image.exit"
```

Validate generated output as above and reconcile it with the expected file/workspace/artifact inventory. Inspect diagnostics even on exit `0`; retain partial evidence on failure. Package/edge support depends on the ecosystem, input format and target type. For example, Node lockfiles can support dependency relationships while installed `package.json` detection does not provide the same graph. Development/optional/peer/workspace coverage must be checked, not inferred from a flag. Java archive identification can require a separate Java index DB; Maven metadata can require resolution. Updates remain disabled here: missing identification data, unavailable offline resolution, unsupported formats or omitted packages remain gaps. Never run dependency installation to conceal them. [Language coverage](https://trivy.dev/docs/latest/guide/coverage/language/), [Node coverage](https://trivy.dev/docs/latest/guide/coverage/language/nodejs/), [Java coverage](https://trivy.dev/docs/latest/guide/coverage/language/java/).

Build edges only from relations actually supplied: CycloneDX `dependencies[].ref` → `dependsOn[]`, or the corresponding typed SPDX relationship with its documented direction. Preserve containment, build/dev/runtime distinctions and missing references; do not turn a flat package list into application-to-every-package dependency edges. Missing edges mean unknown relationships, not dependency-free components. `--dependency-tree` is a view of vulnerable-package origins, not a replacement for the inventory procedure. [CycloneDX relationships](https://cyclonedx.org/use-cases/software-dependencies/), [SPDX 2.3 relationships](https://spdx.github.io/spdx-spec/v2.3.1/relationships-between-SPDX-elements/), [Trivy output flags](https://trivy.dev/docs/latest/guide/references/configuration/cli/trivy_filesystem/).

For reproducibility, record the raw SBOM hash, input hashes/revision/artifact digest, platform, tool/version, configuration/analyzers, exclusions, invocation and any identification-cache version. When comparing repeated inventories, separately hash a documented normalized comparison copy: sort stable component/typed-edge records; preserve ecosystem, name, version, purl qualifiers, scope, locations and artifact identity. Remove known volatile generation timestamps/document UUIDs from that comparison, remapping generated reference IDs consistently. Preserve duplicate identities and report ambiguity instead of merging different instances. Never modify the original SBOM or claim identical raw output when only normalized content matches.

Keep raw JSON and logs private. The report needs the inventory source/identity, basis, counts, graph subset, coverage limits and `E-###` links—not a pasted package dump. Inventory-derived nodes remain `metadata-only` until source tracing or runtime evidence justifies more; findings require separate assessment. A completed inventory does not imply a vulnerability scan or absence of vulnerabilities. Record advisory database applicability as `not used — inventory only` for these runs.

Optional tools are **not bundled or required**. Use one only if already available, within the existing scope, and useful for a specific missing relationship:

| Optional evidence/tool | When useful | Effects and trust limits |
| --- | --- | --- |
| Native package-manager graph, e.g. [npm ls](https://docs.npmjs.com/cli/v11/commands/npm-ls/) | Explain workspace/peer/resolved or installed relationships | Distinguish lockfile-only from installed-tree output; review effective config, lifecycle/plugin/network behavior and workspace scope before any command. Do not assume every ecosystem's graph task is read-only. |
| [Syft](https://github.com/anchore/syft) | Alternate local artifact/filesystem catalog when Trivy coverage is insufficient | Review source selection, catalogers, configuration, updates/network behavior and relationship coverage; no registry pull or installation by default. |
| [dependency-cruiser](https://github.com/sverweij/dependency-cruiser/blob/main/doc/cli.md) | JavaScript/TypeScript source import graph | Imports are not a package SBOM or proof of runtime reachability. Repository JS configs/resolvers/plugins can execute code; use reviewed external configuration or supported no-config mode, without downloads/builds. |

### Vulnerability and IaC scans

Filesystem dependencies, using cached data and no dependency-identification API requests:

```sh
if trivy filesystem --config "$audit_work/trivy.yaml" \
  --ignorefile='' --secret-config='' --scanners vuln \
  --module-dir "$audit_work/empty-trivy-modules" --cache-dir "$audit_trivy_cache" \
  --skip-db-update --skip-java-db-update --skip-check-update \
  --skip-version-check --disable-telemetry --offline-scan \
  --include-dev-deps --list-all-pkgs --exit-code 0 --timeout 5m \
  --format json --output "$audit_work/trivy-filesystem.json" \
  "$audit_target" > "$audit_work/trivy-filesystem.log" 2>&1
then audit_exit=0; else audit_exit=$?; fi
printf '%s\n' "$audit_exit" > "$audit_work/trivy-filesystem.exit"
```

Inspect an existing image archive without executing its contents, building an image, pulling from a registry, or connecting to a Docker daemon:

```sh
audit_image_archive='/absolute/path/to/assessed-release-image.tar'
if trivy image --input "$audit_image_archive" --config "$audit_work/trivy.yaml" \
  --ignorefile='' --secret-config='' --scanners vuln \
  --module-dir "$audit_work/empty-trivy-modules" --cache-dir "$audit_trivy_cache" \
  --skip-db-update --skip-java-db-update --skip-check-update \
  --skip-version-check --disable-telemetry --offline-scan \
  --list-all-pkgs --exit-code 0 --timeout 5m \
  --format json --output "$audit_work/trivy-image.json" \
  > "$audit_work/trivy-image.log" 2>&1
then audit_exit=0; else audit_exit=$?; fi
printf '%s\n' "$audit_exit" > "$audit_work/trivy-image.exit"
```

Record archive identity, image digest/platform, and how it maps to the release. A tag or local archive does not prove that production runs it. Filesystem and image inventories may differ. [Filesystem flags](https://trivy.dev/docs/latest/guide/references/configuration/cli/trivy_filesystem/), [image flags](https://trivy.dev/docs/latest/guide/references/configuration/cli/trivy_image/).

For IaC, select only the misconfiguration scanner through the filesystem command:

```sh
if trivy filesystem --config "$audit_work/trivy.yaml" \
  --ignorefile='' --secret-config='' --scanners misconfig \
  --module-dir "$audit_work/empty-trivy-modules" --cache-dir "$audit_trivy_cache" \
  --skip-check-update --skip-version-check --disable-telemetry --offline-scan \
  --include-non-failures --exit-code 0 --timeout 5m \
  --format json --output "$audit_work/trivy-iac.json" \
  "$audit_target" > "$audit_work/trivy-iac.log" 2>&1
then audit_exit=0; else audit_exit=$?; fi
printf '%s\n' "$audit_exit" > "$audit_work/trivy-iac.exit"
```

Review target `.trivyignore*`, inline `trivy:ignore`/legacy suppression comments, and effective environment filters independently; disabling ignore files does not erase inline suppressions. Record accepted exceptions and inspect suppressed areas manually or in a documented audit copy. Do not use `--ignore-unfixed` or severity filtering to conceal coverage. Restrict custom checks to reviewed sources. [Filtering](https://trivy.dev/docs/latest/guide/configuration/filtering/), [inline IaC suppression](https://trivy.dev/docs/latest/guide/scanner/misconfiguration/config/config/).

`--offline-scan` limits dependency-identification requests; it is not a general network prohibition. IaC module resolution and other features can require remote content. Strict offline runs need network isolation and cached inputs. If network refresh is already permitted, update the reviewed cache separately using the installed version's documented `--download-db-only` / `--download-java-db-only` procedures, then record refreshed metadata and rerun. Do not silently relax the offline scope. [Network considerations](https://trivy.dev/docs/latest/guide/advanced/air-gap/).

These recipes explicitly exclude Trivy's secret scanner; JSON/diagnostics can nevertheless contain sensitive configuration. Inspect `Results`, detected package inventory, `Vulnerabilities`, `Misconfigurations`, statuses, errors, and ignored/skipped inputs. Exit `0` is deliberately used even when findings exist; findings come from JSON, operational failures from exit status plus diagnostics. Ecosystem support for development dependencies varies; do not infer a complete dependency graph from missing results.

## ZAP: explicit passive and active automation plans

Baseline-style testing crawls HTTP resources and passively analyzes responses; it is **not** source-only. Even GET requests can change application state. Establish the approved scheme/host/port/path, exclusions, identities, side effects, request budget, and stop conditions. Existing matching authorization need not be requested again. Use a reviewed local Automation Framework plan with an inline context and explicit job seed/context. Do not substitute packaged baseline/full wrappers or imported-context fallback paths. [Baseline behavior](https://www.zaproxy.org/docs/docker/baseline-scan/), [Automation Framework](https://www.zaproxy.org/docs/desktop/addons/automation-framework/).

Prerequisites: Docker, a trusted **already present** image pinned by digest, all required add-ons/templates already installed, and existing enforced egress and rate controls. A Docker network name or context regex alone is insufficient: enforce approved destinations, redirects, path/method restrictions where required, request-rate/total budgets, and a hard stop externally. Restrict DNS, callbacks and upstream proxies too. If those controls are unavailable, record the live procedure as skipped. Stop on scope escape, unexpected writes, degradation, or sensitive records.

Do not pull images, install/update add-ons, load target hooks/scripts, mount the checkout/daemon socket, expose proxy ports, or use host networking. Use a fresh ZAP home/session for each container. `-silent` suppresses unsolicited requests, including update checks; it does not constrain planned target traffic. Verify installed support and record versions. [CLI flags](https://www.zaproxy.org/docs/desktop/cmdline/).

```sh
audit_zap_image='ghcr.io/zaproxy/zaproxy@sha256:REPLACE_WITH_VERIFIED_LOCAL_DIGEST'
audit_zap_network='REPLACE_WITH_EXISTING_ENFORCED_NETWORK'
audit_zap_container='REPLACE_WITH_UNIQUE_AUDIT_CONTAINER_NAME'
mkdir -m 700 "$audit_work/zap-plan" "$audit_work/zap-output" || exit 1
docker image inspect --format '{{.Id}}' "$audit_zap_image"
docker run --pull=never --rm --network none "$audit_zap_image" zap.sh -silent -version
docker run --pull=never --rm --network none "$audit_zap_image" zap.sh -silent -h > "$audit_work/zap-help.log" 2>&1
docker run --pull=never --rm --network none "$audit_zap_image" zap.sh -cmd -silent -dir /tmp/audit-zap-home -addonlist > "$audit_work/zap-addons.log" 2>&1
```

Prepare `$audit_work/zap-plan/plan.yaml` from the example below. Replace the reserved `.invalid` seed and its escaped regex with the exact approved values; add product-specific exclusions. Keep a trailing slash for a subtree boundary; do not broaden to the host root. Review regex matches/nonmatches and redirects offline. This example is anonymous; authenticated coverage needs a separately reviewed synthetic identity/session plan. No placeholders or unexpected jobs may remain at execution time. [Environment](https://www.zaproxy.org/docs/desktop/addons/automation-framework/environment/), [spider parameters](https://www.zaproxy.org/docs/desktop/addons/spider/automation/).

```yaml
env:
  contexts:
    - name: approved-context
      urls: ['https://audit-target.invalid/approved-path/']
      includePaths: ['^https://audit-target\.invalid/approved-path/.*$']
      excludePaths: []
  parameters:
    failOnError: true
    failOnWarning: true
    continueOnFailure: false
    maxDuration: 300
jobs:
  - type: passiveScan-config
    parameters:
      scanOnlyInScope: true
  - type: spider
    parameters:
      context: approved-context
      url: 'https://audit-target.invalid/approved-path/'
      maxDuration: 1
      maxDepth: 3
      maxChildren: 20
      threadCount: 1
      processForm: false
      postForm: false
      parseRobotsTxt: false
      parseSitemapXml: false
      parseComments: false
      parseGit: false
      parseDsStore: false
      parseSVNEntries: false
  - type: passiveScan-wait
    parameters:
      maxDuration: 2
  - type: report
    parameters:
      template: traditional-json
      reportDir: /zap/output
      reportFile: zap-results.json
      displayReport: false
```

Use only installed, reviewed passive rules; record their IDs/versions and exclusions. Bounds above limit coverage; they do not prove that all reachable routes were tested. [Passive configuration](https://www.zaproxy.org/docs/desktop/addons/passive-scanner/job-pscanconf/), [passive queue waiting](https://www.zaproxy.org/docs/desktop/addons/passive-scanner/job-pscanwait/), [report job](https://www.zaproxy.org/docs/desktop/addons/report-generation/automation/), [JSON template](https://www.zaproxy.org/docs/desktop/addons/report-generation/report-traditional-json/).

Validate the actual plan offline with the pinned image before any live execution. Confirm restrictive plan/output permissions are accessible to its UID without making evidence world-readable. A missing add-on, unknown rule, bad context, parameter warning, or invalid seed stops the procedure; never fall back to defaults. Inspect diagnostics as well as the exit status, then record the reviewed plan digest. `-autocheck` validates configuration, not live scope enforcement. [Validation and execution source](https://github.com/zaproxy/zap-extensions/blob/main/addOns/automation/src/main/java/org/zaproxy/addon/automation/ExtensionAutomation.java).

```sh
if docker run --pull=never --rm --network none \
  --mount "type=bind,src=$audit_work/zap-plan,dst=/zap/plan,readonly" \
  "$audit_zap_image" zap.sh -cmd -silent -dir /tmp/audit-zap-home \
  -autocheck /zap/plan/plan.yaml > "$audit_work/zap-check.log" 2>&1
then audit_zap_check_exit=0; else audit_zap_check_exit=$?; fi
printf '%s\n' "$audit_zap_check_exit" > "$audit_work/zap-check.exit"
test "$audit_zap_check_exit" -eq 0 || exit 1
```

Run only after that review and verification of the existing external scope/rate/stop controls. Preserve the same image digest and plan bytes; any change requires revalidation. Keep a separate trusted control session capable of stopping the named container with `docker stop "$audit_zap_container"`; an independent deadline must enforce the agreed hard stop.

```sh
if docker run --pull=never --rm --name "$audit_zap_container" \
  --network "$audit_zap_network" \
  --mount "type=bind,src=$audit_work/zap-plan,dst=/zap/plan,readonly" \
  --mount "type=bind,src=$audit_work/zap-output,dst=/zap/output" \
  "$audit_zap_image" zap.sh -cmd -silent -dir /tmp/audit-zap-home \
  -autorun /zap/plan/plan.yaml > "$audit_work/zap-run.log" 2>&1
then audit_exit=0; else audit_exit=$?; fi
printf '%s\n' "$audit_exit" > "$audit_work/zap-run.exit"
```

**Active testing is a separate scope.** Only when selected attack rules/effects and the synthetic or isolated target are explicitly authorized, insert this job between `spider` and `passiveScan-wait` in a new plan/run. Replace the rule placeholder with approved installed numeric IDs, each separately listed; review their behavior and permitted input vectors. Keep all other rules disabled, omit `policy` (which would override `policyDefinition`), and revalidate the entire plan offline. Never upgrade passive testing automatically. [Active job and policy semantics](https://www.zaproxy.org/docs/desktop/addons/automation-framework/job-ascan/).

```yaml
  - type: activeScan
    parameters:
      context: approved-context
      url: 'https://audit-target.invalid/approved-path/'
      maxRuleDurationInMins: 1
      maxScanDurationInMins: 2
      threadPerHost: 1
      delayInMs: 1000
    policyDefinition:
      defaultStrength: Low
      defaultThreshold: 'Off'
      rules:
        - id: REPLACE_WITH_APPROVED_INSTALLED_RULE_ID
          strength: Low
          threshold: Medium
```

Single threads, delays, and duration limits are not a hard request budget or side-effect guarantee. Reconcile jobs completed, URLs/methods actually exercised, rules executed, passive queue completion, errors and the JSON report. With these plans, default AF exits `0/1/2` mean no operational warnings/errors, errors, or warnings respectively; **zero does not mean no alerts**. Do not add `exitStatus` overrides that mask failures. Time limits, failed jobs, missing reports, or incomplete queues remain partial/failed coverage, even if useful alerts exist. Keep logs when fail-closed execution prevents report generation.

## Normalize evidence and report execution honestly

| Execution state | Report treatment |
| --- | --- |
| Completed, valid results | Record actual coverage and candidates; a clean result supports only the rules/inputs actually checked. |
| Completed with candidates | Triage source, configuration, identity/version, and exposure; assign provisional or confirmed `F-###` records as evidence warrants. |
| Partial / failed | Preserve usable results and the failure; add `U-###` for missing coverage. Do not classify remaining controls as satisfied. |
| Skipped / unavailable | State the prerequisite, scope restriction, or missing tool and next action; continue manual inspection of accessible evidence. |

For each run record tool/version or image digest, rule/configuration origin and digest, advisory/check database date, target/revision, permitted network behavior, sanitized arguments, start/end time, exit code, result path, execution state, examined inventory, exclusions/suppressions, errors, and limits. Never claim that commands were run because they appear here.

Treat JSON and logs as confidential working evidence. Check parsing/schema before extracting fields; do not `cat` raw results into chat, paste them wholesale into the report, upload them, or commit them. Gitleaks redaction is necessary but does not redact every contextual field; Semgrep, Trivy, and ZAP can include source, configuration, requests, cookies, tokens, URLs, and personal data. Create minimal sanitized records with rule/advisory ID, location, package/version where relevant, observed condition, tool severity, and limitations; keep audit severity separate.

Assign `E-###` to the narrow observed result, link matching controls and `F-###`/`U-###`, and retain stable IDs during deduplication. Show the scan and its actual completion state in the analysis graph. Dependency nodes derived only from scanner inventory are `metadata-only`; add package edges only where the output supplies a supported dependency path. A vulnerability list alone is not a complete graph, a deployed inventory, or proof of exploitability.

If a tool, compatible flag, rule set, cache, runtime URL, or permission is missing, do not hide it, install silently, or invent output. Record a specific fallback: manual source/control tracing, existing SBOM/lockfile inspection, vendor-advisory lookup when permitted, supplied configuration evidence, or a scoped follow-up task. Finish the report with the remaining evidence limits and correction/verification plan.
