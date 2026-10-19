/** Install per-user menu and desktop entries for the prepared Linux source checkout. */
import { execFileSync } from 'node:child_process'
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'

if (process.platform !== 'linux') throw new Error('DSH Linux shortcuts require Linux')
const appRoot = resolve(import.meta.dirname, '..')
const launcher = join(appRoot, 'scripts', 'launch-linux.sh')
const icon = join(appRoot, 'resources', 'icon-windows.png')
const desktop = execFileSync('xdg-user-dir', ['DESKTOP'], { encoding: 'utf8' }).trim()
const applications = join(process.env.XDG_DATA_HOME || join(homedir(), '.local', 'share'), 'applications')
const filename = 'io.github.m1racleshih.dshlinux.desktop'
const marker = 'X-DSH-Linux-Source=true'
const destinations = [join(applications, filename), join(desktop, filename)]
if (!desktop || desktop === homedir()) throw new Error('Configure an XDG desktop directory before installing the desktop shortcut')
for (const path of [launcher, icon, join(appRoot, 'lib', 'main.js'), join(appRoot, '.desktop-build', 'development', 'project', 'desktop-runtime.json')]) {
  if (!existsSync(path)) throw new Error(`Missing prepared source file: ${path}`)
}
for (const path of destinations) {
  if (existsSync(path) && !readFileSync(path, 'utf8').split('\n').includes(marker)) {
    throw new Error(`Refusing to replace an unmanaged desktop entry: ${path}`)
  }
}
// Desktop Exec has its own quoting and percent expansion; no shell interpolation is used.
const argument = '"' + launcher.replaceAll('\\', '\\\\\\\\').replaceAll('"', '\\\\"')
  .replaceAll('`', '\\\\`').replaceAll('$', '\\\\$').replaceAll('%', '%%') + '"'
const contents = [
  '[Desktop Entry]', 'Type=Application', 'Version=1.0', 'Name=DSH Linux',
  'Comment=Community Linux desktop of DeepSeek Harness', 'Comment[zh_CN]=DeepSeek Harness 社区 Linux 桌面版',
  `Exec=/bin/sh ${argument}`, `Icon=${icon}`, 'Terminal=false',
  'Categories=Development;', 'StartupNotify=true',
  'StartupWMClass=io.github.m1racleshih.dshlinux', marker, '',
].join('\n')
for (const path of destinations) {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, contents, { mode: 0o755 })
  chmodSync(path, 0o755)
  console.log(`Installed ${path}`)
}
