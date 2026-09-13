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
  { id: '/regulament-discord#mention', title: 'Regulament Discord — Menționarea staffului', content: 'nu da tag staffului fără motiv' },
  { id: '/regulament-staff#abuz', title: 'Regulament Staff — Abuz de comenzi', content: 'membrii staff nu au voie să abuzeze de comenzi' },
  { id: '/regulament-staff#grad', title: 'Regulament Staff — Grad pe alte comunități', content: 'grad de staff pe alte comunități de Minecraft' },
  { id: '/minecraft/donatori#fly', title: 'Regulament clienți — Abuzul de beneficii', content: 'folosirea comenzii /fly pentru a fugi de PvP' },
  { id: '/informatii-generale#apply', title: 'Informații generale — Aplicare staff', content: 'cum poți aplica în echipa staff' },
  { id: '/informatii-generale#vote', title: 'Informații generale — Votarea serverului', content: 'cum votezi serverul și primești recompense' },
  { id: '/informatii-generale#report', title: 'Informații generale — Raportarea hackerilor', content: 'cum raportezi un hacker pe Discord' },
  { id: '/introducere#ignoranta', title: 'Regulament 1st Network — Ignoranța nu este o scuză', content: 'nu știam regula nu este o scuză' }
];

const cases = [
  ['pot sa injur pe cineva pe chat', '/minecraft/chat#insulte'],
  ['daca folosesc o injuratura la adresa unui jucator', '/minecraft/chat#insulte'],
  ['daca ii zic unuia ca e prost ce patesc', '/minecraft/chat#insulte'],
  ['pot sa folosesc cuvinte vulgare?', '/minecraft/chat#insulte'],
  ['am voie sa trimit acelasi mesaj de 10 ori', '/minecraft/chat#spam'],
  ['dau mesaje mereu pe chat', '/minecraft/chat#spam'],
  ['pot sa fac spam unui admin cu trade', '/minecraft/gameplay#staffspam'],
  ['am voie sa dau /msg la staff de multe ori', '/minecraft/gameplay#staffspam'],
  ['cum deranjez un moderator cu comenzi', '/minecraft/gameplay#staffspam'],
  ['pot sa folosesc x ray', '/minecraft/gameplay#hack'],
  ['e permis autoclickerul?', '/minecraft/gameplay#hack'],
  ['m-a prins anticheatul', '/minecraft/gameplay#hack'],
  ['pot sa intru cu alt cont dupa ban', '/minecraft/gameplay#altcont'],
  ['am luat ban, intru pe alt cont?', '/minecraft/gameplay#altcont'],
  ['pot sa-mi las fratele pe cont', '/minecraft/scam#cont'],
  ['pot sa impart contul cu un prieten', '/minecraft/scam#cont'],
  ['e ok sa dau parola altcuiva', '/minecraft/scam#cont'],
  ['m-a tepuit la trade', '/minecraft/scam#trade'],
  ['pot sa vand iteme pe bani reali', '/minecraft/scam#trade'],
  ['cum evit o teapa la comert', '/minecraft/scam#trade'],
  ['pot pune poza pornografica pe discord', '/regulament-discord#media'],
  ['trimit poze indecente pe serverul discord?', '/regulament-discord#media'],
  ['pot da tag la staff fara motiv', '/regulament-discord#mention'],
  ['cum fac ping la tot stafful aiurea', '/regulament-discord#mention'],
  ['ce se intampla daca stafful abuzeaza de comenzi', '/regulament-staff#abuz'],
  ['un admin poate abuza de /ban?', '/regulament-staff#abuz'],
  ['stafful poate sa aiba grad pe alt server', '/regulament-staff#grad'],
  ['pot fi staff si pe alta comunitate', '/regulament-staff#grad'],
  ['pot folosi fly la pvp', '/minecraft/donatori#fly'],
  ['donatorii pot abuza de beneficii?', '/minecraft/donatori#fly'],
  ['cum aplic la staff', '/informatii-generale#apply'],
  ['cum pot sa devin staff', '/informatii-generale#apply'],
  ['vreau sa intru in echipa', '/informatii-generale#apply'],
  ['unde votez serverul', '/informatii-generale#vote'],
  ['cum primesc reward din vote', '/informatii-generale#vote'],
  ['unde raportez un hacker', '/informatii-generale#report'],
  ['am gasit un hacker ce fac', '/informatii-generale#report'],
  ['nu stiam regula, mai primesc sanctiune?', '/introducere#ignoranta'],
  ['daca nu am citit regulamentul sunt scutit?', '/introducere#ignoranta'],
  ['pot face grief pe insula altuia', '/minecraft/gameplay#grief'],
  ['am voie sa stric baza altui player', '/minecraft/gameplay#grief']
];

for (const [question, expected] of cases) {
  const ranked = rankDocuments(question, docs);
  const focused = focusDocuments(question, docs);
  const candidates = [...ranked.slice(0, 3), ...focused].map((document) => document.id);
  assert.ok(candidates.includes(expected), question + ' => ' + ranked.slice(0, 3).map((d) => d.id).join(', '));
}

console.log('Rule routing tests passed: ' + cases.length + ' varied cases.');
