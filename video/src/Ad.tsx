import React from 'react';
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';

const C = {
  paper: '#fbfaf7', stone: '#f3f1ec', ink: '#1b1a17', ink2: '#6b675f', ink3: '#a39f95',
  line: 'rgba(27,26,23,0.07)', line2: 'rgba(27,26,23,0.12)', clay: '#c96442', green: '#3f9b6a',
};
const SERIF = 'ShoalSerif, Georgia, serif';
const SANS = 'ShoalSans, -apple-system, sans-serif';
const MONO = 'ShoalMono, Menlo, monospace';
const ease = Easing.bezier(0.22, 1, 0.36, 1);
const t = (f: number, a: number, b: number) =>
  interpolate(f, [a, b], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });
const seg = (f: number, a: number, b: number, fade = 12) => Math.min(t(f, a, a + fade), 1 - t(f, b - fade, b));

const FONTS = `
@font-face { font-family: ShoalSans; src: url(${staticFile('inter.woff2')}); font-weight: 100 900; }
@font-face { font-family: ShoalSerif; src: url(${staticFile('serif.woff2')}); }
@font-face { font-family: ShoalSerif; font-style: italic; src: url(${staticFile('serif-italic.woff2')}); }
@font-face { font-family: ShoalMono; src: url(${staticFile('mono.woff2')}); }
`;

/* ---------- timeline ---------- */
const CARDS = [
  { a: 0, b: 80, kind: 'rise', l1: 'One window for', l2: 'every coding agent.' },
  { a: 80, b: 140, kind: 'track', l1: 'Start any agent', l2: 'with ⌘T.' },
  { a: 290, b: 350, kind: 'wipe', l1: 'See them all', l2: 'at a glance.' },
  { a: 475, b: 535, kind: 'zoom', l1: 'Know which one', l2: 'needs you.' },
  { a: 655, b: 715, kind: 'lines', l1: 'Type an agent in any shell.', l2: 'Shoal knows.' },
] as const;
const DEMOS: [number, number][] = [[136, 294], [346, 479], [531, 659], [711, 836]];
const END = 832;

/* ---------- agents ---------- */
type Agent = { name: string; cmd: string; icon?: string; color?: boolean };
const A: Record<string, Agent> = {
  claude: { name: 'Claude Code', cmd: 'claude', icon: 'claudecode-color', color: true },
  hermes: { name: 'Hermes', cmd: 'hermes', icon: 'hermesagent' },
  codex: { name: 'Codex', cmd: 'codex', icon: 'codex-color', color: true },
  gemini: { name: 'Gemini CLI', cmd: 'gemini', icon: 'geminicli-color', color: true },
  omp: { name: 'Oh My Pi', cmd: 'omp', icon: 'pi' },
  opencode: { name: 'OpenCode', cmd: 'opencode', icon: 'opencode' },
  ollama: { name: 'Ollama', cmd: 'ollama', icon: 'ollama' },
  shell: { name: 'Shell', cmd: '$SHELL' },
};
const PICK_LIST = ['claude', 'hermes', 'codex', 'gemini', 'omp', 'opencode', 'ollama', 'shell'];

type St = 'running' | 'attention' | 'idle';
type Row = { key: string; agent: Agent; dir: string; st: St; in: number };

const OMP_SWAP = 792;
function rowsAt(f: number): Row[] {
  const rows: Row[] = [];
  if (f >= 262) rows.push({ key: 'c', agent: A.claude, dir: 'api', in: 262, st: f < 640 ? 'running' : 'idle' });
  if (f >= 372) rows.push({ key: 'h', agent: A.hermes, dir: 'scraper', in: 372, st: f >= 560 && f < 628 ? 'attention' : f >= 628 ? 'running' : 'idle' });
  if (f >= 386) rows.push({ key: 'x', agent: A.codex, dir: 'web', in: 386, st: f >= 404 ? 'running' : 'idle' });
  if (f >= 400) rows.push({ key: 's', agent: f >= OMP_SWAP ? A.omp : A.shell, dir: 'infra', in: 400, st: f >= OMP_SWAP ? 'running' : 'idle' });
  return rows;
}
const activeAt = (f: number) => (f >= 746 ? 's' : f >= 600 ? 'h' : 'c');
const rowY = (i: number) => 456 + i * 70;

/* ---------- small parts ---------- */
const ShellGlyph: React.FC<{ s: number }> = ({ s }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M6 8l4 4-4 4M13 16h5" /></svg>
);
const Logo: React.FC<{ a: Agent; size?: number; bg?: string; pop?: number }> = ({ a, size = 34, bg = C.paper, pop = 1 }) => {
  const s = size * 0.55;
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.29, background: bg, boxShadow: `0 0 0 1px ${C.line}`, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
      <div style={{ transform: `scale(${0.6 + 0.4 * pop}) rotate(${(1 - pop) * -20}deg)`, opacity: pop, display: 'grid' }}>
        {!a.icon ? <ShellGlyph s={s} /> : a.color ? (
          <Img src={staticFile(`${a.icon}.svg`)} style={{ width: s, height: s }} />
        ) : (
          <div style={{ width: s, height: s, background: C.ink, WebkitMaskImage: `url(${staticFile(`${a.icon}.svg`)})`, WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center' }} />
        )}
      </div>
    </div>
  );
};
const Dot: React.FC<{ st: St; f: number; size?: number }> = ({ st, f, size = 8 }) => {
  const color = st === 'running' ? C.green : st === 'attention' ? C.clay : C.line2;
  const ping = st === 'attention' ? (f % 60) / 60 : 0;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: color, boxShadow: st === 'attention' ? `0 0 0 ${ping * 11}px rgba(201,100,66,${0.5 * (1 - ping)})` : 'none' }} />
      {st === 'running' && (
        <div style={{ position: 'absolute', inset: -5, borderRadius: '50%', background: `conic-gradient(from ${(f * 9) % 360}deg, transparent 0 55%, rgba(63,155,106,0.65) 92%, transparent)`, WebkitMaskImage: 'radial-gradient(circle, transparent 6px, #000 6.5px)' }} />
      )}
    </div>
  );
};
const Kbd: React.FC<{ children: React.ReactNode; size?: number }> = ({ children, size = 30 }) => (
  <span style={{ display: 'inline-grid', placeItems: 'center', minWidth: size * 1.9, height: size * 1.9, padding: `0 ${size * 0.5}px`, borderRadius: size * 0.42, background: C.paper, boxShadow: `0 0 0 1px ${C.line2}, 0 ${size * 0.12}px 0 ${C.line2}, 0 10px 30px rgba(27,26,23,0.1)`, fontFamily: SANS, fontWeight: 500, fontSize: size, color: C.ink }}>{children}</span>
);

const Aurora: React.FC<{ f: number; mode: 'running' | 'attention'; o: number }> = ({ f, mode, o }) => {
  if (o <= 0.001) return null;
  const s = Math.sin(f / 40), c = Math.cos(f / 52);
  const cols = mode === 'running'
    ? ['rgba(222,190,130,0.6)', 'rgba(120,176,138,0.48)', 'rgba(201,100,66,0.28)']
    : ['rgba(201,100,66,0.4)', 'rgba(236,170,120,0.52)', 'rgba(201,100,66,0.4)'];
  const breathe = mode === 'attention' ? 0.72 + 0.28 * Math.sin(f / 9) : 1;
  const blobs = [
    { l: 4 + s * 5, w: 44, h: 230, top: -150 + c * 20 },
    { l: 36 - s * 6, w: 40, h: 210, top: -150 - s * 18 },
    { l: 64 + c * 4, w: 34, h: 200, top: -140 + s * 16 },
  ];
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 360, filter: 'blur(60px)', opacity: o * breathe, pointerEvents: 'none' }}>
      {blobs.map((b, i) => <div key={i} style={{ position: 'absolute', left: `${b.l}%`, width: `${b.w}%`, height: b.h, top: b.top, borderRadius: '50%', background: cols[i] }} />)}
    </div>
  );
};

/* ---------- terminal text ---------- */
type Line = { at: number; text: string; color?: string; typed?: boolean };
const TERM: Record<string, Line[]> = {
  c: [
    { at: 266, text: '✻ Claude Code', color: C.clay },
    { at: 272, text: '> refactor the auth middleware and add tests', typed: true },
    { at: 360, text: '● Reading src/auth/middleware.ts', color: C.ink2 },
    { at: 400, text: '● Editing 3 files', color: C.ink2 },
    { at: 430, text: '● Running npm test', color: C.ink2 },
    { at: 460, text: '  ✓ 42 passed', color: C.green },
  ],
  h: [
    { at: 560, text: '● Scraped 1,204 pages', color: C.ink2 },
    { at: 566, text: '? config.yaml already exists. Overwrite? [y/N]', color: C.clay },
    { at: 622, text: '  y', typed: true },
    { at: 632, text: '● Writing config.yaml', color: C.ink2 },
  ],
  s: [
    { at: 750, text: '~/infra %', color: C.ink3 },
    { at: 770, text: '~/infra % omp', typed: true },
    { at: 792, text: 'π  Oh My Pi  ·  ready', color: C.ink },
    { at: 802, text: '> tidy up the terraform modules', typed: true },
  ],
};
const Terminal: React.FC<{ f: number; lines: Line[] }> = ({ f, lines }) => {
  let shown = lines.filter((l) => f >= l.at);
  shown = shown.filter((l, i) => !(l.text === '~/infra %' && shown[i + 1]?.text.startsWith('~/infra % omp')));
  return (
    <div style={{ fontFamily: MONO, fontSize: 22, lineHeight: 1.55 }}>
      {shown.map((l, i) => {
        const n = l.typed ? Math.floor(interpolate(f, [l.at, l.at + Math.max(8, l.text.length * 0.7)], [0, l.text.length], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })) : l.text.length;
        const caret = l.typed && i === shown.length - 1 && Math.floor(f / 8) % 2 === 0;
        return (
          <div key={i} style={{ color: l.color ?? C.ink, whiteSpace: 'pre' }}>
            {l.text.slice(0, n)}{caret && <span style={{ background: C.ink, color: C.ink }}> </span>}
          </div>
        );
      })}
    </div>
  );
};

/* ---------- palette (demo 1) ---------- */
const Palette: React.FC<{ f: number }> = ({ f }) => {
  const o = Math.min(t(f, 156, 168), 1 - t(f, 246, 256));
  if (o <= 0) return null;
  const query = 'cla'.slice(0, Math.floor(interpolate(f, [172, 186], [0, 3], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })));
  const items = PICK_LIST.filter((k) => !query || A[k].name.toLowerCase().includes(query) || A[k].cmd.includes(query));
  const opts = t(f, 202, 214);
  const skip = t(f, 224, 232);
  const cmd = `claude${skip > 0.5 ? ' --dangerously-skip-permissions' : ''}`;
  return (
    <AbsoluteFill style={{ background: `rgba(243,241,236,${0.55 * o})`, backdropFilter: `blur(${12 * o}px)`, alignItems: 'center', paddingTop: 190 }}>
      <div style={{ position: 'relative', width: 760, background: C.paper, borderRadius: 24, boxShadow: `0 0 0 1px ${C.line2}, 0 40px 100px rgba(27,26,23,0.2)`, overflow: 'hidden', opacity: o, transform: `translateY(${(1 - o) * 12}px) scale(${0.975 + 0.025 * o})` }}>
        {opts < 1 && (
          <div style={{ opacity: 1 - opts, transform: `translateX(${-opts * 20}px)` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, height: 84, padding: '0 28px', borderBottom: `1px solid ${C.line}`, fontFamily: SANS, fontSize: 24 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.ink3} strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4 4" /></svg>
              {query ? <span>{query}<span style={{ display: 'inline-block', width: 2, height: 28, background: C.clay, verticalAlign: 'middle', marginLeft: 2 }} /></span> : <span style={{ color: C.ink3 }}>Start a session</span>}
            </div>
            <div style={{ padding: 12, height: 470 }}>
              {items.slice(0, 7).map((k, i) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 18, height: 64, padding: '0 16px', borderRadius: 14, background: i === 0 ? C.stone : 'transparent' }}>
                  <Logo a={A[k]} size={38} />
                  <span style={{ fontFamily: SANS, fontWeight: 500, fontSize: 20 }}>{A[k].name}</span>
                  <span style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 15, color: C.ink3 }}>{A[k].cmd}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {opts > 0 && (
          <div style={{ position: opts < 1 ? 'absolute' : 'relative', inset: 0, opacity: opts, transform: `translateX(${(1 - opts) * 24}px)` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, height: 84, padding: '0 28px', borderBottom: `1px solid ${C.line}` }}>
              <Logo a={A.claude} size={38} />
              <span style={{ fontFamily: SERIF, fontSize: 34 }}>Claude Code</span>
            </div>
            <div style={{ padding: 12 }}>
              {[
                { t: 'Skip permissions', code: '--dangerously-skip-permissions', d: 'Run tools without asking first', on: skip, danger: true },
                { t: 'Continue', code: '--continue', d: 'Pick up the most recent conversation', on: 0 },
                { t: 'Resume', code: '--resume', d: 'Choose a past conversation to reopen', on: 0 },
              ].map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '16px', borderRadius: 14, background: i === 0 && f >= 214 ? C.stone : 'transparent' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: SANS, fontWeight: 500, fontSize: 19, color: r.danger ? C.clay : C.ink }}>{r.t}<span style={{ fontFamily: MONO, fontSize: 14, color: C.ink3, marginLeft: 10 }}>{r.code}</span></div>
                    <div style={{ fontFamily: SANS, fontSize: 16, color: C.ink3, marginTop: 4 }}>{r.d}</div>
                  </div>
                  <div style={{ width: 46, height: 27, borderRadius: 99, background: r.on > 0.5 ? (r.danger ? C.clay : C.ink) : 'rgba(27,26,23,0.12)', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 3, left: 3 + r.on * 19, width: 21, height: 21, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ margin: '4px 28px 28px', padding: '18px 20px', borderRadius: 14, background: C.ink, color: C.stone, fontFamily: MONO, fontSize: 18, display: 'flex', gap: 14, whiteSpace: 'nowrap' }}>
              <span style={{ color: C.clay }}>$</span>{cmd}
            </div>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

/* ---------- app window ---------- */
const AppWindow: React.FC<{ f: number }> = ({ f }) => {
  const rows = rowsAt(f);
  const activeKey = rows.length ? activeAt(f) : null;
  const active = rows.find((r) => r.key === activeKey);
  const switchAt = activeKey === 'h' ? 600 : activeKey === 's' ? 746 : 262;
  const sw = t(f, switchAt, switchAt + 16);
  const running = rows.filter((r) => r.st === 'running').length;
  const needs = rows.filter((r) => r.st === 'attention').length;

  return (
    <div style={{ position: 'absolute', left: 150, top: 170, width: 1620, height: 860, borderRadius: 22, background: C.stone, boxShadow: `0 0 0 1px ${C.line2}, 0 50px 120px rgba(27,26,23,0.18)`, display: 'flex', overflow: 'hidden' }}>
      <div style={{ width: 330, padding: '0 20px 22px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', gap: 10, padding: '24px 6px 0' }}>
          {['#ff5f57', '#febc2e', '#28c840'].map((c) => <div key={c} style={{ width: 14, height: 14, borderRadius: '50%', background: c }} />)}
        </div>
        <div style={{ fontFamily: SERIF, fontSize: 36, padding: '30px 12px 28px' }}>Shoal</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: 50, padding: '0 16px', borderRadius: 13, background: C.paper, boxShadow: `0 0 0 1px ${C.line}`, fontFamily: SANS, fontWeight: 500, fontSize: 17 }}>
          <span style={{ color: C.ink2, fontSize: 22 }}>+</span>New session
          <span style={{ marginLeft: 'auto', fontSize: 14, color: C.ink3, background: 'rgba(27,26,23,0.045)', padding: '2px 7px', borderRadius: 5 }}>⌘T</span>
        </div>
        <div style={{ fontFamily: SANS, fontWeight: 500, fontSize: 14, color: C.ink3, padding: '32px 12px 10px' }}>Sessions</div>
        {rows.map((r) => {
          const inP = t(f, r.in, r.in + 14);
          const isActive = r.key === activeKey;
          const sheen = ((f * 1.6) % 160) - 30;
          const pop = r.key === 's' ? (f >= OMP_SWAP ? t(f, OMP_SWAP, OMP_SWAP + 14) : 1) : 1;
          return (
            <div key={r.key} style={{ position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 14, height: 66, padding: '0 14px', marginBottom: 4, borderRadius: 14, opacity: inP, transform: `translateX(${(1 - inP) * -10}px)`, background: isActive ? '#fff' : 'transparent', boxShadow: isActive ? `0 0 0 1px ${C.line}, 0 2px 10px rgba(27,26,23,0.05)` : 'none' }}>
              {r.st === 'running' && <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(100deg, transparent ${sheen - 25}%, rgba(63,155,106,0.09) ${sheen - 10}%, rgba(222,190,130,0.18) ${sheen}%, rgba(63,155,106,0.09) ${sheen + 10}%, transparent ${sheen + 25}%)` }} />}
              {r.st === 'attention' && <div style={{ position: 'absolute', inset: 0, opacity: 0.7 + 0.3 * Math.sin(f / 9), background: 'radial-gradient(130% 160% at 0% 50%, rgba(201,100,66,0.24), rgba(232,160,110,0.1) 50%, transparent 80%)' }} />}
              <div style={{ position: 'relative' }}><Logo a={r.agent} bg={isActive ? C.stone : C.paper} pop={pop} /></div>
              <div style={{ position: 'relative', flex: 1 }}>
                <div style={{ fontFamily: SANS, fontWeight: 500, fontSize: 17, color: isActive || r.st === 'attention' ? C.ink : C.ink2 }}>{r.agent.name}</div>
                <div style={{ fontFamily: MONO, fontSize: 13, color: C.ink3, marginTop: 3 }}>{r.dir}</div>
              </div>
              <Dot st={r.st} f={f} />
            </div>
          );
        })}
        <div style={{ marginTop: 'auto', padding: '0 12px', display: 'flex', gap: 18, fontFamily: SANS, fontSize: 14, color: C.ink3 }}>
          {running > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Dot st="running" f={f} size={7} />{running} working</span>}
          {needs > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Dot st="attention" f={f} size={7} />{needs} needs you</span>}
        </div>
      </div>

      <div style={{ position: 'relative', flex: 1, margin: '10px 10px 10px 0', borderRadius: 18, background: C.paper, boxShadow: `0 0 0 1px ${C.line}, 0 10px 40px rgba(27,26,23,0.05)`, overflow: 'hidden' }}>
        {!active && (
          <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 18 }}>
            <div style={{ fontFamily: SERIF, fontSize: 64, letterSpacing: '-0.02em' }}>No sessions yet</div>
            <div style={{ fontFamily: SANS, fontSize: 20, color: C.ink3 }}>Press ⌘T to start one</div>
          </AbsoluteFill>
        )}
        {active && (
          <>
            <Aurora f={f} mode="running" o={active.st === 'running' ? sw : 0} />
            <Aurora f={f} mode="attention" o={active.st === 'attention' ? 1 : 0} />
            <div style={{ position: 'relative', height: 76, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', borderBottom: `1px solid ${C.line}` }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, opacity: sw, transform: `translateY(${(1 - sw) * 10}px)`, filter: `blur(${(1 - sw) * 4}px)` }}>
                <span style={{ fontFamily: SERIF, fontSize: 34 }}>{active.agent.name}</span>
                <span style={{ fontFamily: MONO, fontSize: 15, color: C.ink3 }}>~/{active.dir}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', borderRadius: 99, background: 'rgba(255,255,255,0.6)', boxShadow: `0 0 0 1px ${C.line}`, fontFamily: SANS, fontWeight: 500, fontSize: 15, color: active.st === 'attention' ? C.clay : C.ink2 }}>
                <Dot st={active.st} f={f} />{active.st === 'running' ? 'Working' : active.st === 'attention' ? 'Needs you' : 'Idle'}
              </div>
            </div>
            <div style={{ position: 'absolute', top: 104, left: 32, right: 32, opacity: sw, filter: `blur(${(1 - sw) * 8}px)` }}>
              <Terminal f={f} lines={TERM[active.key]} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/* ---------- cursor and keys ---------- */
const CURSOR: { a: number; b: number; path: [number, number, number][]; clicks: number[] }[] = [
  { a: 206, b: 244, path: [[206, 1180, 760], [222, 1290, 326]], clicks: [225] },
  { a: 574, b: 616, path: [[574, 1250, 760], [596, 320, 526]], clicks: [600] },
  { a: 722, b: 766, path: [[722, 1000, 820], [742, 320, 666]], clicks: [746] },
];
const Cursor: React.FC<{ f: number }> = ({ f }) => {
  const c = CURSOR.find((x) => f >= x.a && f < x.b);
  if (!c) return null;
  const [p0, p1] = c.path;
  const k = t(f, p0[0], p1[0]);
  const x = p0[1] + (p1[1] - p0[1]) * k;
  const y = p0[2] + (p1[2] - p0[2]) * k;
  const press = c.clicks.some((cl) => f >= cl - 2 && f < cl + 4) ? 0.86 : 1;
  const o = seg(f, c.a, c.b, 6);
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" style={{ position: 'absolute', left: x - 6, top: y - 4, opacity: o, transform: `scale(${press})`, transformOrigin: '6px 4px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.25))' }}>
      <path d="M5 3l14 8-6 1.5L10 19z" fill={C.ink} stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
};
const KEYS: { a: number; b: number; keys: string[] }[] = [
  { a: 146, b: 172, keys: ['⌘', 'T'] },
  { a: 190, b: 212, keys: ['↵'] },
  { a: 236, b: 258, keys: ['↵'] },
  { a: 616, b: 640, keys: ['y', '↵'] },
  { a: 770, b: 796, keys: ['o', 'm', 'p', '↵'] },
];
const Keys: React.FC<{ f: number }> = ({ f }) => {
  const k = KEYS.find((x) => f >= x.a && f < x.b);
  if (!k) return null;
  const o = seg(f, k.a, k.b, 6);
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 34, display: 'flex', justifyContent: 'center', gap: 12, opacity: o, transform: `translateY(${(1 - t(f, k.a, k.a + 8)) * 16}px)` }}>
      {k.keys.map((key, i) => (
        <div key={i} style={{ transform: `translateY(${f >= k.a + 4 + i * 3 && f < k.a + 8 + i * 3 ? 3 : 0}px)` }}><Kbd size={26}>{key}</Kbd></div>
      ))}
    </div>
  );
};

/* ---------- title cards, each with its own motion ---------- */
const Card: React.FC<{ f: number; card: (typeof CARDS)[number] }> = ({ f, card }) => {
  const { a, b, kind, l1, l2 } = card;
  const lf = f - a;
  const out = t(f, b - 12, b);
  const big = { fontFamily: SERIF, fontSize: 140, lineHeight: 1, letterSpacing: '-0.03em' } as const;
  const em = { fontStyle: 'italic' as const, color: C.clay };
  let body: React.ReactNode;

  if (kind === 'rise') {
    const words = `${l1} ${l2}`.split(' ');
    body = (
      <div style={{ ...big, textAlign: 'center', maxWidth: 1400, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', columnGap: '0.25em' }}>
        {words.map((w, i) => {
          const p = t(lf, 4 + i * 4, 26 + i * 4);
          return <span key={i} style={{ display: 'inline-block', opacity: p, transform: `translateY(${(1 - p) * 40}px)`, filter: `blur(${(1 - p) * 10}px)`, ...(i >= l1.split(' ').length ? em : {}) }}>{w}</span>;
        })}
      </div>
    );
  } else if (kind === 'track') {
    const p = t(lf, 0, 34);
    const k = t(lf, 18, 32);
    body = (
      <div style={{ textAlign: 'center' }}>
        <div style={{ ...big, letterSpacing: `${-0.03 + (1 - p) * 0.3}em`, opacity: p }}>{l1}</div>
        <div style={{ ...big, ...em, marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 28 }}>
          <span style={{ opacity: p }}>with</span>
          <span style={{ transform: `scale(${0.7 + 0.3 * k}) translateY(${(1 - k) * 20}px)`, opacity: k, display: 'inline-flex', gap: 14 }}><Kbd size={64}>⌘</Kbd><Kbd size={64}>T</Kbd></span>
        </div>
      </div>
    );
  } else if (kind === 'wipe') {
    const p1 = t(lf, 2, 24), p2 = t(lf, 12, 34);
    body = (
      <div style={{ ...big, textAlign: 'left' }}>
        <div style={{ clipPath: `inset(0 ${(1 - p1) * 100}% 0 0)` }}>{l1}</div>
        <div style={{ ...em, clipPath: `inset(0 ${(1 - p2) * 100}% 0 0)`, paddingLeft: 160 }}>{l2}</div>
      </div>
    );
  } else if (kind === 'zoom') {
    const p = t(lf, 0, 30), p2 = t(lf, 14, 36);
    body = (
      <div style={{ ...big, textAlign: 'center' }}>
        <div style={{ transform: `scale(${1.12 - 0.12 * p})`, opacity: p, filter: `blur(${(1 - p) * 14}px)` }}>{l1}</div>
        <div style={{ ...em, transform: `scale(${1.12 - 0.12 * p2})`, opacity: p2, filter: `blur(${(1 - p2) * 14}px)` }}>
          <span style={{ display: 'inline-block', width: 22, height: 22, borderRadius: '50%', background: C.clay, marginRight: 28, verticalAlign: 'middle', boxShadow: `0 0 0 ${((lf % 40) / 40) * 22}px rgba(201,100,66,${0.4 * (1 - (lf % 40) / 40)})` }} />
          {l2}
        </div>
      </div>
    );
  } else {
    const p1 = t(lf, 2, 22), p2 = t(lf, 14, 34);
    body = (
      <div style={{ ...big, fontSize: 116, textAlign: 'center' }}>
        <div style={{ overflow: 'hidden', paddingBottom: 12 }}><div style={{ transform: `translateY(${(1 - p1) * 120}%)` }}>Type an agent in <span style={{ fontFamily: MONO, fontSize: 96, letterSpacing: 0, background: C.paper, padding: '0 22px', borderRadius: 16, boxShadow: `0 0 0 1px ${C.line2}` }}>any shell</span>.</div></div>
        <div style={{ overflow: 'hidden', paddingBottom: 12 }}><div style={{ ...em, transform: `translateY(${(1 - p2) * 120}%)` }}>{l2}</div></div>
      </div>
    );
  }
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', opacity: 1 - out, filter: `blur(${out * 12}px)`, transform: `scale(${1 - out * 0.03})` }}>
      {body}
    </AbsoluteFill>
  );
};

const EndCard: React.FC<{ f: number }> = ({ f }) => {
  const lf = f - END;
  const letters = 'Shoal'.split('');
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Aurora f={f} mode="running" o={t(lf, 0, 30) * 0.9} />
      <div style={{ fontFamily: SERIF, fontSize: 240, letterSpacing: '-0.035em', lineHeight: 1, display: 'flex' }}>
        {letters.map((l, i) => {
          const p = t(lf, 4 + i * 5, 26 + i * 5);
          return <span key={i} style={{ display: 'inline-block', opacity: p, filter: `blur(${(1 - p) * 12}px)`, transform: `translateY(${(1 - p) * 18}px)` }}>{l}</span>;
        })}
      </div>
      <div style={{ fontFamily: SANS, fontSize: 32, color: C.ink2, marginTop: 30, opacity: t(lf, 36, 56), transform: `translateY(${(1 - t(lf, 36, 60)) * 10}px)` }}>
        Every coding agent, one calm window.
      </div>
      <div style={{ display: 'flex', gap: 14, marginTop: 36, opacity: t(lf, 50, 70) }}>
        {['Free', 'Open source', 'macOS'].map((x) => (
          <span key={x} style={{ fontFamily: SANS, fontWeight: 500, fontSize: 20, color: C.ink2, padding: '10px 20px', borderRadius: 99, background: C.paper, boxShadow: `0 0 0 1px ${C.line}` }}>{x}</span>
        ))}
      </div>
    </AbsoluteFill>
  );
};

export const Ad: React.FC = () => {
  const f = useCurrentFrame();
  const demo = DEMOS.find(([a, b]) => f >= a && f < b);
  const dO = demo ? seg(f, demo[0], demo[1], 14) : 0;

  return (
    <AbsoluteFill style={{ background: C.stone, color: C.ink, fontFamily: SANS }}>
      <style>{FONTS}</style>
      {CARDS.filter((c) => f >= c.a && f < c.b).map((c) => <Card key={c.a} f={f} card={c} />)}
      {demo && (
        <AbsoluteFill style={{ opacity: dO, filter: `blur(${(1 - dO) * 10}px)`, transform: `scale(${0.97 + 0.03 * dO})` }}>
          <AppWindow f={f} />
          <Palette f={f} />
          <Keys f={f} />
          <Cursor f={f} />
        </AbsoluteFill>
      )}
      {f >= END && <EndCard f={f} />}
    </AbsoluteFill>
  );
};
