# Findings, priorities, and readiness

## Control statuses

| Status | Meaning |
| --- | --- |
| `satisfied` | The specific control is supported by adequate evidence for the stated surface and target. Record limits and sampling. |
| `finding` | An evidenced weakness or unmet applicable requirement exists. Reference an `F-###` record. |
| `needs-validation` | A plausible issue or conflicting evidence requires confirmation. Reference a provisional `F-###` or `U-###`; do not present it as a confirmed vulnerability. |
| `not-verified` | The control applies or may apply, but no adequate check completed. Reference a gap and next action. |
| `not-applicable` | An evidenced architectural or scope reason makes the control inapplicable. State that reason; lack of access is not one. |

Keep unknowns `U-###` separate from defects. Missing production evidence may prevent a readiness recommendation without proving that production is misconfigured.

## Finding record

Each `F-###` record includes:

1. Title, confirmation state (`confirmed` or `provisional`), and affected control IDs.
2. Affected component, revision/environment, exact locations, and evidence IDs.
3. Observed behavior and expected control, with assumptions separated.
4. A concise abuse scenario, preconditions, reachable path, and known constraints. Give safe reproduction steps only when appropriate to the authorized environment; do not include live credentials or personal data.
5. Technical severity, business impact, confidence, remediation priority, and release consequence, each with a reason.
6. Relevant CWE/control/advisory reference when it actually matches; do not invent CVE identifiers or claim certification equivalence.
7. Concrete correction, any temporary mitigation, dependencies on other fixes, owner or proposed role, and effort estimate with assumptions.
8. Acceptance criteria, verification method, regression check, residual risk, and lifecycle state.

Severity and confidence are independent. A source-level authorization bypass can be confirmed without exploiting production. Its production reachability can remain unverified. A dependency advisory hit may remain provisional until affected identity/version/configuration are established.

## Separate the decision axes

| Axis | Values and interpretation |
| --- | --- |
| Technical severity | `critical`, `high`, `medium`, `low`, `informational`; justify using exploit preconditions, capabilities, scope, and impact. Informational observations are not automatically defects. |
| Business impact | Describe affected data, money, availability, customer separation, operational control, and extent. Mark unknowns rather than assuming a generic worst case. |
| Confidence | `high` for a well-supported path/observation, `medium` for incomplete corroboration, `low` for an uncertain lead. Explain missing evidence. |
| Remediation priority | `P0` immediate containment/action; `P1` required before this release; `P2` scheduled remediation with owner/date; `P3` planned hardening. Base on context, not a mechanical severity conversion. |
| Release consequence | `blocking`, `decision-required`, or `non-blocking` for the defined release, with explicit rationale. |

Use CVSS only when useful and defensible. Include version, vector, assumptions, and whether the score is from an advisory or assessed locally. Do not manufacture precision for missing facts. For known CVEs, exploitation evidence or a dated EPSS/known-exploited listing can help prioritize, but does not replace local exposure and impact analysis. No exploit listing is not evidence of safety.

The user may supply established release criteria. Apply them explicitly; identify gaps or conflicts rather than quietly inventing policy. In the absence of criteria, treat demonstrated critical/high-impact reachable issues such as cross-customer disclosure, privileged authentication bypass, or exposed production credentials as proposed blockers with context-specific rationale. An unevidenced suspicion is a validation task, not a confirmed blocker vulnerability.

## Readiness recommendation

Report one bounded recommendation, its target, and its coverage limits:

| Recommendation | Conditions |
| --- | --- |
| `BLOCKED` | At least one evidenced issue violates the stated release criteria or warrants a reasoned blocking recommendation. Also list material unknowns; this verdict does not erase them. |
| `INSUFFICIENT EVIDENCE` | No known blocking issue determines the result, but critical surfaces or assumptions remain unverified, so a release recommendation cannot be supported. |
| `READY WITH CONDITIONS` | No unresolved blocker or critical evidence gap; remaining risks have concrete mitigations/acceptance decisions and must be handled under the named conditions before release. This is not approval to deploy. |
| `NO BLOCKER FOUND IN REVIEWED SCOPE` | The performed review found no blocker within its explicitly bounded scope. It does not assert that the whole system is secure, that unreviewed controls passed, or that compliance is certified. |

If multiple conditions apply, prioritize known blockers, then critical evidence gaps. State pending fixes/decisions directly. Never issue an unconditional "secure" or "approved for production" verdict. A percentage score, lack of scanner alerts, or number of passed controls cannot override a blocker or material gap.

Judge an evidence gap against the decision actually requested. For an explicitly source-only assessment, adequate source coverage may support `NO BLOCKER FOUND IN REVIEWED SCOPE` while deployment controls remain unknown; state that full production readiness was not assessed. When the user asks for a production readiness decision, missing critical deployment evidence can require `INSUFFICIENT EVIDENCE`. Do not silently narrow a production assessment to source-only to obtain a favorable label.

An acceptance record needs the actual decision-maker, date, scope, rationale, conditions, expiration/review date, and evidence of the decision. Do not invent acceptance, owners, deadlines, or legal applicability. Proposed ownership is labeled as a role; unresolved acceptance remains a decision request. Keep accepted risk visible in findings and residual risk. Acceptance does not turn a technical defect into a satisfied control.

## Correction plan

Create one plan table with finding/unknown IDs, priority, specific action, owner or proposed role, effort estimate/range, dependencies, target milestone/date, acceptance test, and status. Include critical `U-###` evidence-gathering tasks alongside fixes, clearly labeled.

Order actions by containment and prerequisite relationships. For example, an exposed credential may require revocation and rotation before removing it from source; deleting a file does not revoke a credential. A tenant-isolation fix must cover relevant background jobs and caches as well as the API guard.

Use lifecycle states `open`, `in-progress`, `fixed-unverified`, `verified-fixed`, `accepted-risk`, or `regressed`. A suggested patch stays `open`. An applied patch stays `fixed-unverified` until its acceptance test passes on the relevant target. If status is not known, say so rather than inventing progress.

Separate a temporary mitigation from the durable fix. Record what risk the mitigation leaves, who will remove it, and the expiry/review condition. Do not automatically downgrade severity merely because a workaround is proposed.

## Sources

- [OWASP ASVS](https://asvs.owasp.org/) — requirement references, with the edition/control actually used recorded in the report.
- [CWE](https://cwe.mitre.org/about/index.html) — weakness classification.
- [FIRST CVSS](https://www.first.org/cvss/) — severity scoring specification.
- [FIRST EPSS](https://www.first.org/epss/) — dated exploitation-probability signal for published CVEs.
- [CISA Known Exploited Vulnerabilities](https://www.cisa.gov/known-exploited-vulnerabilities-catalog) — evidence of known exploitation, when accessible.
