import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { attachReleaseAssets } from '../scripts/attach-release.mjs';

const zipName = 'secure-me-claude-desktop.zip';
const checksumName = 'SHA256SUMS';
const payloads = { [zipName]: Buffer.from([0, 80, 75, 255]), [checksumName]: Buffer.from('verified-checksum\n') };

async function setup(t, assets = []) {
  const directory = await mkdtemp(join(tmpdir(), 'secureme-attachments-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  for (const [name, data] of Object.entries(payloads)) await writeFile(join(directory, name), data);
  const calls = [];
  const options = {
    directory, repository: 'hamza-hnt/Secure-Me', tag: 'v0.2.0',
    gh: async (args) => {
      calls.push(args);
      if (args[0] === 'release') return Buffer.alloc(0);
      if (args[1].includes('/tags/')) return Buffer.from(JSON.stringify({ tag_name: 'v0.2.0', draft: false, assets }));
      const remote = assets.find((asset) => args[1].endsWith(`/${asset.id}`));
      assert.deepEqual(args.slice(2), ['-H', 'Accept: application/octet-stream']);
      assert.ok(remote, 'Unexpected download');
      return remote.bytes ?? payloads[remote.name];
    },
  };
  return { options, calls };
}

test('already complete attachments are compared byte-for-byte and unrelated assets are preserved', async (t) => {
  const { options, calls } = await setup(t, [{ id: 1, name: zipName }, { id: 2, name: checksumName }, { id: 3, name: 'other.txt' }]);
  assert.deepEqual(await attachReleaseAssets(options), { uploaded: [], unchanged: [zipName, checksumName] });
  assert.equal(calls.length, 3);
  assert.ok(calls.every((args) => args[0] === 'api'));
});

test('a partial previous upload resumes with only the missing checksum and no clobber', async (t) => {
  const { options, calls } = await setup(t, [{ id: 1, name: zipName }]);
  assert.deepEqual(await attachReleaseAssets(options), { uploaded: [checksumName], unchanged: [zipName] });
  assert.deepEqual(calls.at(-1), ['release', 'upload', 'v0.2.0', join(options.directory, checksumName), '--repo', 'hamza-hnt/Secure-Me']);
  assert.ok(!calls.flat().includes('--clobber'));
});

test('all intended existing assets are validated before uploading even the first missing asset', async (t) => {
  const { options, calls } = await setup(t, [{ id: 2, name: checksumName, bytes: Buffer.from('different') }]);
  await assert.rejects(attachReleaseAssets(options), /differs/);
  assert.ok(calls.every((args) => args[0] === 'api'));
});

test('failed remote lookup or asset download never starts an upload', async (t) => {
  for (const failDownload of [false, true]) {
    const { options, calls } = await setup(t, [{ id: 1, name: zipName }]);
    const previous = options.gh;
    options.gh = async (args) => {
      if (!failDownload || args[1].includes('/assets/')) throw new Error('remote unavailable');
      return previous(args);
    };
    await assert.rejects(attachReleaseAssets(options), /remote unavailable/);
    assert.ok(calls.every((args) => args[0] === 'api'));
  }
});

test('a new release uploads exactly the two intended local files', async (t) => {
  const { options, calls } = await setup(t);
  assert.deepEqual(await attachReleaseAssets(options), { uploaded: [zipName, checksumName], unchanged: [] });
  assert.deepEqual(calls.at(-1), ['release', 'upload', 'v0.2.0', join(options.directory, zipName), join(options.directory, checksumName), '--repo', 'hamza-hnt/Secure-Me']);
});

test('invalid repository/tag input is rejected before using gh', async (t) => {
  const { options, calls } = await setup(t);
  await assert.rejects(attachReleaseAssets({ ...options, repository: '../other/repo' }));
  await assert.rejects(attachReleaseAssets({ ...options, tag: 'v1.0.0;echo unsafe' }));
  assert.equal(calls.length, 0);
});
