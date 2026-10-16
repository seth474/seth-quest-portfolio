import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { buildModel } from './model.js';

const INK = '#111111';
const WHITE = '#ffffff';
const GRAY = '#767676';
const LINE = '#E6E6E6';
const TRACK = '#EEEEEE';
const GREEN = '#2BE36B';
const RED = '#C62828';
const AMBER = '#A16207';
const GREEN_NUM = '#128A3E';

const COL = 74;
const GUT = 14;
function span(n) {
  return n * COL + (n - 1) * GUT;
}

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
  return GREEN_NUM;
}

function suffixSize(size) {
  if (size >= 56) return 13;
  if (size >= 24) return 11;
  return 9;
}

const s = StyleSheet.create({
  page: { backgroundColor: WHITE, fontFamily: 'Inter', color: INK, paddingTop: 40, paddingHorizontal: 48, paddingBottom: 56 },
  label: { fontFamily: 'Inter', fontWeight: 600, fontSize: 8, letterSpacing: 1.1, color: GRAY, textTransform: 'uppercase' },
  body: { fontFamily: 'Inter', fontSize: 11, lineHeight: 1.45, color: INK },
  gray: { fontFamily: 'Inter', fontSize: 10, lineHeight: 1.45, color: GRAY }
});

function Logo() {
  return (
    <Text style={{ fontFamily: 'Bebas', fontSize: 15, color: INK, letterSpacing: 0.4 }}>
      MORE<Text style={{ color: GREEN }}>.</Text>
    </Text>
  );
}

function Header({ page, section }) {
  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <View style={{ width: span(1) }}><Logo /></View>
        <Text style={s.label}>{section || 'Sales funnel score'}</Text>
        <Text style={{ width: span(1), textAlign: 'right', fontFamily: 'Inter', fontWeight: 600, fontSize: 9, color: GRAY }}>{String(page).padStart(2, '0')}</Text>
      </View>
      <View style={{ marginTop: 10, height: 1, backgroundColor: LINE }} />
    </View>
  );
}

function Footer({ page }) {
  return (
    <View style={{ position: 'absolute', bottom: 28, left: 48, right: 48, flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={{ fontFamily: 'Inter', fontSize: 8, color: GRAY }}>make more money</Text>
      <Text style={{ fontFamily: 'Inter', fontSize: 8, color: GRAY }}>{String(page).padStart(2, '0')} / 05</Text>
    </View>
  );
}

function ScoreMark({ value, band, size, suffix }) {
  const suf = suffixSize(size);
  const lift = Math.round((size - suf) * 0.2);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
      <Text style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: size, color: numColor(band), lineHeight: 1 }}>{String(value)}</Text>
      <Text style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: suf, color: GRAY, marginLeft: 6, marginBottom: lift }}>{suffix || '/100 pts'}</Text>
    </View>
  );
}

function Bar({ label, value, band }) {
  const w = value <= 0 ? 0 : Math.max(2, Math.min(100, value));
  return (
    <View style={{ marginBottom: 18 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 6 }}>
        <Text style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 11, color: INK }}>{label}</Text>
        <ScoreMark value={value} band={band} size={13} suffix="/100" />
      </View>
      <View style={{ height: 4, backgroundColor: TRACK, borderRadius: 2 }}>
        <View style={{ width: w + '%', height: 4, backgroundColor: GREEN, borderRadius: 2 }} />
      </View>
    </View>
  );
}

function Check({ title, detail }) {
  return (
    <View style={{ flexDirection: 'row', marginBottom: 14 }}>
      <View style={{ width: 11, height: 11, borderWidth: 1, borderColor: '#B5B5B5', marginTop: 1, marginRight: 12 }} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 11, color: INK, lineHeight: 1.3 }}>{title}</Text>
        {detail ? <Text style={{ fontFamily: 'Inter', fontSize: 10, lineHeight: 1.4, color: GRAY, marginTop: 2 }}>{detail}</Text> : null}
      </View>
    </View>
  );
}

function bandOf(n) {
  return n < 50 ? 'red' : n < 75 ? 'amber' : 'green';
}

function Snapshot({ m }) {
  const nameSize = m.business.length > 28 ? 22 : 28;
  return (
    <Page size="LETTER" style={s.page}>
      <Header page={1} />
      <View style={{ marginTop: 28, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <Text style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: nameSize, color: INK, maxWidth: span(4) }}>{m.business}</Text>
        <Text style={{ fontFamily: 'Inter', fontSize: 10, color: GRAY, marginBottom: 4 }}>{m.dateLabel}</Text>
      </View>
      <Text style={{ fontFamily: 'Inter', fontSize: 11, color: GRAY, marginTop: 6 }}>{m.place}</Text>

      <View style={{ marginTop: 32, flexDirection: 'row', alignItems: 'flex-end' }}>
        <View style={{ width: span(3) }}>
          <ScoreMark value={m.total} band={m.totalBand} size={64} />
        </View>
        <View style={{ width: span(3), paddingBottom: 10 }}>
          <Text style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 14, lineHeight: 1.35, color: INK }}>{m.weak.headline}</Text>
        </View>
      </View>

      <View style={{ marginTop: 36 }}>
        {m.weak.rows.map(function (row) {
          return <Bar key={row.key} label={row.name} value={row.n} band={bandOf(row.n)} />;
        })}
      </View>

      <View style={{ marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: LINE }}>
        <Text style={[s.label, { marginBottom: 14 }]}>Key findings</Text>
        <View style={{ flexDirection: 'row' }}>
          {m.snapshot.map(function (line, i) {
            return (
              <View key={line} style={{ width: span(2), marginRight: i < 2 ? GUT : 0 }}>
                <Text style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 10, color: GRAY, marginBottom: 6 }}>0{i + 1}</Text>
                <Text style={{ fontFamily: 'Inter', fontSize: 11, lineHeight: 1.4, color: INK }}>{line}</Text>
              </View>
            );
          })}
        </View>
      </View>
      <Footer page={1} />
    </Page>
  );
}

function SectionPage({ block, page }) {
  const fixes = block.fixes.length ? block.fixes : [{ t: 'Keep the source that already brings work.', d: 'Leave a channel alone when it is already producing jobs.' }];
  const money = block.money;
  return (
    <Page size="LETTER" style={s.page}>
      <Header page={page} section={block.name} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 28 }}>
        <Text style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 22, color: INK }}>{block.name}</Text>
        <ScoreMark value={block.num} band={block.band} size={28} />
      </View>
      <Text style={[s.label, { marginTop: 28, marginBottom: 10 }]}>What we found</Text>
      {block.found.map(function (line) {
        return <Text key={line} style={[s.body, { marginBottom: 5 }]}>{line}</Text>;
      })}
      <View style={{ marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: LINE }}>
        <Text style={s.label}>What it costs</Text>
        <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'flex-start' }}>
          <View style={{ width: span(2) }}>
            <Text style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 22, color: INK }}>{money.dollars}</Text>
            <Text style={{ fontFamily: 'Inter', fontSize: 9, color: GRAY, marginTop: 3 }}>{money.equation}</Text>
          </View>
          <View style={{ width: span(4), paddingTop: 4 }}>
            <Text style={s.body}>{money.line}</Text>
            <Text style={[s.gray, { fontSize: 9, marginTop: 6 }]}>{money.note}</Text>
          </View>
        </View>
      </View>
      <View style={{ marginTop: 18, paddingTop: 14, borderTopWidth: 1, borderTopColor: LINE }}>
        <Text style={[s.label, { marginBottom: 12 }]}>The fix</Text>
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
  return (
    <Page size="LETTER" style={s.page}>
      <Header page={5} section="Summary" />
      <Text style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 22, color: INK, marginTop: 28 }}>This week</Text>
      <Text style={[s.body, { marginTop: 10, maxWidth: span(5) }]}>{m.weak.headline} {m.addNote}</Text>
      <View style={{ marginTop: 22 }}>
        {m.weak.rows.map(function (row) {
          return <Bar key={row.key} label={row.name} value={row.n} band={bandOf(row.n)} />;
        })}
      </View>
      <Text style={[s.label, { marginTop: 4, marginBottom: 12 }]}>Do these first</Text>
      {items.slice(0, 3).map(function (fix) {
        return <Check key={fix.t} title={fix.t} detail={fix.d} />;
      })}
      <View style={{ marginTop: 12, paddingTop: 14, borderTopWidth: 1, borderTopColor: LINE }}>
        <Text style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 11, color: INK }}>{m.cta}</Text>
        <Text style={{ fontFamily: 'Inter', fontSize: 10, color: GRAY, marginTop: 3 }}>{m.phone}    ·    {m.url}</Text>
      </View>
      <Footer page={5} />
    </Page>
  );
}

function Magazine({ model }) {
  const m = model;
  return (
    <Document title={'Sales funnel score - ' + m.business} author="MORE." subject="make more money">
      <Snapshot m={m} />
      <SectionPage block={m.leads} page={2} />
      <SectionPage block={m.leaks} page={3} />
      <SectionPage block={m.closing} page={4} />
      <Summary m={m} />
    </Document>
  );
}

export { registerFonts, Magazine, buildModel };
