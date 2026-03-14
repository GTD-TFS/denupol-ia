import fs from "node:fs";
import path from "node:path";

const referenceBase = "/Users/javierbejarnavarrete/Desktop/DENUPOL codex";
const targetBase = "/Users/javierbejarnavarrete/Desktop/SUPER APPS/DENUPOL codex";

const questionFiles = [
  "question_es.js",
  "question_en.js",
  "question_de.js",
  "question_fr.js",
  "question_it.js",
  "question_ru.js",
  "question_ja.js",
  "question_zh.js"
];

const globalFiles = [
  "global_esp.html",
  "global_en_ui.html",
  "global_de_ui.html",
  "global_fr_ui.html",
  "global_it_ui.html",
  "global_ru_ui.html",
  "global_ja_ui.html",
  "global_zh_ui.html"
];

const globalBlocks = [
  {
    name: "tipo+trUI",
    start: 'const tipo = (qs.get("tipo")||"PATRIMONIO").trim().toUpperCase();',
    end: "function getAllPaises(){",
    expected: "same"
  },
  {
    name: "router",
    start: "function routeFromEntry(st){",
    end: "// =============================\n// Estado wizard",
    expected: "same"
  },
  {
    name: "makeStepEl",
    start: "function makeStepEl(q){",
    end: "function renderWizard(){",
    expected: "same"
  },
  {
    name: "nav",
    start: "function renderWizard(){",
    end: "// =============================\n// Objetos modal",
    expected: "different"
  },
  {
    name: "authors",
    start: "function openAuthors(key){",
    end: "// =============================\n// Guardado / carga",
    expected: "same"
  }
];

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function extractBlock(text, start, end) {
  const startIndex = text.indexOf(start);
  const endIndex = text.indexOf(end, startIndex);
  if (startIndex < 0 || endIndex < 0) return null;
  return text.slice(startIndex, endIndex);
}

function statusIcon(ok) {
  return ok ? "OK " : "ERR";
}

let hasUnexpectedMismatch = false;

console.log("Question files");
for (const file of questionFiles) {
  const ref = read(path.join(referenceBase, file));
  const dst = read(path.join(targetBase, file));
  const same = ref === dst;
  console.log(`${statusIcon(same)} ${file}`);
  if (!same) hasUnexpectedMismatch = true;
}

console.log("\nGlobal blocks");
for (const file of globalFiles) {
  const ref = read(path.join(referenceBase, file));
  const dst = read(path.join(targetBase, file));
  console.log(file);

  for (const block of globalBlocks) {
    const refBlock = extractBlock(ref, block.start, block.end);
    const dstBlock = extractBlock(dst, block.start, block.end);
    const same = refBlock !== null && dstBlock !== null && refBlock === dstBlock;
    const ok = block.expected === "same" ? same : !same;
    const expectation = block.expected === "same" ? "must match" : "expected diff";

    console.log(`  ${statusIcon(ok)} ${block.name} (${expectation})`);

    if (!ok) hasUnexpectedMismatch = true;
    if (refBlock === null || dstBlock === null) hasUnexpectedMismatch = true;
  }
}

if (hasUnexpectedMismatch) {
  console.error("\nTree parity check failed.");
  process.exit(1);
}

console.log("\nTree parity check passed.");
