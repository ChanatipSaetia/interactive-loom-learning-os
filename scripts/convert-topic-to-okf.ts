#!/usr/bin/env node
/**
 * Convert TS topic data → OMF (public/okf/[topic]/) format.
 *
 * Usage: node --experimental-strip-types scripts/convert-topic-to-okf.ts
 *
 * Reads from src/topics/{haystack,motorcycle}/data/
 * Writes to   public/okf/{haystack,motorcycle}/
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// ── Helpers ──────────────────────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function ensureDir(path) {
  if (!existsSync(path)) mkdirSync(path, { recursive: true });
}

function writeFile(relativePath, content) {
  const fullPath = join(ROOT, relativePath);
  ensureDir(dirname(fullPath));
  writeFileSync(fullPath, content + '\n');
  console.log(`  ✓ ${relativePath}`);
}

// ── YAML Dumper ──────────────────────────────────────────────────────────

// Resolve ref() objects to plain strings
function resolveRef(val) {
  if (val && typeof val === 'object' && val._tag === 'ref') return val.id;
  return val;
}

function yamlDump(obj, indent = 0) {
  const pad = '  '.repeat(indent);
  if (obj === null || obj === undefined) return '';
  if (typeof obj === 'string') {
    if (needsQuoting(obj)) return `${pad}${yamlLiteralBlock(obj)}`;
    return `${pad}${obj}`;
  }
  if (typeof obj === 'number') return `${pad}${obj}`;
  if (typeof obj === 'boolean') return `${pad}${obj}`;
  if (Array.isArray(obj)) {
    if (obj.length === 0) return `${pad}[]`;
    return obj.map(item => yamlDumpArrayItem(item, indent)).join('\n');
  }
  if (typeof obj === 'object') {
    // Handle ref() objects
    if (obj._tag === 'ref') {
      return `${pad}${obj.id}`;
    }
    return yamlDumpObject(obj, indent);
  }
  return `${pad}${obj}`;
}

function yamlDumpArrayItem(item, indent) {
  const pad = '  '.repeat(indent);
  if (typeof item === 'string') {
    if (item.includes('\n')) {
      return `${pad}- ${yamlLiteralBlock(item).trimStart()}`;
    }
    return `${pad}- ${needsQuoting(item) ? `"${escapeYamlString(item)}"` : item}`;
  }
  if (typeof item === 'number') return `${pad}- ${item}`;
  if (typeof item === 'boolean') return `${pad}- ${item}`;
  if (typeof item === 'object' && item !== null) {
    const lines = yamlDumpObject(item, indent + 1).split('\n');
    const first = lines[0];
    const rest = lines.slice(1).join('\n');
    const firstContent = first.slice((pad + '  ').length);
    return `${pad}- ${firstContent}\n${rest}`;
  }
  return `${pad}- ${item}`;
}

function yamlDumpObject(obj, indent = 0) {
  const pad = '  '.repeat(indent);
  return Object.entries(obj).map(([key, val]) => {
    // Resolve refs
    val = resolveRef(val);
    if (val === null || val === undefined) return `${pad}${key}: null`;
    if (typeof val === 'string') {
      if (val.includes('\n')) {
        return `${pad}${key}: ${yamlLiteralBlock(val, indent + 1).trimStart()}`;
      }
      return `${pad}${key}: ${needsQuoting(val) ? `"${escapeYamlString(val)}"` : val}`;
    }
    if (typeof val === 'object' && !Array.isArray(val)) {
      // Check if it's a ref object
      if (val._tag === 'ref') {
        return `${pad}${key}: ${val.id}`;
      }
      return `${pad}${key}:\n${yamlDump(val, indent + 1)}`;
    }
    if (Array.isArray(val)) {
      return `${pad}${key}:\n${yamlDump(val, indent + 1)}`;
    }
    return `${pad}${key}: ${val}`;
  }).join('\n');
}

function yamlLiteralBlock(s, indent = 0) {
  const pad = '  '.repeat(indent);
  const lines = s.split('\n');
  if (lines.length <= 1) {
    return `"${escapeYamlString(s)}"`;
  }
  return `|\n${lines.map(l => `${pad}${l}`).join('\n')}`;
}

function needsQuoting(s) {
  if (!s) return false;
  const specials = [':', '#', '{', '}', '[', ']', ',', '&', '*', '?', '|', '-', '<', '>', '=', '!', '%', '@', "'", '"'];
  if (specials.some(ch => s.includes(ch))) return true;
  if (s !== s.trim()) return true;
  if (/^\d+\.?\d*$/.test(s)) return true;
  if (['true', 'false', 'null', 'yes', 'no', 'on', 'off'].includes(s.toLowerCase())) return true;
  return false;
}

function escapeYamlString(s) {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

// ── Converters ───────────────────────────────────────────────────────────

function convertFlowchart(topicId, sectionName, flow, title) {
  const base = `public/okf/${topicId}/sections/${sectionName}`;
  writeFile(`${base}/section.md`, `---\ntype: flowchart\ntitle: "${title}"\nresource: "."\n---`);
  writeFile(`${base}/actors.yaml`, yamlDump(flow.actors || {}));
  writeFile(`${base}/systems.yaml`, yamlDump(flow.systems || {}));
  writeFile(`${base}/steps.yaml`, yamlDump(flow.steps || []));
  writeFile(`${base}/journeys.yaml`, yamlDump(flow.journeys || []));
}

function convertTextSection(topicId, sectionName, title, paragraphs, heading) {
  const base = `public/okf/${topicId}/sections/${sectionName}`;
  const fm = `---\ntype: text\ntitle: "${title}"${heading ? `\nheading: "${heading}"` : ''}\nresource: content.md\n---`;
  writeFile(`${base}/section.md`, fm);
  const content = (paragraphs || []).map(p => p.replace(/^##\s+/m, '')).join('\n\n');
  writeFile(`${base}/content.md`, content);
}

function convertBullets(topicId, sectionName, title, items, ordered = false) {
  const base = `public/okf/${topicId}/sections/${sectionName}`;
  writeFile(`${base}/section.md`, `---\ntype: bullets\ntitle: "${title}"\nordered: ${ordered}\nresource: items.yaml\n---`);
  writeFile(`${base}/items.yaml`, yamlDump(items || []));
}

function convertFlashcards(topicId, sectionName, title, cards) {
  const base = `public/okf/${topicId}/sections/${sectionName}`;
  writeFile(`${base}/section.md`, `---\ntype: flashcards\ntitle: "${title}"\nresource: glossary.yaml\n---`);
  const glossary = (cards || []).map(c => ({
    id: c.id,
    word: c.word,
    pronunciation: c.pronunciation,
    category: c.category,
    shortDefinition: c.shortDefinition,
    detailedDefinition: c.detailedDefinition,
    whyItMatters: c.whyItMatters,
    ...(c.dialogue ? { dialogue: c.dialogue } : {}),
  }));
  writeFile(`${base}/glossary.yaml`, yamlDump(glossary));
}

function convertTaxonomy(topicId, sectionName, title, categories) {
  const base = `public/okf/${topicId}/sections/${sectionName}`;
  writeFile(`${base}/section.md`, `---\ntype: taxonomy-browser\ntitle: "${title}"\nresource: "."\n---`);
  (categories || []).forEach((cat, idx) => {
    // Generate slug: extract Latin text from title, or use subtitle, or fallback
    const titleLatin = cat.title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
    const subtitleLatin = (cat.subtitle || '').toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');

    let slug = subtitleLatin && subtitleLatin.length > 2
      ? subtitleLatin
      : titleLatin && titleLatin.length > 2
        ? titleLatin
        : `${cat.color || 'category'}-${idx + 1}`;

    writeFile(`${base}/${slug}.yaml`, yamlDump({
      type: 'taxonomy-category',
      icon: typeof cat.icon === 'string' ? cat.icon : cat.icon.name || 'Folder',
      title: cat.title,
      subtitle: cat.subtitle || '',
      color: cat.color || 'mauve',
      description: cat.description,
      details: cat.details || '',
      analogy: cat.analogy || '',
      primaryFocus: cat.primaryFocus || '',
      inScope: cat.inScope || [],
      outOfScope: cat.outOfScope || [],
    }));
  });
}

function convertTradeoffs(topicId, sectionName, title, scenarios) {
  const base = `public/okf/${topicId}/sections/${sectionName}`;
  writeFile(`${base}/section.md`, `---\ntype: tradeoff-sandbox\ntitle: "${title}"\nresource: "."\n---`);
  const list = Array.isArray(scenarios) ? scenarios : [scenarios];
  list.forEach(scenario => {
    if (scenario) writeFile(`${base}/${scenario.id}.yaml`, yamlDump(scenario));
  });
}

function generateManifest(topicId, config) {
  const { title, description, tags, sections } = config;
  const indexYaml = `# App metadata for ${topicId} topic bundle
category: "${config.category || 'Uncategorized'}"
tags:
${tags.map(t => `  - ${t}`).join('\n')}`;
  writeFile(`public/okf/${topicId}/index.yaml`, indexYaml);

  const indexMd = `# ${title}\n\n${description}\n\n## Sections\n\n${sections.map(s => {
    const sectionName = s.replace('sections/', '').replace('/section.md', '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    return `* [${sectionName}](${s})`;
  }).join('\n')}`;
  writeFile(`public/okf/${topicId}/index.md`, indexMd);
}

// ── Topic: Haystack ──────────────────────────────────────────────────────

async function convertHaystack() {
  console.log('Converting haystack topic…');

  const { haystackIntroParagraphs, haystackCoreParagraphs, haystackCapabilityBullets } =
    await import('../src/topics/haystack/data/text.ts');
  const { indexingFlow, queryFlow } =
    await import('../src/topics/haystack/data/flow.ts');
  const { HAYSTACK_VOCABULARY } =
    await import('../src/topics/haystack/data/flashcards.ts');
  const { haystackTradeoffScenario } =
    await import('../src/topics/haystack/data/tradeoffs/index.ts');
  const { HAYSTACK_TAXONOMY } =
    await import('../src/topics/haystack/data/taxonomy/index.ts');

  convertTextSection('haystack', 'intro', 'What is Haystack?', haystackIntroParagraphs, 'Modern Search with LLMs');
  convertTextSection('haystack', 'core-concepts', 'Core Concepts', Array.isArray(haystackCoreParagraphs) ? haystackCoreParagraphs : [haystackCoreParagraphs]);
  convertBullets('haystack', 'capabilities', 'Key Capabilities', haystackCapabilityBullets, false);
  convertFlowchart('haystack', 'flowchart-indexing', indexingFlow, 'Indexing Pipeline');
  convertFlowchart('haystack', 'flowchart-query', queryFlow, 'Query Pipeline (RAG)');
  convertTradeoffs('haystack', 'tradeoffs', 'Architecture Trade-offs', [haystackTradeoffScenario]);
  convertTaxonomy('haystack', 'taxonomy', 'Haystack Component Taxonomy', HAYSTACK_TAXONOMY);
  convertFlashcards('haystack', 'flashcards', 'Key Vocabulary', HAYSTACK_VOCABULARY);

  generateManifest('haystack', {
    category: 'Architecture',
    title: 'Haystack 2.x - AI Search Framework',
    description: 'Build search and RAG applications with composable Haystack pipelines',
    tags: ['haystack', 'search', 'rag', 'llm', 'embeddings'],
    sections: [
      'sections/intro/section.md',
      'sections/core-concepts/section.md',
      'sections/capabilities/section.md',
      'sections/flowchart-indexing/section.md',
      'sections/flowchart-query/section.md',
      'sections/tradeoffs/section.md',
      'sections/taxonomy/section.md',
      'sections/flashcards/section.md',
    ],
    related: [
      'sections/flowchart-indexing/actors.yaml',
      'sections/flowchart-indexing/systems.yaml',
      'sections/flowchart-indexing/steps.yaml',
      'sections/flowchart-indexing/journeys.yaml',
      'sections/flowchart-query/actors.yaml',
      'sections/flowchart-query/systems.yaml',
      'sections/flowchart-query/steps.yaml',
      'sections/flowchart-query/journeys.yaml',
      'sections/tradeoffs/haystack-architecture.yaml',
      'sections/taxonomy/offline-etl-processing.yaml',
      'sections/taxonomy/real-time-retrieval.yaml',
      'sections/taxonomy/persistent-storage.yaml',
      'sections/taxonomy/extensibility-layer.yaml',
      'sections/capabilities/items.yaml',
      'sections/flashcards/glossary.yaml',
    ],
  });
}

// ── Topic: Motorcycle ────────────────────────────────────────────────────

async function convertMotorcycle() {
  console.log('Converting motorcycle topic…');

  const { motorcycleIntroParagraphs, motorcycleQuestionsParagraphs } =
    await import('../src/topics/motorcycle/data/text.ts');
  const { maintenanceBullets } =
    await import('../src/topics/motorcycle/data/bullets.ts');
  const { engineFlow, chokeFlow, fuelInjectFlow, brakeFlow } =
    await import('../src/topics/motorcycle/data/flow.ts');
  const { motorcycleFlashcards } =
    await import('../src/topics/motorcycle/data/flashcards.ts');
  const { problemTaxonomy } =
    await import('../src/topics/motorcycle/data/taxonomy.ts');
  const { motorcycleTradeoffs } =
    await import('../src/topics/motorcycle/data/tradeoffs.ts');

  convertTextSection('motorcycle', 'intro', 'รถมอเตอร์ไซค์คืออะไร?', motorcycleIntroParagraphs, 'ความคล่องตัวและความปลอดภัย');
  convertTextSection('motorcycle', 'questions', 'คำถามที่ต้องถามช่าง', motorcycleQuestionsParagraphs);
  convertBullets('motorcycle', 'maintenance', 'การบำรุงรักษาพื้นฐาน', maintenanceBullets, false);
  convertFlowchart('motorcycle', 'flowchart-engine', engineFlow, 'วัฏจักรเครื่องยนต์ 4 จังหวะ');
  convertFlowchart('motorcycle', 'flowchart-choke', chokeFlow, 'ระบบโช้ค (Choke System)');
  convertFlowchart('motorcycle', 'flowchart-fuel-injection', fuelInjectFlow, 'ระบบหัวฉีด (Fuel Injection / EFI)');
  convertFlowchart('motorcycle', 'flowchart-brake', brakeFlow, 'ระบบเบรก (Brake System)');
  convertTradeoffs('motorcycle', 'tradeoffs', 'ทางเลือกและการตัดสินใจ', motorcycleTradeoffs);
  convertTaxonomy('motorcycle', 'taxonomy', 'ปัญหาและระบบมอเตอร์ไซค์', problemTaxonomy);
  convertFlashcards('motorcycle', 'flashcards', 'คำศัพท์สำคัญ', motorcycleFlashcards);

  generateManifest('motorcycle', {
    category: 'Mechanical',
    title: 'รถมอเตอร์ไซค์ (Motorcycle)',
    description: 'เข้าใจส่วนประกอบ การทำงาน และการบำรุงรักษารถมอเตอร์ไซค์',
    tags: ['motorcycle', 'engine', 'mechanical', 'thai'],
    sections: [
      'sections/intro/section.md',
      'sections/questions/section.md',
      'sections/maintenance/section.md',
      'sections/flowchart-engine/section.md',
      'sections/flowchart-choke/section.md',
      'sections/flowchart-fuel-injection/section.md',
      'sections/flowchart-brake/section.md',
      'sections/tradeoffs/section.md',
      'sections/taxonomy/section.md',
      'sections/flashcards/section.md',
    ],
    related: [
      'sections/flowchart-engine/actors.yaml',
      'sections/flowchart-engine/systems.yaml',
      'sections/flowchart-engine/steps.yaml',
      'sections/flowchart-engine/journeys.yaml',
      'sections/flowchart-choke/actors.yaml',
      'sections/flowchart-choke/systems.yaml',
      'sections/flowchart-choke/steps.yaml',
      'sections/flowchart-choke/journeys.yaml',
      'sections/flowchart-fuel-injection/actors.yaml',
      'sections/flowchart-fuel-injection/systems.yaml',
      'sections/flowchart-fuel-injection/steps.yaml',
      'sections/flowchart-fuel-injection/journeys.yaml',
      'sections/flowchart-brake/actors.yaml',
      'sections/flowchart-brake/systems.yaml',
      'sections/flowchart-brake/steps.yaml',
      'sections/flowchart-brake/journeys.yaml',
      'sections/tradeoffs/fuel-system.yaml',
      'sections/tradeoffs/engine-oil.yaml',
      'sections/tradeoffs/tires.yaml',
      'sections/taxonomy/engine-system.yaml',
      'sections/taxonomy/drivetrain.yaml',
      'sections/taxonomy/green-3.yaml',
      'sections/maintenance/items.yaml',
      'sections/flashcards/glossary.yaml',
    ],
  });
}

// ── Main ─────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== TS Data → OMF Converter ===\n');
  await convertHaystack();
  console.log('');
  await convertMotorcycle();
  console.log('\nDone!');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
