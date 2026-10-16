import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Svg, Path, Circle } from '@react-pdf/renderer';
import { buildModel } from './model.js';

const INK = '#0a0a0a';
const PAPER = '#f3f2ec';
const GREEN = '#2BE36B';
const WHITE = '#ffffff';
const MUTED = '#5c5c5c';
const LINE = '#e3e1d8';
const RED = '#c62828';
const AMBER = '#c88800';
const CARD = '#ffffff';

const BAND = { red: RED, amber: AMBER, green: '#128a3e' };
const BAND_DARK = { red: '#ff5d5d', amber: '#ffc14d', green: '#2BE36B' };

let fontsReady = false;
function registerFonts(base) {
  if (fontsReady) return;
  fontsReady = true;
  const src = (file) => String(base).replace(/\/$/, '') + '/' + file;
  Font.register({ family: 'Bebas', src: src('BebasNeue-Regular.ttf') });
  Font.register({
    family: 'Inter',
    fonts: [
      { src: src('Inter-Regular.ttf'), fontWeight: 400 },
      { src: src('Inter-SemiBold.ttf'), fontWeight: 600 },
      { src: src('Inter-ExtraBold.ttf'), fontWeight: 800 }
    ]
  });
  Font.registerHyphenationCallback(function (word) { return [word]; });
}

const s = StyleSheet.create({
  bebas: { fontFamily: 'Bebas' },
  inter: { fontFamily: 'Inter' },
  kicker: { fontFamily: 'Inter', fontWeight: 800, fontSize: 9, letterSpacing: 1.4, color: MUTED, textTransform: 'uppercase' },
  body: { fontFamily: 'Inter', fontSize: 12, lineHeight: 1.4, color: INK },
  small: { fontFamily: 'Inter', fontSize: 9, lineHeight: 1.35, color: MUTED }
});

function bandHex(band, dark) {
  return (dark ? BAND_DARK : BAND)[band] || GREEN;
}

function Logo({ size, color, dot }) {
  return (
    <Text style={{ fontFamily: 'Bebas', fontSize: size || 22, color: color || INK, letterSpacing: 0.6 }}>
      MORE<Text style={{ color: dot || GREEN }}>.</Text>
    </Text>
  );
}

function Footer({ n, dark }) {
  return (
    <View style={{ position: 'absolute', bottom: 14, left: 28, right: 28, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
        <Logo size={13} color={dark ? WHITE : INK} />
        <Text style={{ fontFamily: 'Inter', fontSize: 8, color: dark ? '#bdbdbd' : MUTED, marginLeft: 8, marginBottom: 1 }}>make more money</Text>
      </View>
      <Text style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 8, color: dark ? '#bdbdbd' : MUTED }}>{String(n).padStart(2, '0')}  /  12</Text>
    </View>
  );
}

function Icon({ d, color, size }) {
  const sz = size || 16;
  return (
    <Svg width={sz} height={sz} viewBox="0 0 24 24">
      <Circle cx="12" cy="12" r="11" fill={color || INK} />
      <Path d={d} stroke={GREEN} strokeWidth="1.7" fill="none" />
    </Svg>
  );
}

const ICONS = {
  pin: 'M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10z M12 11.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
  clock: 'M12 7v5l3 2 M12 12h.01',
  chat: 'M5 16.5V7.5h14v9H8z',
  check: 'M7 12.5l3.2 3.2L17 9'
};

function Gauge({ score, bandName }) {
  const color = bandHex(bandName, false);
  const w = Math.max(2, Math.min(100, score));
  return (
    <View>
      <View style={{ position: 'relative', height: 14, backgroundColor: '#e4e2da', borderRadius: 7, overflow: 'hidden' }}>
        <View style={{ width: w + '%', height: 14, backgroundColor: color }} />
        <View style={{ position: 'absolute', left: '50%', top: 0, width: 2, height: 14, backgroundColor: '#f7f6f2' }} />
        <View style={{ position: 'absolute', left: '75%', top: 0, width: 2, height: 14, backgroundColor: '#f7f6f2' }} />
      </View>
      <View style={{ position: 'relative', height: 12, marginTop: 2 }}>
        <Text style={[s.small, { position: 'absolute', left: 0 }]}>0</Text>
        <Text style={[s.small, { position: 'absolute', left: '47%' }]}>50</Text>
        <Text style={[s.small, { position: 'absolute', left: '72%' }]}>75</Text>
        <Text style={[s.small, { position: 'absolute', right: 0 }]}>100</Text>
      </View>
    </View>
  );
}

function Cover({ m }) {
  const color = bandHex(m.totalBand, true);
  return (
    <Page size="LETTER" style={{ backgroundColor: INK }}>
      <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 16, backgroundColor: GREEN }} />
      <View style={{ height: 688, paddingTop: 32, paddingLeft: 44, paddingRight: 36 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <View>
            <Logo size={36} color={WHITE} />
            <Text style={{ fontFamily: 'Inter', fontSize: 12, color: '#c8c8c8', marginTop: 2 }}>make more money</Text>
          </View>
          <Text style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10, letterSpacing: 1.6, color: GREEN }}>SALES FUNNEL SCORE</Text>
        </View>
        <Text style={{ fontFamily: 'Bebas', fontSize: m.business.length > 26 ? 42 : 56, color: WHITE, marginTop: 36, lineHeight: 0.92 }}>{m.business}</Text>
        <Text style={{ fontFamily: 'Inter', fontSize: 13, color: '#d0d0d0', marginTop: 8 }}>{m.place || 'Local service company'}</Text>
        <View style={{ marginTop: 28 }}>
          <Text style={{ fontFamily: 'Bebas', fontSize: 176, color: color, lineHeight: 0.82 }}>{String(m.total)}</Text>
          <Text style={{ fontFamily: 'Bebas', fontSize: 32, color: color, marginTop: 2 }}>/100 PTS</Text>
        </View>
        <View style={{ flexDirection: 'row', marginTop: 22 }}>
          {m.weak.rows.map(function (row) {
            const low = m.weak.lows.length === 1 && m.weak.lows[0].key === row.key;
            const b = row.n < 50 ? 'red' : row.n < 75 ? 'amber' : 'green';
            return (
              <View key={row.key} style={{ width: 160, marginRight: 8 }}>
                <Text style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9, letterSpacing: 1.4, color: '#9a9a9a' }}>{row.name.toUpperCase()}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                  <Text style={{ fontFamily: 'Bebas', fontSize: 36, color: bandHex(b, true), lineHeight: 0.9 }}>{String(row.n)}</Text>
                  <Text style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 9, color: bandHex(b, true), marginLeft: 3, marginBottom: 4 }}>/100</Text>
                </View>
                <Text style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 8, letterSpacing: 1, color: low && !m.weak.greenLow ? GREEN : '#8a8a8a', marginTop: 1 }}>{low && !m.weak.greenLow ? 'WEAK SPOT' : b === 'red' ? 'RED' : b === 'amber' ? 'AMBER' : 'GREEN'}</Text>
              </View>
            );
          })}
        </View>
      </View>
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 104, backgroundColor: GREEN, paddingLeft: 44, paddingRight: 36, justifyContent: 'center' }}>
        <Text style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 16, color: INK }}>{m.weak.headline}</Text>
        <Text style={{ fontFamily: 'Inter', fontSize: 11, color: INK, marginTop: 4 }}>{m.weak.detail}</Text>
        <Text style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 10, color: INK, marginTop: 6 }}>{m.dateLabel}{m.name ? '    ·    Prepared for ' + m.name : ''}</Text>
      </View>
    </Page>
  );
}

function ReadPage({ m }) {
  return (
    <Page size="LETTER" style={{ backgroundColor: PAPER }}>
      <View style={{ height: 792, paddingTop: 26, paddingHorizontal: 28, paddingBottom: 36 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <Logo size={18} />
          <Text style={s.kicker}>How to read this</Text>
        </View>
        <Text style={{ fontFamily: 'Bebas', fontSize: 46, color: INK, marginTop: 12, lineHeight: 0.92 }}>{m.weak.label}</Text>
        <View style={{ marginTop: 10, backgroundColor: INK, borderRadius: 12, padding: 16, flexDirection: 'row' }}>
          <View style={{ flex: 1.3, paddingRight: 12 }}>
            <Text style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 16, color: WHITE, lineHeight: 1.25 }}>{m.weak.headline}</Text>
            <Text style={{ fontFamily: 'Inter', fontSize: 11, color: '#d7d7d7', marginTop: 8, lineHeight: 1.4 }}>{m.weak.detail}</Text>
          </View>
          <View style={{ width: 120, alignItems: 'flex-end', justifyContent: 'center' }}>
            <Text style={{ fontFamily: 'Bebas', fontSize: 54, color: bandHex(m.weak.min < 50 ? 'red' : m.weak.min < 75 ? 'amber' : 'green', true), lineHeight: 0.9 }}>{m.weak.min}</Text>
            <Text style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 9, color: GREEN }}>/100 LOWEST</Text>
          </View>
        </View>
        <View style={{ marginTop: 12 }}>
          {m.weak.rows.map(function (row) {
            const b = row.n < 50 ? 'red' : row.n < 75 ? 'amber' : 'green';
            const marked = m.weak.lows.length === 1 && m.weak.lows[0].key === row.key && row.n < 75;
            return (
              <View key={row.key} style={{ backgroundColor: CARD, borderRadius: 10, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: marked ? INK : LINE }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 6 }}>
                  <Text style={{ fontFamily: 'Bebas', fontSize: 22, color: INK }}>{row.name}</Text>
                  <Text style={{ fontFamily: 'Bebas', fontSize: 22, color: bandHex(b, false) }}>{row.n}/100</Text>
                </View>
                <Gauge score={row.n} bandName={b} />
                <Text style={{ fontFamily: 'Inter', fontSize: 9, color: marked ? INK : MUTED, marginTop: 2 }}>{marked ? 'The weak spot. The other two are higher.' : m.weak.lows.length > 1 && m.weak.lows.some(function (x) { return x.key === row.key; }) ? 'Tied at the bottom.' : 'Not the weak spot.'}</Text>
              </View>
            );
          })}
        </View>
        <View style={{ flex: 1, flexDirection: 'row', marginTop: 2 }}>
          <View style={{ flex: 1, backgroundColor: CARD, borderRadius: 10, padding: 12, marginRight: 8, borderWidth: 1, borderColor: LINE }}>
            <Text style={s.kicker}>The cover number</Text>
            <Text style={{ fontFamily: 'Inter', fontSize: 12, lineHeight: 1.4, color: INK, marginTop: 6 }}>The cover is the average of Leads, Leaks, and Closing. Each one is out of 100. Under 50 is red. 50 to 74 is amber. 75 and above is green.</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: CARD, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: LINE }}>
            <Text style={s.kicker}>What each one means</Text>
            <Text style={{ fontFamily: 'Inter', fontSize: 12, lineHeight: 1.4, color: INK, marginTop: 6 }}>Leads: where the work comes from. Leaks: speed, missed calls, and the form. Closing: the quote, the follow-up, the script, and the tracking.</Text>
          </View>
        </View>
      </View>
      <Footer n={2} />
    </Page>
  );
}

function Funnel({ m }) {
  const rows = m.weak.rows;
  const widths = [520, 400, 280];
  const blurbs = [
    'Channels you marked. Search, the site, social, referrals, signs, mail.',
    'The minutes after a lead arrives. Speed, a missed call, the form.',
    'The quote, the follow-up, the script, and one place that tracks the job.'
  ];
  return (
    <Page size="LETTER" style={{ backgroundColor: PAPER }}>
      <View style={{ height: 792, paddingTop: 24, paddingHorizontal: 28, paddingBottom: 36 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <Logo size={18} />
          <Text style={s.kicker}>Leads, then Leaks, then Closing</Text>
        </View>
        <Text style={{ fontFamily: 'Bebas', fontSize: 42, color: INK, marginTop: 4, lineHeight: 0.9 }}>The funnel</Text>
        <View style={{ marginTop: 8, alignItems: 'center' }}>
          {rows.map(function (row, idx) {
            const b = row.n < 50 ? 'red' : row.n < 75 ? 'amber' : 'green';
            const marked = m.weak.lows.length === 1 && m.weak.lows[0].key === row.key && row.n < 75;
            return (
              <View key={row.key} style={{ width: widths[idx], backgroundColor: bandHex(b, false), borderRadius: 10, paddingVertical: 12, paddingHorizontal: 16, marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10, letterSpacing: 1.2, color: WHITE }}>0{idx + 1}   {row.name.toUpperCase()}{marked ? '   ·   WEAK SPOT' : ''}</Text>
                    <Text style={{ fontFamily: 'Inter', fontSize: 10, color: WHITE, marginTop: 3 }}>{blurbs[idx]}</Text>
                  </View>
                  <Text style={{ fontFamily: 'Bebas', fontSize: 40, color: WHITE, lineHeight: 0.9 }}>{row.n}</Text>
                </View>
              </View>
            );
          })}
        </View>
        <View style={{ backgroundColor: GREEN, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, marginTop: 2 }}>
          <Text style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 14, color: INK }}>{m.weak.headline}</Text>
          <Text style={{ fontFamily: 'Inter', fontSize: 11, color: INK, marginTop: 2 }}>{m.weak.detail} The shape above narrows on purpose: work has to pass all three to become money.</Text>
        </View>
        <View style={{ flex: 1, flexDirection: 'row', marginTop: 10 }}>
          {[
            [ICONS.pin, 'Where work enters', 'Leads are the top of the funnel. A thin review list or a quiet page means fewer people ever call. This is demand, before a single visit.'],
            [ICONS.clock, 'Where work slips', 'Leaks are the gap between the ring and the reply. No text on a missed call spends a lead you already paid for, in ads or in a referral.'],
            [ICONS.check, 'Where work is won', 'Closing is the number you send and what you do when it goes quiet. A week-late quote arrives after they hired someone else.']
          ].map(function (col, idx) {
            return (
              <View key={col[1]} style={{ flex: 1, marginRight: idx === 2 ? 0 : 8, backgroundColor: CARD, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: LINE, justifyContent: 'space-between' }}>
                <View>
                  <Icon d={col[0]} />
                  <Text style={{ fontFamily: 'Bebas', fontSize: 20, marginTop: 8, color: INK }}>{col[1]}</Text>
                  <Text style={{ fontFamily: 'Inter', fontSize: 11, lineHeight: 1.4, color: INK, marginTop: 6 }}>{col[2]}</Text>
                </View>
                <Text style={{ fontFamily: 'Bebas', fontSize: 28, color: bandHex(rows[idx].n < 50 ? 'red' : rows[idx].n < 75 ? 'amber' : 'green', false), marginTop: 8 }}>{rows[idx].n}<Text style={{ fontSize: 12 }}>/100</Text></Text>
              </View>
            );
          })}
        </View>
      </View>
      <Footer n={3} />
    </Page>
  );
}

function SectionStory({ m, block, page, index }) {
  const fixes = block.fixes.length ? block.fixes : [{ t: 'Keep what already brings work.', d: 'Do not pause a source that is producing jobs.', lost: 0 }];
  return (
    <Page size="LETTER" style={{ backgroundColor: PAPER }}>
      <View style={{ height: 792, paddingTop: 22, paddingHorizontal: 26, paddingBottom: 34 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <Logo size={16} />
          <Text style={s.kicker}>0{index}   {block.name}   ·   {block.bandNote}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 2 }}>
          <Text style={{ fontFamily: 'Bebas', fontSize: 40, lineHeight: 0.9, color: INK }}>{block.name}</Text>
          <Text style={{ fontFamily: 'Bebas', fontSize: 40, lineHeight: 0.9, color: bandHex(block.band, false) }}>{block.num}<Text style={{ fontSize: 16 }}>/100</Text></Text>
        </View>
        <View style={{ marginTop: 4 }}>
          <Gauge score={block.num} bandName={block.band} />
        </View>
        <View style={{ backgroundColor: GREEN, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10, marginTop: 6 }}>
          <Text style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 11, color: INK }}>{block.ribbon}</Text>
        </View>
        <View style={{ flex: 1, flexDirection: 'row', marginTop: 8 }}>
          <View style={{ flex: 1.05, marginRight: 8 }}>
            <Text style={s.kicker}>What we found</Text>
            <View style={{ flex: 1, marginTop: 4 }}>
              {block.found.map(function (line, i) {
                return (
                  <View key={i} style={{ flex: 1, backgroundColor: CARD, borderRadius: 8, paddingHorizontal: 10, justifyContent: 'center', marginBottom: 5, borderLeftWidth: 4, borderLeftColor: i === 0 ? GREEN : INK }}>
                    <Text style={{ fontFamily: 'Inter', fontSize: 11, lineHeight: 1.3, color: INK }}>{line}</Text>
                  </View>
                );
              })}
            </View>
          </View>
          <View style={{ flex: 0.95, backgroundColor: INK, borderRadius: 12, padding: 12, justifyContent: 'space-between' }}>
            <Text style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9, letterSpacing: 1.3, color: GREEN }}>WHY IT COSTS YOU MONEY</Text>
            <View>
              <Text style={{ fontFamily: 'Bebas', fontSize: 54, color: WHITE, lineHeight: 0.9 }}>{block.money.dollars}</Text>
              <Text style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 12, color: GREEN, marginTop: 2 }}>{block.money.equation}</Text>
            </View>
            <Text style={{ fontFamily: 'Inter', fontSize: 11, lineHeight: 1.35, color: WHITE }}>{block.money.line}</Text>
            <Text style={{ fontFamily: 'Inter', fontSize: 8, lineHeight: 1.3, color: '#c8c8c8' }}>{block.money.note}</Text>
          </View>
        </View>
        <Text style={[s.kicker, { marginTop: 8 }]}>The fix</Text>
        <View style={{ flexDirection: 'row', marginTop: 4, height: 132 }}>
          {fixes.map(function (fix, i) {
            return (
              <View key={fix.t} style={{ flex: 1, marginRight: i === fixes.length - 1 ? 0 : 6, backgroundColor: CARD, borderRadius: 10, padding: 8, borderWidth: 1, borderColor: LINE }}>
                <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: INK, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontFamily: 'Bebas', fontSize: 12, color: GREEN }}>{i + 1}</Text>
                </View>
                <Text style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 11, color: INK, marginTop: 6 }}>{fix.t}</Text>
                <Text style={{ fontFamily: 'Inter', fontSize: 9, lineHeight: 1.3, color: '#333', marginTop: 3 }}>{fix.d}</Text>
              </View>
            );
          })}
        </View>
      </View>
      <Footer n={page} />
    </Page>
  );
}

function Evidence({ block, page, intro }) {
  const tiles = block.tiles;
  const rows = [];
  for (var i = 0; i < tiles.length; i += 2) rows.push(tiles.slice(i, i + 2));
  return (
    <Page size="LETTER" style={{ backgroundColor: PAPER }}>
      <View style={{ height: 792, paddingTop: 24, paddingHorizontal: 28, paddingBottom: 34 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <Logo size={16} />
          <Text style={s.kicker}>{block.name} in their words</Text>
        </View>
        <Text style={{ fontFamily: 'Bebas', fontSize: 40, color: INK, marginTop: 4, lineHeight: 0.9 }}>What you marked</Text>
        <Text style={{ fontFamily: 'Inter', fontSize: 11, color: '#333', marginTop: 4, marginBottom: 8 }}>{intro}</Text>
        <View style={{ flex: 1 }}>
          {rows.map(function (row, ri) {
            return (
              <View key={ri} style={{ flex: 1, flexDirection: 'row', marginBottom: 8 }}>
                {row.map(function (t) {
                  return (
                    <View key={t.k} style={{ flex: 1, marginRight: 8, backgroundColor: CARD, borderRadius: 12, padding: 12, borderTopWidth: 6, borderTopColor: GREEN, borderWidth: 1, borderColor: LINE }}>
                      <Text style={s.kicker}>{t.k}</Text>
                      <Text style={{ fontFamily: 'Bebas', fontSize: 26, color: INK, marginTop: 6, lineHeight: 0.95 }}>{t.v}</Text>
                      <Text style={{ fontFamily: 'Inter', fontSize: 11, lineHeight: 1.35, color: '#222', marginTop: 6 }}>{t.d}</Text>
                    </View>
                  );
                })}
              </View>
            );
          })}
        </View>
      </View>
      <Footer n={page} />
    </Page>
  );
}

function Summary({ m }) {
  const fixes = m.fixes.length ? m.fixes : [{ n: '01', t: 'Keep the source that already brings work.', d: m.weak.detail, lost: 0, sec: 'Leads' }];
  return (
    <Page size="LETTER" style={{ backgroundColor: PAPER }}>
      <View style={{ height: 792, paddingTop: 24, paddingHorizontal: 28, paddingBottom: 34 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <Logo size={16} />
          <Text style={s.kicker}>Ranked by impact</Text>
        </View>
        <Text style={{ fontFamily: 'Bebas', fontSize: 44, lineHeight: 0.9, marginTop: 6 }}>Top 3 fixes</Text>
        <Text style={{ fontFamily: 'Inter', fontSize: 12, color: '#222', marginTop: 4 }}>{m.weak.headline} {m.addNote}</Text>
        <View style={{ flex: 1, marginTop: 10 }}>
          {fixes.map(function (fix) {
            return (
              <View key={fix.n} style={{ flex: 1, flexDirection: 'row', backgroundColor: CARD, borderRadius: 12, marginBottom: 8, overflow: 'hidden', borderWidth: 1, borderColor: LINE }}>
                <View style={{ width: 74, backgroundColor: INK, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontFamily: 'Bebas', fontSize: 32, color: GREEN }}>{fix.n}</Text>
                </View>
                <View style={{ flex: 1, padding: 12, justifyContent: 'center' }}>
                  <Text style={s.kicker}>{fix.sec}{fix.lost ? '   ·   ' + fix.lost + ' PTS ON THE TABLE' : ''}</Text>
                  <Text style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 14, color: INK, marginTop: 4 }}>{fix.t}</Text>
                  <Text style={{ fontFamily: 'Inter', fontSize: 11, lineHeight: 1.35, color: '#222', marginTop: 3 }}>{fix.d}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>
      <Footer n={10} />
    </Page>
  );
}

function Plan({ m }) {
  return (
    <Page size="LETTER" style={{ backgroundColor: PAPER }}>
      <View style={{ height: 792, paddingTop: 24, paddingHorizontal: 28, paddingBottom: 34 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <Logo size={16} />
          <Text style={s.kicker}>Ten days</Text>
        </View>
        <Text style={{ fontFamily: 'Bebas', fontSize: 44, lineHeight: 0.9, marginTop: 4 }}>The 10-day plan</Text>
        <View style={{ flex: 1, marginTop: 8 }}>
          {m.plan.map(function (step, idx) {
            return (
              <View key={step.day} style={{ flex: 1, flexDirection: 'row', marginBottom: 6 }}>
                <View style={{ width: 78, backgroundColor: idx === 4 ? GREEN : INK, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
                  <Text style={{ fontFamily: 'Bebas', fontSize: 16, color: idx === 4 ? INK : GREEN }}>{step.day}</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: CARD, borderRadius: 8, paddingHorizontal: 12, justifyContent: 'center', borderWidth: 1, borderColor: LINE }}>
                  <Text style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 12, color: INK }}>{step.t}</Text>
                  <Text style={{ fontFamily: 'Inter', fontSize: 10, lineHeight: 1.3, color: '#333', marginTop: 2 }}>{step.d}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>
      <Footer n={11} />
    </Page>
  );
}

function Close({ m }) {
  return (
    <Page size="LETTER" style={{ backgroundColor: INK }}>
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 14, backgroundColor: GREEN }} />
      <View style={{ height: 792, paddingTop: 40, paddingHorizontal: 36 }}>
        <Logo size={28} color={WHITE} />
        <Text style={{ fontFamily: 'Inter', fontSize: 12, color: '#cfcfcf', marginTop: 4 }}>make more money</Text>
        <Text style={{ fontFamily: 'Bebas', fontSize: 58, color: WHITE, marginTop: 36, lineHeight: 0.9 }}>{m.cta}</Text>
        <Text style={{ fontFamily: 'Inter', fontSize: 14, color: '#e8e8e8', marginTop: 12, lineHeight: 1.4, maxWidth: 460 }}>Fifteen minutes. Bring this score. We pick the first fix and put it on the calendar.</Text>
        <View style={{ marginTop: 28, backgroundColor: GREEN, borderRadius: 14, paddingVertical: 16, paddingHorizontal: 18 }}>
          <Text style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10, letterSpacing: 1.4, color: INK }}>CALL OR TEXT</Text>
          <Text style={{ fontFamily: 'Bebas', fontSize: 48, color: INK, lineHeight: 0.95, marginTop: 2 }}>{m.phone}</Text>
        </View>
        <View style={{ marginTop: 16, borderWidth: 1.5, borderColor: GREEN, borderRadius: 14, paddingVertical: 16, paddingHorizontal: 18 }}>
          <Text style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10, letterSpacing: 1.4, color: GREEN }}>BEFORE THE CALL</Text>
          <Text style={{ fontFamily: 'Bebas', fontSize: 28, color: WHITE, marginTop: 4 }}>{m.url}</Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'flex-end', paddingBottom: 48 }}>
          <Text style={{ fontFamily: 'Inter', fontSize: 12, color: '#d0d0d0' }}>{m.business}{m.place ? '   ·   ' + m.place : ''}</Text>
          <Text style={{ fontFamily: 'Inter', fontSize: 12, color: '#d0d0d0', marginTop: 3 }}>Score {m.total}/100   ·   {m.dateLabel}</Text>
          <Text style={{ fontFamily: 'Inter', fontSize: 11, color: '#9a9a9a', marginTop: 8 }}>{m.weak.headline}</Text>
        </View>
      </View>
      <Footer n={12} dark />
    </Page>
  );
}

function Magazine({ model }) {
  const m = model;
  return (
    <Document title={'Sales funnel score - ' + m.business} author="MORE." subject="make more money">
      <Cover m={m} />
      <ReadPage m={m} />
      <Funnel m={m} />
      <SectionStory m={m} block={m.leads} page={4} index={1} />
      <Evidence block={m.leads} page={5} intro="Every line below is an answer from the quiz, not a guess." />
      <SectionStory m={m} block={m.leaks} page={6} index={2} />
      <Evidence block={m.leaks} page={7} intro="Speed, missed calls, the form, and the review ask." />
      <SectionStory m={m} block={m.closing} page={8} index={3} />
      <Evidence block={m.closing} page={9} intro="Quote speed, follow-up, the script, and where jobs are tracked." />
      <Summary m={m} />
      <Plan m={m} />
      <Close m={m} />
    </Document>
  );
}

export { registerFonts, Magazine, buildModel };
