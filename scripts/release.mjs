import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { appendFile, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const registry = 'https://registry.npmjs.org';
const archivePath = '.artifacts/package.tgz';
const recordPath = '.artifacts/release.json';
const commitPattern = /^[a-f0-9]{40}$/;

export function parseVersion(version) {
  assert.equal(typeof version, 'string', 'A package version is required.');
  const match = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([\da-zA-Z-]+(?:\.[\da-zA-Z-]+)*))?(?:\+[\da-zA-Z-]+(?:\.[\da-zA-Z-]+)*)?$/.exec(version);
  assert.ok(match, 'Version must be valid SemVer.');
  const prerelease = match[4] ?? '';
  assert.ok(!prerelease.split('.').some((part) => /^0\d+$/.test(part)), 'Numeric prerelease identifiers cannot have leading zeros.');
  return { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]), prerelease };
}

function repositoryName(repository) {
  const url = typeof repository === 'string' ? repository : repository?.url;
  assert.equal(typeof url, 'string', 'package.json must identify its GitHub repository.');
  const match = /^(?:git\+)?https:\/\/github\.com\/([\w.-]+\/[\w.-]+?)(?:\.git)?\/?$/.exec(url);
  assert.ok(match, 'Use the canonical HTTPS GitHub repository URL in package.json.');
  return match[1].toLowerCase();
}

export function validateRelease({ manifest, event, repository, eventSha, head, tagCommit, onMain }) {
  assert.equal(event.action, 'published', 'Only a published GitHub release can publish npm.');
  assert.equal(event.release?.draft, false, 'Draft releases cannot publish npm.');
  assert.match(repository, /^[\w.-]+\/[\w.-]+$/, 'Invalid GitHub repository identity.');
  assert.equal(event.repository?.full_name?.toLowerCase(), repository.toLowerCase(), 'Release repository does not match the workflow.');
  assert.equal(repositoryName(manifest.repository), repository.toLowerCase(), 'Package repository does not match the workflow.');
  assert.equal(manifest.private === true, false, 'A private package cannot be published by this workflow.');
  assert.match(manifest.name ?? '', /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/, 'Invalid npm package name.');
  assert.ok(manifest.name.length <= 214, 'Invalid npm package name length.');
  const version = parseVersion(manifest.version);
  const tag = `v${manifest.version}`;
  assert.equal(event.release.tag_name, tag, 'Release tag must equal v<package.version>.');
  assert.equal(event.release.prerelease, Boolean(version.prerelease), 'GitHub prerelease status must match the package version.');
  const distTag = version.prerelease ? 'next' : 'latest';
  assert.match(eventSha, commitPattern, 'Expected a full commit SHA from the release event.');
  assert.equal(head, eventSha, 'Checkout does not match the release event commit.');
  assert.equal(tagCommit, eventSha, 'Release tag does not resolve to the tested event commit.');
  assert.equal(onMain, true, 'Release commit must belong to origin/main.');
  if (manifest.publishConfig?.registry) {
    assert.equal(manifest.publishConfig.registry.replace(/\/$/, ''), registry, 'Unexpected publish registry.');
  }
  if (manifest.publishConfig?.tag) {
    assert.equal(manifest.publishConfig.tag, distTag, 'publishConfig.tag conflicts with the release channel.');
  }
  if (manifest.publishConfig?.access) {
    assert.equal(manifest.publishConfig.access, 'public', 'This workflow publishes a public package.');
  }
  assert.notEqual(manifest.publishConfig?.provenance, false, 'Package configuration must not disable release provenance.');
  return {
    schema: 1,
    name: manifest.name,
    version: manifest.version,
    repository: repository.toLowerCase(),
    commit: eventSha,
    tag,
    distTag,
  };
}

const git = (...args) => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

async function releaseContext() {
  assert.equal(process.env.GITHUB_EVENT_NAME, 'release', 'Expected the release event.');
  const manifest = JSON.parse(await readFile('package.json', 'utf8'));
  const event = JSON.parse(await readFile(process.env.GITHUB_EVENT_PATH, 'utf8'));
  // Validate the tag before using it as a Git revision. Arguments never enter a shell.
  parseVersion(manifest.version);
  assert.equal(event.release?.tag_name, `v${manifest.version}`, 'Release tag must equal v<package.version>.');
  const head = git('rev-parse', '--verify', 'HEAD');
  const tagCommit = git('rev-parse', '--verify', `refs/tags/v${manifest.version}^{commit}`);
  const main = git('rev-parse', '--verify', 'refs/remotes/origin/main');
  let onMain = false;
  try {
    git('merge-base', '--is-ancestor', head, main);
    onMain = true;
  } catch (error) {
    if (error.status !== 1) throw error;
  }
  return validateRelease({ manifest, event, repository: process.env.GITHUB_REPOSITORY, eventSha: process.env.GITHUB_SHA, head, tagCommit, onMain });
}

export function archiveRecord(context, archive) {
  assert.ok(archive.length > 0, 'The tested archive is empty.');
  return { ...context, sha256: createHash('sha256').update(archive).digest('hex') };
}

export function verifyArchive(context, record, archive) {
  assert.deepEqual(record, archiveRecord(context, archive), 'Release archive identity or content changed after testing.');
}

export function verifyPublishRuntime(nodeVersion, npmVersion) {
  const node = parseVersion(nodeVersion);
  const npm = parseVersion(npmVersion);
  assert.ok(node.major > 22 || (node.major === 22 && node.minor >= 14), 'npm OIDC requires Node >=22.14.0.');
  assert.ok(npm.major > 11 || (npm.major === 11 && (npm.minor > 5 || (npm.minor === 5 && npm.patch >= 1))), 'npm OIDC requires npm >=11.5.1.');
  assert.equal(Boolean(node.prerelease || npm.prerelease), false, 'Use stable Node and npm releases for publishing.');
}

export async function assertUnpublished(context, fetchImpl = fetch) {
  const url = `${registry}/${encodeURIComponent(context.name)}/${encodeURIComponent(context.version)}`;
  const response = await fetchImpl(url, { redirect: 'error', signal: AbortSignal.timeout(15000) });
  assert.notEqual(response.status, 200, 'This package version is already published; never silently republish or retag it.');
  assert.equal(response.status, 404, `Cannot establish unpublished status (registry HTTP ${response.status}).`);
}

async function main(command) {
  assert.ok(['check', 'record', 'verify'].includes(command), 'Usage: node scripts/release.mjs check|record|verify');
  const context = await releaseContext();
  if (command === 'check') {
    assert.ok(process.env.GITHUB_OUTPUT, 'GITHUB_OUTPUT is required.');
    await appendFile(process.env.GITHUB_OUTPUT, `commit=${context.commit}\ndist-tag=${context.distTag}\n`);
  } else {
    const archive = await readFile(archivePath);
    if (command === 'record') {
      await writeFile(recordPath, `${JSON.stringify(archiveRecord(context, archive), null, 2)}\n`, { flag: 'wx' });
    } else {
      const record = JSON.parse(await readFile(recordPath, 'utf8'));
      verifyArchive(context, record, archive);
      const npmVersion = execFileSync('npm', ['--version'], { encoding: 'utf8' }).trim();
      verifyPublishRuntime(process.versions.node, npmVersion);
      assert.ok(process.env.ACTIONS_ID_TOKEN_REQUEST_URL && process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN, 'GitHub OIDC permission is required.');
      assert.ok(!process.env.NODE_AUTH_TOKEN && !process.env.NPM_TOKEN, 'Publishing must use OIDC, not a stored npm token.');
      await assertUnpublished(context);
    }
  }
  console.log(`Release ${context.tag}: ${command} passed (${context.commit}, npm tag ${context.distTag}).`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main(process.argv[2]).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
