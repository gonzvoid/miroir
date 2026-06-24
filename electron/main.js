import { app, BrowserWindow, ipcMain, dialog, protocol, net, shell } from 'electron';
import { fileURLToPath } from 'url';
import { pathToFileURL } from 'url';
import path from 'path';
import fs from 'fs/promises';
import * as googleAuth from './google-auth.js';
import electronUpdater from 'electron-updater';

const { autoUpdater } = electronUpdater;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = process.env.ELECTRON_DEV === '1';

// The meta-config lives at the default userData path (never moves)
const defaultUserData = app.getPath('userData');
const metaConfigFile  = path.join(defaultUserData, 'meta-config.json');

// dataDir / dataFile can be overridden by the user — mutable so we can change at runtime
let dataDir  = defaultUserData;
let dataFile = path.join(dataDir, 'miroir-data.json');

async function loadMetaConfig() {
  try {
    const raw = await fs.readFile(metaConfigFile, 'utf-8');
    const cfg = JSON.parse(raw);
    if (cfg.dataDir) {
      dataDir  = cfg.dataDir;
      dataFile = path.join(dataDir, 'miroir-data.json');
    }
  } catch { /* first run or no custom path */ }
  // migrate old lumen-data.json → miroir-data.json if needed
  try {
    await fs.access(dataFile);
  } catch {
    try { await fs.copyFile(path.join(dataDir, 'lumen-data.json'), dataFile); } catch { /* fresh start */ }
  }
}

async function saveMetaConfig(cfg) {
  await fs.writeFile(metaConfigFile, JSON.stringify(cfg, null, 2), 'utf-8');
}

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 980,
    transparent: true,
    frame: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

// custom protocol so local images load safely without disabling webSecurity (works on Windows)
protocol.registerSchemesAsPrivileged([
  { scheme: 'lumen-img', privileges: { secure: true, supportFetchAPI: true, stream: true, bypassCSP: true } },
]);

app.whenReady().then(async () => {
  await loadMetaConfig();
  googleAuth.init(dataDir);
  protocol.handle('lumen-img', (request) => {
    const encoded = request.url.slice('lumen-img://'.length);
    const filePath = decodeURIComponent(encoded);
    return net.fetch(pathToFileURL(filePath).toString());
  });
  createWindow();
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });

/* ---------------- IPC: state persistence ---------------- */
ipcMain.handle('state:load', async () => {
  try {
    const raw = await fs.readFile(dataFile, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {}; // first run
  }
});

ipcMain.handle('state:save', async (_e, state) => {
  await fs.writeFile(dataFile, JSON.stringify(state, null, 2), 'utf-8');
  return true;
});

/* ---------------- IPC: Google Calendar ---------------- */
ipcMain.handle('google:isConnected', () => googleAuth.isConnected());
ipcMain.handle('google:accounts', () => googleAuth.getAccounts());
ipcMain.handle('google:setDisplayName', (_e, email, name) => googleAuth.setDisplayName(email, name));
ipcMain.handle('google:connect', () => googleAuth.connect());
ipcMain.handle('google:disconnect', (_e, email) => googleAuth.disconnect(email));
ipcMain.handle('google:events', (_e, params) => googleAuth.listEvents(params));

/* ---------------- IPC: data path + storage management ---------------- */
ipcMain.handle('data:path', () => dataFile);

// Native "Save As" dialog for JSON export
ipcMain.handle('data:export', async (_e, jsonString, defaultName) => {
  const { filePath, canceled } = await dialog.showSaveDialog(win, {
    title: 'Export Miroir backup',
    defaultPath: defaultName,
    filters: [{ name: 'JSON', extensions: ['json'] }],
  });
  if (canceled || !filePath) return false;
  await fs.writeFile(filePath, jsonString, 'utf-8');
  return true;
});

// Let the user pick a new folder to store miroir-data.json
ipcMain.handle('data:pickStorageDir', async () => {
  const { filePaths, canceled } = await dialog.showOpenDialog(win, {
    title: 'Choose data storage folder',
    properties: ['openDirectory'],
  });
  if (canceled || !filePaths[0]) return null;

  const newDir  = filePaths[0];
  const newFile = path.join(newDir, 'miroir-data.json');

  // copy existing data to new location
  try { await fs.copyFile(dataFile, newFile); } catch { /* no existing file is fine */ }

  dataDir  = newDir;
  dataFile = newFile;
  await saveMetaConfig({ dataDir: newDir });
  return newFile;
});

/* ---------------- IPC: Obsidian import ---------------- */
ipcMain.handle('obsidian:pickVault', async () => {
  const res = await dialog.showOpenDialog(win, {
    properties: ['openDirectory'],
    title: 'Select your Obsidian vault folder',
  });
  if (res.canceled || !res.filePaths[0]) return null;
  return res.filePaths[0];
});

ipcMain.handle('obsidian:scan', async (_e, vaultPath) => {
  const results = { incomplete: [], complete: [] };

  async function scan(dir) {
    let entries;
    try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue; // skip .obsidian, .git, etc.
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await scan(full);
      } else if (entry.name.endsWith('.md')) {
        try {
          const content = await fs.readFile(full, 'utf-8');
          for (const line of content.split('\n')) {
            const m = line.match(/^\s*-\s+\[( |x)\]\s+(.+)$/i);
            if (!m) continue;
            let text = m[2].trim();
            // extract due date from Tasks plugin: 📅 2024-01-15
            let date = null;
            const dm = text.match(/📅\s*(\d{4}-\d{2}-\d{2})/);
            if (dm) { date = dm[1]; text = text.replace(/📅\s*\d{4}-\d{2}-\d{2}/, '').trim(); }
            // strip Tasks plugin status/priority emojis
            text = text.replace(/[🔁⏫🔼🔽⏬⏰✅🛫➕🏁]/gu, '').trim();
            if (!text) continue;
            if (m[1].toLowerCase() === 'x') results.complete.push({ text });
            else results.incomplete.push({ text, date });
          }
        } catch { /* skip unreadable files */ }
      }
    }
  }

  try { await scan(vaultPath); } catch (e) { console.error('[obsidian]', e.message); }
  return results;
});

/* ---------------- IPC: window controls ---------------- */
ipcMain.handle('win:minimize',    () => win?.minimize());
ipcMain.handle('win:maximize',    () => { if (win?.isMaximized()) win.restore(); else win?.maximize(); });
ipcMain.handle('win:close',       () => win?.close());
ipcMain.handle('win:isMaximized', () => win?.isMaximized() ?? false);
ipcMain.handle('shell:openExternal', (_e, url) => shell.openExternal(url));

/* ---------------- IPC: auto-update (electron-updater) ---------------- */
// Manual download flow: we only check automatically; the user confirms the download.
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

const sendUpdate = (payload) => { try { win?.webContents.send('update:status', payload); } catch { /* window gone */ } };

autoUpdater.on('checking-for-update', () => sendUpdate({ type: 'checking' }));
autoUpdater.on('update-available',     (info) => sendUpdate({ type: 'available', info: { version: info?.version } }));
autoUpdater.on('update-not-available', () => sendUpdate({ type: 'not-available' }));
autoUpdater.on('download-progress',    (p)    => sendUpdate({ type: 'progress', percent: Math.round(p?.percent ?? 0) }));
autoUpdater.on('update-downloaded',    (info) => sendUpdate({ type: 'downloaded', info: { version: info?.version } }));
autoUpdater.on('error',                (err)  => sendUpdate({ type: 'error', message: String(err?.message || err) }));

ipcMain.handle('app:version', () => app.getVersion());
// In dev there is no app-update.yml, so checking would throw — guard it.
ipcMain.handle('update:check',    () => { if (!isDev) autoUpdater.checkForUpdates().catch((e) => sendUpdate({ type: 'error', message: String(e?.message || e) })); });
ipcMain.handle('update:download', () => autoUpdater.downloadUpdate().catch((e) => sendUpdate({ type: 'error', message: String(e?.message || e) })));
ipcMain.handle('update:install',  () => autoUpdater.quitAndInstall());

/* ---------------- IPC: image folder ---------------- */
const IMG_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']);

ipcMain.handle('images:pickFolder', async () => {
  const res = await dialog.showOpenDialog(win, { properties: ['openDirectory'] });
  if (res.canceled || !res.filePaths[0]) return null;
  return res.filePaths[0];
});

// returns list of image file:// URLs in a folder (used to rotate the visual tile)
ipcMain.handle('images:list', async (_e, folder) => {
  try {
    const entries = await fs.readdir(folder);
    return entries
      .filter((f) => IMG_EXT.has(path.extname(f).toLowerCase()))
      .map((f) => 'lumen-img://' + encodeURIComponent(path.join(folder, f)));
  } catch {
    return [];
  }
});
