const { app, BrowserWindow, WebContentsView, ipcMain, dialog, nativeTheme, Menu, shell } = require('electron');
const http = require('http');
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const os = require('os');
const pty = require('node-pty');
const { execFile } = require('child_process');

const ptys = new Map();
let win;
let quitting = false;
const send = (ch, msg) => { if (!quitting && win && !win.isDestroyed()) win.webContents.send(ch, msg); };

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
    env: {
      ...process.env, TERM: 'xterm-256color', COLORTERM: 'truecolor',
      ...(opener.port ? { BROWSER: opener.script, SHOAL_PORT: String(opener.port), SHOAL_TOKEN: opener.token, SHOAL_SESSION: id } : {}),
    },
  });
  ptys.set(id, p);
  p.onData((data) => send('pty:data', { id, data }));
  p.onExit(({ exitCode }) => {
    ptys.delete(id);
    send('pty:exit', { id, exitCode });
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
      send('pty:agent', { id, agent: found });
    }
  });
}
const detectTimer = setInterval(detect, 1200);

ipcMain.on('pty:write', (_e, { id, data }) => ptys.get(id)?.write(data));
ipcMain.on('pty:resize', (_e, { id, cols, rows }) => {
  try { ptys.get(id)?.resize(cols, rows); } catch {}
});
ipcMain.on('pty:kill', (_e, { id }) => {
  const v = views.get(id);
  if (v) { if (shownView === id) { win.contentView.removeChildView(v); shownView = null; } v.webContents.close(); views.delete(id); }
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

/* embedded browser: one private view per session */
const views = new Map();
let shownView = null;

function normalizeUrl(u) {
  u = String(u || '').trim();
  if (!u) return null;
  if (/^https?:\/\//i.test(u)) return u;
  if (/^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(:\d+)?(\/|$)/i.test(u)) return 'http://' + u;
  if (/^[\w-]+(\.[\w-]+)+(:\d+)?(\/|$)/.test(u)) return 'https://' + u;
  return 'https://www.google.com/search?q=' + encodeURIComponent(u);
}

function viewFor(id) {
  if (views.has(id)) return views.get(id);
  const v = new WebContentsView({ webPreferences: { partition: `shoal-${id}`, contextIsolation: true, nodeIntegration: false, sandbox: true } });
  v.setBackgroundColor('#ffffff');
  const wc = v.webContents;
  const state = () => send('browser:state', {
    id, url: wc.getURL(), title: wc.getTitle(), loading: wc.isLoading(),
    canBack: wc.navigationHistory.canGoBack(), canForward: wc.navigationHistory.canGoForward(),
  });
  ['did-navigate', 'did-navigate-in-page', 'page-title-updated', 'did-start-loading', 'did-stop-loading'].forEach((ev) => wc.on(ev, state));
  wc.setWindowOpenHandler(({ url }) => { wc.loadURL(url); return { action: 'deny' }; });
  views.set(id, v);
  return v;
}

function showView(id, bounds) {
  if (shownView && shownView !== id && views.has(shownView)) win.contentView.removeChildView(views.get(shownView));
  shownView = null;
  if (!id || !views.has(id) || !bounds || bounds.width < 1) return;
  const v = views.get(id);
  win.contentView.addChildView(v);
  v.setBounds({ x: Math.round(bounds.x), y: Math.round(bounds.y), width: Math.round(bounds.width), height: Math.round(bounds.height) });
  shownView = id;
}

ipcMain.on('browser:load', (_e, { id, url }) => {
  const u = normalizeUrl(url);
  if (u) viewFor(id).webContents.loadURL(u).catch(() => {});
});
ipcMain.on('browser:nav', (_e, { id, action }) => {
  const wc = views.get(id)?.webContents;
  if (!wc) return;
  if (action === 'back' && wc.navigationHistory.canGoBack()) wc.navigationHistory.goBack();
  if (action === 'forward' && wc.navigationHistory.canGoForward()) wc.navigationHistory.goForward();
  if (action === 'reload') wc.reload();
  if (action === 'stop') wc.stop();
  if (action === 'devtools') wc.toggleDevTools();
  if (action === 'external') { const u = wc.getURL(); if (/^https?:/.test(u)) shell.openExternal(u); }
});
ipcMain.on('browser:layout', (_e, { id, bounds }) => { if (win && !win.isDestroyed()) showView(id, bounds); });
ipcMain.on('browser:close', (_e, { id }) => {
  const v = views.get(id);
  if (!v) return;
  if (shownView === id) { win.contentView.removeChildView(v); shownView = null; }
  v.webContents.close();
  views.delete(id);
});

/* $BROWSER bridge: agents and dev servers open links inside Shoal */
const opener = { port: 0, token: crypto.randomBytes(18).toString('hex'), script: '' };
function startOpener() {
  const dir = path.join(app.getPath('userData'), 'bin');
  fs.mkdirSync(dir, { recursive: true });
  opener.script = path.join(dir, 'shoal-open');
  fs.writeFileSync(opener.script, `#!/bin/sh
u="$1"
case "$u" in
  http://*|https://*) ;;
  *) exec /usr/bin/open "$@" ;;
esac
/usr/bin/curl -fsS -G "http://127.0.0.1:$SHOAL_PORT/open" --data-urlencode "t=$SHOAL_TOKEN" --data-urlencode "s=$SHOAL_SESSION" --data-urlencode "u=$u" >/dev/null 2>&1 || /usr/bin/open "$u"
`, { mode: 0o755 });
  const server = http.createServer((req, res) => {
    const q = new URL(req.url, 'http://127.0.0.1').searchParams;
    const url = q.get('u');
    const ok = req.url.startsWith('/open?') && q.get('t') === opener.token && ptys.has(q.get('s')) && /^https?:\/\//i.test(url || '');
    if (!ok) { res.writeHead(403).end(); return; }
    viewFor(q.get('s')).webContents.loadURL(url).catch(() => {});
    send('browser:opened', { id: q.get('s'), url });
    res.writeHead(204).end();
  });
  server.listen(0, '127.0.0.1', () => { opener.port = server.address().port; });
}
ipcMain.on('theme:dark', (_e, dark) => win?.setBackgroundColor(dark ? '#131312' : '#f3f1ec'));

app.whenReady().then(() => {
  if (process.platform === 'darwin') app.dock.setIcon(path.join(__dirname, 'assets', 'icon.png'));
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: 'Shoal', submenu: [
      { role: 'about', label: 'About Shoal' },
      { type: 'separator' },
      { role: 'hide', label: 'Hide Shoal' },
      { role: 'hideOthers' },
      { role: 'unhide' },
      { type: 'separator' },
      { role: 'quit', label: 'Quit Shoal' },
    ] },
    { role: 'editMenu' },
    { label: 'View', submenu: [{ role: 'reload' }, { role: 'toggleDevTools' }, { type: 'separator' }, { role: 'togglefullscreen' }] },
    { label: 'Window', submenu: [{ role: 'minimize' }, { role: 'zoom' }, { type: 'separator' }, { role: 'front' }] },
  ]));
  startOpener();
  createWindow();
});
function killAll() {
  quitting = true;
  clearInterval(detectTimer);
  for (const p of ptys.values()) { try { p.kill(); } catch {} }
  ptys.clear();
}
app.on('before-quit', killAll);
app.on('window-all-closed', () => app.quit());
