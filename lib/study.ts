import { grammar, words, type Word } from "./content";
export type Review = {
  stage: number;
  due: number;
  reviews: number;
  learned: boolean;
};
export type Question = {
  id: string;
  kind: "vocab" | "grammar" | "listening";
  prompt: string;
  pinyin?: string;
  audio?: string;
  options: string[];
  answer: number;
  explanation: string;
  wordId?: string;
};
export type Result = {
  id: string;
  level: number;
  date: string;
  correct: number;
  total: number;
  seconds: number;
  questions: Question[];
  answers: Record<number, number>;
};
export type StudyState = {
  version: 1;
  level: number;
  theme: "light" | "dark";
  goal: number;
  progress: Record<string, Review>;
  favorites: string[];
  activity: Record<string, number>;
  history: Result[];
};
export const STORAGE_KEY = "hsk-master-study-v1";
export const initialState: StudyState = {
  version: 1,
  level: 1,
  theme: "light",
  goal: 10,
  progress: {},
  favorites: [],
  activity: {},
  history: [],
};
export function dateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[\s'’]/g, "");
}
export function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function reviewWord(
  state: StudyState,
  id: string,
  known: boolean,
  now = new Date(),
): StudyState {
  const previous = state.progress[id];
  const stage = known ? Math.min((previous?.stage || 0) + 1, 5) : 0;
  const delay = known ? [0, 1, 3, 7, 14, 30][stage] * 86400000 : 600000;
  const today = dateKey(now);
  return {
    ...state,
    progress: {
      ...state.progress,
      [id]: {
        stage,
        due: now.getTime() + delay,
        reviews: (previous?.reviews || 0) + 1,
        learned: known,
      },
    },
    activity: { ...state.activity, [today]: (state.activity[today] || 0) + 1 },
  };
}
export function streak(activity: Record<string, number>, now = new Date()) {
  const day = new Date(now);
  if (!activity[dateKey(day)]) day.setDate(day.getDate() - 1);
  let count = 0;
  while (activity[dateKey(day)]) {
    count++;
    day.setDate(day.getDate() - 1);
  }
  return count;
}
export function createQuestions(level: number, mode: string): Question[] {
  const pool = words.filter((w) => w.level === level && w.meaning !== "Chưa có nghĩa");
  const grammarCount = grammar.filter((g) => g.level === level).length;
  const vocab = shuffle(pool)
    .slice(0, mode === "mixed" ? Math.max(0, 50 - grammarCount) : 50)
    .map((word): Question => {
      const meanings = [
        ...new Set(
          pool
            .filter(
              (w) =>
                w.meaning !== word.meaning &&
                (w.meaningLanguage || "vi") === (word.meaningLanguage || "vi") &&
                (mode !== "listening" ||
                  normalize(w.pinyin) !== normalize(word.pinyin)),
            )
            .map((w) => w.meaning),
        ),
      ];
      const options = shuffle([word.meaning, ...shuffle(meanings).slice(0, 3)]);
      return {
        id: `q-${word.id}`,
        kind: mode === "listening" ? "listening" : "vocab",
        prompt:
          mode === "listening" ? "Nghe và chọn nghĩa phù hợp" : word.hanzi,
        pinyin: word.pinyin,
        audio: mode === "listening" ? word.hanzi : undefined,
        options,
        answer: options.indexOf(word.meaning),
        explanation: `${word.hanzi} (${word.pinyin}): ${word.meaning}.${word.example ? ` ${word.example} — ${word.translation}` : ""}`,
        wordId: word.id,
      };
    });
  const structures = shuffle(grammar.filter((g) => g.level === level)).map(
    (g): Question => {
      const correct = g.options[g.answer];
      const options = shuffle(g.options);
      return {
        id: `q-${g.id}`,
        kind: "grammar",
        prompt: g.prompt,
        options,
        answer: options.indexOf(correct),
        explanation: `${g.formula}. ${g.explanation} ${g.note}`,
      };
    },
  );
  return shuffle(
    mode === "grammar"
      ? structures
      : mode === "mixed"
        ? [...vocab, ...structures]
        : vocab,
  );
}
// Validate backups and localStorage before the UI reads them.
export function parseState(value: unknown): StudyState {
  if (!value || typeof value !== "object")
    throw new Error("Tệp sao lưu không hợp lệ.");
  const s = value as Record<string, unknown>;
  if (
    s.version !== 1 ||
    !Number.isInteger(s.level) ||
    Number(s.level) < 1 ||
    Number(s.level) > 6 ||
    !["light", "dark"].includes(String(s.theme)) ||
    ![5, 10, 20, 30].includes(Number(s.goal))
  )
    throw new Error("Phiên bản hoặc thiết lập sao lưu không hợp lệ.");
  if (
    !s.progress ||
    typeof s.progress !== "object" ||
    Array.isArray(s.progress) ||
    !s.activity ||
    typeof s.activity !== "object" ||
    Array.isArray(s.activity) ||
    !Array.isArray(s.favorites) ||
    !Array.isArray(s.history)
  )
    throw new Error("Dữ liệu tiến độ không hợp lệ.");
  const ids = new Set(words.map((w) => w.id));
  const progress: Record<string, Review> = {};
  for (const [id, raw] of Object.entries(s.progress)) {
    if (!ids.has(id)) continue;
    const r = raw as Review;
    if (
      !r ||
      !Number.isInteger(r.stage) ||
      r.stage < 0 ||
      r.stage > 5 ||
      !Number.isFinite(r.due) ||
      r.due < 0 ||
      !Number.isInteger(r.reviews) ||
      r.reviews < 0 ||
      typeof r.learned !== "boolean"
    )
      throw new Error("Lịch ôn tập không hợp lệ.");
    progress[id] = {
      stage: r.stage,
      due: r.due,
      reviews: r.reviews,
      learned: r.learned,
    };
  }
  const activity: Record<string, number> = {};
  for (const [date, count] of Object.entries(s.activity)) {
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      typeof count !== "number" ||
      !Number.isInteger(count) ||
      count < 0
    )
      throw new Error("Nhật ký học không hợp lệ.");
    activity[date] = count;
  }
  const history = s.history.slice(0, 100).map((raw): Result => {
    const r = raw as Result;
    if (
      !r ||
      typeof r.id !== "string" ||
      typeof r.date !== "string" ||
      !Number.isFinite(Date.parse(r.date)) ||
      !Number.isInteger(r.level) ||
      r.level < 1 ||
      r.level > 6 ||
      !Number.isInteger(r.correct) ||
      !Number.isInteger(r.total) ||
      r.total < 1 ||
      r.total > 100 ||
      r.correct < 0 ||
      r.correct > r.total ||
      !Number.isFinite(r.seconds) ||
      r.seconds < 0 ||
      !Array.isArray(r.questions) ||
      r.questions.length !== r.total ||
      !r.answers ||
      typeof r.answers !== "object"
    )
      throw new Error("Lịch sử luyện tập không hợp lệ.");
    for (const q of r.questions)
      if (
        !q ||
        typeof q.id !== "string" ||
        !["vocab", "grammar", "listening"].includes(q.kind) ||
        typeof q.prompt !== "string" ||
        typeof q.explanation !== "string" ||
        !Array.isArray(q.options) ||
        q.options.length !== 4 ||
        !q.options.every((o) => typeof o === "string") ||
        !Number.isInteger(q.answer) ||
        q.answer < 0 ||
        q.answer > 3 ||
        (q.audio !== undefined && typeof q.audio !== "string") ||
        (q.pinyin !== undefined && typeof q.pinyin !== "string")
      )
        throw new Error("Câu hỏi sao lưu không hợp lệ.");
    for (const [key, answer] of Object.entries(r.answers))
      if (
        !/^\d+$/.test(key) ||
        Number(key) >= r.total ||
        !Number.isInteger(answer) ||
        answer < 0 ||
        answer > 3
      )
        throw new Error("Đáp án sao lưu không hợp lệ.");
    return r;
  });
  return {
    version: 1,
    level: Number(s.level),
    theme: s.theme as "light" | "dark",
    goal: Number(s.goal),
    progress,
    activity,
    favorites: [
      ...new Set(
        s.favorites.filter(
          (id): id is string => typeof id === "string" && ids.has(id),
        ),
      ),
    ],
    history,
  };
}
export function matches(word: Word, query: string) {
  const q = normalize(query);
  return (
    !q ||
    [word.hanzi, word.pinyin, word.meaning].some((v) =>
      normalize(v).includes(q),
    )
  );
}
