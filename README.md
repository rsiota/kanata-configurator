# Layr — Kanata configurator

A visual editor for Kanata keymaps. Build a board, edit bindings, and export
`kanata.kbd`.

## Live reload bridge (macOS)

The **Restart Kanata** button posts the current source to a small local service,
which writes `kanata.kbd` and restarts Kanata so you can test as you edit. A
browser cannot restart a system service on its own, so the bridge must be
running:

```sh
npm run bridge
```

By default it writes to `~/.config/kanata/kanata.kbd` and relaunches the
`kanata` binary directly with that config. Override with environment variables:

| Variable | Default | Purpose |
| --- | --- | --- |
| `KANATA_CONFIG_PATH` | `~/.config/kanata/kanata.kbd` | Where the generated config is written |
| `KANATA_CHECK_COMMAND` | detected `kanata --check -c {config}` | Validation before writing; `{config}` is substituted with the config path. Set to empty to disable |
| `KANATA_RESTART_COMMAND` | kill and relaunch `kanata -c <config>` | Command run after writing; empty disables restart |
| `KANATA_VERIFY_COMMAND` | `pgrep -x kanata >/dev/null` | Check after restart; empty disables the check |
| `KANATA_VERIFY_DELAY_MS` | `12000` | Wait before checking, for daemons with a startup delay |
| `KANATA_LOG_PATH` | `/var/log/kanata.log` | Log file used to add detail to restart failures |
| `KANATA_BRIDGE_TOKEN` | unset | Optional shared secret sent from the app as `x-bridge-token` |
| `KANATA_BRIDGE_ORIGINS` | unset | Comma-separated extra browser origins allowed by CORS |
| `KANATA_BRIDGE_PORT` | `8787` | Loopback port |

If the button reports "Cannot reach the bridge", check that `npm run bridge` is
running and that the app is opened from `localhost` or `127.0.0.1`. If you use
another hostname, add the exact origin (for example
`http://192.168.1.10:5173`) to `KANATA_BRIDGE_ORIGINS`. An HTTPS page cannot
call this HTTP bridge; use the local dev URL instead.

Example with a launchd service instead:

```sh
KANATA_RESTART_COMMAND='launchctl kickstart -k gui/$(id -u)/com.example.kanata' \
KANATA_BRIDGE_TOKEN=my-secret npm run bridge
```

The bridge binds to `127.0.0.1` and only accepts browser origins from localhost.
Set a token if other local processes could reach the port. In the app, use the
gear next to **Restart Kanata** to change the bridge URL or token, and to choose
UK or US shifted-symbol legends; these are stored in your browser's local
storage.

Keycaps show UK shifted symbols by default (`S-3` → `£`). Switch to US in the
gear menu if needed. This changes legends only — the Kanata code sent to the
config is unchanged. The ISO hash key is shown as `#` and exported as
`non_us_pound` (`S-non_us_pound` → `~`); it requires Kanata 1.12 or newer.
Prefer physical-key actions such as `S-3` over the Kanata `unicode` action:
Unicode input is not reliably accepted by all macOS apps.

Click a keycap to open the action editor. The **Output key** and **Tap key**
fields open a searchable key picker with grouped, keycap-style buttons. Search
by legend, Kanata code, or description (`£`, `pound`, or `S-3` all find the
same key). Selecting a key writes the corresponding Kanata action; it appears
on the board using the same legend rules.

### Root LaunchDaemon without a password prompt

If Kanata runs as a system daemon, `launchctl kickstart` needs root. Grant only
that exact command via sudoers:

```sh
sudo visudo -f /etc/sudoers.d/kanata-layr-bridge
```

Add one line, replacing `ruben` with your username:

```
ruben ALL=(root) NOPASSWD: /bin/launchctl kickstart -k system/dev.kanata.daemon
```

Then point the bridge at the daemon's config and restart command:

```sh
KANATA_CONFIG_PATH=~/.config/kanata/kanata-off.kbd \
KANATA_CHECK_COMMAND='/opt/homebrew/bin/kanata --check -c {config}' \
KANATA_RESTART_COMMAND='sudo -n /bin/launchctl kickstart -k system/dev.kanata.daemon' \
npm run bridge
```

Validation is automatic when `kanata` is on the PATH or installed in
`/opt/homebrew/bin` or `/usr/local/bin`. The bridge also verifies that a Kanata
process is still running after the restart command, so a daemon that fails due
to config or macOS permissions is reported as an error instead of success.

After upgrading Kanata with Homebrew, re-approve the new binary in both System
Settings → Privacy & Security → **Input Monitoring** and **Accessibility**.
Remove the stale entry for the old version in each list and add the current
binary: `/opt/homebrew/Cellar/kanata/<version>/bin/kanata`. macOS pins the old
path, so an upgraded binary is otherwise denied even though the config is
valid.

If you would rather get a macOS password dialog each time, use this restart
command instead:

```sh
KANATA_RESTART_COMMAND='osascript -e '"'"'do shell script "launchctl kickstart -k system/dev.kanata.daemon" with administrator privileges'"'"''
```

## React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
