import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const npmCli = process.env.npm_execpath;
assert.ok(npmCli, 'Run this check with npm run test:package.');
const temp = await mkdtemp(join(tmpdir(), 'secureme package '));

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root, encoding: 'utf8', timeout: 120_000, maxBuffer: 10 * 1024 * 1024,
    ...options,
  });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, `${command} ${args.join(' ')}\n${result.stdout}\n${result.stderr}`);
  return result.stdout;
}

try {
  const userConfig = join(temp, 'user.npmrc');
  const globalConfig = join(temp, 'global.npmrc');
  await writeFile(userConfig, '');
  await writeFile(globalConfig, '');
  const env = {
    ...process.env,
    npm_config_userconfig: userConfig,
    npm_config_globalconfig: globalConfig,
    npm_config_cache: join(temp, 'npm-cache'),
    npm_config_update_notifier: 'false',
  };
  const npm = (args, options = {}) => run(process.execPath, [npmCli, ...args], { env, ...options });
  const packResult = JSON.parse(npm(['pack', '--json', '--ignore-scripts', '--pack-destination', temp]));
  // npm 11 returns an array; npm 12 keys results by package name.
  const packages = Array.isArray(packResult) ? packResult : Object.values(packResult);
  assert.equal(packages.length, 1, 'Expected exactly one packed archive.');
  const [packed] = packages;
  assert.equal(packed.name, manifest.name);
  assert.equal(packed.version, manifest.version);
  assert.equal(basename(packed.filename), packed.filename);
  assert.ok(packed.size < 512 * 1024, 'The skill package unexpectedly exceeds 512 KiB. Keep README artwork and development tools out of the archive.');
  for (const { path } of packed.files) {
    assert.match(path, /^(?:package\.json|README\.md|(?:bin|lib|preprod-security-audit)\/[^\0]+)$/u, `Unexpected published file: ${path}`);
    assert.ok(!path.split('/').some((part) => ['.git', '.npmrc', 'node_modules', '..', 'security-audits'].includes(part)));
  }

  const consumer = join(temp, 'consumer with spaces');
  await mkdir(consumer);
  await writeFile(join(consumer, 'package.json'), '{"name":"secureme-install-check","private":true}\n');
  const archive = join(temp, packed.filename);
  npm(['install', '--offline', '--ignore-scripts', '--no-audit', '--no-fund', '--no-package-lock', archive], { cwd: consumer });
  const installedRoot = join(consumer, 'node_modules', manifest.name);
  const installed = JSON.parse(await readFile(join(installedRoot, 'package.json'), 'utf8'));
  for (const key of ['name', 'version', 'repository', 'bin']) assert.deepEqual(installed[key], manifest[key], `Packed ${key} differs from source.`);
  assert.deepEqual(installed.dependencies ?? {}, {}, 'The installer must have no runtime dependencies.');
  for (const hook of ['preinstall', 'install', 'postinstall', 'prepare']) assert.equal(installed.scripts?.[hook], undefined, `Unexpected lifecycle hook: ${hook}`);

  // Exercise npm's actual executable shim, including .cmd generation on Windows.
  assert.equal(npm(['exec', '--offline', '--', 'secureme', '--version'], { cwd: consumer }).trim(), manifest.version);
  const destination = join(temp, 'CLI target with spaces');
  npm(['exec', '--offline', '--', 'secureme', 'install', '--dest', destination], { cwd: consumer });
  assert.equal(await readFile(join(destination, 'preprod-security-audit', 'SKILL.md'), 'utf8'), await readFile(join(root, 'preprod-security-audit', 'SKILL.md'), 'utf8'));
  const suiteOutput = run(process.execPath, ['--test', join(root, 'test', 'installer.test.cjs')], {
    cwd: consumer, env: { ...env, SECUREME_PACKAGE_ROOT: installedRoot },
  });
  process.stdout.write(suiteOutput);

  // Only a fully tested archive is made available to the release workflow.
  await mkdir(join(root, '.artifacts'), { recursive: true });
  await copyFile(archive, join(root, '.artifacts', 'package.tgz'));
  console.log(`Tested ${manifest.name}@${manifest.version}: ${packed.files.length} packed files, ${packed.size} bytes. Archive: .artifacts/package.tgz`);
} finally {
  await rm(temp, { recursive: true, force: true });
}
