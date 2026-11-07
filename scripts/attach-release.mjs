import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { lstat, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseVersion } from './release.mjs';

const assetNames = ['secure-me-claude-desktop.zip', 'SHA256SUMS'];
const runGh = (args) => execFileSync('gh', args, { maxBuffer: 25 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });

// Run only after release.mjs verify-artifacts has bound these files to the tested commit.
// All existing intended assets are checked before any missing asset is uploaded.
export async function attachReleaseAssets({ repository, tag, directory = '.artifacts', gh = runGh }) {
  assert.match(repository, /^[\w.-]+\/[\w.-]+$/, 'Expected a GitHub owner/repository.');
  assert.equal(typeof tag, 'string', 'Expected a release tag.');
  assert.ok(tag.startsWith('v'), 'Expected a v<version> release tag.');
  parseVersion(tag.slice(1));
  const local = [];
  for (const name of assetNames) {
    const file = resolve(directory, name);
    const stat = await lstat(file);
    assert.ok(stat.isFile() && !stat.isSymbolicLink(), `Expected a regular local asset: ${name}`);
    local.push({ name, file, bytes: await readFile(file) });
  }
  const metadata = await gh(['api', `repos/${repository}/releases/tags/${encodeURIComponent(tag)}`]);
  const release = JSON.parse(metadata.toString());
  assert.equal(release.tag_name, tag, 'GitHub returned a different release.');
  assert.equal(release.draft, false, 'Refusing to attach assets to a draft release.');
  assert.ok(Array.isArray(release.assets), 'GitHub did not return an asset inventory.');
  const missing = [];
  const unchanged = [];
  for (const asset of local) {
    const matches = release.assets.filter((remote) => remote.name === asset.name);
    assert.ok(matches.length <= 1, `Duplicate remote asset name: ${asset.name}`);
    if (!matches.length) {
      missing.push(asset);
      continue;
    }
    const remote = matches[0];
    assert.ok(Number.isSafeInteger(remote.id) && remote.id > 0, 'Invalid release asset ID.');
    const bytes = await gh(['api', `repos/${repository}/releases/assets/${remote.id}`, '-H', 'Accept: application/octet-stream']);
    assert.ok(Buffer.isBuffer(bytes) && asset.bytes.equals(bytes), `Existing release asset differs: ${asset.name}. Nothing was overwritten.`);
    unchanged.push(asset.name);
  }
  if (missing.length) {
    // No --clobber: a racing uploader fails safely and can be checked on the next run.
    await gh(['release', 'upload', tag, ...missing.map((asset) => asset.file), '--repo', repository]);
  }
  return { uploaded: missing.map((asset) => asset.name), unchanged };
}

async function main() {
  let tag = process.env.RELEASE_TAG;
  if (!tag) {
    const event = JSON.parse(await readFile(process.env.GITHUB_EVENT_PATH, 'utf8'));
    tag = event.release?.tag_name;
  }
  const result = await attachReleaseAssets({ repository: process.env.GITHUB_REPOSITORY, tag });
  console.log(`Release assets ready: ${result.uploaded.length} uploaded, ${result.unchanged.length} already matching.`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
