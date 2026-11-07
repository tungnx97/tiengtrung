"""Import reliable cells from the supplied workbook (requires openpyxl)."""
import json
import re
import sys
import unicodedata
from pathlib import Path

from openpyxl import load_workbook

root = Path(__file__).resolve().parent.parent
source = Path(sys.argv[1]) if len(sys.argv) > 1 else root.parent / 'Tuvung/HSK1- HSK6.xlsx'
book = load_workbook(source, read_only=True, data_only=True)
existing = json.loads((root / 'lib/vocabulary-extra.json').read_text(encoding='utf-8'))
content = (root / 'lib/content.ts').read_text(encoding='utf-8')
known = {word['id'] for word in existing}
for level, block in re.findall(r'\s+(\d): `([\s\S]*?)`[,\n]', content):
    known.update(f'{level}-{line.split("|")[0]}' for line in block.splitlines())

def clean(value):
    return unicodedata.normalize('NFKC', str(value)).strip() if value is not None else ''

patches = []
counts = {}
for level in range(1, 7):
    accepted = 0
    for row in book[f'HSK{level}'].iter_rows(min_row=2, values_only=True):
        if not isinstance(row[0], (int, float)):
            continue
        if level == 1:
            # This sheet has no word-level pronunciation or meaning.
            continue
        if level == 4:
            # Column B repeats 爱情 on most rows; only use column D when it
            # independently matches a word already present at this level.
            hanzi, pinyin, meaning = clean(row[3]), clean(row[2]), clean(row[4])
            if not hanzi or f'{level}-{hanzi}' not in known:
                continue
            pinyin = re.split(r'\s*\[', pinyin)[0].strip()
            example = translation = ''
        else:
            hanzi, pinyin, meaning = clean(row[1]), clean(row[2]), clean(row[3])
            # Excel truncates this entry to 最 although its pinyin and meaning
            # identify 最初. Keep the existing stable ID for the complete word.
            if level == 5 and (hanzi, pinyin, meaning) == ('最', 'zuì chū', 'ban đầu'):
                hanzi = '最初'
            if not hanzi or not meaning:
                continue
            # HSK5 column E repeats the word, not the Chinese example sentence.
            example = clean(row[4]) if level != 5 else ''
            translation = clean(row[6]) if example else ''
        item = {'id': f'{level}-{hanzi}', 'level': level, 'hanzi': hanzi, 'meaning': meaning}
        if pinyin:
            item['pinyin'] = pinyin
        if example:
            item['example'] = example
            item['translation'] = translation
        patches.append(item)
        accepted += 1
    counts[level] = accepted

from collections import Counter
duplicates = {key for key, count in Counter(item['id'] for item in patches).items() if count > 1}
patches = [item for item in patches if item['id'] not in duplicates]
(root / 'lib/vocabulary-workbook.json').write_text(json.dumps(patches, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')

# Reuse complete bilingual examples from the workbook when they contain the
# target word. Do not fabricate Chinese sentences from HSK5's pinyin column.
sentences = []
for level in (2, 3, 6):
    for row in book[f'HSK{level}'].iter_rows(min_row=2, values_only=True):
        if not isinstance(row[0], (int, float)):
            continue
        source_word, example, translation = clean(row[1]), clean(row[4]), clean(row[6])
        if source_word and source_word in example and translation:
            sentences.append((example, translation))
sentences.sort(key=lambda pair: len(pair[0]))
all_words = {item['id']: item for item in existing}
all_words.update({item['id']: item for item in patches})
examples = {}
for item in all_words.values():
    hanzi = item['hanzi']
    # One-character substring matches are often unrelated uses of the word.
    if len(hanzi) < 2:
        continue
    for example, translation in sentences:
        if hanzi in example:
            examples[item['id']] = {'example': example, 'translation': translation}
            break
examples['5-最初'] = {'example': '最初我不明白这个问题。', 'translation': 'Ban đầu tôi không hiểu vấn đề này.'}
(root / 'lib/vocabulary-examples.json').write_text(json.dumps(examples, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
print(json.dumps({'imported': len(patches), 'levels': {level: sum(item['level'] == level for item in patches) for level in counts}, 'ambiguous_ids': sorted(duplicates), 'matched_examples': len(examples)}, ensure_ascii=False))
