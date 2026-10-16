import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Svg, Path } from '@react-pdf/renderer';
import { buildModel } from './model.js';

const INK = '#111111';
const WHITE = '#ffffff';
const GRAY = '#5E5E5E';
const LINE = '#E4E4E4';
const TRACK = '#ECECEC';
const GREEN = '#2BE36B';
const RED = '#FF2D2D';
const AMBER = '#FF9F1A';
const WASH = '#F3FFF7';

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

function numColor(band) {
  if (band === 'red') return RED;
  if (band === 'amber') return AMBER;
  return GREEN;
}

function polar(cx, cy, r, deg) {
  const a = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

function arcPath(cx, cy, r, a0, a1) {
  const span = ((a1 - a0) % 360 + 360) % 360;
  if (span >= 359.5) {
    return 'M ' + cx + ' ' + (cy - r) + ' A ' + r + ' ' + r + ' 0 1 1 ' + (cx - 0.01) + ' ' + (cy - r);
  }
  const p1 = polar(cx, cy, r, a0);
  const p2 = polar(cx, cy, r, a0 + Math.max(1.5, span));
  const large = span > 180 ? 1 : 0;
  return 'M ' + p1[0].toFixed(2) + ' ' + p1[1].toFixed(2) + ' A ' + r + ' ' + r + ' 0 ' + large + ' 1 ' + p2[0].toFixed(2) + ' ' + p2[1].toFixed(2);
}

const s = StyleSheet.create({
  page: { backgroundColor: WHITE, fontFamily: 'Inter', color: INK, paddingTop: 22, paddingHorizontal: 30, paddingBottom: 36 },
  label: { fontFamily: 'Inter', fontWeight: 600, fontSize: 8, letterSpacing: 1.1, color: GREEN, textTransform: 'uppercase' },
  body: { fontFamily: 'Inter', fontSize: 10, lineHeight: 1.35, color: INK }
});

function Header({ page, section }) {
  return (
    <View style={{ marginBottom: 10 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ width: 150 }}>
          <Text style={{ fontFamily: 'Bebas', fontSize: 18, color: GREEN, letterSpacing: 0.8 }}>MORE.</Text>
          <Text style={{ fontFamily: 'Inter', fontSize: 8, color: GRAY, marginTop: -1 }}>make more money</Text>
        </View>
        <Text style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 8, letterSpacing: 1.2, color: GREEN, textTransform: 'uppercase', marginTop: 8 }}>{section || 'Snapshot'}</Text>
        <Text style={{ width: 36, textAlign: 'right', fontFamily: 'Inter', fontWeight: 600, fontSize: 9, color: GRAY, marginTop: 6 }}>{String(page).padStart(2, '0')}</Text>
      </View>
      <View style={{ marginTop: 6, height: 6, backgroundColor: GREEN }} />
    </View>
  );
}

function Footer({ page }) {
  return (
    <View style={{ position: 'absolute', bottom: 14, left: 30, right: 30, flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={{ fontFamily: 'Inter', fontSize: 8, color: GRAY }}>sethquest.com/time-is-money</Text>
      <Text style={{ fontFamily: 'Inter', fontSize: 8, color: GRAY }}>{String(page).padStart(2, '0')} / 05</Text>
    </View>
  );
}

function ScoreMark({ value, band, size, suffix }) {
  const suf = size >= 48 ? 12 : size >= 22 ? 10 : 8;
  const lift = Math.round((size - suf) * 0.18);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
      <Text style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: size, color: numColor(band), lineHeight: 1 }}>{String(value)}</Text>
      <Text style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: suf, color: GRAY, marginLeft: 4, marginBottom: lift }}>{suffix || '/100 pts'}</Text>
    </View>
  );
}

function Bar({ label, value, band }) {
  const w = Math.max(0, Math.min(100, value));
  return (
    <View style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 3 }}>
        <Text style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 10, color: INK }}>{label}</Text>
        <ScoreMark value={value} band={band} size={12} suffix="/100" />
      </View>
      <View style={{ height: 14, backgroundColor: TRACK }}>
        <View style={{ width: w + '%', height: 14, backgroundColor: numColor(band) }} />
      </View>
    </View>
  );
}

function Gauge({ value, band }) {
  const start = 150;
  const sweep = 240;
  const end = start + sweep * (Math.max(0, Math.min(100, value)) / 100);
  const color = numColor(band);
  return (
    <View style={{ width: 168, height: 132 }}>
      <Svg width="168" height="120" viewBox="0 0 168 120">
        <Path d={arcPath(84, 78, 52, start, start + sweep)} stroke={TRACK} strokeWidth="12" fill="none" />
        <Path d={arcPath(84, 78, 52, start, end)} stroke={color} strokeWidth="12" fill="none" />
      </Svg>
      <View style={{ position: 'absolute', top: 58, left: 0, right: 0, alignItems: 'center' }}>
        <ScoreMark value={value} band={band} size={26} />
      </View>
    </View>
  );
}

function Donut({ value, band }) {
  const color = numColor(band);
  const pct = Math.max(0, Math.min(100, value));
  return (
    <View style={{ width: 120, height: 120 }}>
      <Svg width="120" height="120" viewBox="0 0 120 120">
        <Path d={arcPath(60, 60, 42, 0, 359.9)} stroke={TRACK} strokeWidth="14" fill="none" />
        <Path d={arcPath(60, 60, 42, 0, 360 * (pct / 100))} stroke={color} strokeWidth="14" fill="none" />
      </Svg>
      <View style={{ position: 'absolute', top: 46, left: 0, right: 0, alignItems: 'center' }}>
        <Text style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 18, color: color }}>{String(value)}</Text>
      </View>
    </View>
  );
}

function MiniBars({ rows, color }) {
  return (
    <View>
      {rows.map(function (row) {
        const w = Math.max(0, Math.min(100, row.pct));
        return (
          <View key={row.label} style={{ marginBottom: 11 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
              <Text style={{ fontFamily: 'Inter', fontSize: 9, color: INK }}>{row.label}</Text>
              <Text style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 9, color: row.on === false ? GRAY : INK }}>{row.on === false ? 'Off' : w}</Text>
            </View>
            <View style={{ height: 10, backgroundColor: TRACK }}>
              <View style={{ width: (row.on === false ? 0 : w) + '%', height: 10, backgroundColor: color || GREEN }} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

function Funnel({ rows }) {
  return (
    <View>
      {rows.map(function (row) {
        const w = Math.max(18, Math.min(100, row.pct));
        const dropped = 100 - w;
        return (
          <View key={row.label} style={{ marginBottom: 11 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
              <Text style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 9, color: INK }}>{row.label}</Text>
              <Text style={{ fontFamily: 'Inter', fontSize: 9, color: GRAY }}>{row.pct}% still in</Text>
            </View>
            <View style={{ height: 20, backgroundColor: '#FFE1E1', flexDirection: 'row' }}>
              <View style={{ width: w + '%', height: 20, backgroundColor: GREEN }} />
              <View style={{ width: dropped + '%', height: 20, backgroundColor: RED }} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

function Check({ title, detail }) {
  return (
    <View style={{ flexDirection: 'row', marginBottom: 11 }}>
      <View style={{ width: 11, height: 11, borderWidth: 1.5, borderColor: GREEN, marginTop: 1, marginRight: 8 }} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 10, color: INK }}>{title}</Text>
        {detail ? <Text style={{ fontFamily: 'Inter', fontSize: 8.5, lineHeight: 1.3, color: GRAY, marginTop: 1 }}>{detail}</Text> : null}
      </View>
    </View>
  );
}

function Answers({ rows }) {
  const left = rows.filter(function (_, i) { return i % 2 === 0; });
  const right = rows.filter(function (_, i) { return i % 2 === 1; });
  function col(list) {
    return (
      <View style={{ width: '48%' }}>
        {list.map(function (row) {
          return (
            <View key={row.k} style={{ marginBottom: 5 }}>
              <Text style={{ fontFamily: 'Inter', fontSize: 7.5, letterSpacing: 0.6, color: GRAY, textTransform: 'uppercase' }}>{row.k}</Text>
              <Text style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 9, color: INK }}>{row.v}</Text>
            </View>
          );
        })}
      </View>
    );
  }
  return (
    <View style={{ borderWidth: 1, borderColor: LINE, borderLeftWidth: 4, borderLeftColor: GREEN, backgroundColor: WASH, padding: 8, paddingLeft: 10 }}>
      <Text style={[s.label, { marginBottom: 6 }]}>Your answers</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {col(left)}
        {col(right)}
      </View>
    </View>
  );
}

function Cost({ money }) {
  return (
    <View style={{ borderTopWidth: 1, borderTopColor: LINE, paddingTop: 6 }}>
      <Text style={[s.label, { marginBottom: 6 }]}>What it costs</Text>
      <View style={{ flexDirection: 'row' }}>
        <View style={{ width: '48%', paddingRight: 8 }}>
          <Text style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 16, color: INK }}>{money.hoursLabel}</Text>
          <Text style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 13, color: GREEN, marginTop: 2 }}>{money.yearLabel}</Text>
          <Text style={{ fontFamily: 'Inter', fontSize: 8, color: GRAY, marginTop: 3 }}>Owner time, estimate, at $125 an hour.</Text>
        </View>
        <View style={{ width: '52%' }}>
          <Text style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 16, color: INK }}>{money.dollars}</Text>
          <Text style={{ fontFamily: 'Inter', fontSize: 8, color: GRAY, marginTop: 2 }}>{money.equation}</Text>
          <Text style={{ fontFamily: 'Inter', fontSize: 9, lineHeight: 1.3, color: INK, marginTop: 3 }}>{money.line}</Text>
        </View>
      </View>
    </View>
  );
}

function bandOf(n) {
  return n < 50 ? 'red' : n < 75 ? 'amber' : 'green';
}

function Snapshot({ m }) {
  const nameSize = m.business.length > 26 ? 13 : 16;
  return (
    <Page size="LETTER" style={s.page}>
      <Header page={1} section="Snapshot" />
      <Text style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: nameSize, color: INK }}>
        <Text style={{ fontFamily: 'Bebas', fontSize: nameSize + 4, color: GREEN }}>MORE. </Text>
        Snapshot: {m.business}
      </Text>
      <Text style={{ fontFamily: 'Inter', fontSize: 9, color: GRAY, marginTop: 3 }}>
        {m.place ? m.place + '    ·    ' : ''}{m.dateLabel}
      </Text>
      <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center' }}>
        <Gauge value={m.total} band={m.totalBand} />
        <View style={{ flex: 1, marginLeft: 8, backgroundColor: WASH, borderLeftWidth: 4, borderLeftColor: GREEN, padding: 10 }}>
          <Text style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 28, color: INK, lineHeight: 1 }}>{m.time.hours}</Text>
          <Text style={s.label}>Hours lost per week</Text>
          <Text style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 14, color: GREEN, marginTop: 6 }}>{m.time.yearLabel} / year</Text>
          <Text style={{ fontFamily: 'Inter', fontSize: 8, color: GRAY, marginTop: 3 }}>{m.time.note}</Text>
        </View>
      </View>
      <Text style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 11, color: INK, marginTop: 4 }}>{m.weak.headline}</Text>
      <Text style={{ fontFamily: 'Inter', fontSize: 8, color: GRAY, marginTop: 2, marginBottom: 6 }}>{m.floorNote}</Text>
      {m.weak.rows.map(function (row) {
        return <Bar key={row.key} label={row.name} value={row.n} band={bandOf(row.n)} />;
      })}
      <View style={{ flexGrow: 1, marginTop: 10, backgroundColor: WASH, borderLeftWidth: 4, borderLeftColor: GREEN, padding: 14, justifyContent: 'center' }}>
        <Text style={[s.label, { marginBottom: 8 }]}>Key findings</Text>
        {m.snapshot.map(function (line, i) {
          return (
            <View key={line} style={{ flexDirection: 'row', marginBottom: 10 }}>
              <Text style={{ width: 26, fontFamily: 'Inter', fontWeight: 800, fontSize: 14, color: GREEN }}>0{i + 1}</Text>
              <Text style={{ flex: 1, fontFamily: 'Inter', fontSize: 11, lineHeight: 1.35, color: INK }}>{line}</Text>
            </View>
          );
        })}
      </View>
      <Footer page={1} />
    </Page>
  );
}

function SectionPage({ block, page, chart }) {
  const fixes = block.fixes.length ? block.fixes : [{ t: 'Keep the source that already brings work.', d: 'Leave a channel alone when it is already producing jobs.' }];
  return (
    <Page size="LETTER" style={s.page}>
      <Header page={page} section={block.name} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <View>
          <Text style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 18, color: INK }}>{block.name}</Text>
          {block.sub ? <Text style={{ fontFamily: 'Inter', fontSize: 9, color: GRAY, marginTop: 1 }}>{block.sub}</Text> : <View style={{ marginTop: 3, width: 36, height: 3, backgroundColor: GREEN }} />}
        </View>
        <ScoreMark value={block.num} band={block.band} size={26} />
      </View>
      <View style={{ marginTop: 8 }}>{chart}</View>
      <View style={{ marginTop: 8 }}>
        <Answers rows={block.answers} />
      </View>
      <View style={{ marginTop: 8 }}>
        <Cost money={block.money} />
      </View>
      <View style={{ flexGrow: 1, marginTop: 10, backgroundColor: WASH, borderLeftWidth: 4, borderLeftColor: GREEN, padding: 10, justifyContent: 'space-between' }}>
        <Text style={s.label}>The fix</Text>
        {fixes.slice(0, 3).map(function (fix) {
          return <Check key={fix.t} title={fix.t} detail={fix.d} />;
        })}
      </View>
      <Footer page={page} />
    </Page>
  );
}

function Summary({ m }) {
  const items = m.fixes.length ? m.fixes : [{ t: 'Keep the source that already brings work.', d: m.weak.detail }];
  const maxYear = Math.max.apply(null, m.time.parts.map(function (p) { return p.year; })) || 1;
  return (
    <Page size="LETTER" style={s.page}>
      <Header page={5} section="Your plan" />
      <Text style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 18, color: INK }}>Your Plan This Week</Text>
      <View style={{ marginTop: 3, width: 42, height: 3, backgroundColor: GREEN }} />
      <Text style={[s.body, { marginTop: 6 }]}>{m.weak.headline} {m.addNote}</Text>
      <View style={{ marginTop: 8, flexDirection: 'row', backgroundColor: WASH, borderLeftWidth: 4, borderLeftColor: GREEN, padding: 8 }}>
        <View style={{ width: '40%' }}>
          <Text style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 22, color: INK }}>{m.time.hours} hrs</Text>
          <Text style={s.label}>per week</Text>
          <Text style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 14, color: GREEN, marginTop: 6 }}>{m.time.yearLabel}</Text>
          <Text style={{ fontFamily: 'Inter', fontSize: 8, color: GRAY, marginTop: 2 }}>per year, estimate</Text>
        </View>
        <View style={{ width: '60%', justifyContent: 'center' }}>
          {m.weak.rows.map(function (row, i) {
            const part = m.time.parts[i];
            const w = Math.max(8, Math.round((part.year / maxYear) * 100));
            return (
              <View key={row.key} style={{ marginBottom: 6 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontFamily: 'Inter', fontSize: 8, color: INK }}>{row.name}</Text>
                  <Text style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 8, color: INK }}>{part.hours} hrs · {part.yearLabel}</Text>
                </View>
                <View style={{ height: 16, backgroundColor: TRACK, marginTop: 3 }}>
                  <View style={{ width: w + '%', height: 16, backgroundColor: numColor(bandOf(row.n)) }} />
                </View>
              </View>
            );
          })}
        </View>
      </View>
      <Text style={{ fontFamily: 'Inter', fontSize: 8, color: GRAY, marginTop: 6 }}>{m.time.note}</Text>
      <View style={{ flexDirection: 'row', marginTop: 12 }}>
        {m.weak.rows.map(function (row) {
          return (
            <View key={row.key} style={{ width: '33%' }}>
              <Text style={{ fontFamily: 'Inter', fontSize: 8, color: GRAY, marginBottom: 2 }}>{row.name}</Text>
              <ScoreMark value={row.n} band={bandOf(row.n)} size={20} suffix="/100" />
            </View>
          );
        })}
      </View>
      <View style={{ flexGrow: 1, marginTop: 12, backgroundColor: WASH, borderLeftWidth: 4, borderLeftColor: GREEN, padding: 12, justifyContent: 'space-between' }}>
        <View>
          <Text style={[s.label, { marginBottom: 8 }]}>Do these first</Text>
          {items.slice(0, 3).map(function (fix) {
            return <Check key={fix.t} title={fix.t} detail={fix.d} />;
          })}
        </View>
        <View style={{ paddingTop: 8, borderTopWidth: 1, borderTopColor: LINE }}>
          <Text style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 11, color: INK }}>{m.cta}</Text>
          <Text style={{ fontFamily: 'Inter', fontSize: 10, color: GRAY, marginTop: 2 }}>{m.phone}    ·    {m.url}</Text>
        </View>
      </View>
      <Footer page={5} />
    </Page>
  );
}

function Magazine({ model }) {
  const m = model;
  const left = m.channels.slice(0, 5);
  const right = m.channels.slice(5);
  return (
    <Document title={'MORE. Snapshot - ' + m.business} author="MORE." subject="make more money">
      <Snapshot m={m} />
      <SectionPage
        block={m.leads}
        page={2}
        chart={
          <View>
            <Text style={[s.label, { marginBottom: 6 }]}>Channels you use</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ width: '48%' }}><MiniBars rows={left} /></View>
              <View style={{ width: '48%' }}><MiniBars rows={right} /></View>
            </View>
          </View>
        }
      />
      <SectionPage
        block={m.leaks}
        page={3}
        chart={
          <View>
            <Text style={[s.label, { marginBottom: 6 }]}>Where leads drop off</Text>
            <Funnel rows={m.funnel} />
          </View>
        }
      />
      <SectionPage
        block={m.closing}
        page={4}
        chart={
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Donut value={m.closing.num} band={m.closing.band} />
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={[s.label, { marginBottom: 6 }]}>What the close is made of</Text>
              <MiniBars rows={m.closeParts} color={numColor(m.closing.band)} />
            </View>
          </View>
        }
      />
      <Summary m={m} />
    </Document>
  );
}

export { registerFonts, Magazine, buildModel };
