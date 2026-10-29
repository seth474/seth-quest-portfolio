globalThis.BSCardCSS = `
  :host { display: block; }
  :host([hidden]) { display: none !important; }
  .drawer, .card { box-sizing: border-box; }
  .status { margin: 16px 0 0; font-size: 15px; font-family: "Segoe UI", Helvetica, Arial, sans-serif; color: #f4f0e6; }
  .status.error { color: #f0c2b4; }
  .retry { margin-top: 14px; border: 1px solid #343026; background: transparent; color: #f4f0e6; border-radius: 999px; padding: 6px 12px; font-size: 12px; cursor: pointer; }
  .drawer { max-height: calc(100vh - 80px); overflow: auto; background: #100e0b; color: #f4f0e6; }
  .card {
    padding: 22px 20px 28px;
    font-family: Georgia, "Iowan Old Style", "Palatino Linotype", serif;
    line-height: 1.45;
  }
  button, input, a, .note, .caveat, .facts, .dim-note, .alt-meta, .email-note, .clear {
    font-family: "Segoe UI", Helvetica, Arial, sans-serif;
  }
  .head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
  .mark { margin: 0; letter-spacing: 0.18em; text-transform: uppercase; color: #e2b657; font-size: 11px; }
  .score { margin: 6px 0 0; font-size: 72px; line-height: 0.9; font-weight: 600; }
  .emoji { margin: 10px 0 0; font-size: 18px; }
  .close, .interest button, .seek {
    border: 1px solid #3a3428;
    background: transparent;
    color: #f4f0e6;
    border-radius: 999px;
    cursor: pointer;
  }
  .close { padding: 6px 12px; font-size: 12px; }
  .badge { margin: 16px 0 0; color: #e2b657; letter-spacing: 0.16em; text-transform: uppercase; font-size: 11px; }
  .note, .caveat, .facts, .clear, .dim-note, .alt-meta, .email-note { margin: 8px 0 0; color: #c8c1b3; font-size: 13px; }
  .kicker { margin: 16px 0 0; color: #e2b657; letter-spacing: 0.14em; text-transform: uppercase; font-size: 11px; }
  .real { margin: 4px 0 0; font-size: 26px; line-height: 1.15; font-weight: 600; }
  .alert { margin: 12px 0 0; padding: 10px 12px; border: 1px solid #8a5a32; background: #2a2118; color: #f0d3b0; border-radius: 12px; font-size: 14px; }
  .alert .kicker { margin: 0 0 4px; display: block; }
  h2 { margin: 22px 0 8px; font-size: 13px; letter-spacing: 0.14em; text-transform: uppercase; font-weight: 600; font-family: "Segoe UI", Helvetica, Arial, sans-serif; color: #f4f0e6; }
  .stamps { display: flex; flex-direction: column; gap: 8px; }
  .seek { text-align: left; padding: 8px 12px; border-radius: 12px; font-size: 13px; }
  .seek:hover, .close:hover, .interest button:hover { border-color: #e2b657; }
  .dims { list-style: none; margin: 0; padding: 0; }
  .dims li { padding: 10px 0; border-top: 1px solid #2c2822; }
  .dim-top { display: flex; justify-content: space-between; gap: 12px; font-size: 13px; }
  .bar { height: 4px; margin-top: 6px; background: #2c2822; border-radius: 999px; overflow: hidden; }
  .bar span { display: block; height: 100%; background: #e2b657; }
  .alts ol { margin: 8px 0 0; padding-left: 18px; }
  .alts li { margin: 0 0 10px; }
  .alts a { color: #f4f0e6; }
  .interest { margin-top: 22px; }
  .row { display: flex; gap: 8px; margin-top: 8px; }
  .interest input {
    flex: 1;
    min-width: 0;
    border: 1px solid #3a3428;
    background: #18160f;
    color: #f4f0e6;
    border-radius: 999px;
    padding: 8px 12px;
    font-size: 14px;
  }
  .interest button { padding: 8px 14px; font-size: 13px; }
  .tip-row { margin: 18px 0 0; }
  .tip { color: #e2b657; }
  button:focus-visible, input:focus-visible, a:focus-visible { outline: 2px solid #e2b657; outline-offset: 2px; }

  .drawer { --fg: #f4f0e6; --muted: #c8c1b3; --line: #343026; --bg: #100e0b; --high: #f06a4f; --mixed: #e2b657; --gold: #5cc98a; }
  .hero { display: flex; align-items: center; gap: 14px; }
  .dial { position: relative; width: 86px; height: 86px; flex: none; }
  .dial .track { stroke: var(--line); }
  .dial .meter { stroke: var(--mixed); transition: stroke-dasharray 0.6s ease; }
  .dial.band-high .meter { stroke: var(--high); }
  .dial.band-gold .meter { stroke: var(--gold); }
  .dial-num { position: absolute; inset: 0; display: grid; place-items: center; font-size: 26px; font-weight: 600; color: var(--fg); font-family: "Segoe UI", Helvetica, Arial, sans-serif; }
  .verdict { font-size: 17px; font-weight: 600; margin: 4px 0 0; }
  .verdict.band-high { color: var(--high); }
  .verdict.band-mixed { color: var(--mixed); }
  .verdict.band-gold { color: var(--gold); }
  .score.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); margin: 0; }
  .flags { margin-top: 16px; padding: 12px 14px; border: 1px solid var(--line); border-radius: 12px; }
  .flags h2 { margin-top: 0; }
  .flag-list { list-style: none; margin: 8px 0 0; padding: 0; }
  .flag-list li + li { border-top: 1px solid var(--line); margin-top: 8px; padding-top: 8px; }
  .flag-top { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
  .flag-label { font-family: "Segoe UI", Helvetica, Arial, sans-serif; font-size: 13px; font-weight: 600; color: var(--fg); }
  .flag-seek { padding: 2px 9px; font-size: 11px; }
  .steps { list-style: none; margin: 14px 0 0; padding: 0; font-family: "Segoe UI", Helvetica, Arial, sans-serif; font-size: 13px; }
  .step { display: flex; align-items: center; gap: 10px; padding: 5px 0; color: var(--muted); }
  .step .dot { width: 16px; height: 16px; border-radius: 50%; border: 1px solid var(--line); display: grid; place-items: center; font-size: 10px; flex: none; }
  .step.done { color: var(--fg); }
  .step.done .dot { background: var(--gold); border-color: var(--gold); color: #100e0b; }
  .step.skipped .dot { border-color: var(--mixed); color: var(--mixed); }
  .step.active { color: var(--fg); }
  .step.active .dot { border-color: var(--mixed); border-top-color: transparent; animation: bsspin 0.8s linear infinite; }
  .step-note { color: var(--muted); font-size: 11px; }
  .err-title { margin: 16px 0 0; font-size: 18px; font-weight: 600; color: var(--high); font-family: "Segoe UI", Helvetica, Arial, sans-serif; }
  @keyframes bsspin { to { transform: rotate(360deg); } }
  @media (prefers-color-scheme: light) {
    .drawer { --fg: #1d1b17; --muted: #5b554a; --line: #e2ddd2; --bg: #fbf9f4; --high: #c8442b; --mixed: #a87912; --gold: #23874f; background: var(--bg); color: var(--fg); }
    .drawer .card, .drawer h2, .drawer h3, .drawer .real, .drawer .score, .drawer .close, .drawer .seek, .drawer .retry, .drawer .status { color: var(--fg); }
    .drawer .note, .drawer .caveat, .drawer .facts, .drawer .dim-note, .drawer .clear, .drawer .alt-meta { color: var(--muted); }
    .drawer .status.error { color: var(--high); }
  }
`;

if (typeof module !== "undefined" && module.exports) module.exports = globalThis.BSCardCSS;
