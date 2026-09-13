import assert from 'node:assert/strict';
import { rankDocuments, focusDocuments } from './relevance.mjs';

const docs = [
  { id: '/minecraft/chat#insulte', title: 'Regulament chat — Jigniri și insulte', content: 'limbaj vulgar, insulte și jigniri în chat' },
  { id: '/minecraft/chat#spam', title: 'Regulament chat — Spam', content: 'mesaje repetate și spam în chat' },
  { id: '/minecraft/gameplay#grief', title: 'Regulament Gameplay — Grief în zona altui jucător', content: 'grief pe protecția altui jucător' },
  { id: '/minecraft/gameplay#staffspam', title: 'Regulament Gameplay — Spam către membrii staff', content: 'spam de comenzi sau mesaje către membrii staff' },
  { id: '/minecraft/gameplay#hack', title: 'Regulament Gameplay — Folosirea hack-urilor', content: 'hack, cheat, xray și autoclicker' },
  { id: '/minecraft/gameplay#altcont', title: 'Regulament Gameplay — Intrarea cu alt cont după ban', content: 'intrarea pe server cu un alt cont după ban' },
  { id: '/minecraft/scam#cont', title: 'Scam și Comerț — Împărțirea conturilor', content: 'nu ai voie să împarți contul cu alți jucători' },
  { id: '/minecraft/scam#trade', title: 'Scam și Comerț — Tranzacții', content: 'scam, trade, comerț și bani reali' },
  { id: '/regulament-discord#media', title: 'Regulament Discord — Imagini pornografice', content: 'poze pornografice și conținut indecent pe Discord' },
  { id: '/regulament-staff#abuz', title: 'Regulament Staff — Abuz de comenzi', content: 'membrii staff nu au voie să abuzeze de comenzi' },
  { id: '/regulament-staff#grad', title: 'Regulament Staff — Grad pe alte comunități', content: 'grad de staff pe alte comunități de Minecraft' },
  { id: '/minecraft/donatori#fly', title: 'Regulament clienți — Abuzul de beneficii', content: 'folosirea comenzii /fly pentru a fugi de PvP' },
  { id: '/informatii-generale#apply', title: 'Informații generale — Aplicare staff', content: 'cum poți aplica în echipa staff' },
  { id: '/introducere#ignoranta', title: 'Regulament 1st Network — Ignoranța nu este o scuză', content: 'nu știam regula nu este o scuză' }
];

const cases = [
  ['pot sa injur pe cineva pe chat', '/minecraft/chat#insulte'],
  ['daca ii zic unuia ca e prost ce patesc', '/minecraft/chat#insulte'],
  ['pot sa fac spam unui admin cu trade', '/minecraft/gameplay#staffspam'],
  ['am voie sa dau /msg la staff de multe ori', '/minecraft/gameplay#staffspam'],
  ['pot sa folosesc x ray', '/minecraft/gameplay#hack'],
  ['pot sa intru cu alt cont dupa ban', '/minecraft/gameplay#altcont'],
  ['pot sa-mi las fratele pe cont', '/minecraft/scam#cont'],
  ['pot sa vand contul', '/minecraft/scam#cont'],
  ['m-a tepuit la trade', '/minecraft/scam#trade'],
  ['pot sa vand iteme pe bani reali', '/minecraft/scam#trade'],
  ['pot pune poza pornografica pe discord', '/regulament-discord#media'],
  ['ce se intampla daca stafful abuzeaza de comenzi', '/regulament-staff#abuz'],
  ['stafful poate sa aiba grad pe alt server', '/regulament-staff#grad'],
  ['pot folosi fly la pvp', '/minecraft/donatori#fly'],
  ['cum aplic la staff', '/informatii-generale#apply'],
  ['cum pot sa devin staff', '/informatii-generale#apply'],
  ['nu stiam regula, mai primesc sanctiune?', '/introducere#ignoranta'],
  ['pot face grief pe insula altuia', '/minecraft/gameplay#grief']
];

for (const [question, expected] of cases) {
  const [top] = rankDocuments(question, docs);
  assert.equal(top.id, expected, question + ' => ' + top.id);
}

const focused = focusDocuments('pot sa injur pe cineva pe chat', docs);
assert.ok(focused.length > 0 && focused.every((document) => document.id.startsWith('/minecraft/chat')));
console.log('Rule routing tests passed: ' + (cases.length + 1) + ' cases.');
