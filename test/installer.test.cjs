'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

// CI can run this suite against the unpacked npm tarball as well as the checkout.
const PACKAGE_ROOT = path.resolve(process.env.SECUREME_PACKAGE_ROOT || path.join(__dirname, '..'));
const CLI = path.join(PACKAGE_ROOT, 'bin', 'secureme.cjs');
const { SKILL_NAME, installSkill, resolveSkillsParent } = require(path.join(PACKAGE_ROOT, 'lib', 'installer.cjs'));
const SOURCE = path.join(PACKAGE_ROOT, SKILL_NAME);

async function workspace(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'secureme test '));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const home = path.join(root, 'custom home');
  const cwd = path.join(root, 'project with spaces');
  await fs.mkdir(home);
  await fs.mkdir(cwd);
  const env = { ...process.env, HOME: home, USERPROFILE: home, CODEX_HOME: path.join(root, 'legacy codex') };
  return { root, home, cwd, env };
}

function cli(args, context) {
  const result = spawnSync(process.execPath, [CLI, ...args], {
    cwd: context.cwd, env: context.env, encoding: 'utf8', timeout: 30_000,
  });
  if (result.error) throw result.error;
  return result;
}

async function exists(file) {
  try { await fs.lstat(file); return true; } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

async function tree(root, relative = '') {
  const output = {};
  for (const entry of (await fs.readdir(path.join(root, relative), { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const name = path.join(relative, entry.name);
    if (entry.isDirectory()) {
      output[name] = 'directory';
      Object.assign(output, await tree(root, name));
    } else {
      assert.ok(entry.isFile(), `Unexpected shipped file type: ${name}`);
      output[name] = (await fs.readFile(path.join(root, name))).toString('base64');
    }
  }
  return output;
}

test('help/default help/version have no installation side effects', async (t) => {
  const context = await workspace(t);
  for (const args of [[], ['help'], ['--help'], ['-h'], ['install', '--help']]) {
    const result = cli(args, context);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Usage: secureme/);
    assert.match(result.stdout, /\.agents\/skills/);
  }
  const { version } = JSON.parse(await fs.readFile(path.join(PACKAGE_ROOT, 'package.json'), 'utf8'));
  for (const flag of ['--version', '-v']) {
    const result = cli([flag], context);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout.trim(), version);
  }
  assert.deepEqual(await fs.readdir(context.home), []);
  assert.deepEqual(await fs.readdir(context.cwd), []);
});

test('invalid commands and flags fail without writing', async (t) => {
  const context = await workspace(t);
  for (const args of [
    ['unknown'], ['--force'], ['help', 'install'], ['--version', 'install'],
    ['install', '--dest'], ['install', '--dest='], ['install', '--dest', '--force'],
    ['install', '--unknown'], ['install', 'unexpected'], ['install', '--force', '--force'],
    ['install', '--dest', 'a', '--dest', 'b'], ['install', '--project', '--dest', 'a'],
  ]) {
    const result = cli(args, context);
    assert.equal(result.status, 1, JSON.stringify(args));
    assert.match(result.stderr, /secureme:/);
  }
  assert.deepEqual(await fs.readdir(context.cwd), []);
  assert.deepEqual(await fs.readdir(context.home), []);
});

test('default install respects HOME, ignores CODEX_HOME and copies the full shipped tree', async (t) => {
  const context = await workspace(t);
  const result = cli(['install'], context);
  assert.equal(result.status, 0, result.stderr);
  const target = path.join(context.home, '.agents', 'skills', SKILL_NAME);
  assert.deepEqual(await tree(target), await tree(SOURCE));
  for (const relative of ['SKILL.md', 'agents/openai.yaml', 'assets/report-template.md', 'references/tooling.md', 'references/modules/supply-chain.md']) {
    assert.ok(await exists(path.join(target, relative)), `Missing packaged skill resource: ${relative}`);
  }
  assert.equal(await exists(context.env.CODEX_HOME), false);
  assert.deepEqual(await fs.readdir(context.cwd), []);
});

test('HOME fallback, USERPROFILE, explicit tilde and relative custom directories resolve predictably', () => {
  const home = path.resolve('home with spaces');
  const cwd = path.resolve('project');
  assert.equal(resolveSkillsParent({}, { cwd, env: {}, home }), path.join(home, '.agents', 'skills'));
  assert.equal(resolveSkillsParent({}, { cwd, env: { USERPROFILE: home }, home: '/unused' }), path.join(home, '.agents', 'skills'));
  assert.equal(resolveSkillsParent({}, { cwd, env: { HOME: home, USERPROFILE: '/unused', CODEX_HOME: '/also-unused' } }), path.join(home, '.agents', 'skills'));
  assert.equal(resolveSkillsParent({ dest: '~/custom skills' }, { cwd, env: { HOME: home } }), path.join(home, 'custom skills'));
  assert.equal(resolveSkillsParent({ dest: 'custom skills' }, { cwd, env: { HOME: home } }), path.join(cwd, 'custom skills'));
});

test('custom destination with spaces and project installation are isolated', async (t) => {
  const context = await workspace(t);
  const parent = path.join(context.root, 'custom skills parent');
  let result = cli(['install', '--dest', parent], context);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(await tree(path.join(parent, SKILL_NAME)), await tree(SOURCE));
  result = cli(['install', '--project'], context);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(await tree(path.join(context.cwd, '.agents', 'skills', SKILL_NAME)), await tree(SOURCE));
  result = cli(['install', '--dest=another skills parent'], context);
  assert.equal(result.status, 0, result.stderr);
  assert.ok(await exists(path.join(context.cwd, 'another skills parent', SKILL_NAME, 'SKILL.md')));
  assert.deepEqual(await fs.readdir(context.home), []);
});

test('identical installs leave file timestamps and sibling content unchanged', async (t) => {
  const context = await workspace(t);
  const parent = path.join(context.root, 'skills');
  assert.equal(cli(['install', '--dest', parent], context).status, 0);
  const target = path.join(parent, SKILL_NAME);
  const entry = path.join(target, 'SKILL.md');
  const past = new Date('2001-01-01T00:00:00Z');
  await fs.utimes(entry, past, past);
  await fs.writeFile(path.join(parent, 'keep.txt'), 'unrelated');
  const before = (await fs.stat(entry)).mtimeMs;
  for (const flag of [[], ['--force']]) {
    const result = cli(['install', '--dest', parent, ...flag], context);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Already up to date/);
    assert.equal((await fs.stat(entry)).mtimeMs, before);
  }
  assert.deepEqual((await fs.readdir(parent)).sort(), ['keep.txt', SKILL_NAME].sort());
  assert.equal(await fs.readFile(path.join(parent, 'keep.txt'), 'utf8'), 'unrelated');
});

test('different existing content is refused; force retains an exact backup including extra files', async (t) => {
  const context = await workspace(t);
  const parent = path.join(context.root, 'skills');
  const target = path.join(parent, SKILL_NAME);
  await fs.mkdir(path.join(target, 'personal notes'), { recursive: true });
  await fs.writeFile(path.join(target, 'SKILL.md'), 'user edits');
  await fs.writeFile(path.join(target, 'personal notes', 'notes.md'), 'keep this');
  const original = await tree(target);
  let result = cli(['install', '--dest', parent], context);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /preserved.*--force/);
  assert.deepEqual(await tree(target), original);
  result = cli(['install', '--dest', parent, '--force'], context);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(await tree(target), await tree(SOURCE));
  const backups = (await fs.readdir(context.root)).filter((name) => name.startsWith(`.secureme-backup-${SKILL_NAME}-`));
  assert.equal(backups.length, 1);
  const backup = path.join(context.root, backups[0], SKILL_NAME);
  assert.deepEqual(await tree(backup), original);
  assert.ok(result.stdout.includes(await fs.realpath(backup)));
  assert.deepEqual(await fs.readdir(parent), [SKILL_NAME], 'A backup must not become another discoverable skill');
  assert.ok(path.relative(parent, backup).startsWith(`..${path.sep}`));
});

test('dry-run creates no parent, stage, backup or lock and preserves different existing content', async (t) => {
  const context = await workspace(t);
  const parent = path.join(context.root, 'does not exist', 'skills');
  let result = cli(['install', '--dest', parent, '--dry-run'], context);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Dry run: Install/);
  assert.equal(await exists(path.dirname(parent)), false);
  const target = path.join(parent, SKILL_NAME);
  await fs.mkdir(target, { recursive: true });
  await fs.writeFile(path.join(target, 'notes.txt'), 'personal');
  const original = await tree(parent);
  result = cli(['install', '--dest', parent, '--dry-run'], context);
  assert.equal(result.status, 1);
  result = cli(['install', '--dest', parent, '--force', '--dry-run'], context);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Dry run: Replace with a backup/);
  assert.deepEqual(await tree(parent), original);
});

test('symlink targets, nested links, and symlink skills parents are rejected without changing external content', async (t) => {
  const context = await workspace(t);
  const external = path.join(context.root, 'external');
  await fs.mkdir(external);
  await fs.writeFile(path.join(external, 'keep.txt'), 'external data');
  const parent = path.join(context.root, 'skills');
  await fs.mkdir(parent);
  const target = path.join(parent, SKILL_NAME);
  await fs.symlink(external, target, 'junction');
  for (const flags of [[], ['--force'], ['--force', '--dry-run']]) {
    const result = cli(['install', '--dest', parent, ...flags], context);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /symbolic link/);
  }
  await fs.unlink(target);
  await fs.mkdir(target);
  await fs.symlink(external, path.join(target, 'nested'), 'junction');
  assert.equal(cli(['install', '--dest', parent, '--force'], context).status, 1);
  const linkedParent = path.join(context.root, 'linked parent');
  await fs.symlink(external, linkedParent, 'junction');
  assert.equal(cli(['install', '--dest', linkedParent, '--force'], context).status, 1);
  assert.deepEqual(await fs.readdir(external), ['keep.txt']);
  assert.equal(await fs.readFile(path.join(external, 'keep.txt'), 'utf8'), 'external data');
});

test('file targets and overlapping source locations are refused', async (t) => {
  const context = await workspace(t);
  const parent = path.join(context.root, 'skills');
  await fs.mkdir(parent);
  await fs.writeFile(path.join(parent, SKILL_NAME), 'user file');
  assert.equal(cli(['install', '--dest', parent, '--force'], context).status, 1);
  assert.equal(await fs.readFile(path.join(parent, SKILL_NAME), 'utf8'), 'user file');
  for (const destination of [PACKAGE_ROOT, path.join(SOURCE, 'nested')]) {
    const result = cli(['install', '--dest', destination, '--force', '--dry-run'], context);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /overlap/);
  }
  const alias = path.join(context.root, 'source alias');
  await fs.symlink(SOURCE, alias, 'junction');
  const nested = path.join(alias, 'must not be created');
  const result = cli(['install', '--dest', nested], context);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /overlap/);
  assert.equal(await exists(nested), false);
});

test('a pre-existing installation lock is preserved and blocks changes', async (t) => {
  const context = await workspace(t);
  const parent = path.join(context.root, 'skills');
  const lock = path.join(parent, `.${SKILL_NAME}.install-lock`);
  await fs.mkdir(lock, { recursive: true });
  await fs.writeFile(path.join(lock, 'owner'), 'another process');
  const result = cli(['install', '--dest', parent], context);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Another installation/);
  assert.equal(await fs.readFile(path.join(lock, 'owner'), 'utf8'), 'another process');
  assert.equal(await exists(path.join(parent, SKILL_NAME)), false);
});

test('a failed staged replacement rolls back the original and removes only its temporary paths', async (t) => {
  const context = await workspace(t);
  const parent = path.join(context.root, 'skills');
  const target = path.join(parent, SKILL_NAME);
  await fs.mkdir(target, { recursive: true });
  await fs.writeFile(path.join(target, 'custom.txt'), 'must survive');
  await fs.writeFile(path.join(parent, 'sibling.txt'), 'also survives');
  const original = await tree(parent);
  const rename = fs.rename;
  const mocked = t.mock.method(fs, 'rename', async (from, to) => {
    if (path.basename(from).startsWith(`.${SKILL_NAME}.stage-`)) throw new Error('Simulated staged rename failure');
    return rename(from, to);
  });
  await assert.rejects(installSkill({ source: SOURCE, parent, force: true }), /Simulated staged rename failure/);
  mocked.mock.restore();
  assert.deepEqual(await tree(parent), original);
  assert.equal((await fs.readdir(context.root)).some((name) => name.startsWith('.secureme-backup-')), false);
});

test('an incomplete package or linked source is refused before destination creation', async (t) => {
  const context = await workspace(t);
  const source = path.join(context.root, 'incomplete source');
  const parent = path.join(context.root, 'new skills');
  await fs.mkdir(source);
  await fs.writeFile(path.join(source, 'README.md'), 'not a skill');
  await assert.rejects(installSkill({ source, parent }), /missing.*SKILL\.md/);
  assert.equal(await exists(parent), false);
  await fs.writeFile(path.join(source, 'SKILL.md'), 'skill');
  const external = path.join(context.root, 'external source');
  await fs.mkdir(external);
  await fs.symlink(external, path.join(source, 'linked source'), 'junction');
  await assert.rejects(installSkill({ source, parent }), /symbolic link/);
  assert.equal(await exists(parent), false);
});

test('a staging write failure leaves the existing installation and sibling files intact', async (t) => {
  const context = await workspace(t);
  const parent = path.join(context.root, 'skills');
  const target = path.join(parent, SKILL_NAME);
  await fs.mkdir(target, { recursive: true });
  await fs.writeFile(path.join(target, 'custom.md'), 'user content');
  await fs.writeFile(path.join(parent, 'sibling.txt'), 'unrelated');
  const original = await tree(parent);
  const writeFile = fs.writeFile;
  const mocked = t.mock.method(fs, 'writeFile', async (file, ...args) => {
    if (String(file).includes(`.${SKILL_NAME}.stage-`)) throw new Error('Simulated disk write failure');
    return writeFile(file, ...args);
  });
  await assert.rejects(installSkill({ source: SOURCE, parent, force: true }), /Simulated disk write failure/);
  mocked.mock.restore();
  assert.deepEqual(await tree(parent), original);
});
