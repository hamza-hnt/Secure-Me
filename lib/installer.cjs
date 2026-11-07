'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');

const SKILL_NAME = 'preprod-security-audit';
const HELP = `Usage: secureme <command> [options]

Commands:
  install              Copy the complete security audit skill into a skills directory
  export               Create a ZIP for manual upload to Claude Desktop or claude.ai
  help, --help, -h      Show this help
  --version, -v        Show the package version

Install options:
  --agent <name>       codex (default) or claude-code
  --dest <directory>   Use a custom skills parent directory
  --project            Install under the current directory for the selected agent
  --force              Replace a different installation, keeping a complete backup
  --dry-run            Describe the result without writing any files

Codex uses ~/.agents/skills, or .agents/skills with --project. CODEX_HOME does not
override it. Claude Code uses ~/.claude/skills, or .claude/skills with --project.
For personal Claude installs, an absolute CLAUDE_CONFIG_DIR overrides ~/.claude.
Home resolves from HOME, then USERPROFILE; Claude on Windows prefers USERPROFILE.
--dest overrides the agent's destination; --project ignores personal config paths.
An identical installation is left unchanged. Existing different content is preserved
unless --force is supplied. This command never runs scanners or installs dependencies.
Backups are placed alongside the skills parent, outside its skill discovery tree.

Export options:
  --output <file.zip>  Output ZIP (default: secure-me-claude-desktop.zip in cwd)
  --dry-run            Validate the export without writing any files
Identical ZIPs are unchanged; different existing files are preserved and refused.
`;

function parseArgs(args) {
  if (!args.length) return { command: 'help' };
  if (['help', '--help', '-h', '--version', '-v'].includes(args[0])) {
    if (args.length !== 1) throw new Error('Unexpected arguments after help or version.');
    return { command: ['--version', '-v'].includes(args[0]) ? 'version' : 'help' };
  }
  const command = args[0];
  if (!['install', 'export'].includes(command)) throw new Error(`Unknown command: ${command}. Use secureme --help.`);
  const options = { command };
  const valueFlags = command === 'install' ? { '--dest': 'dest', '--agent': 'agent' } : { '--output': 'output' };
  const booleanFlags = command === 'install'
    ? { '--project': 'project', '--force': 'force', '--dry-run': 'dryRun' }
    : { '--dry-run': 'dryRun' };
  for (let i = 1; i < args.length; i++) {
    const flag = args[i];
    if (['--help', '-h'].includes(flag) && args.length === 2) return { command: 'help' };
    const name = flag.split('=', 1)[0];
    if (Object.hasOwn(valueFlags, name)) {
      const key = valueFlags[name];
      if (options[key] !== undefined) throw new Error(`${name} may only be supplied once.`);
      const value = flag === name ? args[++i] : flag.slice(name.length + 1);
      if (!value || value.startsWith('-')) throw new Error(`${name} requires a value.`);
      options[key] = value;
    } else if (Object.hasOwn(booleanFlags, flag)) {
      const key = booleanFlags[flag];
      if (options[key]) throw new Error(`${flag} may only be supplied once.`);
      options[key] = true;
    } else {
      throw new Error(`Unknown ${command} option: ${flag}. Use secureme --help.`);
    }
  }
  if (options.dest !== undefined && options.project) throw new Error('Use either --dest or --project, not both.');
  if (command === 'install') {
    options.agent ??= 'codex';
    if (!['codex', 'claude-code'].includes(options.agent)) throw new Error('Unknown agent. Choose codex or claude-code.');
  }
  return options;
}

function resolveUserPath(value, cwd, home) {
  const expanded = value === '~' ? home : value.replace(/^~[\\/]/, () => `${home}${path.sep}`);
  return path.resolve(cwd, expanded);
}

function resolveSkillsParent(options, { cwd = process.cwd(), env = process.env, home = os.homedir(), platform = process.platform } = {}) {
  const agent = options.agent ?? 'codex';
  if (!['codex', 'claude-code'].includes(agent)) throw new Error('Unknown agent. Choose codex or claude-code.');
  const pathHome = env.HOME || env.USERPROFILE || home;
  if (options.dest !== undefined) return resolveUserPath(options.dest, cwd, pathHome);
  const userHome = agent === 'claude-code' && platform === 'win32'
    ? env.USERPROFILE || env.HOME || home
    : pathHome;
  const configFolder = agent === 'claude-code' ? '.claude' : '.agents';
  if (options.project) return path.resolve(cwd, configFolder, 'skills');
  if (agent === 'claude-code' && env.CLAUDE_CONFIG_DIR) {
    if (!path.isAbsolute(env.CLAUDE_CONFIG_DIR)) throw new Error('CLAUDE_CONFIG_DIR must be an absolute path; use --dest for an explicit skills directory.');
    return path.join(env.CLAUDE_CONFIG_DIR, 'skills');
  }
  return path.resolve(userHome, configFolder, 'skills');
}

async function statIfPresent(file) {
  try {
    return await fs.lstat(file);
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

async function resolvedLocation(file) {
  if (await statIfPresent(file)) return fs.realpath(file);
  const parent = path.dirname(file);
  if (parent === file) throw new Error(`Cannot resolve installation filesystem root: ${file}`);
  return path.join(await resolvedLocation(parent), path.basename(file));
}

async function readTree(root) {
  const tree = new Map();
  async function walk(relative = '') {
    const full = path.join(root, relative);
    const stat = await fs.lstat(full);
    if (stat.isSymbolicLink()) throw new Error(`Refusing symbolic link: ${full}`);
    if (stat.isDirectory()) {
      tree.set(relative, { type: 'directory' });
      for (const name of (await fs.readdir(full)).sort()) await walk(path.join(relative, name));
    } else if (stat.isFile()) {
      tree.set(relative, { type: 'file', data: await fs.readFile(full), mode: stat.mode & 0o777 });
    } else {
      throw new Error(`Refusing unsupported file type: ${full}`);
    }
  }
  await walk();
  if (tree.get('')?.type !== 'directory') throw new Error(`Expected a directory: ${root}`);
  return tree;
}

function treesEqual(left, right) {
  return left.size === right.size && [...left].every(([name, entry]) => {
    const other = right.get(name);
    return other?.type === entry.type && (entry.type === 'directory' || entry.data.equals(other.data));
  });
}

function within(parent, child) {
  const relative = path.relative(parent, child);
  return relative === '' || (relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
}

async function inspectTarget(target, sourceTree, force) {
  const stat = await statIfPresent(target);
  if (!stat) return 'installed';
  if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error(`Refusing non-directory or symbolic link target: ${target}`);
  if (treesEqual(sourceTree, await readTree(target))) return 'unchanged';
  if (!force) throw new Error(`Existing skill differs: ${target}. Your files were preserved. Use --force to replace it with a backup.`);
  return 'replaced';
}

async function installSkill({ source, parent, force = false, dryRun = false }) {
  source = path.resolve(source);
  parent = path.resolve(parent);
  const target = path.join(parent, SKILL_NAME);
  if (path.dirname(target) !== parent || within(source, target) || within(target, source)) {
    throw new Error('The installation target must stay inside its skills parent and must not overlap the package source.');
  }
  const sourceTree = await readTree(source);
  if (sourceTree.get('SKILL.md')?.type !== 'file') throw new Error('The package is missing its skill entry point (SKILL.md).');
  const parentStat = await statIfPresent(parent);
  if (parentStat && (parentStat.isSymbolicLink() || !parentStat.isDirectory())) {
    throw new Error(`Refusing non-directory or symbolic link skills parent: ${parent}`);
  }
  const canonicalParent = await resolvedLocation(parent);
  const canonicalSource = await fs.realpath(source);
  const canonicalTarget = path.join(canonicalParent, SKILL_NAME);
  if (within(canonicalSource, canonicalTarget) || within(canonicalTarget, canonicalSource)) {
    throw new Error('The resolved installation location overlaps the package source.');
  }
  const before = await inspectTarget(target, sourceTree, force);
  if (before === 'replaced' && path.dirname(canonicalParent) === canonicalParent) {
    throw new Error('Cannot place a backup outside a filesystem-root skills parent. Choose a dedicated skills directory.');
  }
  if (dryRun || before === 'unchanged') return { status: before, target, dryRun };

  await fs.mkdir(parent, { recursive: true });
  if (await fs.realpath(parent) !== canonicalParent) throw new Error('The skills parent changed during installation.');
  const lock = path.join(parent, `.${SKILL_NAME}.install-lock`);
  try {
    await fs.mkdir(lock);
  } catch (error) {
    if (error.code === 'EEXIST') throw new Error(`Another installation may be running: ${lock}. Inspect any interrupted install before removing this lock.`);
    throw error;
  }
  let stage;
  let backupRoot;
  let backup;
  try {
    const status = await inspectTarget(target, sourceTree, force);
    if (status === 'unchanged') return { status, target, dryRun: false };
    if (status === 'replaced' && path.dirname(canonicalParent) === canonicalParent) {
      throw new Error('Cannot place a backup outside a filesystem-root skills parent. Choose a dedicated skills directory.');
    }
    stage = await fs.mkdtemp(path.join(parent, `.${SKILL_NAME}.stage-`));
    for (const [relative, entry] of sourceTree) {
      if (!relative) continue;
      const file = path.join(stage, relative);
      if (entry.type === 'directory') await fs.mkdir(file);
      else await fs.writeFile(file, entry.data, { flag: 'wx', mode: entry.mode });
    }
    if (await fs.realpath(parent) !== canonicalParent) throw new Error('The skills parent changed during installation.');
    await inspectTarget(target, sourceTree, force);
    if (status === 'replaced') {
      backupRoot = await fs.mkdtemp(path.join(path.dirname(canonicalParent), `.secureme-backup-${SKILL_NAME}-`));
      backup = path.join(backupRoot, SKILL_NAME);
      await fs.rename(target, backup);
    }
    try {
      if (await statIfPresent(target)) throw new Error('The target changed during installation; refusing to overwrite it.');
      await fs.rename(stage, target);
      stage = undefined;
    } catch (error) {
      if (backup && await statIfPresent(backup)) {
        try {
          if (await statIfPresent(target)) throw new Error('Another target now exists.');
          await fs.rename(backup, target);
          backup = undefined;
        } catch (rollbackError) {
          throw new Error(`${error.message} Rollback could not complete: ${rollbackError.message} Original files remain at ${backup}.`);
        }
      }
      throw error;
    }
    return { status, target, backup, dryRun: false };
  } finally {
    if (stage) await fs.rm(stage, { recursive: true, force: true });
    if (backupRoot && !(backup && await statIfPresent(backup))) await fs.rmdir(backupRoot);
    await fs.rmdir(lock);
  }
}

async function run(args, { packageRoot, cwd = process.cwd(), env = process.env, stdout = process.stdout } = {}) {
  const options = parseArgs(args);
  if (options.command === 'help') {
    stdout.write(HELP);
    return;
  }
  if (options.command === 'version') {
    const metadata = JSON.parse(await fs.readFile(path.join(packageRoot, 'package.json'), 'utf8'));
    stdout.write(`${metadata.version}\n`);
    return;
  }
  if (options.command === 'export') {
    const { exportDesktopSkill, DEFAULT_ARCHIVE_NAME } = require('./desktop-archive.cjs');
    const result = await exportDesktopSkill({
      source: path.join(packageRoot, SKILL_NAME),
      output: resolveUserPath(options.output ?? DEFAULT_ARCHIVE_NAME, cwd, env.HOME || env.USERPROFILE || os.homedir()),
      dryRun: options.dryRun,
    });
    const verb = result.status === 'unchanged' ? 'Already up to date' : result.dryRun ? 'Export' : 'Exported';
    stdout.write(`${result.dryRun ? 'Dry run: ' : ''}${verb}: ${result.target}\n`);
    return result;
  }
  const result = await installSkill({
    source: path.join(packageRoot, SKILL_NAME),
    parent: resolveSkillsParent(options, { cwd, env }),
    force: options.force,
    dryRun: options.dryRun,
  });
  const verb = { installed: 'Install', replaced: 'Replace with a backup', unchanged: 'Already up to date' }[result.status];
  stdout.write(`${result.dryRun ? 'Dry run: ' : ''}${verb}: ${result.target}\n`);
  if (result.backup) stdout.write(`Previous installation preserved at: ${result.backup}\n`);
  return result;
}

module.exports = { SKILL_NAME, parseArgs, resolveSkillsParent, installSkill, run };
