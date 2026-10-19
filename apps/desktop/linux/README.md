---
description: "Linux x64 desktop build identity, source validation and distribution limits."
---

# DSH Linux desktop

English | [中文](README.zh.md)

## Summary

DSH Linux adapts the upstream Electron desktop to Linux x64. The application keeps native window decorations on Linux, including KDE Plasma. The source is experimental; an installation package and a complete KDE acceptance run are not yet qualified.

## Table of Contents

- [Identity and data](#identity-and-data)
- [Source validation](#source-validation)
- [Distribution scope](#distribution-scope)
- [Dev Note](#dev-note)

## Identity and data

The Linux package configuration uses the name `DSH Linux`, executable `dsh-linux`, and application identifier `io.github.m1racleshih.dshlinux`. The packaged application and its CLI default to `~/.dsh-linux`; an explicit `DSH_HOME` takes precedence. Development runs use the existing disposable directory under `apps/desktop/.desktop-build/development`. Electron configuration belongs to the application's own user-data directory.

The fork preserves the upstream MIT license, attribution, interface, and artwork. DeepSeek names and artwork identify upstream work; they do not imply endorsement. See the [brand guidelines](../../../BRAND_GUIDELINES.md) and [license](../../../LICENSE).

## Source validation

The initial source checks run on Ubuntu 24.04 x64 with KDE Plasma 5.27 on X11, Node 24.18.0 and the repository-pinned pnpm 11.28.5. Install dependencies with the lockfile, then build and check the artifacts:

```sh
pnpm install --frozen-lockfile
pnpm run build:artifacts
pnpm run build:check
```

Focused tests cover Linux build directories, platform mapping, the CLI launcher, data isolation, native window decoration selection and the separation from official update configuration. Native runtime preparation and an actual desktop launch are additional checks; passing source tests alone does not qualify an installer or KDE behavior.

The source-built application reached the Chinese workspace interface on KDE/X11. The pinned primary runtime passed Python dependency checks and Office document round trips. The Electron Node runtime passed image encoding/decoding, PTY, search, HTML conversion and offline pnpm checks, although image processing emitted GLib-GObject warnings. A crash was not observed in this smoke run; the warnings remain an open compatibility concern.

The repository documentation checks report a commit-reference finding in the unchanged `python/sdk/uv.lock` at line 113. The same check reproduces against the upstream file. This finding is separate from the Linux source tests.

## Distribution scope

The unvalidated `package:desktop:linux:x64` entry targets an unsigned AppImage and Debian package through the existing runtime preparation code. Its `:dir` variant targets an unpacked application. These output paths are under `apps/desktop/.desktop-build/targets/linux-x64/unsigned-artifacts`. Packaging requires a separately confirmed full version under the [packaging policy](../packaging/README.md#release-versions); this source-validation iteration does not produce packages.

Linux builds have no automatic update feed or mandatory-update policy. The packaging entry removes inherited official signing and deployment settings and always disables publishing. The `dsh` URL scheme remains the upstream login callback scheme; coexistence with another application claiming that scheme needs manual validation.

KDE acceptance includes Chinese input, clipboard, file dialogs, taskbar grouping, scaling, close/quit behavior, environment inherited from the application menu, and sandboxed commands. Image processing, terminal sessions, Python and Office conversion must also pass against the prepared or packaged runtime. Wayland and Linux arm64 are outside the initial validated target.

## Dev Note

No installer is qualified by the source checks. Record packaging and desktop acceptance evidence before publishing a Linux release.
