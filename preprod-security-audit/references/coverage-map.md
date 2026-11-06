# Coverage map: 35 domains, nine modules

The original 35 domains describe the assessment surface. They are grouped into seven core module files; AI/agents and installed clients add two conditional modules. A domain is not a separate file, a scanner invocation, or a certification requirement.

Use this matrix when selecting scope or checking coverage. Read the actual controls in the linked modules for applicability, evidence, correction, and retest requirements. Select relevant controls and record unverified/excluded surfaces; a mapped domain is not automatically a completed check. Shared controls represent cross-cutting paths, not additional findings.

| Domain | Original assessment area | Primary module | Principal controls and shared coverage |
| --- | --- | --- | --- |
| 01 | Inventory and exposed surface | [Architecture](modules/architecture.md) | ARCH-001, ARCH-002, ARCH-003, ARCH-016; INFRA-004 for effective exposure. |
| 02 | Architecture and threat scenarios | [Architecture](modules/architecture.md) | ARCH-004, ARCH-008, ARCH-009, ARCH-015, ARCH-018. |
| 03 | Authentication | [Identity and access](modules/identity-access.md) | IAM-003, IAM-004, IAM-005; DATA-009 for credential cryptography. |
| 04 | Account lifecycle | [Identity and access](modules/identity-access.md) | IAM-001, IAM-002, IAM-005, IAM-007. |
| 05 | Authorization | [Identity and access](modules/identity-access.md) | IAM-011, IAM-013, IAM-016; INFRA-018 for fixed authorization constants. |
| 06 | Customer and tenant isolation | [Identity and access](modules/identity-access.md) | IAM-012; ARCH-006, DATA-002, DATA-003, APP-008. |
| 07 | Sessions and tokens | [Identity and access](modules/identity-access.md) | IAM-006, IAM-007, IAM-008. |
| 08 | SSO and federation | [Identity and access](modules/identity-access.md) | IAM-009, IAM-010. |
| 09 | Machine identities and privileged access | [Identity and access](modules/identity-access.md) | IAM-013, IAM-014, IAM-015; INFRA-003, SC-008. |
| 10 | Input validation and injection | [Application and API](modules/application-api.md) | APP-002, APP-003, APP-010, APP-013. |
| 11 | Browser and frontend | [Application and API](modules/application-api.md) | APP-004, APP-005, APP-006, APP-007, APP-020; DATA-017 for client-exposed secrets. |
| 12 | API security | [Application and API](modules/application-api.md) | APP-001, APP-008, APP-018; IAM-011, IAM-012. |
| 13 | Files and document processing | [Application and API](modules/application-api.md) | APP-010, APP-011, APP-012, APP-013; DATA-004. |
| 14 | Outbound access and SSRF | [Application and API](modules/application-api.md) | APP-009, APP-015; INFRA-005, INFRA-017. |
| 15 | Business logic and fraud | [Application and API](modules/application-api.md) | APP-016, APP-017; ARCH-008. |
| 16 | Integrations and webhooks | [Application and API](modules/application-api.md) | APP-014, APP-015; IAM-014, ARCH-011. |
| 17 | Secrets | [Data and secrets](modules/data-secrets.md) | DATA-005, DATA-006, DATA-017; SC-008, SC-015 for pipeline/build exposure. |
| 18 | Cryptography and keys | [Data and secrets](modules/data-secrets.md) | DATA-007, DATA-008, DATA-009, DATA-016. |
| 19 | Personal and sensitive data | [Data and secrets](modules/data-secrets.md) | DATA-001, DATA-010, DATA-011, DATA-013; ARCH-007, ARCH-013. |
| 20 | Databases, caches, and storage | [Data and secrets](modules/data-secrets.md) | DATA-002, DATA-003, DATA-004, DATA-015; INFRA-015. |
| 21 | Indirect disclosure | [Data and secrets](modules/data-secrets.md) | DATA-012, DATA-013; SC-015, OPS-002; CLIENT-004 for installed clients. |
| 22 | Cloud and infrastructure IAM | [Infrastructure and deployment](modules/infrastructure-deployment.md) | INFRA-001, INFRA-002, INFRA-003, INFRA-016. |
| 23 | Network, DNS, and Internet exposure | [Infrastructure and deployment](modules/infrastructure-deployment.md) | INFRA-004, INFRA-005, INFRA-006, INFRA-007; DATA-008. |
| 24 | Hosts, containers, and Kubernetes | [Infrastructure and deployment](modules/infrastructure-deployment.md) | INFRA-009, INFRA-010, INFRA-011, INFRA-012, INFRA-013. |
| 25 | Production configuration and IaC | [Infrastructure and deployment](modules/infrastructure-deployment.md) | INFRA-008, INFRA-014, INFRA-017, INFRA-018, INFRA-019; DATA-017. |
| 26 | Dependencies and components | [Supply chain](modules/supply-chain.md) | SC-002, SC-003, SC-004, SC-005. |
| 27 | Repositories and CI/CD | [Supply chain](modules/supply-chain.md) | SC-001, SC-006, SC-007, SC-008, SC-009, SC-010, SC-011, SC-016, SC-017; pipeline review includes transitive definitions and external settings gaps. |
| 28 | Build and release integrity | [Supply chain](modules/supply-chain.md) | SC-012, SC-013, SC-014, SC-018; distinguish CI success from authorization to deploy the exact artifact. |
| 29 | Availability and cost control | [Operations and resilience](modules/operations-resilience.md) | OPS-004, OPS-005, OPS-007; APP-018, AI-013 where applicable. |
| 30 | Error handling and degraded operation | [Operations and resilience](modules/operations-resilience.md) | OPS-006; APP-019, ARCH-015, INFRA-019. |
| 31 | Logging and detection | [Operations and resilience](modules/operations-resilience.md) | OPS-001, OPS-002, OPS-003. |
| 32 | Backup and restoration | [Operations and resilience](modules/operations-resilience.md) | OPS-008, OPS-009; DATA-014, DATA-016. |
| 33 | Incident response | [Operations and resilience](modules/operations-resilience.md) | OPS-010, OPS-011, OPS-012; IAM-007, DATA-006. |
| 34 | Continuous vulnerability management | [Operations and resilience](modules/operations-resilience.md) | OPS-013; SC-003, SC-004. |
| 35 | Third parties, support, and governance | [Architecture](modules/architecture.md) and [Operations and resilience](modules/operations-resilience.md) | ARCH-012, ARCH-013; OPS-014, OPS-015, INFRA-016, IAM-013. |

## Conditional extensions

- [AI and agents](modules/ai-agents.md): AI-001 through AI-020, selected for actual LLM, RAG, tools, MCP, or delegated-agent surfaces.
- [Mobile, desktop, and browser extensions](modules/mobile-desktop.md): CLIENT-001 through CLIENT-024, selected by platform and delivered artifact.

These extensions supplement the 35-domain map. They do not replace backend, identity, delivery, or operational checks.

## Cross-cutting hardcoded-value review

Treat hardcoded values by consequence and enforcing layer:

- Credential material or unsafe secret fallback: DATA-017, with discovery/history coverage in DATA-005 and propagation into artifacts in SC-015.
- Fixed environment destination, account, region, bucket, or endpoint: INFRA-017.
- Fixed principal, tenant, role, origin, token trust, or security-policy value: INFRA-018 plus the relevant IAM/APP/OPS control.
- Missing settings, overriding values, unsafe defaults, or ambiguous type parsing: INFRA-019.

A constant can be an intentional security boundary. Externalizing it does not by itself reduce risk; making a trusted setting attacker-editable can increase risk. Findings need a reachable security consequence or a demonstrated violation of an applicable requirement.

## Coverage limits

This is a traceability map of original audit controls, not an exhaustive mapping to every requirement in ASVS, CIS, a regulation, or a platform certification. Use the applicable authoritative references and record versions and actual checks in the report.

Specialist areas such as industrial equipment, custom hardware, sector-specific payment certification, or a full legal compliance assessment need separate scope and expertise. Do not mark those areas satisfied because a related general control exists.
