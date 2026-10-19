/** Community packages cannot inherit official release services or signing credentials. */
import { expect, it } from 'vitest'
import { linuxPackageEnvironment } from '../scripts/package-linux.ts'
import { createElectronBuilderConfig } from '../scripts/electron-builder-config.mjs'

it('retains build networking while removing official release settings', () => {
  const source = { PATH: '/tools', https_proxy: 'http://127.0.0.1:7897',
    DSH_DESKTOP_APP_ID: 'com.deepseek.harness', DSH_DESKTOP_TARGET_PLATFORM: 'win32',
    DSH_DESKTOP_MANDATORY_UPDATE_PROD_ORIGIN: 'https://policy.example.com',
    DSH_DESKTOP_BUILD_VERSION: 'stale', DSH_PACKAGING_PRESET: 'production',
    DOWNLOAD_PROD_COS_SECRET_KEY: 'fixture', CSC_KEY_PASSWORD: 'fixture', APPLE_ID: 'fixture' }
  const env = linuxPackageEnvironment(source)
  expect(env).toEqual({ PATH: source.PATH, https_proxy: source.https_proxy,
    DSH_DESKTOP_APP_ID: 'io.github.m1racleshih.dshlinux', DSH_DESKTOP_TARGET_PLATFORM: 'linux',
    DSH_DESKTOP_TARGET_ARCH: 'x64', DSH_DESKTOP_UNSIGNED: '1', CSC_IDENTITY_AUTO_DISCOVERY: 'false' })
  expect(source.DSH_DESKTOP_TARGET_PLATFORM).toBe('win32')
})

it('builds DSH Linux packages without an official update source or policy', () => {
  const config = createElectronBuilderConfig({}, 'linux', 'x64')
  expect(config.productName).toBe('DSH Linux')
  expect(config.appId).toBe('io.github.m1racleshih.dshlinux')
  expect(config.publish).toBeNull()
  expect(config.extraMetadata).not.toHaveProperty('dshMandatoryUpdatePolicy')
  expect(config.extraMetadata).toMatchObject({ name: 'dsh-linux' })
  expect(config.linux.executableName).toBe('dsh-linux')
  expect(config.linux.target).toEqual(['AppImage', 'deb'])
  expect(config.linux.desktop.entry.StartupWMClass).toBe('dsh-linux')
  expect(config.artifactName).toBe('dsh-linux-${version}-${os}-${arch}-unsigned.${ext}')
})

it('rejects unsupported Linux architectures before packaging', () => {
  expect(() => createElectronBuilderConfig({}, 'linux', 'arm64')).toThrow(/unsupported target/u)
})
