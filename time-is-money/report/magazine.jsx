import React from 'react';
import { Document, Page, Text, View, Font, Svg, Defs, LinearGradient, Stop, Rect } from '@react-pdf/renderer';
import { buildModel } from './model.js';

const BLACK = '#07080a';
const GREEN = '#22e06b';
const RED = '#FF3B30';

const THEMES = {
  light: { id: 'light', page: '#ffffff', ink: '#141414', muted: '#5E646C', block: '#F2F2F2', track: '#E4E4E4', bar: '#3A3F45', header: 'slim' },
  dark: { id: 'dark', page: BLACK, ink: '#F4F5F6', muted: '#C8CDD3', block: '#1C1F24', track: '#2A2E34', bar: '#D5D8DC', header: 'band' }
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

function themeOf(name) {
  return THEMES[name] || THEMES.dark;
}

function hourColor(high, ink) {
  return high ? RED : ink;
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
  const gid = 'tband' + theme.id + page;
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
      <View style={{ paddingHorizontal: 32, paddingTop: theme.header === 'band' ? 16 : 14 }}>
        {children}
      </View>
      <Footer theme={theme} page={page} />
    </Page>
  );
}

function Label({ theme, children }) {
  return (
    <Text style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 8, letterSpacing: 0.8, color: theme.muted, textTransform: 'uppercase', marginBottom: 6 }}>{children}</Text>
  );
}

function HourBar({ row, max, theme }) {
  const w = Math.max(8, Math.round((row.hours / max) * 100));
  return (
    <View style={{ backgroundColor: theme.block, padding: 10, marginBottom: 8 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Text style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 10, color: theme.ink, width: 360 }}>{row.name}</Text>
        <Text style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 16, color: hourColor(row.high, theme.ink) }}>{row.hours} hrs</Text>
      </View>
      <Text style={{ fontFamily: 'Inter', fontSize: 9, lineHeight: 1.35, color: theme.muted, marginTop: 3, marginBottom: 7 }}>{row.line}</Text>
      <View style={{ height: 7, backgroundColor: theme.track }}>
        <View style={{ width: w + '%', height: 7, backgroundColor: theme.bar }} />
      </View>
    </View>
  );
}

function Answers({ rows, theme }) {
  return (
    <View style={{ backgroundColor: theme.block, padding: 12, marginTop: 8 }}>
      <Label theme={theme}>Your answers</Label>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        {rows.map(function (row) {
          return (
            <View key={row.k} style={{ width: '48%', marginBottom: 6 }}>
              <Text style={{ fontFamily: 'Inter', fontSize: 7, letterSpacing: 0.5, color: theme.muted, textTransform: 'uppercase' }}>{row.k}</Text>
              <Text style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 9, color: theme.ink }}>{row.v}</Text>
            </View>
          );
        })}
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
  const max = Math.max.apply(null, m.rows.map(function (r) { return r.hours; })) || 1;
  const nameSize = m.business.length > 28 ? 13 : 16;
  return (
    <Sheet theme={theme} page={1}>
      <Text style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: nameSize, color: theme.ink }}>
        <Text style={{ fontFamily: 'Bebas', fontSize: nameSize + 2, color: theme.ink }}>MORE</Text>
        <Text style={{ fontFamily: 'Bebas', fontSize: nameSize + 2, color: GREEN }}>.</Text>
        <Text> Time Snapshot: {m.business}</Text>
      </Text>
      <Text style={{ fontFamily: 'Inter', fontSize: 9, color: theme.muted, marginTop: 3 }}>
        {m.trade ? m.trade + '    ·    ' : ''}{m.dateLabel}
      </Text>
      <View style={{ marginTop: 14, flexDirection: 'row', alignItems: 'stretch' }}>
        <View style={{ width: 190, backgroundColor: theme.block, padding: 14, justifyContent: 'center' }}>
          <Text style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 36, color: hourColor(m.high, theme.ink), lineHeight: 1 }}>{m.hours}</Text>
          <Text style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 8, letterSpacing: 0.6, color: theme.muted, marginTop: 4 }}>HOURS A WEEK</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 8, backgroundColor: theme.block, padding: 14, justifyContent: 'center' }}>
          <Text style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 22, color: theme.ink }}>{m.yearLabel}</Text>
          <Text style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 8, letterSpacing: 0.6, color: theme.muted, marginTop: 4 }}>PER YEAR · ESTIMATE</Text>
          <Text style={{ fontFamily: 'Inter', fontSize: 8, color: theme.muted, marginTop: 6 }}>{m.rateLabel} · {m.rateKind}</Text>
        </View>
      </View>
      <Text style={{ fontFamily: 'Inter', fontSize: 11, lineHeight: 1.4, color: theme.ink, marginTop: 12, marginBottom: 10 }}>{m.insight}</Text>
      {m.rows.map(function (row) {
        return <HourBar key={row.key} row={row} max={max} theme={theme} />;
      })}
      <Text style={{ fontFamily: 'Inter', fontSize: 8, color: theme.muted, marginTop: 2 }}>{m.note}</Text>
    </Sheet>
  );
}

function SectionPage({ m, row, page, theme, fixes }) {
  const share = Math.max(8, Math.round((row.hours / m.hours) * 100));
  return (
    <Sheet theme={theme} page={page}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Text style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 18, color: theme.ink, width: 390 }}>{row.name}</Text>
        <Text style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 22, color: hourColor(row.high, theme.ink) }}>{row.hours} hrs</Text>
      </View>
      <Text style={{ fontFamily: 'Inter', fontSize: 10, lineHeight: 1.35, color: theme.muted, marginTop: 4 }}>{row.line}</Text>
      <View style={{ marginTop: 12 }}>
        <Label theme={theme}>Share of the week</Label>
        <View style={{ height: 14, backgroundColor: theme.track }}>
          <View style={{ width: share + '%', height: 14, backgroundColor: theme.bar }} />
        </View>
        <Text style={{ fontFamily: 'Inter', fontSize: 8, color: theme.muted, marginTop: 4 }}>{row.yearLabel} / year · estimate · at {m.rateLabel}</Text>
      </View>
      <Answers rows={m.answers[row.key]} theme={theme} />
      <View style={{ backgroundColor: theme.block, padding: 12, marginTop: 8 }}>
        <Label theme={theme}>What it costs</Label>
        <Text style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 16, color: theme.ink }}>{row.hours} hrs / week</Text>
        <Text style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 14, color: theme.ink, marginTop: 2 }}>{row.yearLabel} / year</Text>
        <Text style={{ fontFamily: 'Inter', fontSize: 8, color: theme.muted, marginTop: 3 }}>{row.hours} hours × {m.rateLabel} × 52 weeks. Estimate.</Text>
      </View>
      <View style={{ marginTop: 12 }}>
        <Label theme={theme}>What one AI agent can take on</Label>
        {fixes.map(function (fix) {
          return <Check key={fix.t} title={fix.t} detail={fix.d} theme={theme} />;
        })}
      </View>
    </Sheet>
  );
}

function Summary({ m, theme }) {
  return (
    <Sheet theme={theme} page={5}>
      <Text style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 16, color: theme.ink }}>Done with you in 5 days. One on one with the founder.</Text>
      <Text style={{ fontFamily: 'Inter', fontSize: 11, lineHeight: 1.4, color: theme.ink, marginTop: 8 }}>{m.insight}</Text>
      <View style={{ marginTop: 10, backgroundColor: theme.block, padding: 12 }}>
        <Label theme={theme}>The 5-day plan</Label>
        {m.plan.map(function (step) {
          return (
            <View key={step.day} style={{ flexDirection: 'row', marginBottom: 7 }}>
              <Text style={{ width: 78, fontFamily: 'Inter', fontWeight: 800, fontSize: 9, color: theme.ink }}>{step.day}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 10, color: theme.ink }}>{step.t}</Text>
                <Text style={{ fontFamily: 'Inter', fontSize: 8, lineHeight: 1.3, color: theme.muted, marginTop: 1 }}>{step.d}</Text>
              </View>
            </View>
          );
        })}
      </View>
      <View style={{ marginTop: 10, flexDirection: 'row' }}>
        <View style={{ flex: 1, backgroundColor: theme.block, padding: 12, marginRight: 8 }}>
          <Text style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 20, color: theme.ink }}>{m.price}</Text>
          <Text style={{ fontFamily: 'Inter', fontSize: 8, color: theme.muted, marginTop: 2 }}>once, for the One-Week AI Setup</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: theme.block, padding: 12, marginRight: 8 }}>
          <Text style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 16, color: theme.ink }}>{m.kickoff}</Text>
          <Text style={{ fontFamily: 'Inter', fontSize: 8, color: theme.muted, marginTop: 2 }}>$1,000 kickoff · non-refundable</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: theme.block, padding: 12 }}>
          <Text style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 16, color: theme.ink }}>{m.handoff}</Text>
          <Text style={{ fontFamily: 'Inter', fontSize: 8, color: theme.muted, marginTop: 2 }}>$1,400 at handoff</Text>
        </View>
      </View>
      <View style={{ marginTop: 12, paddingTop: 8 }}>
        <Text style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 11, color: theme.ink }}>{m.cta}</Text>
        <Text style={{ fontFamily: 'Inter', fontSize: 10, color: theme.muted, marginTop: 2 }}>{m.phone}    ·    {m.url}</Text>
      </View>
    </Sheet>
  );
}

function Magazine({ model, theme }) {
  const m = model;
  const t = themeOf(theme);
  return (
    <Document title={'MORE. Time Snapshot - ' + m.business} author="MORE." subject="make more money">
      <Snapshot m={m} theme={t} />
      <SectionPage m={m} row={m.rows[0]} page={2} theme={t} fixes={m.setup.email} />
      <SectionPage m={m} row={m.rows[1]} page={3} theme={t} fixes={m.setup.quotes} />
      <SectionPage m={m} row={m.rows[2]} page={4} theme={t} fixes={m.setup.paper} />
      <Summary m={m} theme={t} />
    </Document>
  );
}

export { registerFonts, Magazine, buildModel };
