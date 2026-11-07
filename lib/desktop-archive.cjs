'use strict';

const fs = require('node:fs/promises');
const { constants } = require('node:fs');
const path = require('node:path');

const DEFAULT_ARCHIVE_NAME = 'secure-me-claude-desktop.zip';
const SKILL_NAME = 'preprod-security-audit';
const MAX_ARCHIVE_BYTES = 20 * 1024 * 1024;

async function statIfPresent(file) {
  try { return await fs.lstat(file); } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

async function resolvedLocation(file) {
  if (await statIfPresent(file)) return fs.realpath(file);
  return path.join(await resolvedLocation(path.dirname(file)), path.basename(file));
}

function within(parent, child) {
  const relative = path.relative(parent, child);
  return relative === '' || (!path.isAbsolute(relative) && relative !== '..' && !relative.startsWith(`..${path.sep}`));
}

function validateName(name) {
  if (!name || name === '.' || name === '..' || /[\\/:*?"<>|\x00-\x1f]/.test(name) || /[. ]$/.test(name) || /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(name)) {
    throw new Error(`Refusing a non-portable archive path component: ${name}`);
  }
}

function frontmatterScalar(raw) {
  const value = raw.trim();
  if (value.startsWith('"')) {
    const parsed = JSON.parse(value);
    if (typeof parsed !== 'string') throw new Error('Expected a string in SKILL.md frontmatter.');
    return parsed;
  }
  if (/^'(?:[^']|'')*'$/.test(value)) return value.slice(1, -1).replace(/''/g, "'");
  if (!value || /^[\[\]{}>|&*!%@`'"?-]/.test(value) || /:\s|(?:^|\s)#/.test(value)) {
    throw new Error('Desktop export requires single-line scalar name and description frontmatter.');
  }
  return value;
}

function validateSkill(data) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(data.toString('utf8'));
  if (!match) throw new Error('SKILL.md must start with YAML frontmatter.');
  const fields = {};
  for (const field of ['name', 'description']) {
    const lines = match[1].split(/\r?\n/).filter((line) => line.startsWith(`${field}:`));
    if (lines.length !== 1) throw new Error(`SKILL.md requires exactly one ${field} field.`);
    fields[field] = frontmatterScalar(lines[0].slice(field.length + 1));
  }
  if (fields.name !== SKILL_NAME) throw new Error(`SKILL.md name must match ${SKILL_NAME}.`);
  if (!fields.description.trim() || /[\r\n]/.test(fields.description) || [...fields.description].length > 200) {
    throw new Error('Claude Desktop requires a nonempty description of at most 200 characters.');
  }
}

async function readPortableTree(source) {
  const entries = [];
  let totalBytes = 0;
  async function walk(relative = '') {
    const full = path.join(source, ...relative.split('/').filter(Boolean));
    const stat = await fs.lstat(full);
    if (stat.isSymbolicLink() || (!stat.isDirectory() && !stat.isFile())) throw new Error(`Refusing symbolic link or unsupported file type: ${full}`);
    if (!relative && !stat.isDirectory()) throw new Error('The skill source must be a directory.');
    const omitted = relative === 'agents' || relative.startsWith('agents/');
    if (stat.isDirectory()) {
      if (!omitted) entries.push({ name: `${SKILL_NAME}/${relative ? `${relative}/` : ''}`, data: Buffer.alloc(0), directory: true });
      const names = (await fs.readdir(full)).sort();
      const portableNames = new Set();
      for (const name of names) {
        validateName(name);
        const key = name.normalize('NFC').toLowerCase();
        if (portableNames.has(key)) throw new Error(`Refusing ambiguous archive filenames in ${full}`);
        portableNames.add(key);
        await walk(relative ? `${relative}/${name}` : name);
      }
    } else if (!omitted) {
      totalBytes += stat.size;
      if (totalBytes > MAX_ARCHIVE_BYTES) throw new Error('The desktop skill is too large for this lightweight ZIP exporter.');
      const handle = await fs.open(full, constants.O_RDONLY | (constants.O_NOFOLLOW || 0));
      let data;
      try {
        const opened = await handle.stat();
        if (!opened.isFile() || opened.dev !== stat.dev || opened.ino !== stat.ino) throw new Error(`Source file changed while exporting: ${full}`);
        data = await handle.readFile();
      } finally { await handle.close(); }
      if (data.length !== stat.size) throw new Error(`Source file changed while exporting: ${full}`);
      entries.push({ name: `${SKILL_NAME}/${relative}`, data, directory: false });
    }
  }
  await walk();
  const entry = entries.find((item) => item.name === `${SKILL_NAME}/SKILL.md` && !item.directory);
  if (!entry) throw new Error('The skill is missing SKILL.md.');
  validateSkill(entry.data);
  for (const directory of ['assets', 'references']) {
    if (!entries.some((item) => item.directory && item.name === `${SKILL_NAME}/${directory}/`)) throw new Error(`The skill is missing its ${directory} directory.`);
  }
  return entries.sort((a, b) => Buffer.compare(Buffer.from(a.name), Buffer.from(b.name)));
}

const crcTable = Uint32Array.from({ length: 256 }, (_, value) => {
  for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});

function crc32(data) {
  let crc = 0xffffffff;
  for (const byte of data) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

// ZIP32, stored entries, UTF-8 names, fixed 1980-01-01 timestamps and permissions.
// Format: https://pkware.cachefly.net/webdocs/casestudies/APPNOTE.TXT
function zip(entries) {
  if (entries.length >= 0xffff) throw new Error('Too many files for the desktop ZIP format.');
  const local = [];
  const central = [];
  let offset = 0;
  let centralSize = 0;
  for (const entry of entries) {
    const name = Buffer.from(entry.name);
    if (name.length > 0xffff) throw new Error('Archive path is too long.');
    const crc = crc32(entry.data);
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(0x800, 6);
    header.writeUInt16LE(33, 12);
    header.writeUInt32LE(crc, 14);
    header.writeUInt32LE(entry.data.length, 18);
    header.writeUInt32LE(entry.data.length, 22);
    header.writeUInt16LE(name.length, 26);
    const directory = Buffer.alloc(46);
    directory.writeUInt32LE(0x02014b50, 0);
    directory.writeUInt16LE(0x0314, 4);
    header.copy(directory, 6, 4, 30);
    directory.writeUInt32LE(((entry.directory ? 0o40755 : 0o100644) * 0x10000 + (entry.directory ? 0x10 : 0)) >>> 0, 38);
    directory.writeUInt32LE(offset, 42);
    local.push(header, name, entry.data);
    central.push(directory, name);
    offset += header.length + name.length + entry.data.length;
    centralSize += directory.length + name.length;
    if (offset + centralSize + 22 > MAX_ARCHIVE_BYTES) throw new Error('The desktop ZIP exceeds the 20 MiB export limit.');
  }
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...local, ...central, end]);
}

async function inspectOutput(target, data) {
  const stat = await statIfPresent(target);
  if (!stat) return 'exported';
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`Refusing non-file or symbolic link output: ${target}`);
  if ((await fs.readFile(target)).equals(data)) return 'unchanged';
  throw new Error(`Existing archive differs: ${target}. Your file was preserved; choose another output path.`);
}

async function exportDesktopSkill({ source, output, dryRun = false }) {
  source = path.resolve(source);
  const target = path.resolve(output);
  if (within(source, target) || within(target, source)) throw new Error('The archive output must not overlap the skill source.');
  const entries = await readPortableTree(source);
  const canonicalSource = await fs.realpath(source);
  const parent = path.dirname(target);
  const canonicalParent = await resolvedLocation(parent);
  const canonicalTarget = path.join(canonicalParent, path.basename(target));
  if (within(canonicalSource, canonicalTarget) || within(canonicalTarget, canonicalSource)) throw new Error('The resolved archive output overlaps the skill source.');
  const data = zip(entries);
  const status = await inspectOutput(target, data);
  if (dryRun || status === 'unchanged') return { status, target, dryRun };
  await fs.mkdir(parent, { recursive: true });
  if (await fs.realpath(parent) !== canonicalParent) throw new Error('The output directory changed during export.');
  // Exclusive creation refuses a competing writer or a newly introduced symlink.
  await fs.writeFile(target, data, { flag: 'wx', mode: 0o600 });
  return { status: 'exported', target, dryRun: false };
}

module.exports = { DEFAULT_ARCHIVE_NAME, exportDesktopSkill };
