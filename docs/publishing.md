# Publishing secure-me-skill

The package is published from [hamza-hnt/Secure-Me](https://github.com/hamza-hnt/Secure-Me) by [publish.yml](https://github.com/hamza-hnt/Secure-Me/blob/main/.github/workflows/publish.yml) when a GitHub release is **published**. The workflow uses npm OIDC trusted publishing and a tested archive. It does not use a stored npm token, repack in the publish job, or silently accept an already-published version.

## One-time setup

The npm package must already exist before its owner can configure a trusted publisher in its package settings. If `secure-me-skill` has not been published yet, complete the bootstrap below first. Creating the workflow file alone does not configure npm or the GitHub environment.

Create the GitHub environment **`npm`** in this repository. Select deployment branches and tags, then add a **Tag** rule with the pattern **`v*`**. This repository's environment is configured that way. Configure required reviewers separately if the release process calls for them; those settings are external to the YAML. The publish job uses this environment, while validation and tests use read-only repository permissions.

In the npm package's settings, add this GitHub Actions trusted publisher:

| Setting | Value |
| --- | --- |
| Organization or user | `hamza-hnt` |
| Repository | `Secure-Me` |
| Workflow filename | `publish.yml` — filename only |
| Environment | `npm` |
| Direct publishing | Enable **Allow npm publish** / `allow-publish` |

Alternatively, an authenticated package owner using npm 12 can configure the same publisher through the CLI:

```sh
npm trust github secure-me-skill --file publish.yml --repo hamza-hnt/Secure-Me --env npm --allow-publish --yes
```

The workflow invokes `npm publish` directly, so a stage-only publisher is insufficient. Do not add `NPM_TOKEN` or `NODE_AUTH_TOKEN` to the workflow or environment; the verification step rejects nonempty values. The publisher job has `id-token: write` and runs on a GitHub-hosted Linux runner. The configured package repository must match this GitHub repository. See npm's [trusted publishing configuration](https://docs.npmjs.com/trusted-publishers/).

New trusted publisher configurations must complete their first successful publish within two days under npm's current rules; recreate an expired configuration before retrying. The workflow requests provenance for the public package/public repository. See [npm trusted publisher expiry](https://docs.npmjs.com/trusted-publishers/#trusted-publisher-configuration-expiry) and [provenance documentation](https://docs.npmjs.com/generating-provenance-statements/).

## Bootstrap the first package

Bootstrap is a one-time maintainer operation using an authenticated npm account with publication rights and its required interactive authentication. No automation token needs to be saved in GitHub.

From the intended committed source on `main`, using Node.js 22 or newer:

```sh
npm ci --ignore-scripts
npm test
npm run test:package
npm run validate
```

Inspect the package-test result and `.artifacts/package.tgz`. The package test checks the archive metadata, allowlisted files, size, installation, CLI shim, and installed skill behavior. Publish those exact bytes through the maintainer's local npm session:

```sh
npm login
npm publish .artifacts/package.tgz --access public --ignore-scripts --tag latest
```

This local bootstrap does not claim the GitHub workflow's OIDC provenance. It creates the package so its owner can configure the trusted publisher. A practical sequence is a manual **`0.1.0`** bootstrap, followed by a new **`0.1.1`** version released automatically after configuration. These are example milestones, not claims that either version is already published.

Do not create or rerun an automatic `v0.1.0` publication after manually publishing `0.1.0`: the workflow deliberately rejects an existing npm version. Use a new version for the first automated release.

## Prepare an automated release

1. Update `package.json` and `package-lock.json` to the same new SemVer version. Keep the repository URL and public npm registry configuration intact.
2. Run the local checks above and merge the release commit into `main` through the repository's normal review process.
3. Create a tag exactly **`v<package.version>`** on that commit. A tag-only push does not publish npm; publish a GitHub release for the tag.
4. Match the GitHub release's prerelease checkbox to the package version: `0.1.1` is stable; `0.2.0-rc.1` is a prerelease.
5. Observe the release validation, all nine tests, any configured `npm` environment review, and the publication result. Confirm the npm version, channel, and provenance after success.

The validated commit must be reachable from `origin/main`; it need not remain the branch tip. Checkout `HEAD`, the release event SHA, and the tag's resolved commit must be identical. A moved tag, unrelated branch commit, repository mismatch, or conflicting release channel/configuration fails verification.

| Release type | Example tag | GitHub prerelease | npm dist-tag |
| --- | --- | --- | --- |
| Stable | `v0.1.1` | No | `latest` |
| Prerelease | `v0.2.0-rc.1` | Yes | `next` |

The workflow does not promote an existing prerelease by retagging it. Release a new version through the same checks.

## How the tested archive reaches npm

[test.yml](https://github.com/hamza-hnt/Secure-Me/blob/main/.github/workflows/test.yml) runs `ubuntu-latest`, `macos-latest`, and `windows-latest`, each on Node.js **22, 24, and 26**: nine jobs. Every job runs:

```sh
npm ci --ignore-scripts
npm test
npm run test:package
npm run validate
```

The package has no runtime or development dependencies. Its installer uses Node.js built-ins. The archive includes the CLI, skill tree, README, and package metadata; artwork, publishing docs, tests, and workflow sources are excluded. The package test enforces a 512 KiB compressed-size ceiling.

The Linux/Node 24 job preserves `.artifacts/package.tgz` only after testing the packed installation. It records `.artifacts/release.json` with package identity, version, repository, exact commit/tag, intended npm channel, and the archive's SHA-256. Both files are uploaded as `npm-release-<run_id>` and retained for seven days.

Publication depends on the entire test matrix succeeding. The publish job downloads that run's artifact and recomputes its record before publication. It revalidates the release source, requires compatible stable Node/npm versions and OIDC availability, and checks the public npm registry for the exact package version. Only an explicit HTTP 404 permits publication; an existing version, authorization error, rate limit, or unavailable registry fails the job.

The final command publishes the downloaded archive with `--ignore-scripts`, `--access public`, `--provenance`, the explicit public registry, and the validated `latest` or `next` channel. It does not repack from the publish checkout. The local SHA-256 release record and npm provenance are distinct evidence: the former checks transfer integrity within this run; the latter records publication provenance.

Consumer installation requires Node.js 22+. Publication uses Node.js 24 and separately verifies Node.js >=22.14.0 and npm >=11.5.1 for OIDC support. A consumer's runtime requirement is not the publisher's npm requirement.

## Failures and reruns

- **Existing version:** inspect npm to determine whether a previous attempt completed. The workflow will not silently turn that into success or alter its dist-tag. Use a new version for new contents.
- **Wrong tag or source:** correct the release plan; preserve published version identities. Verification rejects a tag whose commit changed relative to the event.
- **Authentication or stage-only rejection:** check the exact trusted-publisher fields, `npm` environment, direct-publish permission, configuration expiry, and OIDC permission. Do not add a token as a fallback.
- **Failed matrix job:** rerun failed jobs after investigating the failure. Artifact names use the stable run ID; a rerun of the Linux/Node 24 job replaces that run's artifact with its newly tested archive. A publish-only retry uses the already-tested artifact for the same run.
- **Expired or missing artifact:** rerun the full workflow to regenerate and retest the archive. Do not rebuild an untested replacement in the publish job.
- **Archive verification or registry error:** investigate and rerun the affected checks without bypassing the digest or unpublished-version gate.

The repository defines these checks; a successful local run is not evidence that the hosted matrix or publication has completed. Keep the GitHub run and npm publication result as the release evidence.
