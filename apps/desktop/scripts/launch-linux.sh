#!/bin/sh
# Launch already-built source with persistent user data and no debugger listeners.
set -eu
app_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd -P)
electron="$app_root/node_modules/electron/dist/electron"
for required in "$electron" "$app_root/lib/main.js" "$app_root/.desktop-build/development/project/desktop-runtime.json" "$app_root/.desktop-build/targets/linux-x64/runtime/primary-runtime/runtime.json"; do
  if [ ! -f "$required" ]; then
    message="DSH Linux source is not prepared. Build the repository and run pnpm run install:desktop:linux again. Missing: $required"
    if command -v kdialog >/dev/null 2>&1; then kdialog --error "$message"; else printf '%s\n' "$message" >&2; fi
    exit 1
  fi
done
case "${DSH_HOME-}" in
  *[![:space:]]*) ;;
  *) export DSH_HOME="$HOME/.dsh-linux" ;;
esac
export DSH_DESKTOP_PRIMARY_RUNTIME_DIR="$app_root/.desktop-build/targets/linux-x64/runtime/primary-runtime"
export DSH_DESKTOP_OPEN_DEVTOOLS=0
unset ELECTRON_RUN_AS_NODE DSH_DESKTOP_HOST_INSPECT_PORT
umask 077
state="${XDG_STATE_HOME:-$HOME/.local/state}/dsh-linux"
mkdir -p "$state"
cd "$app_root"
exec "$electron" --class=io.github.m1racleshih.dshlinux \
  "--user-data-dir=${XDG_CONFIG_HOME:-$HOME/.config}/dsh-linux" "$app_root" "$@" >> "$state/desktop.log" 2>&1
