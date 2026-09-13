import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { resolve } from 'node:path';

const port = Number(process.env.PORT || 3099);
const origin = process.env.RULES_ORIGIN || 'https://rules.mc-1st.ro';
const publicRulesUrl = (process.env.PUBLIC_RULES_URL || origin).replace(/\/$/u, '');
const model = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
const reasoningEffort = process.env.GROQ_REASONING_EFFORT || 'medium';
const maxMinute = Number(process.env.MAX_REQUESTS_PER_MINUTE || 5);
const maxDay = Number(process.env.MAX_REQUESTS_PER_DAY || 30);
const indexFile = resolve(import.meta.dirname, 'data/documents.json');
const projectRoot = resolve(import.meta.dirname, '..');
const execFileAsync = promisify(execFile);
const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET || '';
const requests = new Map();
let index = [];
const noRuleResponse = {
  answer: 'Nu am găsit o regulă care să răspundă clar acestei întrebări. Pentru nelămuriri, contactează echipa staff pe Discord.',
  sanction: 'Regulamentul nu precizează o sancțiune exactă.',
  sources: [],
  supportUrl: 'https://discord.mc-1st.ro'
};
const sectionCatalog = () => index.map((document) => `${document.id} | ${document.title}`).join('\n');

const stopWords = new Set('a ai ale al am an asta acest aceasta ca care ce cu daca de din e este eu fi in la mai mi nu o pe pentru sa sau se si sunt te un unei unor'.split(' '));
const queryExpansions = [
  { terms: ['pula', 'sugi', 'muie', 'pizda', 'fmm', 'plm', 'injur'], add: ['jigniri', 'insulte', 'limbaj', 'vulgar'] },
  { terms: ['spam', 'flood'], add: ['spam', 'mesaj', 'repetat'] },
  { terms: ['hack', 'cheat', 'autoclick', 'xray'], add: ['hack', 'cheating', 'interzis'] },
  { terms: ['reclama', 'server', 'promov'], add: ['reclama', 'promovarea', 'comunitatilor'] },
  { terms: ['cont', 'account', 'impart', 'partaj', 'share'], add: ['conturilor', 'impartirea', 'vanzarea', 'jucatori'] },
  { terms: ['scam', 'teapa', 'insel', 'trade', 'tranzact', 'comert', 'vanz'], add: ['scam', 'comert', 'tranzactiile', 'intermediar'] }
];

function tokens(value) {
  return [...new Set(value.toLocaleLowerCase('ro-RO').normalize('NFD').replace(/[\u0300-\u036f]/gu, '').match(/[a-z0-9/]{2,}/gu)?.filter((word) => !stopWords.has(word)) || [])];
}

function clientIp(request) {
  return request.headers['x-forwarded-for']?.split(',')[0].trim() || request.socket.remoteAddress || 'unknown';
}

function takeRateLimit(ip) {
  const now = Date.now();
  const entry = requests.get(ip) || { minute: [], day: [] };
  entry.minute = entry.minute.filter((time) => time > now - 60_000);
  entry.day = entry.day.filter((time) => time > now - 86_400_000);
  if (entry.minute.length >= maxMinute || entry.day.length >= maxDay) return false;
  entry.minute.push(now);
  entry.day.push(now);
  requests.set(ip, entry);
  return true;
}

function relevantDocuments(question) {
  const normalizedQuestion = question.toLocaleLowerCase('ro-RO').normalize('NFD').replace(/[\u0300-\u036f]/gu, '');
  const asksAboutClients = /\b(client|clienti|clientilor|donator|donatori|premium)\b/u.test(normalizedQuestion);
  const queryTokens = tokens(question);
  for (const expansion of queryExpansions) {
    if (expansion.terms.some((term) => normalizedQuestion.includes(term))) queryTokens.push(...expansion.add);
  }
  return index.map((document) => {
    const haystack = `${document.title} ${document.content}`.toLocaleLowerCase('ro-RO').normalize('NFD').replace(/[\u0300-\u036f]/gu, '');
    const title = document.title.toLocaleLowerCase('ro-RO').normalize('NFD').replace(/[\u0300-\u036f]/gu, '');
    const score = queryTokens.reduce((sum, token) => {
      const escaped = token.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
      const exact = haystack.match(new RegExp(`\\b${escaped}\\b`, 'gu'))?.length || 0;
      const titleExact = title.match(new RegExp(`\\b${escaped}\\b`, 'gu'))?.length || 0;
      const stem = token.length >= 5 ? token.slice(0, 4).replace(/[.*+?^${}()|[\]\\]/gu, '\\$&') : '';
      const related = stem ? haystack.match(new RegExp(`\\b${stem}[a-z]*\\b`, 'gu'))?.length || 0 : 0;
      const titleRelated = stem ? title.match(new RegExp(`\\b${stem}[a-z]*\\b`, 'gu'))?.length || 0 : 0;
      return sum + exact + titleExact * 4 + related + titleRelated * 4;
    }, 0)
      + (haystack.includes(question.toLocaleLowerCase('ro-RO')) ? 8 : 0);
    const isClientOnly = /regulament clienti|clientilor le este|clientiilor le este/iu.test(`${document.title} ${document.content}`.normalize('NFD').replace(/[\u0300-\u036f]/gu, ''));
    return { ...document, score: score - (!asksAboutClients && isClientOnly ? 20 : 0) };
  }).filter((document) => document.score > 0).sort((a, b) => b.score - a.score).slice(0, 5);
}

async function selectRelevantDocuments(question) {
  if (!process.env.GROQ_API_KEY) return relevantDocuments(question);
  const prompt = `Ești un motor de căutare semantică pentru regulamentul MC-1ST. Alege secțiunile care răspund direct la întrebare, chiar dacă utilizatorul folosește sinonime, forme gramaticale diferite sau limbaj colocvial. Nu răspunde la întrebare. Returnează EXCLUSIV JSON valid: {"sections":["id-1","id-2"]}. Alege între 1 și 6 id-uri numai din catalog. Dacă niciuna nu este relevantă, returnează {"sections":[]}.\n\nCATALOG:\n${sectionCatalog()}\n\nÎNTREBARE:\n${question}`;
  try {
    const selectionResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({ model, temperature: 0, reasoning_effort: 'low', max_completion_tokens: 500, messages: [{ role: 'user', content: prompt }] })
    });
    if (!selectionResponse.ok) throw new Error(`Groq selector ${selectionResponse.status}`);
    const payload = await selectionResponse.json();
    const selectedIds = parseModelJson(payload.choices?.[0]?.message?.content).sections;
    if (!Array.isArray(selectedIds)) throw new Error('Selector fără secțiuni.');
    const selected = [...new Set(selectedIds.filter((id) => typeof id === 'string'))]
      .map((id) => index.find((document) => document.id === id))
      .filter(Boolean)
      .slice(0, 6);
    return selected.length ? selected : relevantDocuments(question);
  } catch (error) {
    console.error(`Semantic selector fallback: ${error.message}`);
    return relevantDocuments(question);
  }
}

function send(response, status, body) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  response.end(JSON.stringify(body));
}

function parseModelJson(content) {
  const json = String(content || '').trim().match(/\{[\s\S]*\}/u)?.[0];
  if (!json) throw new Error('Modelul nu a returnat JSON.');
  return JSON.parse(json);
}

async function readJson(request) {
  let body = '';
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 16_000) throw new Error('Cererea este prea mare.');
  }
  return JSON.parse(body || '{}');
}

async function readBody(request) {
  let body = '';
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 1_000_000) throw new Error('Payload-ul webhookului este prea mare.');
  }
  return body;
}

function validWebhookSignature(body, signature) {
  if (!webhookSecret || typeof signature !== 'string' || !signature.startsWith('sha256=')) return false;
  const expected = Buffer.from(`sha256=${createHmac('sha256', webhookSecret).update(body).digest('hex')}`);
  const received = Buffer.from(signature);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

async function syncRulesRepository() {
  await execFileAsync('/usr/bin/git', ['pull', '--ff-only', 'origin', 'main'], { cwd: projectRoot, timeout: 60_000 });
  await execFileAsync(process.execPath, [resolve(import.meta.dirname, 'build-index.mjs')], { cwd: projectRoot, timeout: 60_000 });
  await loadIndex();
}

async function askGroq(question, sources) {
  if (!process.env.GROQ_API_KEY) throw new Error('Serviciul nu este configurat încă.');
  const context = sources.map((source, number) => `[S${number + 1}] ${source.title}\nURL: ${publicRulesUrl}${source.url}\n${source.content}`).join('\n\n');
  const prompt = [
    'Ești asistentul oficial al regulamentului MC-1ST. Răspunzi numai pe baza tuturor surselor MDX incluse mai jos.',
    'Analizează întrebarea după sens, nu doar după cuvintele exacte. Înțelege sinonime, greșeli de scriere, exprimări colocviale, argou, formulări indirecte și limbaj vulgar.',
    'Leagă fiecare situație de toate regulile relevante. De exemplu, o insultă vulgară adresată mamei unui jucător în chat este o jignire/insultă și poate fi și toxicitate; alege regula și sancțiunea pentru canalul menționat.',
    'Identifică mai întâi contextul: Minecraft, Discord, staff, clienți/donatori, scam/comerț sau informații generale. Dacă utilizatorul nu precizează canalul, folosește regula generală aplicabilă și menționează presupunerea.',
    'Nu folosi cunoștințe din afara regulamentului, nu inventa sancțiuni și nu transforma o regulă într-o interdicție mai largă decât scrie în sursă.',
    'Dacă există o regulă relevantă, răspunde concret: ce comportament descrie întrebarea, dacă este permis, sancțiunea exactă și explicația pe scurt. Dacă mai multe reguli se aplică, menționează-le pe toate și indică sancțiunea fiecăreia.',
    'Folosește răspunsul de necunoaștere numai când nicio sursă nu acoperă în mod rezonabil situația. Nu spune că nu există regulă doar pentru că formularea utilizatorului diferă de titlul regulii.',
    'Returnează EXCLUSIV JSON valid în forma {"answer":"...","sanction":"...","sources":[1]}. `sources` trebuie să conțină numerele tuturor secțiunilor care susțin răspunsul și numai numere valide din sursele de mai jos. Scrie concis, clar și natural în română.',
    'SURSELE COMPLETE ALE REGULAMENTULUI:',
    context
  ].join('\n\n');
  const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({ model, temperature: 0, reasoning_effort: reasoningEffort, max_completion_tokens: 1200, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: prompt }, { role: 'user', content: question }] })
  });
  if (!groqResponse.ok) {
    const details = (await groqResponse.text()).slice(0, 500);
    throw new Error(`Groq a răspuns cu eroarea ${groqResponse.status}: ${details}`);
  }
  const payload = await groqResponse.json();
  const answer = parseModelJson(payload.choices?.[0]?.message?.content);
  const sourceNumbers = Array.isArray(answer.sources) ? [...new Set(answer.sources.filter((number) => Number.isInteger(number) && number >= 1 && number <= sources.length))] : [];
  if (!answer.answer) return noRuleResponse;
  const verifiedNumbers = sourceNumbers.length ? sourceNumbers : [1];
  const citedSources = verifiedNumbers.map((number) => ({ title: sources[number - 1].title, url: `${publicRulesUrl}${sources[number - 1].url}` }));
  return { answer: String(answer.answer), sanction: String(answer.sanction || 'Regulamentul nu precizează o sancțiune exactă.'), sources: citedSources.filter((source, position) => citedSources.findIndex((candidate) => candidate.url === source.url) === position) };
}

async function loadIndex() {
  index = JSON.parse(await readFile(indexFile, 'utf8')).documents;
  console.log(`Loaded ${index.length} rule sections.`);
}

await loadIndex();
createServer(async (request, response) => {
  const requestOrigin = request.headers.origin;
  if (requestOrigin === origin) response.setHeader('access-control-allow-origin', origin);
  response.setHeader('vary', 'Origin');
  if (request.method === 'OPTIONS') {
    if (requestOrigin !== origin) return send(response, 403, { error: 'Origin nepermis.' });
    response.writeHead(204, { 'access-control-allow-methods': 'POST, OPTIONS', 'access-control-allow-headers': 'content-type', 'access-control-max-age': '86400' });
    return response.end();
  }
  if (request.method === 'GET' && request.url === '/health') return send(response, 200, { ok: true, indexedSections: index.length, configured: Boolean(process.env.GROQ_API_KEY) });
  if (request.method === 'POST' && request.url === '/admin/reload') {
    try {
      const body = await readBody(request);
      if (!validWebhookSignature(body, request.headers['x-hub-signature-256'])) return send(response, 401, { error: 'Semnătură webhook invalidă.' });
      const payload = JSON.parse(body || '{}');
      if (payload.ref && payload.ref !== 'refs/heads/main') return send(response, 202, { ok: true, ignored: true });
      await syncRulesRepository();
      return send(response, 200, { ok: true, indexedSections: index.length });
    } catch (error) {
      console.error(`Webhook reload failed: ${error.message}`);
      return send(response, 500, { error: 'Sincronizarea regulamentului a eșuat.' });
    }
  }
  if (request.method !== 'POST' || request.url !== '/chat') return send(response, 404, { error: 'Negăsit.' });
  if (requestOrigin !== origin) return send(response, 403, { error: 'Origin nepermis.' });
  if (!takeRateLimit(clientIp(request))) return send(response, 429, { error: 'Ai atins temporar limita de întrebări. Încearcă mai târziu.' });
  try {
    const { question } = await readJson(request);
    if (typeof question !== 'string' || question.trim().length < 3 || question.length > 1000) return send(response, 400, { error: 'Întrebarea trebuie să aibă între 3 și 1000 de caractere.' });
    const sources = index;
    if (sources.length === 0) return send(response, 200, noRuleResponse);
    return send(response, 200, await askGroq(question.trim(), sources));
  } catch (error) {
    console.error(error);
    return send(response, 502, { error: error.message === 'Serviciul nu este configurat încă.' ? error.message : 'Nu am putut genera răspunsul acum. Încearcă din nou.' });
  }
}).listen(port, '127.0.0.1', () => console.log(`Rules chatbot listens only on 127.0.0.1:${port}`));
