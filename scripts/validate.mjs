import assert from 'node:assert/strict';
import { lstat, readFile, readdir, access } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const skill = join(root, 'preprod-security-audit');
async function files(directory) {
  const output = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = join(directory, entry.name);
    assert.ok(!entry.isSymbolicLink(), `Do not publish symlinks: ${file}`);
    if (entry.isDirectory()) output.push(...await files(file));
    else output.push(file);
  }
  return output;
}
const skillFiles = await files(skill);
const entrypoint = await readFile(join(skill, 'SKILL.md'), 'utf8');
assert.match(entrypoint, /^---\r?\nname: preprod-security-audit\r?\ndescription: .+\r?\n---/u);
const metadata = await readFile(join(skill, 'agents', 'openai.yaml'), 'utf8');
assert.ok(metadata.includes('$preprod-security-audit'), 'UI prompt must name the installed skill.');

const controls = new Set();
for (const file of skillFiles.filter((file) => /[/\\]modules[/\\].+\.md$/u.test(file))) {
  for (const match of (await readFile(file, 'utf8')).matchAll(/^### ([A-Z]+-\d{3})\b/gmu)) {
    assert.ok(!controls.has(match[1]), `Duplicate control ${match[1]}`);
    controls.add(match[1]);
  }
}
assert.ok(controls.size > 0, 'No audit controls found.');
const documents = [...skillFiles.filter((file) => file.endsWith('.md')), join(root, 'README.md')];
const docsDir = join(root, 'docs');
try { documents.push(...(await files(docsDir)).filter((file) => file.endsWith('.md'))); } catch (error) { if (error.code !== 'ENOENT') throw error; }
let linkCount = 0;
for (const file of documents) {
  const text = await readFile(file, 'utf8');
  for (const [control] of text.matchAll(/\b(?:ARCH|IAM|APP|DATA|INFRA|SC|OPS|AI|CLIENT)-\d{3}\b/gu)) assert.ok(controls.has(control), `Unknown ${control} in ${file}`);
  for (const match of text.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/gu)) {
    const target = match[1];
    if (/^[a-z][a-z\d+.-]*:/iu.test(target)) continue;
    const [location, anchor] = target.split('#');
    const destination = location ? resolve(dirname(file), decodeURIComponent(location)) : file;
    await access(destination);
    if (anchor && destination.endsWith('.md')) {
      const body = await readFile(destination, 'utf8');
      const slugs = [...body.matchAll(/^#{1,6}\s+(.+)$/gmu)].map((heading) => heading[1].toLowerCase().replace(/[^\p{L}\p{N}_ -]/gu, '').replaceAll(' ', '-'));
      assert.ok(slugs.includes(anchor), `Missing anchor ${target} in ${file}`);
    }
    linkCount++;
  }
}
const manifest = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
assert.equal(manifest.bin.secureme, 'bin/secureme.cjs');
for (const folder of ['bin', 'lib']) for (const file of await files(join(root, folder))) assert.ok((await lstat(file)).isFile());
console.log(`Validated ${controls.size} audit controls, ${skillFiles.length} skill files and ${linkCount} local links.`);
