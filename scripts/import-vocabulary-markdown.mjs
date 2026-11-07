import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const directory = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(root, "../Tuvung");
const entries = new Map();
const counts = [];
const value = (text) => text && text !== "—" ? text.normalize("NFKC").trim() : "";

for (let level = 1; level <= 6; level++) {
  const lines = readFileSync(path.join(directory, `HSK${level}.md`), "utf8").split(/\r?\n/);
  let rows = 0;
  for (const line of lines) {
    if (!/^\|\s*\d+\s*\|/.test(line)) continue;
    const columns = line.split("|").slice(1, -1).map((column) => column.trim());
    if (columns.length !== 8) throw new Error(`HSK${level}: dòng ${line.slice(0, 40)} có số cột không hợp lệ`);
    const [, rawHanzi, rawPinyin, rawMeaning, , rawExample, , rawTranslation] = columns;
    const hanzi = value(rawHanzi);
    if (!hanzi) throw new Error(`HSK${level}: thiếu chữ Hán tại dòng ${columns[0]}`);
    const previous = entries.get(hanzi);
    const entry = previous || { id: `${level}-${hanzi}`, level, hanzi };
    const pinyin = value(rawPinyin);
    const meaning = value(rawMeaning);
    const example = value(rawExample);
    const translation = value(rawTranslation);
    if (!entry.pinyin && pinyin) entry.pinyin = pinyin;
    if (!entry.meaning && meaning) entry.meaning = meaning;
    if (!entry.example && example && translation) Object.assign(entry, { example, translation });
    entries.set(hanzi, entry);
    rows++;
  }
  if (!rows) throw new Error(`HSK${level}: không tìm thấy từ vựng`);
  counts.push({ level, rows, unique: entries.size });
}
const output = [...entries.values()];
writeFileSync(path.join(root, "lib/vocabulary-markdown.json"), JSON.stringify(output));
console.log(JSON.stringify({ total: output.length, levels: counts, missingMeanings: output.filter((word) => !word.meaning).length, missingExamples: output.filter((word) => !word.example).length }));
