---
description: "Linux x64 桌面构建标识、源码验证和分发限制。"
---

# DSH Linux 桌面版

[English](README.md) | 中文

## 概要

DSH Linux 将上游 Electron 桌面适配到 Linux x64。应用在 Linux 上保留原生窗口装饰，包括 KDE Plasma。源码处于实验阶段；安装包和完整 KDE 验收尚未通过确认。

## 目录

- [标识与数据](#identity-and-data)
- [本地桌面快捷方式](#local-desktop-shortcut)
- [源码验证](#source-validation)
- [分发范围](#distribution-scope)
- [开发备注](#dev-note)

<a id="identity-and-data"></a>

## 标识与数据

Linux 打包配置使用名称 `DSH Linux`、可执行文件 `dsh-linux` 和应用标识 `io.github.m1racleshih.dshlinux`。打包后的应用及其 CLI 默认使用 `~/.dsh-linux`，显式设置的 `DSH_HOME` 优先。开发运行沿用 `apps/desktop/.desktop-build/development` 下的临时目录。Electron 配置使用应用独立的用户数据目录。

本分支保留上游 MIT 许可证、署名、界面和图标。DeepSeek 名称和图标用于标识上游成果，不表示官方背书。参见[品牌指南](../../../BRAND_GUIDELINES.zh.md)和[许可证](../../../LICENSE)。

<a id="local-desktop-shortcut"></a>

## 本地桌面快捷方式

编译源码后，在仓库根目录运行 `pnpm run install:desktop:linux`。它准备运行环境，并将 DSH Linux 安装到当前用户的应用菜单和桌面目录，不生成安装包，也不启用登录自启动。请保留源码目录及其依赖；更新源码后重新编译，移动源码目录后重新安装快捷方式。

双击桌面上的 DSH Linux 即可打开。关闭工作区窗口会隐藏界面，任务继续运行。KDE 系统托盘保留应用图标：点击可恢复窗口，右键选择“退出 DSH Linux”会停止应用及其后台。存在运行中任务或定时提醒时，退出可能需要确认。KDE 可能将图标放在托盘的隐藏项目区域。

快捷方式默认使用 `~/.dsh-linux` 保存 Harness 数据，设置 `DSH_HOME` 可覆盖。Electron 数据位于 `${XDG_CONFIG_HOME:-~/.config}/dsh-linux`，启动日志位于 `${XDG_STATE_HOME:-~/.local/state}/dsh-linux/desktop.log`。它直接启动编译后的应用，不打开终端或调试器。普通开发启动器仍使用临时数据目录。

源码快捷方式启动、关闭工作区后隐藏、托盘恢复以及托盘退出时清理后台，均已在 KDE/X11 验证。完整桌面验收和安装包验收仍需单独完成。

<a id="source-validation"></a>

## 源码验证

初始源码检查在 Ubuntu 24.04 x64、KDE Plasma 5.27 X11、Node 24.18.0 和仓库固定的 pnpm 11.28.5 上运行。按锁文件安装依赖，然后编译并检查构建产物：

```sh
pnpm install --frozen-lockfile
pnpm run build:artifacts
pnpm run build:check
```

专项测试覆盖 Linux 构建目录、平台映射、CLI 启动器、数据隔离、原生窗口装饰选择以及与官方更新配置的隔离。原生运行环境准备和实际桌面启动是额外检查；仅通过源码测试不代表安装包或 KDE 行为已通过验收。

源码开发版已在 KDE/X11 上进入中文工作区界面。固定版本的基础运行环境通过了 Python 依赖检查和 Office 文档往返检查。Electron Node 环境通过了图片编码与解码、PTY、搜索、HTML 转换和离线 pnpm 检查，但图片处理输出了 GLib-GObject 警告。本次冒烟检查未观察到崩溃；该警告仍是待处理的兼容性问题。

仓库文档检查在未修改的 `python/sdk/uv.lock` 第 113 行报告了提交引用问题。对上游原文件运行相同检查也能复现。该问题与 Linux 源码测试分开记录。

<a id="distribution-scope"></a>

## 分发范围

尚未验收的 `package:desktop:linux:x64` 入口通过现有运行环境准备代码面向未签名 AppImage 和 Debian 包。其 `:dir` 变体面向未压缩应用。输出位于 `apps/desktop/.desktop-build/targets/linux-x64/unsigned-artifacts`。根据[打包规范](../packaging/README.zh.md#release-versions)，打包前需单独确认完整版本号；本轮源码验证不生成安装包。

Linux 构建不配置自动更新源或强制更新策略。打包入口会移除继承的官方签名与部署设置，并始终禁用发布。`dsh` URL 协议仍用于上游登录回调；与其他注册该协议的应用共存需要手工验证。

KDE 验收包括中文输入、剪贴板、文件对话框、任务栏分组、缩放、关闭与退出行为、从应用菜单启动时继承的环境以及沙箱命令。图片处理、终端会话、Python 和 Office 转换还需在准备完成或打包后的运行环境中通过检查。Wayland 和 Linux arm64 不属于首轮已验证目标。

<a id="dev-note"></a>

## 开发备注

源码检查不构成安装包验收。发布 Linux 版本前须记录打包和桌面验收证据。
