const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('lumen', {
  loadState: () => ipcRenderer.invoke('state:load'),
  saveState: (state) => ipcRenderer.invoke('state:save', state),
  pickImageFolder: () => ipcRenderer.invoke('images:pickFolder'),
  listImages: (folder) => ipcRenderer.invoke('images:list', folder),
  googleIsConnected: () => ipcRenderer.invoke('google:isConnected'),
  googleAccounts: () => ipcRenderer.invoke('google:accounts'),
  googleSetDisplayName: (email, name) => ipcRenderer.invoke('google:setDisplayName', email, name),
  googleConnect: () => ipcRenderer.invoke('google:connect'),
  googleDisconnect: (email) => ipcRenderer.invoke('google:disconnect', email),
  googleEvents: (params) => ipcRenderer.invoke('google:events', params),
  getDataPath: () => ipcRenderer.invoke('data:path'),
  exportData: (json, name) => ipcRenderer.invoke('data:export', json, name),
  pickStorageDir: () => ipcRenderer.invoke('data:pickStorageDir'),
  obsidianPickVault: () => ipcRenderer.invoke('obsidian:pickVault'),
  obsidianScan: (vaultPath) => ipcRenderer.invoke('obsidian:scan', vaultPath),
  winMinimize:    () => ipcRenderer.invoke('win:minimize'),
  winMaximize:    () => ipcRenderer.invoke('win:maximize'),
  winClose:       () => ipcRenderer.invoke('win:close'),
  winIsMaximized: () => ipcRenderer.invoke('win:isMaximized'),
});
