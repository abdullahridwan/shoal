const AGENTS = [
  {
    id: 'claude', label: 'Claude Code', cmd: 'claude', icon: 'claudecode-color', color: true,
    opts: [
      { key: 'skip', flag: '--dangerously-skip-permissions', t: 'Skip permissions', d: 'Run tools without asking first', danger: true },
      { key: 'cont', flag: '--continue', t: 'Continue', d: 'Pick up the most recent conversation' },
      { key: 'resume', flag: '--resume', t: 'Resume', d: 'Choose a past conversation to reopen' },
      { key: 'model', t: 'Model', seg: ['default', 'opus', 'sonnet', 'haiku'], flag: (v) => (v === 'default' ? '' : `--model ${v}`) },
    ],
  },
  { id: 'hermes', label: 'Hermes', cmd: 'hermes', icon: 'hermesagent', opts: [] },
  {
    id: 'codex', label: 'Codex', cmd: 'codex', icon: 'codex-color', color: true,
    opts: [
      { key: 'bypass', flag: '--dangerously-bypass-approvals-and-sandbox', t: 'Bypass approvals', d: 'No sandbox, no confirmations', danger: true },
      { key: 'auto', flag: '--full-auto', t: 'Full auto', d: 'Sandboxed, runs without asking' },
      { key: 'search', flag: '--search', t: 'Web search', d: 'Let the agent search the web' },
    ],
  },
  {
    id: 'gemini', label: 'Gemini CLI', cmd: 'gemini', icon: 'geminicli-color', color: true,
    opts: [{ key: 'yolo', flag: '--yolo', t: 'YOLO mode', d: 'Approve every action automatically', danger: true }],
  },
  {
    id: 'omp', label: 'Oh My Pi', cmd: 'omp', icon: 'pi',
    opts: [{ key: 'cont', flag: '--continue', t: 'Continue', d: 'Pick up the most recent session' }],
  },
  { id: 'opencode', label: 'OpenCode', cmd: 'opencode', icon: 'opencode', opts: [] },
  { id: 'ollama', label: 'Ollama', cmd: 'ollama', icon: 'ollama', opts: [] },
  { id: 'shell', label: 'Shell', cmd: '', icon: null, opts: [] },
];
const DETECT_ONLY = { pi: { id: 'pi', label: 'Pi', cmd: 'pi', icon: 'pi' } };
const byId = (id) => AGENTS.find((a) => a.id === id) || DETECT_ONLY[id];

const SHELL_SVG = '<svg viewBox="0 0 24 24"><path d="M6 8l4 4-4 4M13 16h5"/></svg>';
const CLOSE_SVG = '<svg viewBox="0 0 24 24"><path d="M7 7l10 10M17 7L7 17"/></svg>';
const STATUS_LABEL = { running: 'Working', attention: 'Needs you', idle: 'Idle', exited: 'Exited' };

const LIGHT = {
  background: '#fbfaf7', foreground: '#2a2925', cursor: '#c96442', cursorAccent: '#fbfaf7',
  selectionBackground: 'rgba(201,100,66,0.18)',
  black: '#1b1a17', red: '#b5412f', green: '#3a7d57', yellow: '#a0701a', blue: '#3d62a8',
  magenta: '#8a4f9e', cyan: '#2f7f86', white: '#8b877e',
  brightBlack: '#8b877e', brightRed: '#c9563f', brightGreen: '#4b9468', brightYellow: '#b8862a',
  brightBlue: '#5577b8', brightMagenta: '#a066b2', brightCyan: '#3f949b', brightWhite: '#b8b4aa',
};
const DARK = {
  background: '#1c1b19', foreground: '#e8e5dc', cursor: '#d97757', cursorAccent: '#1c1b19',
  selectionBackground: 'rgba(217,119,87,0.28)',
  black: '#3a3833', red: '#e5775f', green: '#7cc497', yellow: '#e2b45c', blue: '#82a4e0',
  magenta: '#c49ad6', cyan: '#6fc3c9', white: '#d6d2c8',
  brightBlack: '#6f6b62', brightRed: '#f09a85', brightGreen: '#9fd8b3', brightYellow: '#f0cb85',
  brightBlue: '#a5bfee', brightMagenta: '#d7b6e4', brightCyan: '#93d6db', brightWhite: '#f5f3ee',
};
const darkQuery = matchMedia('(prefers-color-scheme: dark)');
const isDark = () => (store.get('theme', 'system') === 'system' ? darkQuery.matches : store.get('theme') === 'dark');
const termTheme = () => (isDark() ? DARK : LIGHT);
function applyTheme() {
  const dark = isDark();
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  sessions.forEach((s) => { s.term.options.theme = termTheme(); });
  window.shoal.setDark?.(dark);
}
darkQuery.addEventListener('change', applyTheme);

const $ = (s) => document.querySelector(s);
const sessions = [];
let activeId = null;
let home = '';
let cwd = '';
let seq = 0;
let palSel = 0;
let palItems = AGENTS;
let optAgent = null;
let optSel = 0;

const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};
const cfgOf = (a) => store.get(`cfg:${a.id}`, { on: {}, seg: {}, extra: '' });

function commandFor(a, cfg = cfgOf(a)) {
  if (!a.cmd) return '';
  const parts = [a.cmd];
  for (const o of a.opts || []) {
    if (o.seg) { const f = o.flag(cfg.seg[o.key] || o.seg[0]); if (f) parts.push(f); }
    else if (cfg.on[o.key]) parts.push(o.flag);
  }
  if (cfg.extra?.trim()) parts.push(cfg.extra.trim());
  return parts.join(' ');
}
function flagSummary(a) {
  const cfg = cfgOf(a);
  const bits = (a.opts || []).filter((o) => !o.seg && cfg.on[o.key]).map((o) => o.t.toLowerCase());
  const seg = (a.opts || []).find((o) => o.seg && cfg.seg[o.key] && cfg.seg[o.key] !== o.seg[0]);
  if (seg) bits.push(cfg.seg[seg.key]);
  if (cfg.extra?.trim()) bits.push('+ args');
  return bits.join(' · ');
}

function logoHTML(agent, extra = '') {
  let inner;
  if (!agent.icon) inner = `<span class="ico-shell">${SHELL_SVG}</span>`;
  else if (agent.color) inner = `<img class="ico" src="icons/${agent.icon}.svg" alt="">`;
  else inner = `<span class="ico mask" style="-webkit-mask-image:url(icons/${agent.icon}.svg)"></span>`;
  return `<div class="logo ${extra}">${inner}</div>`;
}

const tildify = (p) => (home && p.startsWith(home) ? '~' + p.slice(home.length) : p);
const basename = (p) => tildify(p).split('/').filter(Boolean).pop() || '~';
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function autoName(agent) {
  const same = sessions.filter((x) => x.shown.id === agent.id).length;
  return same ? `${agent.label} ${same + 1}` : agent.label;
}

async function createSession(agent) {
  closePalette();
  const command = commandFor(agent);
  rememberDir(cwd);
  const id = `s${++seq}`;
  const el = document.createElement('div');
  el.className = 'term';
  $('#terminals').appendChild(el);

  const term = new Terminal({
    fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
    fontSize: 12, lineHeight: 1, fontWeight: 400, fontWeightBold: 700,
    cursorBlink: false, cursorStyle: 'block',
    allowProposedApi: true, macOptionIsMeta: true, scrollback: 10000,
    theme: termTheme(),
  });
  const fit = new FitAddon.FitAddon();
  term.loadAddon(fit);
  term.loadAddon(new WebLinksAddon.WebLinksAddon());
  term.open(el);
  term.attachCustomKeyEventHandler((e) => !(e.metaKey && /^[tbw1-9\[\]]$/.test(e.key)));

  const s = {
    id, agent, shown: agent, term, fit, el, cwd, command,
    name: autoName(agent), renamed: false,
    created: Date.now(), lastData: 0, lastInput: 0, unread: false, exited: false, swapped: false,
  };
  sessions.push(s);

  term.onData((d) => { s.lastInput = Date.now(); window.shoal.write(id, d); });
  term.onBell(() => { if (s.id !== activeId) s.unread = true; });
  term.onResize(({ cols, rows }) => window.shoal.resize(id, cols, rows));

  activate(id);
  fit.fit();
  await window.shoal.spawn({ id, cwd, command, cols: term.cols, rows: term.rows });
  render();
}

function activate(id) {
  activeId = id;
  const s = sessions.find((x) => x.id === id);
  sessions.forEach((x) => x.el.classList.toggle('active', x.id === id));
  if (s) {
    s.unread = false;
    requestAnimationFrame(() => { s.fit.fit(); s.term.focus(); });
  }
  render();
}

function closeSession(id) {
  const i = sessions.findIndex((x) => x.id === id);
  if (i < 0) return;
  const [s] = sessions.splice(i, 1);
  window.shoal.kill(id);
  s.term.dispose();
  s.el.remove();
  if (activeId === id) {
    const next = sessions[i] || sessions[i - 1];
    next ? activate(next.id) : (activeId = null);
  }
  render();
}

function statusOf(s) {
  if (s.exited) return 'exited';
  const now = Date.now();
  if (now - s.lastData < 1200 && now - s.lastInput > 250) return 'running';
  if (s.unread) return 'attention';
  return 'idle';
}

function sessionRow(s) {
  const li = document.createElement('li');
  li.className = 'session';
  li.dataset.id = s.id;
  li.innerHTML = `<span class="logo-slot">${logoHTML(s.shown)}</span>
    <div class="meta"><div class="name"></div><div class="sub"></div></div>
    <span class="dot"></span>
    <button class="close" title="Close  ⌘W">${CLOSE_SVG}</button>`;
  li.addEventListener('mousedown', (e) => { if (!e.target.closest('.close, input')) activate(s.id); });
  li.querySelector('.close').addEventListener('click', () => closeSession(s.id));
  li.querySelector('.name').addEventListener('dblclick', () => rename(s, li));
  return li;
}

function render() {
  const list = $('#sessions');
  const ids = sessions.map((s) => s.id).join();
  if (list.dataset.ids !== ids) {
    list.innerHTML = '';
    sessions.forEach((s) => list.appendChild(sessionRow(s)));
    list.dataset.ids = ids;
  }

  const counts = { running: 0, attention: 0 };
  sessions.forEach((s) => {
    const st = statusOf(s);
    if (st in counts) counts[st]++;
    const li = list.querySelector(`[data-id="${s.id}"]`);
    li.classList.toggle('active', s.id === activeId);
    li.dataset.state = st;
    if (s.swapped) li.querySelector('.logo-slot').innerHTML = logoHTML(s.shown, 'swap');
    const name = li.querySelector('.name');
    if (name && name.textContent !== s.name) name.textContent = s.name;
    li.title = `${s.name}  ·  ${basename(s.cwd)}`;
    li.querySelector('.sub').textContent = basename(s.cwd);
    li.querySelector('.dot').className = `dot ${st}`;
  });

  $('#summary').innerHTML = !sessions.length ? '' : [
    counts.running && `<span><i class="dot running"></i>${counts.running} working</span>`,
    counts.attention && `<span><i class="dot attention"></i>${counts.attention} need${counts.attention === 1 ? 's' : ''} you</span>`,
    !counts.running && !counts.attention && `<span>${sessions.length} ${sessions.length === 1 ? 'session' : 'sessions'}, all quiet</span>`,
  ].filter(Boolean).join('');

  const a = sessions.find((x) => x.id === activeId);
  $('#empty').classList.toggle('hidden', !!a);
  $('#header').classList.toggle('hidden', !a);
  $('#main').dataset.state = a ? statusOf(a) : 'none';
  if (a) {
    const key = `${a.id}|${a.name}`;
    if ($('#header').dataset.key !== key) {
      $('#header').dataset.key = key;
      $('#header-title').innerHTML = `<span class="title">${esc(a.name)}</span><span class="path">${esc(tildify(a.cwd))}</span>`;
    }
    const st = statusOf(a);
    $('#header-status').innerHTML = `<span class="dot ${st}"></span>${STATUS_LABEL[st]}`;
  }
  sessions.forEach((s) => { s.swapped = false; });
}

function rename(s, li) {
  const name = li.querySelector('.name');
  const input = document.createElement('input');
  input.className = 'name-input';
  input.value = s.name;
  name.replaceWith(input);
  input.focus();
  input.select();
  let finished = false;
  const done = (save) => {
    if (finished) return;
    finished = true;
    if (save && input.value.trim() && input.value.trim() !== s.name) { s.name = input.value.trim(); s.renamed = true; }
    input.replaceWith(name);
    render();
    s.term.focus();
  };
  input.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Enter') done(true);
    if (e.key === 'Escape') done(false);
  });
  input.addEventListener('blur', () => done(true));
}

function renderPalette() {
  const q = $('#palette-input').value.trim().toLowerCase();
  palItems = AGENTS.filter((a) => !q || a.label.toLowerCase().includes(q) || a.cmd.includes(q));
  palSel = Math.min(palSel, Math.max(palItems.length - 1, 0));
  const list = $('#palette-list');
  if (!palItems.length) { list.innerHTML = '<li class="pal-empty">No matching agents</li>'; return; }
  list.innerHTML = palItems.map((a, i) => {
    const f = flagSummary(a);
    return `<li class="pal-item${i === palSel ? ' sel' : ''}" data-i="${i}">${logoHTML(a)}<span class="label">${a.label}</span>${f ? `<span class="flags">${esc(f)}</span>` : ''}<span class="cmd">${a.cmd || '$SHELL'}</span></li>`;
  }).join('');
  list.querySelectorAll('.pal-item').forEach((li) => {
    li.addEventListener('mousemove', () => { if (palSel !== +li.dataset.i) { palSel = +li.dataset.i; renderPalette(); } });
    li.addEventListener('click', () => choose(palItems[+li.dataset.i]));
  });
  $('#keys').innerHTML = '<span class="hint">↑↓</span> select <span class="hint">↵</span> options <span class="hint">⌘↵</span> launch';
}

function choose(a) {
  showOpts(a);
}

function renderFolder() {
  $('#of-path').textContent = tildify(cwd);
  $('#folder-label').textContent = tildify(cwd);
  const recents = store.get('recentDirs', []).filter((d) => d !== home).slice(0, 6);
  $('#of-recent').innerHTML = recents.map((d, i) =>
    `<button class="of-chip${d === cwd ? ' on' : ''}" data-i="${i}" title="${esc(d)}">${esc(basename(d))}</button>`).join('');
  $('#of-recent').querySelectorAll('.of-chip').forEach((b) =>
    b.addEventListener('click', () => { cwd = recents[+b.dataset.i]; renderFolder(); }));
}
async function chooseFolder() {
  const p = await window.shoal.pickFolder(cwd);
  if (p) cwd = p;
  renderFolder();
}
function rememberDir(d) {
  store.set('recentDirs', [d, ...store.get('recentDirs', []).filter((x) => x !== d)].slice(0, 12));
}

function showOpts(a) {
  optAgent = a;
  optSel = 0;
  $('#step-pick').classList.add('hidden');
  $('#step-opts').classList.remove('hidden');
  $('#opts-title').innerHTML = `${logoHTML(a)}<span>${a.label}</span>`;
  $('#opts-args').value = cfgOf(a).extra || '';
  renderFolder();
  renderOpts();
  $('#opts-args').blur();
  $('#keys').innerHTML = '<span class="hint">⌘O</span> folder <span class="hint">space</span> toggle <span class="hint">↵</span> launch';
}

function renderOpts() {
  const a = optAgent;
  const cfg = cfgOf(a);
  const body = $('#opts-body');
  if (!a.cmd) {
    body.innerHTML = '';
  } else if (!a.opts.length) {
    body.innerHTML = '<div class="opt"><div class="txt"><span class="d">No presets for this agent. Add any flags below.</span></div></div>';
  } else {
    body.innerHTML = a.opts.map((o, i) => {
      const on = !o.seg && cfg.on[o.key];
      const right = o.seg
        ? `<div class="seg">${o.seg.map((v) => `<button data-v="${v}" class="${(cfg.seg[o.key] || o.seg[0]) === v ? 'on' : ''}">${v}</button>`).join('')}</div>`
        : '<span class="switch"></span>';
      const code = o.seg ? '' : `<code>${esc(o.flag)}</code>`;
      return `<div class="opt${on ? ' on' : ''}${o.danger ? ' danger' : ''}${i === optSel ? ' sel' : ''}" data-i="${i}">
        <div class="txt"><span class="t">${o.t}${code}</span>${o.d ? `<span class="d">${o.d}</span>` : ''}</div>${right}</div>`;
    }).join('');
    body.querySelectorAll('.opt').forEach((row) => {
      const o = a.opts[+row.dataset.i];
      row.addEventListener('mousemove', () => {
        if (optSel === +row.dataset.i) return;
        body.querySelector('.opt.sel')?.classList.remove('sel');
        row.classList.add('sel');
        optSel = +row.dataset.i;
      });
      if (o.seg) row.querySelectorAll('.seg button').forEach((b) => b.addEventListener('click', () => setSeg(o, b.dataset.v)));
      else row.addEventListener('click', () => toggleOpt(o));
    });
  }
  $('#opts-cmd').textContent = commandFor(a) || '$SHELL';
}

function saveCfg(fn) {
  const cfg = cfgOf(optAgent);
  fn(cfg);
  store.set(`cfg:${optAgent.id}`, cfg);
  renderOpts();
}
const toggleOpt = (o) => saveCfg((c) => { c.on[o.key] = !c.on[o.key]; });
const setSeg = (o, v) => saveCfg((c) => { c.seg[o.key] = v; });

function openPalette() {
  palSel = 0;
  optAgent = null;
  $('#palette-input').value = '';
  $('#folder-label').textContent = tildify(cwd);
  $('#step-opts').classList.add('hidden');
  $('#step-pick').classList.remove('hidden');
  renderPalette();
  $('#palette').classList.remove('hidden');
  $('#palette-input').focus();
}
function backToPick() {
  optAgent = null;
  $('#step-opts').classList.add('hidden');
  $('#step-pick').classList.remove('hidden');
  renderPalette();
  $('#palette-input').focus();
}
function closePalette() {
  optAgent = null;
  $('#palette').classList.add('hidden');
  sessions.find((s) => s.id === activeId)?.term.focus();
}
const paletteOpen = () => !$('#palette').classList.contains('hidden');

function toggleSidebar(force) {
  const collapsed = force ?? !document.body.classList.contains('collapsed');
  document.body.classList.toggle('collapsed', collapsed);
  store.set('sidebarCollapsed', collapsed);
  setTimeout(() => sessions.find((s) => s.id === activeId)?.fit.fit(), 400);
}

function buildStatic() {
  $('#side-toggle').addEventListener('click', () => toggleSidebar());
  if (store.get('sidebarCollapsed', false)) toggleSidebar(true);
  $('#quick').innerHTML = AGENTS.slice(0, 4).map((a, i) =>
    `<button class="quick-tile" data-i="${i}">${logoHTML(a)}<span class="label">${a.label}</span></button>`
  ).join('');
  $('#quick').querySelectorAll('.quick-tile').forEach((b) =>
    b.addEventListener('click', () => { openPalette(); choose(AGENTS[+b.dataset.i]); }));

  $('#palette-input').addEventListener('input', () => { palSel = 0; renderPalette(); });
  $('#opts-args').addEventListener('input', (e) => saveCfg((c) => { c.extra = e.target.value; }));
  $('#opts-back').addEventListener('click', backToPick);
  $('#palette').addEventListener('mousedown', (e) => { if (e.target.id === 'palette') closePalette(); });
  $('#folder-btn').addEventListener('click', async () => {
    await chooseFolder();
    if (!optAgent) $('#palette-input').focus();
  });
  $('#of-choose').addEventListener('click', chooseFolder);
  $('#start-btn').addEventListener('click', () => optAgent && createSession(optAgent));
  $('#new-btn').addEventListener('click', openPalette);
  $('#theme-btn').addEventListener('click', () => {
    document.documentElement.classList.add('theming');
    store.set('theme', isDark() ? 'light' : 'dark');
    applyTheme();
    setTimeout(() => document.documentElement.classList.remove('theming'), 500);
  });
}

function paletteKeys(e) {
  if (optAgent) {
    const inArgs = document.activeElement === $('#opts-args');
    const o = optAgent.opts[optSel];
    if (e.metaKey && e.key === 'o') { e.preventDefault(); chooseFolder(); return; }
    if (e.key === 'Escape') { e.preventDefault(); inArgs ? $('#opts-args').blur() : backToPick(); }
    else if (e.key === 'Enter') { e.preventDefault(); createSession(optAgent); }
    else if (e.key === 'Tab') { e.preventDefault(); inArgs ? $('#opts-args').blur() : $('#opts-args').focus(); }
    else if (inArgs) return;
    else if (e.key === 'ArrowDown' && optAgent.opts.length) { e.preventDefault(); optSel = (optSel + 1) % optAgent.opts.length; renderOpts(); }
    else if (e.key === 'ArrowUp' && optAgent.opts.length) { e.preventDefault(); optSel = (optSel - 1 + optAgent.opts.length) % optAgent.opts.length; renderOpts(); }
    else if (e.key === ' ' && o && !o.seg) { e.preventDefault(); toggleOpt(o); }
    else if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === ' ') && o?.seg) {
      e.preventDefault();
      const cur = o.seg.indexOf(cfgOf(optAgent).seg[o.key] || o.seg[0]);
      setSeg(o, o.seg[(cur + (e.key === 'ArrowLeft' ? -1 : 1) + o.seg.length) % o.seg.length]);
    }
    else if (e.key === 'Backspace') { e.preventDefault(); backToPick(); }
    return;
  }
  if (e.key === 'Escape') { e.preventDefault(); closePalette(); }
  else if (e.key === 'ArrowDown') { e.preventDefault(); palSel = (palSel + 1) % Math.max(palItems.length, 1); renderPalette(); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); palSel = (palSel - 1 + palItems.length) % Math.max(palItems.length, 1); renderPalette(); }
  else if (e.key === 'Enter' && palItems[palSel]) { e.preventDefault(); e.metaKey ? createSession(palItems[palSel]) : choose(palItems[palSel]); }
  else if (e.metaKey && e.key === 't') { e.preventDefault(); closePalette(); }
}

window.addEventListener('keydown', (e) => {
  if (paletteOpen()) return paletteKeys(e);
  if (!e.metaKey) return;
  const i = sessions.findIndex((s) => s.id === activeId);
  if (e.key === 't') { e.preventDefault(); openPalette(); }
  else if (e.key === 'b') { e.preventDefault(); toggleSidebar(); }
  else if (e.key === 'w' && activeId) { e.preventDefault(); closeSession(activeId); }
  else if (/^[1-9]$/.test(e.key)) { const s = sessions[+e.key - 1]; if (s) { e.preventDefault(); activate(s.id); } }
  else if (e.key === ']' && sessions.length) { e.preventDefault(); activate(sessions[(i + 1) % sessions.length].id); }
  else if (e.key === '[' && sessions.length) { e.preventDefault(); activate(sessions[(i - 1 + sessions.length) % sessions.length].id); }
}, true);

window.shoal.onData(({ id, data }) => {
  const s = sessions.find((x) => x.id === id);
  if (!s) return;
  s.term.write(data);
  const now = Date.now();
  if (now - s.lastInput > 250) {
    s.lastData = now;
    if (id !== activeId && now - s.created > 2500) s.unread = true;
  }
});

window.shoal.onAgent(({ id, agent }) => {
  const s = sessions.find((x) => x.id === id);
  if (!s) return;
  const next = (agent && byId(agent)) || s.agent;
  if (next.id === s.shown.id) return;
  s.shown = next;
  s.swapped = true;
  if (!s.renamed) s.name = autoName(next);
  render();
});

window.shoal.onExit(({ id }) => {
  const s = sessions.find((x) => x.id === id);
  if (!s) return;
  s.exited = true;
  s.term.write('\r\n\x1b[2m[process exited]\x1b[0m\r\n');
  render();
});

new ResizeObserver(() => sessions.find((s) => s.id === activeId)?.fit.fit()).observe($('#terminals'));
setInterval(render, 400);

(async () => {
  applyTheme();
  home = await window.shoal.home();
  cwd = home;
  await document.fonts.ready;
  buildStatic();
  render();
})();
