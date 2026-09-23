import { useMemo, useState } from 'react';

const sections = [
  { id: 'chat', name: 'Chat', note: 'Se aplică identic în /helpop, /eac și /msg', rules: [
    ['Limbi străine (altele decât RO/EN)', 'Mute 30 min'],
    ['Jigniri și insulte (inclusiv plm, fmm)', 'Mute 2 ore / Warn pe iteme, sign, /msg'],
    ['Toxicitate', 'Mute 2 ore / Warn'],
    ['Toxicitate excesivă', 'Suspendare donorchat / Mute 12 ore / Ban 3-7 zile'],
    ['Rasism', 'Mute 3 zile / Ban 3 zile în ganguri, iteme, construcții'],
    ['Jignirea staffului sau a serverului', 'Mute 3 zile'],
    ['Spam', 'Mute 1 oră'], ['Caps lock', 'Mute 1 oră'], ['Prelungirea cuvintelor', 'Mute 1 oră'],
    ['Solicitarea de favoruri de la staff', 'Warn'], ['Acuzații de hack în chat public', 'Warn'],
    ['Aceleași reguli în /helpop, /eac, /msg', 'Warn'], ['Dezvăluirea datelor personale', 'Ban permanent'],
    ['Reclamă indirectă („cine are server?”)', 'Mute 7 zile'], ['Promovarea comunităților externe', 'Ban permanent'],
    ['Promovarea conturilor personale', 'Mute 3 zile / Warn']
  ]},
  { id: 'cheating', name: 'Cheating', rules: [
    ['Hack, autoclicker, macro, BetterPvP, dublu input, F3+T', 'Ban permanent'], ['Te prefaci că folosești hack', 'Ban permanent'],
    ['Joci cu un hacker sau nu îl raportezi', 'Ban 30 zile'], ['Schematica Printer', 'Ban 30 zile + construcție ștearsă'],
    ['X-Ray', 'Ban 30 zile'], ['Farmare cu metode interzise', 'Ban 14 zile'], ['Butterfly / dragclick / jitter', 'Ban 15 min (dat de anticheat)']
  ]},
  { id: 'buguri', name: 'Bug-uri', note: 'Exploatarea se sancționează chiar dacă bug-ul e cunoscut', rules: [
    ['Bug disconnect în combat', 'Ban 7 zile'], ['Bug elytra', 'Ban 7 zile'], ['Bug perlă', 'Ban 3 zile'],
    ['Bug urcat cu blocuri', 'Ban 3 zile'], ['Bug dat prin blocuri', 'Ban 3 zile']
  ]},
  { id: 'griefing', name: 'Griefing și altele', rules: [
    ['Te dai drept staff sau rudă cu staff', 'Ban permanent'], ['Nume asemănător cu al unui staff', 'Ban permanent'],
    ['Nume de cont indecent sau jignitor', 'Ban permanent'], ['Hărțuirea staffului („vânătoare”)', 'Ban permanent'],
    ['Grief în zona altui jucător', 'Ban 30 zile'], ['Instigare', 'Ban 7 zile'], ['Capcane (trap)', 'Ban 7 zile'],
    ['TPA Kill', 'Ban 7 zile'], ['/home sau /pwarp în zona altuia', 'Ban 7 zile'], ['Împingerea jucătorilor cu undița', 'Ban 7 zile'],
    ['Deranjarea eventului de pescuit', 'Ban 7 zile'], ['Team la LMS', 'Ban 7 zile'],
    ['Construcții obscene sau rasiste', 'Ban 7 zile + construcție ștearsă'], ['Intrare pe alt cont sub 15 min după ban', 'Ban 3 zile'],
    ['Mai multe conturi în AFK Zone', 'Ban 3 zile'], ['Profileboosting', 'Ban pe conturile implicate + descalificare din topuri'],
    ['Spam către staff (/trade, /msg)', 'Warn'], ['/chatreport abuziv', 'Warn']
  ]},
  { id: 'scam', name: 'Scam și comerț', rules: [
    ['Afaceri în afara jocului (bani reali)', 'Ban permanent'], ['Vânzarea conturilor', 'Ban permanent'],
    ['Împărțirea conturilor', 'Ban permanent'], ['Falsificarea dovezilor', 'Ban permanent'],
    ['Scam pe /ah sau /trade cu iteme false', 'Ban 7 zile'],
    ['Construcții tip cazino sau alba-neagra', 'Ban 7 zile + construcție ștearsă'], ['Înșelarea jucătorilor pentru iteme', 'În funcție de gravitate']
  ]}
];

export default function StaffTldr() {
  const fold = (value) => value.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');
  const severity = (value) => value.includes('permanent') ? 'perm' : value.includes('Warn') ? 'warn' : value.includes('Mute') ? 'mute' : value.includes('Ban') || value.includes('Suspendare') ? 'temp' : 'var';
  const [query, setQuery] = useState('');
  const [active, setActive] = useState('all');
  const normalized = fold(query.trim());
  const visible = useMemo(() => sections.map((section) => ({
    ...section,
    rules: section.rules.filter(([rule, sanction]) => !normalized || fold(rule + ' ' + sanction + ' ' + section.name).includes(normalized))
  })).filter((section) => (active === 'all' || active === section.id) && section.rules.length), [active, normalized]);
  const count = visible.reduce((sum, section) => sum + section.rules.length, 0);

  return <div className="staff-tldr">
    <style>{`
      .staff-tldr{--bg:#0c0709;--surface:#150c0f;--surface2:#1e1115;--ink:#f6eaed;--muted:#cdb6bc;--line:#2f1a21;--accent:#ff2d55;max-width:900px;margin:0 auto;padding:18px 16px 44px;background:var(--bg);color:var(--ink);font:15px/1.55 "IBM Plex Sans",system-ui,sans-serif}
      .staff-tldr *{box-sizing:border-box}.staff-tldr h1,.staff-tldr h2{font-family:Impact,"Arial Black",sans-serif;font-weight:400}.staff-tldr h1{font-size:clamp(26px,6vw,42px);margin:0}.staff-tldr h1 span{color:var(--accent)}.staff-tldr header{padding:18px 0 8px}.staff-tldr .lede{color:var(--muted)}.staff-tldr .controls{position:sticky;top:0;z-index:2;background:var(--bg);padding:14px 0 12px;border-bottom:1px solid var(--line)}.staff-tldr input{width:100%;padding:11px 14px;border:1px solid var(--line);border-radius:10px;background:var(--surface);color:var(--ink);font:inherit}.staff-tldr input:focus{outline:2px solid var(--accent)}.staff-tldr .chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}.staff-tldr button{border:1px solid var(--line);border-radius:999px;padding:5px 12px;background:var(--surface);color:var(--muted);cursor:pointer}.staff-tldr button.active{background:var(--accent);border-color:var(--accent);color:#fff}.staff-tldr .count{margin-top:8px;color:var(--muted);font-size:12px}.staff-tldr section{padding:28px 0 4px}.staff-tldr h2{font-size:20px;margin:0 0 12px}.staff-tldr .note{color:var(--muted);font-size:13px;margin-bottom:10px}.staff-tldr .table{border:1px solid var(--line);border-radius:12px;overflow:hidden;background:var(--surface)}.staff-tldr .row{display:grid;grid-template-columns:1fr auto;gap:14px;padding:11px 15px}.staff-tldr .row+.row{border-top:1px solid var(--line)}.staff-tldr .rule{color:var(--ink)}.staff-tldr .pill{display:inline-block;padding:3px 8px;border-radius:6px;font-size:13px}.staff-tldr .warn{color:#f4c451;background:#2d220d}.staff-tldr .mute{color:#86b8ff;background:#12203a}.staff-tldr .temp{color:#ff9d52;background:#33190b}.staff-tldr .perm{color:#ff5468;background:#3b0d17}.staff-tldr .var{color:#bca8ad;background:#241a1d}.staff-tldr .empty{padding:34px;text-align:center;color:var(--muted)}@media(max-width:560px){.staff-tldr .row{grid-template-columns:1fr;gap:6px}.staff-tldr .pill{justify-self:start}}
    `}</style>
    <header><p style={{color:'var(--accent)',fontSize:12,textTransform:'uppercase'}}>mc-1st.ro</p><h1>Regulament <span>1st</span> Network</h1><p className="lede">Toate regulile și sancțiunile, într-un singur loc. Caută după cuvânt cheie sau filtrează pe categorie.</p></header>
    <div className="controls"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Caută: elytra, xray, caps, scam…" aria-label="Caută în regulament" /><div className="chips"><button className={active === 'all' ? 'active' : ''} onClick={() => setActive('all')}>Toate</button>{sections.map((section) => <button key={section.id} className={active === section.id ? 'active' : ''} onClick={() => setActive(section.id)}>{section.name}</button>)}</div><div className="count">{count} {count === 1 ? 'regulă' : 'reguli'}</div></div>
    {visible.length ? visible.map((section) => <section key={section.id}><h2>{section.name}</h2>{section.note && <p className="note">{section.note}</p>}<div className="table">{section.rules.map(([rule, sanction], index) => <div className="row" key={rule}><div className="rule">{rule}</div><span className={`pill ${severity(sanction)}`}>{sanction}</span></div>)}</div></section>) : <div className="empty">Nicio regulă nu se potrivește cu căutarea.</div>}
  </div>;
}
