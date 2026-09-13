const stopWords = new Set('a ai ale al am an asta acest aceasta ca care ce cu daca de din e este eu fi in la mai mi nu o pe pentru sa sau se si sunt te un unei unor'.split(' '));

const queryExpansions = [
  { terms: ['fut', 'fute', 'futut', 'pula', 'sugi', 'muie', 'pizda', 'cur', 'cacat', 'injur', 'jign', 'vulgar'], add: ['jigniri', 'insulte', 'limbaj', 'vulgar', 'toxicitate'] },
  { terms: ['spam', 'flood', 'deranj'], add: ['spam', 'mesaj', 'repetat'] },
  { terms: ['hack', 'cheat', 'autoclick', 'xray', 'x-ray', 'screenshare'], add: ['hack', 'cheating', 'interzis', 'control'] },
  { terms: ['reclama', 'server', 'promov'], add: ['reclama', 'promovarea', 'comunitatilor'] },
  { terms: ['cont', 'account', 'impart', 'partaj', 'share', 'fratele', 'prieten'], add: ['conturilor', 'impartirea', 'vanzarea', 'jucatori'] },
  { terms: ['scam', 'teapa', 'insel', 'trade', 'tranzact', 'comert', 'vanz'], add: ['scam', 'comert', 'tranzactiile', 'intermediar'] },
  { terms: ['staff', 'admin', 'moderator', 'comanda', 'abuz'], add: ['staff', 'abuz', 'comenzi', 'sanctiuni'] }
];

function normalize(value) {
  return value.toLocaleLowerCase('ro-RO').normalize('NFD').replace(/[\u0300-\u036f]/gu, '');
}

function tokens(value) {
  return [...new Set(normalize(value).match(/[a-z0-9/]{2,}/gu)?.filter((word) => !stopWords.has(word)) || [])];
}

function rankDocuments(question, documents) {
  const normalizedQuestion = normalize(question);
  const queryTokens = tokens(question);
  for (const expansion of queryExpansions) {
    if (expansion.terms.some((term) => normalizedQuestion.includes(term))) queryTokens.push(...expansion.add);
  }
  return documents.map((document, originalIndex) => {
    const haystack = normalize(document.content || '');
    const title = normalize(document.title || '');
    const score = [...new Set(queryTokens)].reduce((sum, token) => {
      const escaped = token.replace(/[.*+?^\${}()|[\]\\]/gu, '\\$&');
      const exact = haystack.match(new RegExp('\\\\b' + escaped + '\\\\b', 'gu'))?.length || 0;
      const titleExact = title.match(new RegExp('\\\\b' + escaped + '\\\\b', 'gu'))?.length || 0;
      const stem = token.length >= 5 ? token.slice(0, 4).replace(/[.*+?^\${}()|[\]\\]/gu, '\\$&') : '';
      const related = stem ? haystack.match(new RegExp('\\\\b' + stem + '[a-z]*\\\\b', 'gu'))?.length || 0 : 0;
      const titleRelated = stem ? title.match(new RegExp('\\\\b' + stem + '[a-z]*\\\\b', 'gu'))?.length || 0 : 0;
      return sum + exact + titleExact * 8 + related + titleRelated * 8;
    }, 0);
    const categoryBoost = normalizedQuestion.match(/fut|fute|futut|pula|sugi|muie|pizda|injur|jign|vulgar/gu)
      ? (title.match(/jign|insult|limbaj|vulgar|toxic/gu)?.length || 0) * 20
      : 0;
    return { ...document, score: score + categoryBoost, _originalIndex: originalIndex };
  }).sort((a, b) => b.score - a.score || a._originalIndex - b._originalIndex)
    .map(({ _originalIndex, ...document }) => document);
}

export { normalize, tokens, rankDocuments };
