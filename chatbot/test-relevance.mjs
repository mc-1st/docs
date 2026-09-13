import assert from 'node:assert/strict';
import { rankDocuments } from './relevance.mjs';

const docs = [
  { id: '/minecraft/chat#1', title: 'Regulament chat — Jigniri și insulte', content: 'limbaj vulgar, insulte și jigniri în chat' },
  { id: '/minecraft/gameplay#1', title: 'Regulament Gameplay — Grief în zona altui jucător', content: 'grief pe protecția altui jucător' },
  { id: '/regulament-staff#1', title: 'Regulament Staff — Abuz de comenzi', content: 'membrii staff nu au voie să abuzeze de comenzi' },
  { id: '/minecraft/scam-si-comert#1', title: 'Scam și Comerț — Împărțirea conturilor', content: 'nu ai voie să împarți contul cu alți jucători' }
];

function top(question) {
  return rankDocuments(question, docs)[0].id;
}

assert.equal(top('ce se întâmplă dacă folosesc un limbaj vulgar față de un jucător'), '/minecraft/chat#1');
assert.equal(top('pot să împart contul cu fratele meu'), '/minecraft/scam-si-comert#1');
assert.equal(top('cum se sancționează abuzul de comenzi ca membru staff'), '/regulament-staff#1');
assert.equal(top('pot face grief pe protecția altui jucător'), '/minecraft/gameplay#1');
console.log('Rule routing tests passed.');
