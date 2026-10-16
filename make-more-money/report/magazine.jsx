import React from 'react';
import { Document, Page, Text, View, Font, Svg, Path, Defs, LinearGradient, Stop, Rect } from '@react-pdf/renderer';
import { buildModel } from './model.js';

const BLACK = '#07080a';
const GREEN = '#22e06b';
const RED = '#FF3B30';

const THEMES = {
  light: {
    id: 'light',
    page: '#ffffff',
    ink: '#141414',
    muted: '#5E646C',
    block: '#F2F2F2',
    track: '#E4E4E4',
    bar: '#3A3F45',
    header: 'slim'
  },
  dark: {
    id: 'dark',
    page: BLACK,
    ink: '#F4F5F6',
    muted: '#C8CDD3',
    block: '#1C1F24',
    track: '#2A2E34',
    bar: '#D5D8DC',
    header: 'band'
  }
};

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

function digitColor(n, ink) {
  return n < 50 ? RED : ink;
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

function themeOf(name) {
  return THEMES[name] || THEMES.dark;
}

function Band({ id, height }) {
  return (
    <Svg width="612" height={height} viewBox={'0 0 612 ' + height}>
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0%" stopColor={BLACK} />
          <Stop offset="100%" stopColor={GREEN} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="612" height={height} fill={'url(#' + id + ')'} />
    </Svg>
  );
}

function Wordmark({ color }) {
  return (
    <Text style={{ fontFamily: 'Bebas', fontSize: 20, letterSpacing: 0.6, color: color }}>
      MORE<Text style={{ color: GREEN }}>.</Text>
    </Text>
  );
}

function ReportHeader({ theme, page }) {
  const gid = 'band' + theme.id + page;
  if (theme.header === 'band') {
    return (
      <View>
        <Band id={gid} height="46" />
        <View style={{ position: 'absolute', top: 12, left: 32 }}>
          <Wordmark color="#ffffff" />
          <Text style={{ fontFamily: 'Inter', fontSize: 8, color: '#F4F5F6', marginTop: 1 }}>make more money</Text>
        </View>
      </View>
    );
  }
  return (
    <View>
      <View style={{ paddingTop: 16, paddingHorizontal: 32, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <View>
          <Wordmark color={theme.ink} />
          <Text style={{ fontFamily: 'Inter', fontSize: 8, color: theme.muted, marginTop: 1 }}>make more money</Text>
        </View>
        <Text style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 9, color: theme.muted }}>{String(page).padStart(2, '0')}</Text>
      </View>
      <View style={{ marginTop: 8 }}>
        <Band id={gid} height="7" />
      </View>
    </View>
  );
}

function Footer({ theme, page }) {
  return (
    <View style={{ position: 'absolute', bottom: 14, left: 32, right: 32, flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={{ fontFamily: 'Inter', fontSize: 8, color: theme.muted }}>sethquest.com/time-is-money</Text>
      <Text style={{ fontFamily: 'Inter', fontSize: 8, color: theme.muted }}>{String(page).padStart(2, '0')} / 05</Text>
    </View>
  );
}

function Sheet({ theme, page, children }) {
  return (
    <Page size="LETTER" style={{ backgroundColor: theme.page, fontFamily: 'Inter', color: theme.ink, paddingBottom: 36 }}>
      <ReportHeader theme={theme} page={page} />
      <View style={{ paddingHorizontal: 32, paddingTop: theme.header === 'band' ? 16 : 14, paddingBottom: 28, flexGrow: 1 }}>
        {children}
      </View>
      <Footer theme={theme} page={page} />
    </Page>
  );
}

function Gauge({ value, theme }) {
  const start = 150;
  const sweep = 240;
  const end = start + sweep * (Math.max(0, Math.min(100, value)) / 100);
  return (
    <View style={{ width: 158, height: 118 }}>
      <Svg width="158" height="110" viewBox="0 0 158 110">
        <Path d={arcPath(79, 70, 46, start, start + sweep)} stroke={theme.track} strokeWidth="11" fill="none" />
        <Path d={arcPath(79, 70, 46, start, end)} stroke={theme.bar} strokeWidth="11" fill="none" />
      </Svg>
      <View style={{ position: 'absolute', top: 48, left: 0, right: 0, alignItems: 'center' }}>
        <Text style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 26, color: digitColor(value, theme.ink) }}>{String(value)}</Text>
        <Text style={{ fontFamily: 'Inter', fontSize: 8, color: theme.muted, marginTop: 1 }}>/100 pts</Text>
      </View>
    </View>
  );
}

function ScoreLine({ row, theme }) {
  const w = Math.max(0, Math.min(100, row.n));
  return (
    <View style={{ backgroundColor: theme.block, padding: 10, marginBottom: 8 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Text style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 10, color: theme.ink, width: 400 }}>{row.name}</Text>
        <Text style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 16, color: digitColor(row.n, theme.ink) }}>{String(row.n)}</Text>
      </View>
      <Text style={{ fontFamily: 'Inter', fontSize: 9, lineHeight: 1.35, color: theme.muted, marginTop: 3, marginBottom: 7 }}>{row.line}</Text>
      <View style={{ height: 7, backgroundColor: theme.track }}>
        <View style={{ width: w + '%', height: 7, backgroundColor: theme.bar }} />
      </View>
    </View>
  );
}

function Label({ theme, children }) {
  return (
    <Text style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 8, letterSpacing: 0.8, color: theme.muted, textTransform: 'uppercase', marginBottom: 6 }}>{children}</Text>
  );
}

function MiniBars({ rows, theme }) {
  return (
    <View>
      {rows.map(function (row) {
        const w = Math.max(0, Math.min(100, row.pct));
        const off = row.on === false;
        return (
          <View key={row.label} style={{ marginBottom: 9 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
              <Text style={{ fontFamily: 'Inter', fontSize: 9, color: theme.ink }}>{row.label}</Text>
              <Text style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 9, color: off ? theme.muted : theme.ink }}>{off ? 'Off' : String(w)}</Text>
            </View>
            <View style={{ height: 8, backgroundColor: theme.track }}>
              <View style={{ width: (off ? 0 : w) + '%', height: 8, backgroundColor: theme.bar }} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

function Funnel({ rows, theme }) {
  return (
    <View>
      {rows.map(function (row) {
        const w = Math.max(8, Math.min(100, row.pct));
        return (
          <View key={row.label} style={{ marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
              <Text style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 9, color: theme.ink }}>{row.label}</Text>
              <Text style={{ fontFamily: 'Inter', fontSize: 8.5, color: theme.muted }}>{row.pct}% still in</Text>
            </View>
            <View style={{ height: 18, backgroundColor: theme.track }}>
              <View style={{ width: w + '%', height: 18, backgroundColor: theme.bar }} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

function Donut({ value, theme }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <View style={{ width: 108, height: 108 }}>
      <Svg width="108" height="108" viewBox="0 0 108 108">
        <Path d={arcPath(54, 54, 36, 0, 359.9)} stroke={theme.track} strokeWidth="12" fill="none" />
        <Path d={arcPath(54, 54, 36, 0, Math.max(2, 360 * (pct / 100)))} stroke={theme.bar} strokeWidth="12" fill="none" />
      </Svg>
      <View style={{ position: 'absolute', top: 40, left: 0, right: 0, alignItems: 'center' }}>
        <Text style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 18, color: digitColor(value, theme.ink) }}>{String(value)}</Text>
      </View>
    </View>
  );
}

function Answers({ rows, theme }) {
  const left = rows.filter(function (_, i) { return i % 2 === 0; });
  const right = rows.filter(function (_, i) { return i % 2 === 1; });
  function col(list) {
    return (
      <View style={{ width: '48%' }}>
        {list.map(function (row) {
          return (
            <View key={row.k} style={{ marginBottom: 5 }}>
              <Text style={{ fontFamily: 'Inter', fontSize: 7, letterSpacing: 0.5, color: theme.muted, textTransform: 'uppercase' }}>{row.k}</Text>
              <Text style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 9, color: theme.ink }}>{row.v}</Text>
            </View>
          );
        })}
      </View>
    );
  }
  return (
    <View style={{ backgroundColor: theme.block, padding: 12 }}>
      <Label theme={theme}>Your answers</Label>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {col(left)}
        {col(right)}
      </View>
    </View>
  );
}

function Cost({ money, theme }) {
  return (
    <View style={{ backgroundColor: theme.block, padding: 12, marginTop: 10 }}>
      <Label theme={theme}>What it costs</Label>
      <View style={{ flexDirection: 'row' }}>
        <View style={{ width: '46%', paddingRight: 8 }}>
          <Text style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 14, color: theme.ink }}>{money.hoursLabel}</Text>
          <Text style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 12, color: theme.ink, marginTop: 2 }}>{money.yearLabel}</Text>
          <Text style={{ fontFamily: 'Inter', fontSize: 8, color: theme.muted, marginTop: 3 }}>Owner time, estimate, at $125 an hour.</Text>
        </View>
        <View style={{ width: '54%' }}>
          <Text style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 14, color: theme.ink }}>{money.dollars}</Text>
          <Text style={{ fontFamily: 'Inter', fontSize: 8, color: theme.muted, marginTop: 2 }}>{money.equation}</Text>
          <Text style={{ fontFamily: 'Inter', fontSize: 8.5, lineHeight: 1.3, color: theme.ink, marginTop: 3 }}>{money.line}</Text>
        </View>
      </View>
    </View>
  );
}

function Check({ title, detail, theme }) {
  return (
    <View style={{ flexDirection: 'row', marginBottom: 8 }}>
      <View style={{ width: 10, height: 10, borderWidth: 1.25, borderColor: theme.muted, marginTop: 1, marginRight: 8 }} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 10, color: theme.ink }}>{title}</Text>
        {detail ? <Text style={{ fontFamily: 'Inter', fontSize: 8, lineHeight: 1.3, color: theme.muted, marginTop: 1 }}>{detail}</Text> : null}
      </View>
    </View>
  );
}

function Snapshot({ m, theme }) {
  const nameSize = m.business.length > 28 ? 13 : 16;
  return (
    <Sheet theme={theme} page={1}>
      <Text style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: nameSize, color: theme.ink }}>
        <Text style={{ fontFamily: 'Bebas', fontSize: nameSize + 2, color: theme.ink }}>MORE</Text>
        <Text style={{ fontFamily: 'Bebas', fontSize: nameSize + 2, color: GREEN }}>.</Text>
        <Text> Snapshot: {m.business}</Text>
      </Text>
      <Text style={{ fontFamily: 'Inter', fontSize: 9, color: theme.muted, marginTop: 3 }}>
        {m.place ? m.place + '    ·    ' : ''}{m.dateLabel}
      </Text>
      <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center' }}>
        <Gauge value={m.total} theme={theme} />
        <View style={{ flex: 1, marginLeft: 8, backgroundColor: theme.block, padding: 12 }}>
          <Text style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 26, color: theme.ink, lineHeight: 1 }}>{m.time.hours}</Text>
          <Text style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 8, letterSpacing: 0.6, color: theme.muted, marginTop: 3 }}>HOURS LOST PER WEEK</Text>
          <Text style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 13, color: theme.ink, marginTop: 8 }}>{m.time.yearLabel} / year</Text>
          <Text style={{ fontFamily: 'Inter', fontSize: 8, color: theme.muted, marginTop: 3 }}>{m.time.note}</Text>
        </View>
      </View>
      <Text style={{ fontFamily: 'Inter', fontSize: 11, lineHeight: 1.4, color: theme.ink, marginTop: 12, marginBottom: 10 }}>{m.insight}</Text>
      {m.rows.map(function (row) {
        return <ScoreLine key={row.key} row={row} theme={theme} />;
      })}
    </Sheet>
  );
}

function SectionPage({ block, page, theme, chart }) {
  const fixes = block.fixes.length ? block.fixes : [{ t: 'Keep the source that already brings work.', d: 'Leave a channel alone when it is already producing jobs.' }];
  const titleSize = block.name.length > 24 ? 13 : 18;
  return (
    <Sheet theme={theme} page={page}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Text style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: titleSize, color: theme.ink, width: 430 }}>{block.name}</Text>
        <Text style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 22, color: digitColor(block.num, theme.ink) }}>{String(block.num)}</Text>
      </View>
      <Text style={{ fontFamily: 'Inter', fontSize: 9.5, lineHeight: 1.35, color: theme.muted, marginTop: 4 }}>{block.line}</Text>
      <View style={{ marginTop: 12 }}>{chart}</View>
      <View style={{ marginTop: 10 }}>
        <Answers rows={block.answers} theme={theme} />
      </View>
      <Cost money={block.money} theme={theme} />
      <View style={{ marginTop: 12 }}>
        <Label theme={theme}>This week</Label>
        {fixes.slice(0, 3).map(function (fix) {
          return <Check key={fix.t} title={fix.t} detail={fix.d} theme={theme} />;
        })}
      </View>
    </Sheet>
  );
}

function Summary({ m, theme }) {
  const items = m.fixes.length ? m.fixes : [{ t: 'Keep the source that already brings work.', d: 'Leave a channel alone when it is already producing jobs.' }];
  const maxYear = Math.max.apply(null, m.time.parts.map(function (p) { return p.year; })) || 1;
  return (
    <Sheet theme={theme} page={5}>
      <Text style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 18, color: theme.ink }}>Your Plan This Week</Text>
      <Text style={{ fontFamily: 'Inter', fontSize: 11, lineHeight: 1.4, color: theme.ink, marginTop: 8 }}>{m.insight}</Text>
      <View style={{ marginTop: 10, flexDirection: 'row', backgroundColor: theme.block, padding: 10 }}>
        <View style={{ width: '38%' }}>
          <Text style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 20, color: theme.ink }}>{m.time.hours} hrs</Text>
          <Text style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 8, letterSpacing: 0.6, color: theme.muted, marginTop: 2 }}>PER WEEK</Text>
          <Text style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 13, color: theme.ink, marginTop: 8 }}>{m.time.yearLabel}</Text>
          <Text style={{ fontFamily: 'Inter', fontSize: 8, color: theme.muted, marginTop: 2 }}>per year, estimate</Text>
        </View>
        <View style={{ width: '62%', justifyContent: 'center' }}>
          {m.rows.map(function (row, i) {
            const part = m.time.parts[i];
            const w = Math.max(8, Math.round((part.year / maxYear) * 100));
            return (
              <View key={row.key} style={{ marginBottom: 6 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontFamily: 'Inter', fontSize: 8, color: theme.ink, width: 210 }}>{row.name}</Text>
                  <Text style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 8, color: theme.ink }}>{part.hours} hrs</Text>
                </View>
                <View style={{ height: 8, backgroundColor: theme.track, marginTop: 2 }}>
                  <View style={{ width: w + '%', height: 8, backgroundColor: theme.bar }} />
                </View>
              </View>
            );
          })}
        </View>
      </View>
      <Text style={{ fontFamily: 'Inter', fontSize: 8, color: theme.muted, marginTop: 6 }}>{m.time.note} {m.addNote}</Text>
      <View style={{ flexDirection: 'row', marginTop: 14 }}>
        {m.rows.map(function (row) {
          return (
            <View key={row.key} style={{ width: '33%', paddingRight: 8 }}>
              <Text style={{ fontFamily: 'Inter', fontSize: 8, color: theme.muted, marginBottom: 2 }}>{row.name}</Text>
              <Text style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 18, color: digitColor(row.n, theme.ink) }}>{String(row.n)}</Text>
              <Text style={{ fontFamily: 'Inter', fontSize: 8, lineHeight: 1.3, color: theme.muted, marginTop: 3 }}>{row.line}</Text>
            </View>
          );
        })}
      </View>
      <View style={{ marginTop: 'auto', backgroundColor: theme.block, padding: 12 }}>
        <Label theme={theme}>Do these first</Label>
        {items.slice(0, 3).map(function (fix) {
          return <Check key={fix.t} title={fix.t} detail={fix.d} theme={theme} />;
        })}
        <View style={{ marginTop: 4, paddingTop: 8, borderTopWidth: 1, borderTopColor: theme.track }}>
          <Text style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 11, color: theme.ink }}>{m.cta}</Text>
          <Text style={{ fontFamily: 'Inter', fontSize: 10, color: theme.muted, marginTop: 2 }}>{m.phone}    ·    {m.url}</Text>
        </View>
      </View>
    </Sheet>
  );
}

function Magazine({ model, theme }) {
  const m = model;
  const t = themeOf(theme);
  const left = m.channels.slice(0, 5);
  const right = m.channels.slice(5);
  return (
    <Document title={'MORE. Snapshot - ' + m.business} author="MORE." subject="make more money">
      <Snapshot m={m} theme={t} />
      <SectionPage
        block={m.leads}
        page={2}
        theme={t}
        chart={
          <View>
            <Label theme={t}>Channels you use</Label>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ width: '48%' }}><MiniBars rows={left} theme={t} /></View>
              <View style={{ width: '48%' }}><MiniBars rows={right} theme={t} /></View>
            </View>
          </View>
        }
      />
      <SectionPage
        block={m.leaks}
        page={3}
        theme={t}
        chart={
          <View>
            <Label theme={t}>Where leads drop off</Label>
            <Funnel rows={m.funnel} theme={t} />
          </View>
        }
      />
      <SectionPage
        block={m.closing}
        page={4}
        theme={t}
        chart={
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Donut value={m.closing.num} theme={t} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Label theme={t}>What the close is made of</Label>
              <MiniBars rows={m.closeParts} theme={t} />
            </View>
          </View>
        }
      />
      <Summary m={m} theme={t} />
    </Document>
  );
}

export { registerFonts, Magazine, buildModel };
