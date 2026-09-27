const { app, BrowserWindow, ipcMain, dialog, nativeTheme } = require('electron');
const path = require('path');
const os = require('os');
const pty = require('node-pty');
const { execFile } = require('child_process');

const ptys = new Map();
let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 720,
    minHeight: 480,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 20, y: 20 },
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#131312' : '#f3f1ec',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.loadFile(path.join(__dirname, 'src', 'index.html'));
}

ipcMain.handle('pty:spawn', (_e, { id, cwd, command, cols, rows }) => {
  const shell = process.env.SHELL || '/bin/zsh';
  const p = pty.spawn(shell, ['-l'], {
    name: 'xterm-256color',
    cols: cols || 80,
    rows: rows || 24,
    cwd: cwd || os.homedir(),
    env: { ...process.env, TERM: 'xterm-256color', COLORTERM: 'truecolor' },
  });
  ptys.set(id, p);
  p.onData((data) => win?.webContents.send('pty:data', { id, data }));
  p.onExit(({ exitCode }) => {
    ptys.delete(id);
    win?.webContents.send('pty:exit', { id, exitCode });
  });
  if (command) setTimeout(() => p.write(command + '\r'), 150);
  return { shell: path.basename(shell) };
});

const KNOWN = ['claude', 'hermes', 'codex', 'gemini', 'opencode', 'ollama', 'omp', 'pi'];
const RUNNERS = new Set(['node', 'bun', 'deno', 'python', 'python3', 'npx', 'bunx', 'uv', 'uvx']);

function detect() {
  if (!ptys.size) return;
  execFile('ps', ['-A', '-o', 'pid=,ppid=,command='], { maxBuffer: 8 << 20 }, (err, out) => {
    if (err) return;
    const kids = new Map();
    const cmds = new Map();
    for (const line of out.split('\n')) {
      const m = line.match(/^\s*(\d+)\s+(\d+)\s+(.*)$/);
      if (!m) continue;
      cmds.set(+m[1], m[3]);
      if (!kids.has(+m[2])) kids.set(+m[2], []);
      kids.get(+m[2]).push(+m[1]);
    }
    const nameOf = (cmd) => {
      const toks = cmd.split(/\s+/).map((t) => path.basename(t));
      for (const t of toks.slice(0, 3)) {
        if (KNOWN.includes(t)) return t;
        if (!RUNNERS.has(t)) break;
      }
      return null;
    };
    for (const [id, p] of ptys) {
      let found = null;
      const stack = [...(kids.get(p.pid) || [])];
      while (stack.length && !found) {
        const pid = stack.shift();
        found = nameOf(cmds.get(pid) || '');
        stack.push(...(kids.get(pid) || []));
      }
      win?.webContents.send('pty:agent', { id, agent: found });
    }
  });
}
setInterval(detect, 1200);

ipcMain.on('pty:write', (_e, { id, data }) => ptys.get(id)?.write(data));
ipcMain.on('pty:resize', (_e, { id, cols, rows }) => {
  try { ptys.get(id)?.resize(cols, rows); } catch {}
});
ipcMain.on('pty:kill', (_e, { id }) => {
  ptys.get(id)?.kill();
  ptys.delete(id);
});

ipcMain.handle('dialog:folder', async (_e, defaultPath) => {
  const r = await dialog.showOpenDialog(win, {
    properties: ['openDirectory', 'createDirectory'],
    defaultPath: defaultPath || os.homedir(),
  });
  return r.canceled ? null : r.filePaths[0];
});

ipcMain.handle('env:home', () => os.homedir());
ipcMain.on('theme:dark', (_e, dark) => win?.setBackgroundColor(dark ? '#131312' : '#f3f1ec'));

app.whenReady().then(() => {
  if (process.platform === 'darwin') app.dock.setIcon(path.join(__dirname, 'assets', 'icon.png'));
  createWindow();
});
app.on('window-all-closed', () => {
  for (const p of ptys.values()) p.kill();
  app.quit();
});
