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

const t = (f: number, a: number, b: number, from = 0, to = 1) =>
  interpolate(f, [a, b], [from, to], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });

const FONTS = `
@font-face { font-family: ShoalSans; src: url(${staticFile('inter.woff2')}); font-weight: 100 900; }
@font-face { font-family: ShoalSerif; src: url(${staticFile('serif.woff2')}); }
@font-face { font-family: ShoalSerif; font-style: italic; src: url(${staticFile('serif-italic.woff2')}); }
@font-face { font-family: ShoalMono; src: url(${staticFile('mono.woff2')}); }
`;

type Agent = { name: string; icon?: string; color?: boolean; dir: string };
const AGENTS: Agent[] = [
  { name: 'Claude Code', icon: 'claudecode-color', color: true, dir: 'api' },
  { name: 'Hermes', icon: 'hermesagent', dir: 'scraper' },
  { name: 'Codex', icon: 'codex-color', color: true, dir: 'web' },
  { name: 'Oh My Pi', icon: 'pi', dir: 'infra' },
];
const ROW_IN = [118, 130, 142, 154];

const Logo: React.FC<{ a: Agent; size?: number; bg?: string }> = ({ a, size = 34, bg = C.paper }) => {
  const s = size * 0.55;
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.29, background: bg, boxShadow: `0 0 0 1px ${C.line}`, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
      {a.color ? (
        <Img src={staticFile(`${a.icon}.svg`)} style={{ width: s, height: s }} />
      ) : (
        <div style={{ width: s, height: s, background: C.ink, WebkitMaskImage: `url(${staticFile(`${a.icon}.svg`)})`, WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center' }} />
      )}
    </div>
  );
};

type St = 'running' | 'attention' | 'idle';
const Dot: React.FC<{ st: St; f: number; size?: number }> = ({ st, f, size = 8 }) => {
  const color = st === 'running' ? C.green : st === 'attention' ? C.clay : C.line2;
  const ping = st === 'attention' ? (f % 78) / 78 : 0;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: color, boxShadow: st === 'attention' ? `0 0 0 ${ping * 10}px rgba(201,100,66,${0.45 * (1 - ping)})` : 'none' }} />
      {st === 'running' && (
        <div style={{ position: 'absolute', inset: -5, borderRadius: '50%', background: `conic-gradient(from ${(f * 9) % 360}deg, transparent 0 55%, rgba(63,155,106,0.65) 92%, transparent)`, WebkitMaskImage: 'radial-gradient(circle, transparent 6px, #000 6.5px)' }} />
      )}
    </div>
  );
};

const statusAt = (i: number, f: number): St => {
  if (i === 0) return f < 232 ? 'running' : 'idle';
  if (i === 1) return f >= 188 && f < 236 ? 'attention' : f >= 236 ? 'attention' : 'idle';
  if (i === 2) return f >= 160 ? 'running' : 'idle';
  return 'idle';
};

const CLAUDE_LINES = [
  { at: 126, text: '> refactor the auth middleware and add tests', color: C.ink },
  { at: 150, text: '● Reading src/auth/middleware.ts', color: C.ink2 },
  { at: 166, text: '● Editing 3 files', color: C.ink2 },
  { at: 182, text: '● Running npm test', color: C.ink2 },
  { at: 204, text: '  ✓ 42 passed', color: C.green },
];
const HERMES_LINES = [
  { at: 238, text: '● Scraped 1,204 pages', color: C.ink2 },
  { at: 246, text: '? config.yaml already exists. Overwrite? [y/N]', color: C.clay },
];

const Typed: React.FC<{ f: number; lines: typeof CLAUDE_LINES }> = ({ f, lines }) => (
  <div style={{ fontFamily: MONO, fontSize: 21, lineHeight: 1.55 }}>
    {lines.map((l, i) => {
      const n = Math.floor(interpolate(f, [l.at, l.at + 14], [0, l.text.length], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
      if (f < l.at) return null;
      return <div key={i} style={{ color: l.color, whiteSpace: 'pre' }}>{l.text.slice(0, n)}</div>;
    })}
  </div>
);

const Aurora: React.FC<{ f: number; mode: 'running' | 'attention'; o: number }> = ({ f, mode, o }) => {
  const s = Math.sin(f / 40), c = Math.cos(f / 52);
  const cols = mode === 'running'
    ? ['rgba(222,190,130,0.6)', 'rgba(120,176,138,0.48)', 'rgba(201,100,66,0.28)']
    : ['rgba(201,100,66,0.38)', 'rgba(236,170,120,0.5)', 'rgba(201,100,66,0.38)'];
  const breathe = mode === 'attention' ? 0.72 + 0.28 * Math.sin(f / 9) : 1;
  const blobs = [
    { l: 4 + s * 5, w: 44, h: 230, top: -150 + c * 20 },
    { l: 36 - s * 6, w: 40, h: 210, top: -150 - s * 18 },
    { l: 64 + c * 4, w: 34, h: 200, top: -140 + s * 16 },
  ];
  return (
    <div style={{ position: 'absolute', inset: 0, height: 360, filter: 'blur(60px)', opacity: o * breathe, pointerEvents: 'none' }}>
      {blobs.map((b, i) => (
        <div key={i} style={{ position: 'absolute', left: `${b.l}%`, width: `${b.w}%`, height: b.h, top: b.top, borderRadius: '50%', background: cols[i] }} />
      ))}
    </div>
  );
};

const Caption: React.FC<{ f: number; a: number; b: number; children: React.ReactNode }> = ({ f, a, b, children }) => {
  const o = Math.min(t(f, a, a + 16), 1 - t(f, b - 12, b));
  return (
    <div style={{ position: 'absolute', top: 44, left: 0, right: 0, textAlign: 'center', fontFamily: SERIF, fontSize: 64, letterSpacing: '-0.02em', color: C.ink, opacity: o, transform: `translateY(${(1 - t(f, a, a + 20)) * 14}px)`, filter: `blur(${(1 - o) * 6}px)` }}>
      {children}
    </div>
  );
};

const Switch: React.FC<{ on: number; danger?: boolean }> = ({ on, danger }) => (
  <div style={{ width: 46, height: 27, borderRadius: 99, background: interpolateColor(on, 'rgba(27,26,23,0.12)', danger ? C.clay : C.ink), position: 'relative' }}>
    <div style={{ position: 'absolute', top: 3, left: 3 + on * 19, width: 21, height: 21, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
  </div>
);
function interpolateColor(p: number, a: string, b: string) {
  return p < 0.5 ? a : b;
}

const Palette: React.FC<{ f: number }> = ({ f }) => {
  const o = Math.min(t(f, 296, 312), 1 - t(f, 384, 396));
  if (o <= 0) return null;
  const skip = t(f, 318, 330);
  const model = f >= 346 ? 1 : 0;
  const cmd = `claude${skip > 0.5 ? ' --dangerously-skip-permissions' : ''}${model ? ' --model opus' : ''}`;
  const rows = [
    { t: 'Skip permissions', code: '--dangerously-skip-permissions', d: 'Run tools without asking first', on: skip, danger: true },
    { t: 'Continue', code: '--continue', d: 'Pick up the most recent conversation', on: 0 },
  ];
  const segs = ['default', 'opus', 'sonnet', 'haiku'];
  const segX = interpolate(f, [346, 358], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });
  return (
    <AbsoluteFill style={{ background: `rgba(243,241,236,${0.55 * o})`, backdropFilter: `blur(${12 * o}px)`, alignItems: "center", paddingTop: 190 }}>
      <div style={{ width: 760, background: C.paper, borderRadius: 24, boxShadow: `0 0 0 1px ${C.line2}, 0 40px 100px rgba(27,26,23,0.2)`, overflow: 'hidden', opacity: o, transform: `translateY(${(1 - o) * 12}px) scale(${0.975 + 0.025 * o})` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, height: 84, padding: '0 28px', borderBottom: `1px solid ${C.line}` }}>
          <Logo a={AGENTS[0]} size={38} />
          <span style={{ fontFamily: SERIF, fontSize: 34 }}>Claude Code</span>
        </div>
        <div style={{ padding: 12 }}>
          {rows.map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '16px 16px', borderRadius: 14, background: i === 0 ? C.stone : 'transparent' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: SANS, fontWeight: 500, fontSize: 19, color: r.danger ? C.clay : C.ink }}>
                  {r.t}<span style={{ fontFamily: MONO, fontSize: 14, color: C.ink3, marginLeft: 10 }}>{r.code}</span>
                </div>
                <div style={{ fontFamily: SANS, fontSize: 16, color: C.ink3, marginTop: 4 }}>{r.d}</div>
              </div>
              <Switch on={r.on} danger={r.danger} />
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', padding: '16px', borderRadius: 14, background: f >= 338 ? C.stone : 'transparent' }}>
            <div style={{ flex: 1, fontFamily: SANS, fontWeight: 500, fontSize: 19 }}>Model</div>
            <div style={{ position: 'relative', display: 'flex', padding: 3, borderRadius: 12, background: 'rgba(27,26,23,0.06)' }}>
              <div style={{ position: 'absolute', top: 3, bottom: 3, left: 3 + segX * 104, width: 100, borderRadius: 9, background: '#fff', boxShadow: '0 1px 3px rgba(27,26,23,0.12)' }} />
              {segs.map((s, i) => (
                <div key={s} style={{ position: 'relative', width: 100, height: 36, display: 'grid', placeItems: 'center', fontFamily: SANS, fontWeight: 500, fontSize: 15, color: i === model ? C.ink : C.ink2, marginRight: i < 3 ? 4 : 0 }}>{s}</div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ margin: '4px 28px 28px', padding: '18px 20px', borderRadius: 14, background: C.ink, color: C.stone, fontFamily: MONO, fontSize: 18, display: 'flex', gap: 14, whiteSpace: 'nowrap' }}>
          <span style={{ color: C.clay }}>$</span>{cmd}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const AppWindow: React.FC<{ f: number }> = ({ f }) => {
  const active = f < 232 ? 0 : 1;
  const sw = t(f, 228, 244);
  const headerAgent = AGENTS[active];
  const activeSt = statusAt(active, f);
  const auroraRun = active === 0 ? t(f, 124, 150) * (1 - sw) : 0;
  const auroraAtt = active === 1 ? sw : 0;
  const statusLabel = activeSt === 'running' ? 'Working' : activeSt === 'attention' ? 'Needs you' : 'Idle';
  const nRunning = [0, 1, 2, 3].filter((i) => f >= ROW_IN[i] && statusAt(i, f) === 'running').length;
  const nAtt = [0, 1, 2, 3].filter((i) => f >= ROW_IN[i] && statusAt(i, f) === 'attention').length;

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
        {AGENTS.map((a, i) => {
          const inP = t(f, ROW_IN[i], ROW_IN[i] + 14);
          if (inP <= 0) return null;
          const st = statusAt(i, f);
          const isActive = i === active;
          const sheen = st === 'running' ? ((f * 1.6) % 160) - 30 : 0;
          return (
            <div key={i} style={{ position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 14, height: 66, padding: '0 14px', marginBottom: 4, borderRadius: 14, opacity: inP, transform: `translateX(${(1 - inP) * -10}px)`, background: isActive ? '#fff' : 'transparent', boxShadow: isActive ? `0 0 0 1px ${C.line}, 0 2px 10px rgba(27,26,23,0.05)` : 'none' }}>
              {st === 'running' && <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(100deg, transparent ${sheen - 25}%, rgba(63,155,106,0.09) ${sheen - 10}%, rgba(222,190,130,0.18) ${sheen}%, rgba(63,155,106,0.09) ${sheen + 10}%, transparent ${sheen + 25}%)` }} />}
              {st === 'attention' && <div style={{ position: 'absolute', inset: 0, opacity: 0.7 + 0.3 * Math.sin(f / 9), background: 'radial-gradient(130% 160% at 0% 50%, rgba(201,100,66,0.22), rgba(232,160,110,0.09) 50%, transparent 80%)' }} />}
              <div style={{ position: 'relative' }}><Logo a={a} bg={isActive ? C.stone : C.paper} /></div>
              <div style={{ position: 'relative', flex: 1 }}>
                <div style={{ fontFamily: SANS, fontWeight: 500, fontSize: 17, color: isActive || st === 'attention' ? C.ink : C.ink2 }}>{a.name}</div>
                <div style={{ fontFamily: MONO, fontSize: 13, color: C.ink3, marginTop: 3 }}>{a.dir}</div>
              </div>
              <Dot st={st} f={f} />
            </div>
          );
        })}
        <div style={{ marginTop: 'auto', padding: '0 12px', display: 'flex', gap: 18, fontFamily: SANS, fontSize: 14, color: C.ink3 }}>
          {nRunning > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Dot st="running" f={f} size={7} />{nRunning} working</span>}
          {nAtt > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Dot st="attention" f={f} size={7} />{nAtt} needs you</span>}
        </div>
      </div>

      <div style={{ position: 'relative', flex: 1, margin: '10px 10px 10px 0', borderRadius: 18, background: C.paper, boxShadow: `0 0 0 1px ${C.line}, 0 10px 40px rgba(27,26,23,0.05)`, overflow: 'hidden' }}>
        <Aurora f={f} mode="running" o={auroraRun} />
        <Aurora f={f} mode="attention" o={auroraAtt} />
        {f >= 118 && (
          <>
            <div style={{ position: 'relative', height: 76, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', borderBottom: `1px solid ${C.line}` }}>
              <div key={active} style={{ display: 'flex', alignItems: 'baseline', gap: 16, opacity: active === 1 ? t(f, 236, 254) : t(f, 118, 134), transform: `translateY(${(1 - (active === 1 ? t(f, 236, 256) : t(f, 118, 138))) * 10}px)` }}>
                <span style={{ fontFamily: SERIF, fontSize: 34 }}>{headerAgent.name}</span>
                <span style={{ fontFamily: MONO, fontSize: 15, color: C.ink3 }}>~/{headerAgent.dir}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', borderRadius: 99, background: 'rgba(255,255,255,0.6)', boxShadow: `0 0 0 1px ${C.line}`, fontFamily: SANS, fontWeight: 500, fontSize: 15, color: activeSt === 'attention' ? C.clay : C.ink2 }}>
                <Dot st={activeSt} f={f} />{statusLabel}
              </div>
            </div>
            <div style={{ position: 'absolute', top: 104, left: 32, right: 32, opacity: 1 - sw, filter: `blur(${sw * 8}px)` }}>
              <Typed f={f} lines={CLAUDE_LINES} />
            </div>
            <div style={{ position: 'absolute', top: 104, left: 32, right: 32, opacity: sw, filter: `blur(${(1 - sw) * 8}px)` }}>
              <Typed f={f} lines={HERMES_LINES} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export const Ad: React.FC = () => {
  const f = useCurrentFrame();

  const titleOut = t(f, 84, 104);
  const winIn = t(f, 96, 126);
  const winOut = t(f, 392, 410);
  const endIn = t(f, 404, 430);

  return (
    <AbsoluteFill style={{ background: C.stone, color: C.ink, fontFamily: SANS }}>
      <style>{FONTS}</style>

      {f < 110 && (
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', opacity: 1 - titleOut, filter: `blur(${titleOut * 10}px)` }}>
          <div style={{ fontFamily: SERIF, fontSize: 150, lineHeight: 0.95, letterSpacing: '-0.03em', textAlign: 'center' }}>
            <div style={{ opacity: t(f, 6, 30), transform: `translateY(${(1 - t(f, 6, 34)) * 24}px)`, filter: `blur(${(1 - t(f, 6, 30)) * 8}px)` }}>All your agents,</div>
            <div style={{ fontStyle: 'italic', color: C.clay, opacity: t(f, 26, 50), transform: `translateY(${(1 - t(f, 26, 54)) * 24}px)`, filter: `blur(${(1 - t(f, 26, 50)) * 8}px)` }}>in one window.</div>
          </div>
        </AbsoluteFill>
      )}

      {f >= 96 && f < 412 && (
        <AbsoluteFill style={{ opacity: winIn * (1 - winOut), transform: `translateY(${(1 - winIn) * 30}px) scale(${0.96 + 0.04 * winIn - 0.02 * winOut})`, filter: `blur(${(1 - winIn) * 10 + winOut * 10}px)` }}>
          <Caption f={f} a={112} b={228}>See who&apos;s <em style={{ color: C.clay }}>working.</em></Caption>
          <Caption f={f} a={232} b={294}>Know who <em style={{ color: C.clay }}>needs you.</em></Caption>
          <Caption f={f} a={298} b={392}>Launch with <em style={{ color: C.clay }}>your flags.</em></Caption>
          <AppWindow f={f} />
          <Palette f={f} />
        </AbsoluteFill>
      )}

      {f >= 404 && (
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', opacity: endIn, filter: `blur(${(1 - endIn) * 10}px)` }}>
          <Aurora f={f} mode="running" o={endIn * 0.8} />
          <div style={{ fontFamily: SERIF, fontSize: 220, letterSpacing: '-0.035em', lineHeight: 1, transform: `translateY(${(1 - endIn) * 20}px)` }}>Shoal</div>
          <div style={{ fontFamily: SANS, fontSize: 30, color: C.ink2, marginTop: 26, opacity: t(f, 416, 440) }}>Open source. Every agent, one calm window.</div>
          <div style={{ fontFamily: MONO, fontSize: 22, color: C.clay, marginTop: 34, opacity: t(f, 426, 450) }}>github.com/abdullahridwan/shoal</div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
