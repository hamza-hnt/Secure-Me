# Mobile, desktop, and browser-extension clients

Load the relevant platform subsections only when a distributed client is in scope. Apply backend application/identity controls separately; a client-side restriction does not prove server-side authorization.

## Evidence and coverage

- Use `satisfied`, `finding`, `needs-validation`, `not-verified`, or `not-applicable` per control; link the shared `E-###`, `F-###`, and `U-###` registers.
- Identify platform, framework, supported OS/browser versions, build variant, package identity, distribution route, and assessed artifact hash where available.
- Keep source, manifest/build declarations, signed-package observations, device/runtime observations, and vendor documentation distinct. Source review alone does not verify the shipped binary.
- Do not install clients, enroll devices, change OS security settings, intercept real user traffic, or bypass protections without appropriate task scope and authorization.
- Use isolated test devices/profiles and synthetic data where runtime checks are authorized. Document unavailable package, device, or store evidence as a gap.

## Shared client controls

### CLIENT-001 — Release artifact and debug configuration
- Applies: all distributed clients.
- Check/evidence: compare source/build configuration with the supplied package, build identity, debug endpoints, bundled test accounts, and release settings; note unavailable binary evidence.
- Remediate: remove development-only capabilities and secrets, constrain diagnostics, and preserve a release-to-source mapping.
- Retest: inspect the release artifact and verify relevant diagnostics are unavailable or appropriately protected in an isolated run.

### CLIENT-002 — Server authority and public-client secrets
- Applies: clients call protected services or enforce business restrictions.
- Check/evidence: trace server authorization and validation independently of UI checks; distinguish public identifiers from credentials granting privileged access when extracted from the package.
- Remediate: move privileged secrets and authoritative checks to a trusted service; scope unavoidable client credentials to their legitimate public-client role.
- Retest: verify prohibited operations fail at the backend using an approved test client, even when the interface restriction is bypassed.

### CLIENT-003 — Local secrets and sensitive storage
- Applies: tokens, keys, confidential documents, databases, or cached personal data persist on-device.
- Check/evidence: inspect storage APIs, file permissions, platform credential-store use, key access conditions, logout cleanup, and cross-user access; encrypted files do not prove safe key storage.
- Remediate: use suitable platform-protected storage, reduce persisted data, scope filesystem access, and invalidate or remove sensitive state when required.
- Retest: inspect synthetic state before/after logout and under relevant user/device conditions without extracting real credentials.

### CLIENT-004 — Incidental disclosure channels
- Applies: sensitive data can reach logs, crash reports, clipboard, screenshots, notifications, or shared files.
- Check/evidence: trace representative data to those channels and inspect retention/access settings; decide required restrictions from the data and threat context rather than a blanket ban.
- Remediate: redact or remove sensitive content and apply platform controls where the product's confidentiality requirements justify them.
- Retest: exercise the scoped flow with synthetic data and inspect permitted diagnostic and OS surfaces for unexpected copies.

### CLIENT-005 — Network trust and transport
- Applies: clients communicate over a network.
- Check/evidence: inspect TLS trust/hostname validation, cleartext exceptions, proxies, development overrides, and endpoint selection; evaluate pinning only against the stated threat model and operational plan.
- Remediate: restore proper certificate validation, narrow necessary exceptions, and provide safe certificate/key rotation for any justified pinning scheme.
- Retest: use a controlled endpoint/device setup to confirm invalid trust is rejected and legitimate connections survive the supported rotation path.

### CLIENT-006 — Native OAuth and session lifecycle
- Applies: mobile/desktop clients use OAuth or browser-based sign-in.
- Check/evidence: inspect external-browser authorization, PKCE where applicable, state/issuer binding, registered redirects, token storage, refresh, logout, and revocation; packaged static secrets do not make native apps confidential clients.
- Remediate: use the appropriate public-client flow, bind the response to the request, and align token cleanup and revocation with the session design.
- Retest: verify mismatched/expired responses and unintended redirects fail; confirm expected logout and refresh behavior using test identities.

### CLIENT-007 — Local authentication and tamper assumptions
- Applies: biometrics, PINs, device integrity, root/jailbreak checks, or local access gates protect sensitive operations.
- Check/evidence: distinguish convenience UI gates from platform-protected key use and server policy; inspect fallback and biometric-enrollment behavior where relevant.
- Remediate: protect the actual sensitive capability and preserve server authorization; use integrity signals as risk inputs rather than the sole access decision.
- Retest: verify supported fallback, lock, and enrollment-change cases in an approved test setup; do not equate obfuscation with an enforceable trust boundary.

## Mobile controls

### CLIENT-008 — Exported components and platform capabilities
- Applies: Android components/providers or iOS app groups, extensions, entitlements, and cross-app interfaces exist.
- Check/evidence: inspect the merged release manifest or entitlements plus handler code, exported surfaces, caller checks, and file/provider grants; source declarations may differ from packaging.
- Remediate: remove unnecessary exports/capabilities and enforce caller/resource validation on required interfaces.
- Retest: inspect the packaged configuration and use a controlled caller to verify intended access and rejection of unauthorized requests.

### CLIENT-009 — Deep links and incoming intents
- Applies: links, intents, document associations, or URL schemes invoke mobile behavior.
- Check/evidence: inspect domain association, scheme/host/path validation, parameter trust, authentication state, and whether links directly trigger sensitive actions.
- Remediate: validate destinations and input, use verified app links where appropriate, and require the normal authorization/confirmation path for consequential actions.
- Retest: check malformed, unexpected-origin, logged-out, and replayed links using harmless fixtures.

### CLIENT-010 — Embedded web content
- Applies: mobile clients use WebViews or JavaScript/native bridges.
- Check/evidence: inspect allowed navigation, remote content, bridge exposure, file access, mixed content, and message validation for the actual platform/runtime version.
- Remediate: limit content origins and navigation, remove unnecessary bridge methods, and enforce strict input and capability boundaries.
- Retest: use a controlled untrusted page/message to verify native capabilities and private files remain inaccessible.

### CLIENT-011 — Permissions and data collection
- Applies: camera, microphone, location, contacts, media, identifiers, or background access is requested.
- Check/evidence: compare requested permissions and SDK collection with product features, user choices, and confirmed privacy requirements; declaration text alone does not prove runtime behavior.
- Remediate: remove unnecessary permissions/collection, request access in context, and handle denial/revocation safely.
- Retest: verify denied and revoked permissions do not leak data or bypass restrictions and required features fail predictably.

### CLIENT-012 — Backup, lock state, and background disclosure
- Applies: mobile data can enter device/cloud backups, task previews, notifications, widgets, or background tasks.
- Check/evidence: inspect backup rules, data-protection settings, notification content, lock-state behavior, and account switching for relevant data classes.
- Remediate: exclude unsuitable data from backup/display and apply platform protection and lifecycle cleanup appropriate to the sensitivity.
- Retest: inspect synthetic backup/lock/background behavior in an authorized environment; record any unavailable restore evidence.

### CLIENT-013 — Offline state and synchronization
- Applies: clients queue actions or retain data while offline.
- Check/evidence: inspect authorization on reconnection, stale entitlements, account changes, local modifications, conflicts, and replay of queued operations.
- Remediate: revalidate sensitive operations server-side on sync, bind queues to account/tenant, and define safe conflict and revocation handling.
- Retest: queue harmless test actions, change the relevant permission/account, and confirm sync does not execute under stale or different authority.

## Desktop controls

### CLIENT-014 — Renderer and native privilege separation
- Applies: Electron or another desktop framework renders web content with native capabilities.
- Check/evidence: inspect process boundaries, sandboxing, context isolation, Node/native exposure, preload bridges, and remote-content handling for the actual framework version.
- Remediate: isolate untrusted rendering from native privileges and expose only narrowly defined capabilities through reviewed bridges.
- Retest: verify a controlled renderer cannot reach unintended filesystem, process, or network capabilities through exposed interfaces.

### CLIENT-015 — IPC sender and argument validation
- Applies: desktop processes, windows, frames, helpers, or plugins exchange privileged messages.
- Check/evidence: inspect sender/frame checks, channel permissions, schemas, path handling, and authorization at receivers; a trusted channel name does not authenticate its sender.
- Remediate: validate sender identity and each operation's arguments at the privileged receiver; remove generic execute/read/write channels.
- Retest: use isolated invalid-sender and malformed-message cases and confirm no privileged operation occurs.

### CLIENT-016 — Protocol handlers, files, and shell launch
- Applies: desktop apps open URLs/files or invoke commands and external programs.
- Check/evidence: inspect custom protocols, argument parsing, path resolution, file associations, external-open handlers, and shell interpolation.
- Remediate: constrain schemes and destinations, validate paths/arguments, avoid shell interpretation, and require normal authorization for consequential actions.
- Retest: use inert malformed URLs/filenames and mock launches to prove validation without executing arbitrary commands.

### CLIENT-017 — Local listeners and inter-user access
- Applies: the desktop app starts local HTTP/WebSocket/RPC servers or exposes sockets/pipes.
- Check/evidence: inspect binding, authentication, origin checks where relevant, permissions, request validation, and assumptions about localhost; loopback reachability is not caller authentication.
- Remediate: reduce listener exposure and enforce suitable caller authentication and per-operation authorization.
- Retest: use authorized local test processes and origins to confirm unauthorized requests fail; do not probe unrelated local services.

### CLIENT-018 — Installer and update integrity
- Applies: apps install code or receive application/plugin updates outside or through a store.
- Check/evidence: inspect signing/verification, update metadata and artifact integrity, publisher access, downgrade handling, install paths, and failure recovery; signing is not proof that code is safe.
- Remediate: authenticate update artifacts and publishers, protect installation paths, and enforce an appropriate version/rollback policy.
- Retest: use isolated altered/unauthorized update fixtures and confirm rejection without modifying a user's installed application.

### CLIENT-019 — Helpers, privileges, and OS integration
- Applies: elevated helpers, services, drivers, accessibility permissions, startup entries, or broad filesystem access exist.
- Check/evidence: inspect necessity, privileged operations, caller authorization, service permissions, binary loading, and writable search paths; identify platform-specific evidence gaps.
- Remediate: minimize privileged scope, validate requests at helpers, and protect binaries/configuration from less-privileged modification.
- Retest: verify representative denied operations and file permissions in a controlled platform environment; avoid changing host-wide security settings.

## Browser-extension controls

### CLIENT-020 — Extension permission and origin scope
- Applies: browser extensions request API, host, optional, or persistent site permissions.
- Check/evidence: inspect the packaged manifest, runtime permission requests, content-script matches, and features that justify access; distinguish optional from always-granted permissions.
- Remediate: narrow host/API permissions and request additional access only when needed for the intended feature.
- Retest: inspect the installed test profile's grants and verify the extension cannot access unrelated sites or APIs.

### CLIENT-021 — Page-to-extension messaging
- Applies: content scripts, page messages, external extensions, or websites can call extension logic.
- Check/evidence: inspect sender/origin validation, permitted message types, tab/frame binding, data validation, and privileged fetch/action routing.
- Remediate: treat page and content-script input as untrusted; expose narrowly scoped operations with receiver-side checks.
- Retest: use a controlled unrelated page/frame to confirm it cannot request privileged operations or obtain protected extension data.

### CLIENT-022 — Extension execution and exposed resources
- Applies: extensions render remote/page content or expose packaged resources.
- Check/evidence: inspect CSP, dynamic code paths, unsafe DOM sinks, web-accessible resources, external messaging, and remote configuration that can alter behavior.
- Remediate: remove unnecessary execution/exposure, render untrusted content safely, and constrain behavior controlled by remote data.
- Retest: use inert adversarial page/configuration fixtures; verify no unintended execution, privileged navigation, or sensitive resource exposure.

### CLIENT-023 — Native messaging and local bridges
- Applies: browser extensions connect to native hosts or local desktop services.
- Check/evidence: inspect allowed extension identities, host installation permissions, message schemas, native command/file access, and user/account boundaries.
- Remediate: restrict callers and operations on both sides, protect host registration/binaries, and validate all incoming arguments.
- Retest: use a controlled unauthorized extension/process or fixture and verify privileged native actions are rejected.

### CLIENT-024 — Client SDKs and supported versions
- Applies: mobile, desktop, or extension packages bundle runtimes, SDKs, native libraries, or third-party telemetry.
- Check/evidence: inventory shipped versions and permissions, inspect relevant advisories and collection behavior, and identify supported-update paths; repository lockfiles may differ from packaged binaries.
- Remediate: update or remove affected components, constrain collection, and define a viable security-update policy for supported clients.
- Retest: verify the packaged component version and targeted fix; document users/platforms that remain on unsupported or unverified releases.

## Traceability and references

- Add package/build, platform interface, renderer, native helper, extension context, backend, and local-store nodes with inspected artifact links.
- Label evidence-based edges such as `packaged from`, `invokes via IPC`, `stores token in`, `opens URL through`, and `updates from`; cite `E-###` and evidence type.
- Mark unavailable binaries, device observations, stores, and external SDK behavior with `U-###`; connect `F-###` to the affected interface and control, without hidden reasoning.
- Primary references: [OWASP MASVS](https://mas.owasp.org/MASVS/), [Android security checklist](https://developer.android.com/privacy-and-security/security-tips), [Apple Platform Security](https://support.apple.com/guide/security/welcome/web).
- Platform references: [Electron security](https://www.electronjs.org/docs/latest/tutorial/security), [Chrome extension security](https://developer.chrome.com/docs/extensions/develop/security-privacy/stay-secure), [RFC 8252: OAuth for Native Apps](https://www.rfc-editor.org/rfc/rfc8252).
- Consult the relevant platform/version documentation; these original audit controls do not assert full MASVS or platform certification.
