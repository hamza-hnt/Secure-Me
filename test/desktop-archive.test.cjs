'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const test = require('node:test');
const PACKAGE_ROOT = path.resolve(process.env.SECUREME_PACKAGE_ROOT || path.join(__dirname, '..'));
const { DEFAULT_ARCHIVE_NAME, exportDesktopSkill } = require(path.join(PACKAGE_ROOT, 'lib', 'desktop-archive.cjs'));

const entrypoint = '---\nname: preprod-security-audit\ndescription: Audit security before production.\n---\n# Audit\n';
async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'secureme-desktop-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const source = path.join(root, 'source');
  await fs.mkdir(path.join(source, 'assets'), { recursive: true });
  await fs.mkdir(path.join(source, 'references', 'modules'), { recursive: true });
  await fs.mkdir(path.join(source, 'agents'), { recursive: true });
  await fs.writeFile(path.join(source, 'SKILL.md'), entrypoint);
  await fs.writeFile(path.join(source, 'assets', 'report.md'), 'report\n');
  await fs.writeFile(path.join(source, 'references', 'modules', 'audit.md'), Buffer.from([0, 1, 127, 255]));
  await fs.writeFile(path.join(source, 'agents', 'openai.yaml'), 'codex-only\n');
  return { root, source, output: path.join(root, DEFAULT_ARCHIVE_NAME) };
}

// Independent bitwise CRC implementation and ZIP reader (no production helpers).
function referenceCrc(data) {
  let crc = -1;
  for (const byte of data) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ -1) >>> 0;
}

function decode(zip) {
  const end = zip.length - 22;
  assert.equal(zip.readUInt32LE(end), 0x06054b50);
  assert.equal(zip.readUInt16LE(end + 4), 0);
  assert.equal(zip.readUInt16LE(end + 6), 0);
  assert.equal(zip.readUInt16LE(end + 20), 0);
  const count = zip.readUInt16LE(end + 10);
  assert.equal(zip.readUInt16LE(end + 8), count);
  const start = zip.readUInt32LE(end + 16);
  assert.equal(start + zip.readUInt32LE(end + 12), end);
  let cursor = start;
  const files = new Map();
  for (let i = 0; i < count; i++) {
    assert.equal(zip.readUInt32LE(cursor), 0x02014b50);
    assert.equal(zip.readUInt16LE(cursor + 8), 0x800);
    assert.equal(zip.readUInt16LE(cursor + 10), 0); // stored
    assert.equal(zip.readUInt16LE(cursor + 12), 0); // stable time
    assert.equal(zip.readUInt16LE(cursor + 14), 33); // 1980-01-01
    const size = zip.readUInt32LE(cursor + 24);
    assert.equal(zip.readUInt32LE(cursor + 20), size);
    const nameLength = zip.readUInt16LE(cursor + 28);
    const name = zip.subarray(cursor + 46, cursor + 46 + nameLength).toString('utf8');
    assert.ok(!files.has(name));
    assert.ok(name.startsWith('preprod-security-audit/'));
    assert.ok(!name.split('/').includes('..') && !name.includes('\\'));
    const local = zip.readUInt32LE(cursor + 42);
    assert.equal(zip.readUInt32LE(local), 0x04034b50);
    assert.equal(zip.readUInt16LE(local + 6), 0x800);
    assert.equal(zip.readUInt16LE(local + 8), 0);
    assert.equal(zip.readUInt32LE(local + 22), size);
    assert.equal(zip.readUInt16LE(local + 26), nameLength);
    assert.equal(zip.subarray(local + 30, local + 30 + nameLength).toString('utf8'), name);
    const data = zip.subarray(local + 30 + nameLength, local + 30 + nameLength + size);
    assert.equal(referenceCrc(data), zip.readUInt32LE(cursor + 16));
    assert.equal(referenceCrc(data), zip.readUInt32LE(local + 14));
    files.set(name, data);
    cursor += 46 + nameLength + zip.readUInt16LE(cursor + 30) + zip.readUInt16LE(cursor + 32);
  }
  assert.equal(cursor, end);
  return files;
}

test('ZIP inventory, bytes, metadata and CRC are portable and complete without Codex agents', async (t) => {
  const input = await fixture(t);
  assert.deepEqual(await exportDesktopSkill(input), { status: 'exported', target: input.output, dryRun: false });
  const files = decode(await fs.readFile(input.output));
  assert.deepEqual([...files.keys()], [
    'preprod-security-audit/', 'preprod-security-audit/SKILL.md', 'preprod-security-audit/assets/',
    'preprod-security-audit/assets/report.md', 'preprod-security-audit/references/',
    'preprod-security-audit/references/modules/', 'preprod-security-audit/references/modules/audit.md',
  ]);
  assert.equal(files.get('preprod-security-audit/SKILL.md').toString(), entrypoint);
  assert.deepEqual(files.get('preprod-security-audit/references/modules/audit.md'), Buffer.from([0, 1, 127, 255]));
});

test('the shipped skill exports every portable file with identical bytes', async (t) => {
  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'secureme-shipped-desktop-'));
  t.after(() => fs.rm(temporary, { recursive: true, force: true }));
  const source = path.join(PACKAGE_ROOT, 'preprod-security-audit');
  const output = path.join(temporary, DEFAULT_ARCHIVE_NAME);
  const expected = new Map();
  async function inventory(directory, relative = '') {
    for (const item of await fs.readdir(directory, { withFileTypes: true })) {
      const name = relative ? `${relative}/${item.name}` : item.name;
      if (name === 'agents') continue;
      const full = path.join(directory, item.name);
      if (item.isDirectory()) await inventory(full, name);
      else {
        assert.ok(item.isFile(), `Unexpected shipped entry: ${name}`);
        expected.set(`preprod-security-audit/${name}`, await fs.readFile(full));
      }
    }
  }
  await inventory(source);
  await exportDesktopSkill({ source, output });
  const actual = new Map([...decode(await fs.readFile(output))].filter(([name]) => !name.endsWith('/')));
  assert.ok(expected.has('preprod-security-audit/SKILL.md'));
  assert.ok(expected.has('preprod-security-audit/assets/report-template.md'));
  assert.ok(expected.has('preprod-security-audit/references/coverage-map.md'));
  assert.deepEqual([...actual.keys()].sort(), [...expected.keys()].sort());
  for (const [name, bytes] of expected) assert.deepEqual(actual.get(name), bytes, name);
  assert.ok(![...actual.keys()].some((name) => name.includes('/agents/')));
});

test('exports are byte-identical despite timestamps and file modes; existing identical output is untouched', async (t) => {
  const input = await fixture(t);
  await exportDesktopSkill(input);
  const before = await fs.stat(input.output);
  await fs.utimes(path.join(input.source, 'SKILL.md'), 1600000000, 1600000000);
  await fs.chmod(path.join(input.source, 'SKILL.md'), 0o600);
  const second = path.join(input.root, 'second.zip');
  await exportDesktopSkill({ ...input, output: second });
  assert.deepEqual(await fs.readFile(input.output), await fs.readFile(second));
  assert.equal((await exportDesktopSkill(input)).status, 'unchanged');
  assert.equal((await fs.stat(input.output)).mtimeMs, before.mtimeMs);
});

test('dry run writes no archive or parent directories; conflicting output is preserved', async (t) => {
  const input = await fixture(t);
  const output = path.join(input.root, 'missing', 'result.zip');
  assert.equal((await exportDesktopSkill({ ...input, output, dryRun: true })).status, 'exported');
  await assert.rejects(fs.stat(path.dirname(output)), { code: 'ENOENT' });
  await fs.writeFile(input.output, 'keep me');
  await assert.rejects(exportDesktopSkill(input), /differs/);
  await assert.rejects(exportDesktopSkill({ ...input, dryRun: true }), /differs/);
  assert.equal(await fs.readFile(input.output, 'utf8'), 'keep me');
});

test('source overlap, missing portable directories, and invalid frontmatter are refused', async (t) => {
  const input = await fixture(t);
  await assert.rejects(exportDesktopSkill({ ...input, output: path.join(input.source, 'archive.zip') }), /overlap/);
  for (const contents of ['# no frontmatter', entrypoint.replace('preprod-security-audit', 'wrong-name'), entrypoint.replace('Audit security before production.', 'x'.repeat(201)), entrypoint.replace('Audit security before production.', "''")]) {
    await fs.writeFile(path.join(input.source, 'SKILL.md'), contents);
    await assert.rejects(exportDesktopSkill(input));
  }
  await fs.writeFile(path.join(input.source, 'SKILL.md'), entrypoint);
  await fs.rm(path.join(input.source, 'assets'), { recursive: true });
  await assert.rejects(exportDesktopSkill(input), /missing its assets/);
});

test('symbolic source files, output symlinks and aliased source overlap are refused', async (t) => {
  const input = await fixture(t);
  const link = path.join(input.source, 'references', 'linked.md');
  try { await fs.symlink(path.join(input.source, 'SKILL.md'), link); } catch (error) {
    if (error.code === 'EPERM') return t.skip('Host does not permit creating symbolic links.');
    throw error;
  }
  await assert.rejects(exportDesktopSkill(input), /symbolic link/);
  await fs.unlink(link);
  await fs.symlink(path.join(input.source, 'SKILL.md'), input.output);
  await assert.rejects(exportDesktopSkill(input), /symbolic link/);
  await fs.unlink(input.output);
  const alias = path.join(input.root, 'alias');
  await fs.symlink(input.source, alias, process.platform === 'win32' ? 'junction' : 'dir');
  await assert.rejects(exportDesktopSkill({ ...input, output: path.join(alias, 'archive.zip') }), /overlap/);
});

test('backslash traversal filenames and special files are refused', { skip: process.platform === 'win32' }, async (t) => {
  const input = await fixture(t);
  const unsafe = path.join(input.source, 'references', '..\\escaped.md');
  await fs.writeFile(unsafe, 'no');
  await assert.rejects(exportDesktopSkill(input), /non-portable/);
  await fs.unlink(unsafe);
  const fifo = path.join(input.source, 'references', 'pipe');
  execFileSync('mkfifo', [fifo]);
  await assert.rejects(exportDesktopSkill(input), /unsupported file type/);
});
