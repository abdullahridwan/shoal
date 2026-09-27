import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';

const FONTS = `
@font-face { font-family: ShoalSans; src: url(${staticFile('inter.woff2')}); font-weight: 100 900; }
@font-face { font-family: ShoalSerif; src: url(${staticFile('serif.woff2')}); }
@font-face { font-family: ShoalSerif; font-style: italic; src: url(${staticFile('serif-italic.woff2')}); }
@font-face { font-family: ShoalMono; src: url(${staticFile('mono.woff2')}); }
`;
const SERIF = 'ShoalSerif, Georgia, serif';
const SANS = 'ShoalSans, sans-serif';
const MONO = 'ShoalMono, monospace';

const LIGHT = [
  ['Stone', '#F3F1EC', 'App background'],
  ['Paper', '#FBFAF7', 'Surfaces, terminal'],
  ['Ink', '#1B1A17', 'Text, marks'],
  ['Ink 2', '#6B675F', 'Secondary text'],
  ['Ink 3', '#A39F95', 'Hints, metadata'],
];
const ACCENT = [
  ['Clay', '#C96442', 'The one accent'],
  ['Sage', '#3F9B6A', 'Working'],
  ['Gold', '#DEBE82', 'Aurora'],
];
const DARK = [
  ['Night', '#131312', 'Dark background'],
  ['Ember', '#1C1B19', 'Dark surfaces'],
  ['Bone', '#EFECE4', 'Dark text'],
  ['Clay, dark', '#D97757', 'Dark accent'],
];

const Swatch: React.FC<{ s: string[]; w: number }> = ({ s, w }) => {
  const dark = ['#1B1A17', '#131312', '#1C1B19', '#6B675F', '#C96442', '#3F9B6A', '#D97757'].includes(s[1]);
  return (
    <div style={{ width: w, height: 190, borderRadius: 18, background: s[1], boxShadow: '0 0 0 1px rgba(27,26,23,0.08)', padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', color: dark ? '#F3F1EC' : '#1B1A17' }}>
      <div style={{ fontFamily: SANS, fontWeight: 500, fontSize: 20 }}>{s[0]}</div>
      <div style={{ fontFamily: MONO, fontSize: 15, opacity: 0.75, marginTop: 4 }}>{s[1]}</div>
      <div style={{ fontFamily: SANS, fontSize: 14, opacity: 0.6, marginTop: 2 }}>{s[2]}</div>
    </div>
  );
};

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontFamily: SANS, fontWeight: 500, fontSize: 16, color: '#A39F95', marginBottom: 16 }}>{children}</div>
);

export const Brand: React.FC = () => (
  <AbsoluteFill style={{ background: '#F3F1EC', color: '#1B1A17', padding: 90, fontFamily: SANS }}>
    <style>{FONTS}</style>
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', borderBottom: '1px solid rgba(27,26,23,0.12)', paddingBottom: 36 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
        <Img src={staticFile('mark.svg')} style={{ width: 130, height: 126 }} />
        <div style={{ fontFamily: SERIF, fontSize: 150, letterSpacing: '-0.035em', lineHeight: 0.9 }}>Shoal</div>
      </div>
      <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 46, color: '#C96442' }}>Brand kit</div>
    </div>

    <div style={{ display: 'flex', gap: 80, marginTop: 56 }}>
      <div style={{ flex: 1.35 }}>
        <Label>Light palette</Label>
        <div style={{ display: 'flex', gap: 14 }}>{LIGHT.map((s) => <Swatch key={s[0]} s={s} w={178} />)}</div>
        <div style={{ display: 'flex', gap: 60, marginTop: 44 }}>
          <div>
            <Label>Accents</Label>
            <div style={{ display: 'flex', gap: 14 }}>{ACCENT.map((s) => <Swatch key={s[0]} s={s} w={178} />)}</div>
          </div>
        </div>
        <div style={{ marginTop: 44 }}>
          <Label>Dark palette</Label>
          <div style={{ display: 'flex', gap: 14 }}>{DARK.map((s) => <Swatch key={s[0]} s={s} w={178} />)}</div>
        </div>
      </div>

      <div style={{ flex: 1 }}>
        <Label>Display, Instrument Serif</Label>
        <div style={{ fontFamily: SERIF, fontSize: 96, lineHeight: 0.95, letterSpacing: '-0.03em' }}>All your agents,<br /><em style={{ color: '#C96442' }}>in one window.</em></div>
        <div style={{ height: 50 }} />
        <Label>Interface, Inter</Label>
        <div style={{ fontSize: 30, lineHeight: 1.45, color: '#6B675F' }}>Calm, plain and specific. Sentence case, no exclamation marks, say what it does.</div>
        <div style={{ height: 50 }} />
        <Label>Terminal and data, JetBrains Mono</Label>
        <div style={{ fontFamily: MONO, fontSize: 24, background: '#1B1A17', color: '#F3F1EC', borderRadius: 14, padding: '20px 24px' }}>
          <span style={{ color: '#C96442' }}>$ </span>claude --model opus
        </div>
        <div style={{ height: 50 }} />
        <Label>Aurora, the signature gradient</Label>
        <div style={{ position: 'relative', height: 120, borderRadius: 18, overflow: 'hidden', background: '#FBFAF7', boxShadow: '0 0 0 1px rgba(27,26,23,0.08)' }}>
          <div style={{ position: 'absolute', inset: -40, filter: 'blur(40px)' }}>
            <div style={{ position: 'absolute', left: '0%', top: 10, width: '45%', height: 140, borderRadius: '50%', background: 'rgba(222,190,130,0.75)' }} />
            <div style={{ position: 'absolute', left: '35%', top: 20, width: '40%', height: 130, borderRadius: '50%', background: 'rgba(120,176,138,0.6)' }} />
            <div style={{ position: 'absolute', left: '65%', top: 10, width: '40%', height: 140, borderRadius: '50%', background: 'rgba(201,100,66,0.45)' }} />
          </div>
        </div>
      </div>
    </div>
  </AbsoluteFill>
);
