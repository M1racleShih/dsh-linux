/** Source shortcuts preserve paths and keep runtime data outside the checkout. */
import { execFileSync } from 'node:child_process'
import { chmodSync, copyFileSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { expect, it, onTestFinished } from 'vitest'

it.skipIf(process.platform !== 'linux')('launches with persistent data, literal arguments and no debugger or sandbox override', () => {
  const root = mkdtempSync(join(tmpdir(), 'dsh source 中文 '))
  onTestFinished(() => rm(root, { recursive: true, force: true }))
  const app = join(root, 'app with spaces')
  const launcher = join(app, 'scripts', 'launch-linux.sh')
  for (const path of ['scripts/launch-linux.sh', 'lib/main.js', '.desktop-build/development/project/desktop-runtime.json',
    '.desktop-build/targets/linux-x64/runtime/primary-runtime/runtime.json', 'node_modules/electron/dist/electron']) {
    const file = join(app, path)
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, '')
  }
  copyFileSync(new URL('../scripts/launch-linux.sh', import.meta.url), launcher)
  const electron = join(app, 'node_modules', 'electron', 'dist', 'electron')
  writeFileSync(electron, `#!/usr/bin/env node
console.log(JSON.stringify({ args: process.argv.slice(2), home: process.env.DSH_HOME,
  primary: process.env.DSH_DESKTOP_PRIMARY_RUNTIME_DIR, devtools: process.env.DSH_DESKTOP_OPEN_DEVTOOLS,
  nodeMode: process.env.ELECTRON_RUN_AS_NODE, hostInspector: process.env.DSH_DESKTOP_HOST_INSPECT_PORT }))
`)
  chmodSync(electron, 0o755)
  const literal = 'path with 中文 $ and `literal`'
  execFileSync('/bin/sh', [launcher, literal], { timeout: 10_000,
    env: { ...process.env, HOME: root, DSH_HOME: undefined, XDG_CONFIG_HOME: join(root, 'config'),
      XDG_STATE_HOME: join(root, 'state'), ELECTRON_RUN_AS_NODE: '1', DSH_DESKTOP_HOST_INSPECT_PORT: '1234' } })
  expect(JSON.parse(readFileSync(join(root, 'state', 'dsh-linux', 'desktop.log'), 'utf8'))).toEqual({
    args: ['--class=io.github.m1racleshih.dshlinux', `--user-data-dir=${join(root, 'config', 'dsh-linux')}`, app, literal],
    home: join(root, '.dsh-linux'), primary: join(app, '.desktop-build/targets/linux-x64/runtime/primary-runtime'), devtools: '0',
  })
})
