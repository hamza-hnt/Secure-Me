import assert from 'node:assert/strict';
import test from 'node:test';
import { archiveRecord, assertUnpublished, parseVersion, validateRelease, verifyArchive, verifyPublishRuntime } from '../scripts/release.mjs';

const sha = 'a'.repeat(40);
function input(version = '1.2.3') {
  return {
    manifest: { name: 'secureme-test-package', version, repository: { type: 'git', url: 'git+https://github.com/hamza-hnt/Secure-Me.git' } },
    event: { action: 'published', repository: { full_name: 'hamza-hnt/Secure-Me' }, release: { draft: false, tag_name: `v${version}`, prerelease: version.includes('-') } },
    repository: 'hamza-hnt/Secure-Me', eventSha: sha, head: sha, tagCommit: sha, onMain: true,
  };
}

test('stable and prerelease versions map to distinct npm tags', () => {
  assert.equal(validateRelease(input()).distTag, 'latest');
  assert.equal(validateRelease(input('2.0.0-rc.1')).distTag, 'next');
});

test('release source cannot be replaced by a different checkout, moved tag, or unrelated branch', () => {
  for (const change of [{ head: 'b'.repeat(40) }, { tagCommit: 'b'.repeat(40) }, { onMain: false }, { eventSha: 'main' }]) {
    assert.throws(() => validateRelease({ ...input(), ...change }));
  }
});

test('reject mismatched tag, repository, draft, event and prerelease classification', () => {
  const mutations = [
    (i) => { i.event.release.tag_name = 'v9.9.9'; },
    (i) => { i.event.release.prerelease = true; },
    (i) => { i.event.release.draft = true; },
    (i) => { i.event.action = 'edited'; },
    (i) => { i.event.repository.full_name = 'other/repo'; },
    (i) => { i.manifest.repository.url = 'https://github.com/other/repo'; },
    (i) => { i.manifest.private = true; },
    (i) => { i.manifest.publishConfig = { registry: 'https://example.invalid' }; },
    (i) => { i.manifest.publishConfig = { tag: 'next' }; },
    (i) => { i.manifest.publishConfig = { access: 'restricted' }; },
    (i) => { i.manifest.publishConfig = { provenance: false }; },
  ];
  for (const mutate of mutations) {
    const candidate = input();
    mutate(candidate);
    assert.throws(() => validateRelease(candidate));
  }
});

test('canonical SemVer protects release refs and handles prerelease rules', () => {
  for (const version of ['01.2.3', '1.2', '1.2.3-01', '1.2.3\nother=value', '1.2.3;echo x', '../main']) {
    assert.throws(() => parseVersion(version));
  }
  assert.equal(parseVersion('1.2.3-beta.0+build.4').prerelease, 'beta.0');
});

test('artifact verification binds bytes, package, source, version and dist-tag', () => {
  const context = validateRelease(input());
  const bytes = Buffer.from('the exact tested archive');
  const record = archiveRecord(context, bytes);
  verifyArchive(context, record, bytes);
  assert.throws(() => verifyArchive(context, record, Buffer.from('different archive')));
  for (const [key, value] of [['commit', 'b'.repeat(40)], ['version', '9.0.0'], ['name', 'other-package'], ['distTag', 'next']]) {
    assert.throws(() => verifyArchive(context, { ...record, [key]: value }, bytes));
  }
  assert.throws(() => archiveRecord(context, Buffer.alloc(0)));
});

test('OIDC runtime minimums fail closed', () => {
  verifyPublishRuntime('22.14.0', '11.5.1');
  verifyPublishRuntime('24.0.0', '12.0.0');
  for (const [node, npm] of [['22.13.0', '11.5.1'], ['20.20.0', '12.0.0'], ['24.0.0', '11.5.0'], ['24.0.0-rc.1', '11.5.1']]) {
    assert.throws(() => verifyPublishRuntime(node, npm));
  }
});

test('only an explicit registry 404 permits a new version', async () => {
  const context = validateRelease(input());
  let checkedUrl;
  await assertUnpublished(context, async (url) => { checkedUrl = url; return { status: 404 }; });
  assert.equal(checkedUrl, 'https://registry.npmjs.org/secureme-test-package/1.2.3');
  for (const status of [200, 401, 403, 429, 500]) {
    await assert.rejects(assertUnpublished(context, async () => ({ status })));
  }
  await assert.rejects(assertUnpublished(context, async () => { throw new Error('offline'); }));
});
