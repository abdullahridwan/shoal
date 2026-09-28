const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('shoal', {
  spawn: (opts) => ipcRenderer.invoke('pty:spawn', opts),
  write: (id, data) => ipcRenderer.send('pty:write', { id, data }),
  resize: (id, cols, rows) => ipcRenderer.send('pty:resize', { id, cols, rows }),
  kill: (id) => ipcRenderer.send('pty:kill', { id }),
  pickFolder: (p) => ipcRenderer.invoke('dialog:folder', p),
  setDark: (d) => ipcRenderer.send('theme:dark', d),
  home: () => ipcRenderer.invoke('env:home'),
  onData: (cb) => ipcRenderer.on('pty:data', (_e, m) => cb(m)),
  onAgent: (cb) => ipcRenderer.on('pty:agent', (_e, m) => cb(m)),
  browserLoad: (id, url) => ipcRenderer.send('browser:load', { id, url }),
  browserNav: (id, action) => ipcRenderer.send('browser:nav', { id, action }),
  browserLayout: (id, bounds) => ipcRenderer.send('browser:layout', { id, bounds }),
  onBrowserState: (cb) => ipcRenderer.on('browser:state', (_e, m) => cb(m)),
  onBrowserOpened: (cb) => ipcRenderer.on('browser:opened', (_e, m) => cb(m)),
  onExit: (cb) => ipcRenderer.on('pty:exit', (_e, m) => cb(m)),
});
