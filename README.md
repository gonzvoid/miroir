# Miroir — Personal Command Center

A desktop dashboard (Electron + React + Vite + Tailwind) for Windows. Tasks, calendar, mood/journal, ideas and habits, with a real local image folder and Google Calendar integration.

## Requirements

- Node.js 18+ (20 recommended) — https://nodejs.org
- Windows 10/11

## Run in development

```bash
npm install
npm run dev
```

Starts Vite and opens the Electron window with hot reload.

## Build a Windows installer (.exe)

```bash
npm run package
```

The NSIS installer is written to `release/`. (For the app icon, add `build/icon.ico`.)

## Publish a release (auto-update)

```bash
npm run release
```

Builds the app and publishes the installer plus `latest.yml` to the public releases repo (`gonzvoid/MiroirRelease`) via electron-builder. Requires a `GH_TOKEN` environment variable with `public_repo` scope. Bump `version` in `package.json` before each release — it must increase for the auto-updater to detect it.

Installed apps check for updates on launch and let the user download/install from **Settings → Updates**.

## Where your data is stored

Everything (tasks, mood, ideas, habits, settings) is saved as JSON in your Electron userData folder, e.g.:

```
C:\Users\<you>\AppData\Roaming\Miroir\miroir-data.json
```

It never leaves your machine. The storage folder can be changed from **Settings → Data & Backup**.

## Image folder (visual tile)

In the image tile, pick a folder; the app lists and rotates through its images. They are served through a custom `lumen-img://` protocol to avoid the `file://` issues with Windows paths.

## Google Calendar (setup)

The integration lives in the Electron main process (`electron/google-auth.js`) and is fully wired. It needs your own OAuth credentials:

1. Go to https://console.cloud.google.com and create a project.
2. **APIs & Services → Library** → enable **Google Calendar API**.
3. **Credentials → Create credentials → OAuth client ID** → type **Desktop app**.
4. Save the client ID and secret into `electron/google-credentials.json`:
   ```json
   { "clientId": "xxxx.apps.googleusercontent.com", "clientSecret": "xxxx" }
   ```
   This file is gitignored and must never be committed.
5. In the app, connect your account from the calendar sources. The OAuth consent opens in your browser (redirect on `localhost:42813`); the refresh token is stored locally in `google-tokens.json` next to your data.

Until connected, the app falls back to sample events.

## Project structure

```
electron/        main process + preload (IPC: disk state, image folder, Google auth, auto-update)
src/
  lib/           utils (dates, constants), store (persistence), useUpdater (auto-update hook)
  components/    Header, Tiles, SettingsPanel, ImageTile, icons
  App.jsx        independent 3-column layout
  styles/        light/dark/cream theme tokens + Tailwind
```

## Distribution

Source code is private. Only the built installer is distributed publicly through the separate `gonzvoid/MiroirRelease` repository, which the in-app auto-updater reads from.

## Design notes

- **3 independent columns**: each column flows on its own, so a tile's height never drags its neighbours.
- Tasks: 3 states (empty → in progress → done), click to edit, drag to reorder or move between categories, status menu (Started/On hold/Postponed) and quick delete.
- Mood: per-day morning/midday/evening logging with 30-day and 7-day views; the Mood tile always shows today.
