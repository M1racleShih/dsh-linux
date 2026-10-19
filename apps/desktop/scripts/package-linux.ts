/** Build the community Linux distribution without official signing or update credentials. */
import { mkdirSync, readFileSync, rmSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { desktopTargetBuildPaths } from './desktop-build-paths.mjs'
import { validateDesktopBuildVersion } from './desktop-build-version.mjs'
import { desktopBuildCommitEnvironment, readDesktopBuildCommit } from './desktop-build-commit.mjs'
import { createPackagingRun } from './packaging-run.mjs'

const APP_ROOT = resolve(import.meta.dirname, '..')
const REPOSITORY_ROOT = resolve(APP_ROOT, '..', '..')

/**
 * Isolate community builds from official signing, publishing and mandatory-update settings.
 * @param environment Parent environment retained for build tools and networking.
 * @returns Linux x64 environment with manual updates and no signing credentials.
 */
export function linuxPackageEnvironment(environment: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  return {
    ...Object.fromEntries(Object.entries(environment).filter(([name]) =>
      !/^(?:DSH_DESKTOP_|DSH_PACKAGING_|DOWNLOAD_(?:TEST|PROD)_|APPLE_|(?:WIN_)?CSC_)/iu.test(name))),
    DSH_DESKTOP_APP_ID: 'io.github.m1racleshih.dshlinux',
    DSH_DESKTOP_TARGET_PLATFORM: 'linux',
    DSH_DESKTOP_TARGET_ARCH: 'x64',
    DSH_DESKTOP_UNSIGNED: '1',
    CSC_IDENTITY_AUTO_DISCOVERY: 'false',
  }
}

async function main(): Promise<void> {
  if (process.platform !== 'linux' || process.arch !== 'x64') {
    throw new Error('DSH Linux packaging requires a Linux x64 build host')
  }
  const { values } = parseArgs({ args: process.argv.slice(2).filter(value => value !== '--'), options: {
    dir: { type: 'boolean', default: false },
    'prepare-only': { type: 'boolean', default: false },
    check: { type: 'boolean', default: false },
    'build-version': { type: 'string' },
  } })
  const pnpm = process.env.npm_execpath
  if (!pnpm) throw new Error('Invoke Linux packaging through pnpm run package:desktop:linux:x64')
  const { version } = JSON.parse(readFileSync(join(APP_ROOT, 'package.json'), 'utf8')) as { version: string }
  const buildVersion = validateDesktopBuildVersion(values['build-version'] ?? version, version)
  const env: NodeJS.ProcessEnv = { ...linuxPackageEnvironment(process.env), DSH_DESKTOP_BUILD_VERSION: buildVersion,
    ...desktopBuildCommitEnvironment(readDesktopBuildCommit(REPOSITORY_ROOT)) }
  if (values.check) {
    console.log(`DSH Linux: linux-x64, version ${buildVersion}, manual updates, publishing disabled`)
    return
  }
  const paths = desktopTargetBuildPaths('linux-x64')
  const run = createPackagingRun(join(APP_ROOT, '.desktop-build', 'packaging-runs'), {
    target: 'linux-x64', version: buildVersion, directory: values.dir, prepareOnly: values['prepare-only'], unsigned: true,
  }, { secrets: Object.entries(process.env).filter(([name]) => /KEY|SECRET|TOKEN|PASSWORD/iu.test(name)).map(([, value]) => value ?? '') })
  env.DSH_DESKTOP_PACKAGING_RUN_DIR = run.directory
  const execute = (args: string[], cwd = REPOSITORY_ROOT): Promise<void> =>
    run.run(args.join(' '), process.execPath, [pnpm, ...args], { cwd, env })
  console.log(`DESKTOP_PACKAGING_RECORD ${run.directory}`)
  let success = false
  try {
    await execute(['run', 'build:official'])
    await execute(['run', 'release:pack', '--family', 'dsh', '--out', paths.packedDsh, '--concurrency', '2'])
    await execute(['--dir', 'apps/desktop-host', 'pack', '--pack-destination', paths.packedDsh])
    await execute(['run', 'release:pack', '--family', 'vendor', '--out', paths.packedVendor, '--concurrency', '2'])
    rmSync(paths.packedLandlock, { recursive: true, force: true })
    mkdirSync(paths.packedLandlock, { recursive: true })
    await execute(['--dir', 'native/system', 'run', 'build:ts'])
    await execute(['--dir', 'native/system/packages/entry', 'pack', '--pack-destination', paths.packedLandlock])
    for (const script of ['prepare:runtime', 'prepare:packages', 'prepare:dsh']) {
      await execute(['run', script], APP_ROOT)
    }
    if (!values['prepare-only']) {
      await execute(['exec', 'electron-builder', '--config', 'electron-builder.config.mjs', '--linux', '--x64',
        '--publish', 'never', ...(values.dir ? ['--dir'] : [])], APP_ROOT)
      await execute(['exec', 'tsx', 'scripts/smoke-packaged-runtime.ts', '--unsigned'], APP_ROOT)
      console.log(`DSH Linux artifacts: ${paths.unsignedArtifacts}`)
    }
    success = true
  } finally {
    run.finish(success)
  }
}

if (process.argv[1] !== undefined && import.meta.filename === resolve(process.argv[1])) await main()
