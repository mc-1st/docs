import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve, relative, extname, dirname, basename, join } from 'node:path';

const projectRoot = resolve(import.meta.dirname, '..');
const outputFile = resolve(import.meta.dirname, 'data/documents.json');

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const file = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (['.git', 'node_modules', 'chatbot', 'sources'].includes(entry.name)) return [];
      return walk(file);
    }
    return entry.isFile() && extname(entry.name) === '.mdx' ? [file] : [];
  }));
  return files.flat();
}

function cleanMdx(text) {
  return text
    .replace(/^---[\s\S]*?---\s*/u, '')
    .replace(/<\/?(?:Note|Warning|Tip)>/gu, '')
    .replace(/<Card\s+title="([^"]+)"[^>]*>/gu, '\n## $1\n')
    .replace(/<\/?(?:AccordionGroup|Accordion)[^>]*>/gu, '\n')
    .replace(/<[^>]+>/gu, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/gu, '$1')
    .replace(/[`*_]/gu, '')
    .replace(/\r/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function titleFromFrontmatter(text, fallback) {
  const match = text.match(/^---[\s\S]*?^title:\s*["']?([^\n"']+)/mu);
  return match?.[1]?.trim() || fallback;
}

function pageUrl(file) {
  const path = relative(projectRoot, file).replace(/\\/g, '/').replace(/\.mdx$/u, '');
  return path === 'index' ? '/' : `/${path}`;
}

function chunksFor(text) {
  const parts = text.split(/(?=^#{1,2}\s)/mu).map((part) => part.trim()).filter(Boolean);
  return parts.flatMap((part) => {
    const heading = part.match(/^#{1,2}\s+(.+)$/mu)?.[1]?.trim() || '';
    if (part.length <= 1800) return [{ heading, content: part }];
    const paragraphs = part.split(/\n\n+/u);
    const chunks = [];
    let current = '';
    for (const paragraph of paragraphs) {
      if ((current + '\n\n' + paragraph).length > 1800 && current) {
        chunks.push({ heading, content: current });
        current = '';
      }
      current = current ? `${current}\n\n${paragraph}` : paragraph;
    }
    if (current) chunks.push({ heading, content: current });
    return chunks;
  });
}

const files = await walk(projectRoot);
const documents = [];
for (const file of files) {
  const raw = await readFile(file, 'utf8');
  const title = titleFromFrontmatter(raw, basename(file, '.mdx'));
  const url = pageUrl(file);
  for (const [index, chunk] of chunksFor(cleanMdx(raw)).entries()) {
    const sectionTitle = chunk.heading ? `${title} — ${chunk.heading}` : title;
    documents.push({ id: `${url}#${index + 1}`, title: sectionTitle, url, content: chunk.content });
  }
}

await mkdir(dirname(outputFile), { recursive: true });
await writeFile(outputFile, JSON.stringify({ generatedAt: new Date().toISOString(), documents }, null, 2) + '\n');
console.log(`Indexed ${documents.length} rule sections from ${files.length} pages.`);
