import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const directory = path.resolve(root, "../Tuvung/HSK_markdown");
const reference = JSON.parse(readFileSync(path.join(root, ".sites-runtime/hsk-lookup.json"), "utf8"));
const dictionary = new Map(reference.map((entry) => [entry.s.normalize("NFKC"), entry]));
const firstSeen = new Set();
const result = [];
for (let level = 1; level <= 6; level++) {
  const text = readFileSync(path.join(directory, `HSK${level}.md`), "utf8");
  const matcher = level <= 4 ? /【([^】]+)】/g : /^\s*\d+\s+([^\s]+)\s+/gm;
  for (const match of text.matchAll(matcher)) {
    const hanzi = match[1].normalize("NFKC").trim();
    if (firstSeen.has(hanzi)) continue;
    firstSeen.add(hanzi);
    const entry = dictionary.get(hanzi);
    const form = entry?.f?.find((item) => item.i?.y && item.m?.length);
    if (!form) continue;
    result.push({ id: `${level}-${hanzi}`, level, hanzi, pinyin: form.i.y,
      meaning: form.m[0], topic: "Từ vựng mở rộng", example: "", translation: "", meaningLanguage: "en" });
  }
}
writeFileSync(path.join(root, "lib/vocabulary-extra.json"), JSON.stringify(result));
console.log(JSON.stringify({ total: result.length, levels: Array.from({length:6}, (_,i) => result.filter(word => word.level === i + 1).length) }));
