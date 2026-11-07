"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  Bookmark,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock3,
  Download,
  ExternalLink,
  Flame,
  GraduationCap,
  Headphones,
  Layers3,
  LayoutDashboard,
  Lightbulb,
  List,
  Moon,
  RotateCcw,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
  Target,
  Trophy,
  Upload,
  Volume2,
  X,
  FileText,
  CheckCircle2,
  CalendarDays,
  UserRound,
} from "lucide-react";
import { AccountShell } from "@/components/account-shell";
import type { Account } from "@/lib/account-types";
import { grammar, levels, sources, words, type Word } from "@/lib/content";
import {
  createQuestions,
  dateKey,
  initialState,
  matches,
  parseState,
  reviewWord,
  shuffle,
  STORAGE_KEY,
  streak,
  type Question,
  type Result,
  type StudyState,
} from "@/lib/study";

type Tab = "dashboard" | "learn" | "exam" | "sources";
type Mode = "flashcard" | "list" | "grammar";
const EXAM_SECONDS = 30 * 60;
const tips = [
  {
    title: "Học trong ngữ cảnh",
    text: "Đừng chỉ nhớ một từ riêng lẻ. Hãy đọc to câu ví dụ, rồi thay một chi tiết bằng câu chuyện của chính bạn.",
    label: "Ghi nhớ từ vựng",
  },
  {
    title: "Nhớ trước, xem sau",
    text: "Thử tự nhớ nghĩa trước khi lật thẻ. Đánh dấu “Cần học lại” khi chưa chắc để từ đó sớm trở lại trong lịch ôn.",
    label: "Ôn tập chủ động",
  },
  {
    title: "Lắng nghe thanh điệu",
    text: "Đọc chậm từng âm tiết, chú ý thanh điệu rồi nói lại cả câu. Giọng đọc của thiết bị là công cụ hỗ trợ luyện nghe.",
    label: "Phát âm & nghe",
  },
  {
    title: "Một chút, mỗi ngày",
    text: "Dành 10 phút học đều mỗi ngày. Kết hợp từ mới, ôn từ cũ và tự viết một câu với cấu trúc vừa học.",
    label: "Thói quen học tập",
  },
];
const navShort: Record<Tab, string> = {
  dashboard: "Tổng quan",
  learn: "Học tập",
  exam: "Luyện tập",
  sources: "Tài liệu",
};
const nav = [
  { id: "dashboard" as Tab, label: "Tổng quan", icon: LayoutDashboard },
  { id: "learn" as Tab, label: "Từ vựng & Ngữ pháp", icon: BookOpen },
  { id: "exam" as Tab, label: "Luyện tập HSK", icon: FileText },
  { id: "sources" as Tab, label: "Thư viện tài liệu", icon: Layers3 },
];
function Progress({
  value,
  className = "",
}: {
  value: number;
  className?: string;
}) {
  return (
    <div className={`progress ${className}`}>
      <span style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}
function timeLabel(seconds: number) {
  return `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
}
function Empty({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty">
      <BookOpen size={32} />
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}
function download(name: string, data: string, type = "application/json") {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function Home() {
  return (
    <AccountShell>
      {({ account, openAccount }) => (
        <StudyDashboard
          key={account.id}
          account={account}
          onOpenAccount={openAccount}
        />
      )}
    </AccountShell>
  );
}

function StudyDashboard({
  account,
  onOpenAccount,
}: {
  account: Account;
  onOpenAccount: () => void;
}) {
  const accountStorageKey = `${STORAGE_KEY}:${account.id}`;
  const [state, setState] = useState<StudyState>(initialState);
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState<number | null>(null);
  const [tab, setTab] = useState<Tab>("dashboard");
  const [mode, setMode] = useState<Mode>("flashcard");
  const [toast, setToast] = useState("");
  const [tip, setTip] = useState(0);
  const [settings, setSettings] = useState(false);
  const [pendingImport, setPendingImport] = useState<StudyState | null>(null);
  const [search, setSearch] = useState("");
  const [topic, setTopic] = useState("all");
  const [filter, setFilter] = useState("all");
  const [deck, setDeck] = useState<Word[]>(words.filter((w) => w.level === 1));
  const [card, setCard] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [sessionReviews, setSessionReviews] = useState(0);
  const [deckFinished, setDeckFinished] = useState(false);
  const [showPinyin, setShowPinyin] = useState(true);
  const [examMode, setExamMode] = useState("mixed");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  const [feedbackPending, setFeedbackPending] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [examStatus, setExamStatus] = useState<"intro" | "active" | "result">(
    "intro",
  );
  const [remaining, setRemaining] = useState(EXAM_SECONDS);
  const [examLevel, setExamLevel] = useState(1);
  const [result, setResult] = useState<Result | null>(null);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const startedAt = useRef(0);
  const submitted = useRef(false);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const persistError = useRef(false);
  const modalOpen = settings || !!pendingImport || submitOpen || exitOpen;

  useEffect(() => () => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
  }, []);

  useEffect(() => {
    try {
      const saved =
        localStorage.getItem(accountStorageKey) ||
        (account.username === "tungnx"
          ? localStorage.getItem(STORAGE_KEY)
          : null);
      if (saved) {
        const parsed = parseState(JSON.parse(saved));
        setState(parsed);
        setDeck(words.filter((w) => w.level === parsed.level));
      }
    } catch {
      setToast(
        "Không đọc được tiến độ cũ. Bạn có thể khôi phục bằng tệp sao lưu.",
      );
    }
    setReady(true);
  }, [accountStorageKey, account.username]);
  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!ready) return;
    document.documentElement.dataset.theme = state.theme;
    try {
      localStorage.setItem(accountStorageKey, JSON.stringify(state));
    } catch {
      if (!persistError.current) {
        persistError.current = true;
        setToast(
          "Trình duyệt không lưu được tiến độ. Hãy xuất bản sao lưu trong Cài đặt.",
        );
      }
    }
  }, [state, ready, accountStorageKey]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 5000);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    if (examStatus !== "active") return;
    const timer = setInterval(
      () =>
        setRemaining(
          Math.max(
            0,
            EXAM_SECONDS - Math.floor((Date.now() - startedAt.current) / 1000),
          ),
        ),
      1000,
    );
    return () => clearInterval(timer);
  }, [examStatus]);
  useEffect(() => {
    if (examStatus === "active" && remaining === 0) finishExam();
  }, [remaining, examStatus]); // deadline uses the same submit path
  useEffect(() => {
    if (!modalOpen) return;
    const previous = document.activeElement as HTMLElement;
    const timer = setTimeout(
      () =>
        modalRef.current
          ?.querySelector<HTMLElement>("button,input,select")
          ?.focus(),
      0,
    );
    function trap(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setSettings(false);
        setPendingImport(null);
        setSubmitOpen(false);
        setExitOpen(false);
      }
      if (e.key === "Tab") {
        const controls = Array.from(
          modalRef.current?.querySelectorAll<HTMLElement>(
            "button,input,select,a[href]",
          ) || [],
        ).filter((x) => !x.hasAttribute("disabled"));
        const first = controls[0],
          last = controls.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }
    document.addEventListener("keydown", trap);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", trap);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [modalOpen]);
  useEffect(() => {
    function key(e: KeyboardEvent) {
      if (
        modalOpen ||
        tab !== "learn" ||
        mode !== "flashcard" ||
        deckFinished ||
        !deck.length
      )
        return;
      const target = e.target as HTMLElement;
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || target.closest("input,textarea,select,[contenteditable='true'],[role='textbox']"))
        return;
      if (e.code === "Space") {
        if (target.closest("button,a")) return;
        e.preventDefault();
        setFlipped((v) => !v);
      }
      if (e.code === "ArrowRight" || e.code === "ArrowLeft") {
        e.preventDefault();
        moveCard(e.code === "ArrowRight" ? 1 : -1);
      }
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [modalOpen, tab, mode, deckFinished, deck, card]);

  const currentWords = words.filter((w) => w.level === state.level);
  const calendarDate = now === null ? new Date(2026, 0, 5) : new Date(now);
  const today = dateKey(calendarDate);
  const learned = currentWords.filter(
    (w) => state.progress[w.id]?.learned,
  ).length;
  const due = currentWords.filter(
    (w) => state.progress[w.id] && state.progress[w.id].due <= (now ?? 0),
  );
  const todayCount = state.activity[today] || 0;
  const average = state.history.length
    ? Math.round(
        state.history.reduce((sum, r) => sum + (r.correct / r.total) * 100, 0) /
          state.history.length,
      )
    : 0;
  const topics = [...new Set(currentWords.map((w) => w.topic))];
  const filtered = currentWords.filter(
    (w) =>
      matches(w, search) &&
      (topic === "all" || w.topic === topic) &&
      (filter === "all" ||
        (filter === "saved" && state.favorites.includes(w.id)) ||
        (filter === "learned" && state.progress[w.id]?.learned) ||
        (filter === "new" && !state.progress[w.id]) ||
        (filter === "due" &&
          state.progress[w.id] &&
          state.progress[w.id].due <= (now ?? 0))),
  );
  const activeWord = deck[card];
  const dailyWord =
    currentWords[
      now === null ? 0 : (calendarDate.getDate() - 1) % currentWords.length
    ];
  const week = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(calendarDate);
    date.setDate(date.getDate() - 6 + i);
    return {
      date: dateKey(date),
      label: ["CN", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"][
        date.getDay()
      ],
      count: state.activity[dateKey(date)] || 0,
    };
  });
  function go(next: Tab) {
    setTab(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function startLearning(items = currentWords) {
    setDeck(items);
    setCard(0);
    setFlipped(false);
    setDeckFinished(false);
    setSessionReviews(0);
    setMode("flashcard");
    go("learn");
  }
  function changeLevel(level: number) {
    setState((s) => ({ ...s, level }));
    setSearch("");
    setTopic("all");
    setFilter("all");
    setDeck(words.filter((w) => w.level === level));
    setCard(0);
    setFlipped(false);
    setDeckFinished(false);
    setSessionReviews(0);
    if (examStatus !== "active") setExamStatus("intro");
  }
  function moveCard(direction: number) {
    setCard((c) => (c + direction + deck.length) % deck.length);
    setFlipped(false);
  }
  function rate(known: boolean) {
    if (!activeWord) return;
    setState((s) => reviewWord(s, activeWord.id, known));
    setSessionReviews((c) => c + 1);
    setFlipped(false);
    if (card + 1 >= deck.length) setDeckFinished(true);
    else setCard((c) => c + 1);
  }
  function favorite(id: string) {
    setState((s) => ({
      ...s,
      favorites: s.favorites.includes(id)
        ? s.favorites.filter((x) => x !== id)
        : [...s.favorites, id],
    }));
  }
  function speak(text: string) {
    if (!("speechSynthesis" in window)) {
      setToast(
        "Trình duyệt này chưa hỗ trợ giọng đọc. Hãy thử Chrome hoặc Edge.",
      );
      return;
    }
    const voices = window.speechSynthesis.getVoices();
    const chinese =
      voices.find((v) => /^zh[-_]CN/i.test(v.lang)) ||
      voices.find((v) => /^zh/i.test(v.lang));
    if (!chinese) {
      setToast(
        "Thiết bị chưa có giọng đọc tiếng Trung. Hãy cài giọng zh-CN trong hệ điều hành.",
      );
      return;
    }
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(text);
    speech.voice = chinese;
    speech.lang = "zh-CN";
    speech.rate = 0.8;
    speech.onerror = () =>
      setToast("Chưa phát được âm thanh. Hãy kiểm tra giọng đọc của thiết bị.");
    window.speechSynthesis.speak(speech);
  }
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.getVoices();
    return () => window.speechSynthesis.cancel();
  }, []);
  function startExam() {
    if (examMode === "listening" && (!("speechSynthesis" in window) || !window.speechSynthesis.getVoices().some((voice) => /^zh/i.test(voice.lang)))) {
      setToast("Thiết bị chưa có giọng đọc tiếng Trung. Hãy cài giọng zh-CN hoặc chọn bài từ vựng.");
      return;
    }
    const qs = createQuestions(state.level, examMode);
    submitted.current = false;
    setQuestions(qs);
    setAnswers({});
    setRevealed({});
    setFeedbackPending(false);
    setQuestionIndex(0);
    setRemaining(EXAM_SECONDS);
    setExamLevel(state.level);
    setResult(null);
    startedAt.current = Date.now();
    setExamStatus("active");
  }
  function goToQuestion(index: number) {
    if (index === questionIndex) return;
    if (answers[questionIndex] !== undefined) {
      setRevealed((previous) => ({ ...previous, [questionIndex]: true }));
    }
    setQuestionIndex(index);
  }
  function nextQuestion() {
    if (feedbackPending) return;
    if (answers[questionIndex] === undefined || revealed[questionIndex]) {
      goToQuestion(questionIndex + 1);
      return;
    }
    setRevealed((previous) => ({ ...previous, [questionIndex]: true }));
    setFeedbackPending(true);
    feedbackTimer.current = setTimeout(() => {
      setQuestionIndex(questionIndex + 1);
      setFeedbackPending(false);
      feedbackTimer.current = null;
    }, 1500);
  }
  function finishExam() {
    if (submitted.current || !questions.length) return;
    submitted.current = true;
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = null;
    setFeedbackPending(false);
    setSubmitOpen(false);
    setExitOpen(false);
    const r: Result = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      level: examLevel,
      date: new Date().toISOString(),
      correct: questions.filter((q, i) => answers[i] === q.answer).length,
      total: questions.length,
      seconds: Math.min(
        EXAM_SECONDS,
        Math.floor((Date.now() - startedAt.current) / 1000),
      ),
      questions,
      answers,
    };
    setResult(r);
    setState((s) => ({
      ...s,
      history: [r, ...s.history].slice(0, 100),
      activity: {
        ...s.activity,
        [dateKey()]: (s.activity[dateKey()] || 0) + 1,
      },
    }));
    setExamStatus("result");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function exportWords() {
    const escape = (v: string) => `"${v.replaceAll('"', '""')}"`;
    const lines = [
      [
        "Chữ Hán",
        "Pinyin",
        "Nghĩa tiếng Việt",
        "Chủ đề",
        "Ví dụ",
        "Dịch nghĩa",
      ],
      ...filtered.map((w) => [
        w.hanzi,
        w.pinyin,
        w.meaning,
        w.topic,
        w.example,
        w.translation,
      ]),
    ];
    download(
      `hsk-${state.level}-tu-vung.csv`,
      "\uFEFF" + lines.map((row) => row.map(escape).join(",")).join("\r\n"),
      "text/csv;charset=utf-8",
    );
    setToast(`Đã xuất ${filtered.length} từ vựng.`);
  }
  async function importBackup(file?: File) {
    if (!file) return;
    try {
      if (file.size > 3000000)
        throw new Error("Tệp quá lớn. Vui lòng chọn bản sao lưu dưới 3 MB.");
      setPendingImport(parseState(JSON.parse(await file.text())));
      setSettings(false);
    } catch (error) {
      setToast(
        error instanceof Error ? error.message : "Không đọc được tệp sao lưu.",
      );
    }
    if (fileInput.current) fileInput.current.value = "";
  }

  return (
    <div className="app-shell">
      <header className="header">
        <div className="header-main wrap">
          <button
            className="brand"
            onClick={() => go("dashboard")}
            aria-label="HSK Master - Tổng quan"
          >
            <span className="brand-mark" lang="zh-CN">
              漢
            </span>
            <span>
              <strong>
                HSK Master<span className="brand-dot">.</span>
              </strong>
              <small>MỖI NGÀY MỘT BƯỚC TIẾN</small>
            </span>
          </button>
          <div className="header-actions">
            <label className="level-label" htmlFor="level">
              Trình độ của bạn
            </label>
            <div className="select-wrap">
              <GraduationCap size={17} />
              <select
                id="level"
                value={state.level}
                disabled={examStatus === "active"}
                onChange={(e) => changeLevel(Number(e.target.value))}
              >
                {levels.map((_, i) => (
                  <option key={i} value={i + 1}>
                    HSK {i + 1}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} />
            </div>
            <span className="header-divider" />
            <button
              className="icon-btn"
              aria-label={
                state.theme === "light"
                  ? "Bật giao diện tối"
                  : "Bật giao diện sáng"
              }
              onClick={() =>
                setState((s) => ({
                  ...s,
                  theme: s.theme === "light" ? "dark" : "light",
                }))
              }
            >
              {state.theme === "light" ? <Moon size={19} /> : <Sun size={19} />}
            </button>
            <button
              className="avatar"
              onClick={() => setSettings(true)}
              aria-label="Cài đặt học tập"
            >
              <Settings2 size={18} />
            </button>
            <button
              className="account-button"
              onClick={onOpenAccount}
              aria-label={
                account.role === "admin"
                  ? "Quản lý tài khoản"
                  : "Tài khoản của tôi"
              }
            >
              <UserRound size={18} />
              <span>{account.displayName}</span>
            </button>
          </div>
        </div>
        <div className="nav-wrap">
          <nav className="navigation wrap" aria-label="Điều hướng chính">
            {nav.map((n) => (
              <button
                key={n.id}
                className={tab === n.id ? "nav-item active" : "nav-item"}
                onClick={() => go(n.id)}
                aria-current={tab === n.id ? "page" : undefined}
                aria-label={n.label}
              >
                <n.icon size={17} />
                <span className="nav-full">{n.label}</span>
                <span className="nav-short">{navShort[n.id]}</span>
                {n.id === "learn" && due.length > 0 && (
                  <span className="nav-count">{due.length}</span>
                )}
              </button>
            ))}
            <span className="nav-note">
              <span className="green-dot" />
              {ready ? "Đã lưu trên trình duyệt này" : "Đang tải tiến độ"}
              {ready && <button className="text-btn" onClick={() => setSettings(true)}>Sao lưu tiến độ</button>}
            </span>
          </nav>
        </div>
      </header>
      <main className="wrap main">
        {tab === "dashboard" && (
          <div className="page-enter">
            <div className="page-top">
              <div>
                <p className="eyebrow">KHÔNG GIAN HỌC TẬP CỦA BẠN</p>
                <h1>
                  Chào bạn, cùng học thôi <span className="wave">☀</span>
                </h1>
                <p className="muted">
                  Một chút kiên trì hôm nay, một bước tiến dài ngày mai.
                </p>
              </div>
              <span className="date-label">
                <CalendarDays size={16} />
                {now === null
                  ? "Học mỗi ngày"
                  : calendarDate.toLocaleDateString("vi-VN", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
              </span>
            </div>
            <section className="hero">
              <div className="hero-copy">
                <span className="hero-pill">
                  <Sparkles size={13} />
                  HÀNH TRÌNH CHINH PHỤC TIẾNG TRUNG
                </span>
                <h2>
                  Sẵn sàng chinh phục
                  <br />
                  <span>HSK {state.level}</span> hôm nay?
                </h2>
                <p>
                  Mở rộng vốn từ, nắm chắc ngữ pháp và tự tin hơn
                  <br className="desktop" /> qua từng bài luyện tập. Bắt đầu từ
                  một từ mới nhé!
                </p>
                <div className="hero-actions">
                  <button className="btn white" onClick={() => startLearning()}>
                    <BookOpen size={17} />
                    Học từ ngay
                    <ArrowRight size={17} />
                  </button>
                  <button className="btn glass" onClick={() => go("exam")}>
                    <Clock3 size={17} />
                    Vào luyện tập
                  </button>
                </div>
                <div className="hero-bottom">
                  <span className="tiny-check">
                    <Check size={11} />
                  </span>{" "}
                  {currentWords.length} từ tuyển chọn <span>·</span>{" "}
                  {grammar.filter((g) => g.level === state.level).length} điểm
                  ngữ pháp <span>·</span> Học theo nhịp của bạn
                </div>
              </div>
              <div className="hero-art" aria-hidden="true">
                <div className="hero-ring ring-one" />
                <div className="hero-ring ring-two" />
                <span className="art-spark s1">✧</span>
                <span className="art-spark s2">✦</span>
                <div className="floating-card card-back">
                  <span lang="zh-CN">中</span>
                  <small>zhōng</small>
                </div>
                <div className="floating-card card-front">
                  <span className="art-card-label">MỖI NGÀY, MỘT TỪ MỚI</span>
                  <strong lang="zh-CN">学</strong>
                  <span>xué</span>
                  <div className="art-card-line" />
                  <small>Học hỏi để lớn hơn</small>
                </div>
                <div className="art-badge">
                  <span>
                    <CheckCheck size={18} />
                  </span>
                  <div>
                    Tiến bộ mỗi ngày<small>加油 · Jiāyóu!</small>
                  </div>
                </div>
                <span className="art-cloud">语言的力量</span>
              </div>
            </section>
            <div className="stats-grid">
              <Stat
                icon={<BookOpen />}
                color="blue"
                label="Từ vựng đã ghi nhớ"
                value={`${learned}`}
                suffix={`/ ${currentWords.length}`}
                note={`Bộ tuyển chọn HSK ${state.level}`}
              />
              <Stat
                icon={<Trophy />}
                color="green"
                label="Bài luyện tập đã làm"
                value={`${state.history.length}`}
                suffix="bài"
                note="Mỗi bài là một bước tiến"
              />
              <Stat
                icon={<Star />}
                color="amber"
                label="Kết quả trung bình"
                value={state.history.length ? `${average}` : "—"}
                suffix={state.history.length ? "%" : ""}
                note={
                  state.history.length
                    ? "Tất cả bài đã hoàn thành"
                    : "Bắt đầu bài luyện tập đầu tiên"
                }
              />
              <Stat
                icon={<Flame />}
                color="coral"
                label="Chuỗi ngày học"
                value={`${streak(state.activity, calendarDate)}`}
                suffix="ngày"
                note={
                  streak(state.activity, calendarDate) > 0
                    ? "Tiếp tục giữ nhịp bạn nhé!"
                    : "Bắt đầu chuỗi học hôm nay"
                }
              />
            </div>
            <div className="dashboard-grid">
              <section className="panel roadmap">
                <div className="section-head">
                  <div>
                    <h2>
                      <span className="mini-icon red">
                        <Target size={17} />
                      </span>
                      Lộ trình của bạn
                    </h2>
                    <p>Chinh phục tiếng Trung, từng cấp độ một</p>
                  </div>
                  <span className="tag neutral">HSK 1 – 6 · Hệ 2.0</span>
                </div>
                <div className="level-list">
                  {levels.map((label, i) => {
                    const lv = i + 1;
                    const pool = words.filter((w) => w.level === lv);
                    const count = pool.filter(
                      (w) => state.progress[w.id]?.learned,
                    ).length;
                    const pct = Math.round((count / pool.length) * 100);
                    return (
                      <button
                        key={lv}
                        className={`level-row ${state.level === lv ? "selected" : ""}`}
                        onClick={() => { changeLevel(lv); startLearning(pool); }}
                        disabled={examStatus === "active"}
                      >
                        <span
                          className={`level-number ${pct === 100 ? "completed" : ""}`}
                        >
                          {pct === 100 ? (
                            <Check size={16} />
                          ) : (
                            String(lv).padStart(2, "0")
                          )}
                        </span>
                        <div className="level-detail">
                          <div className="level-title">
                            <strong>
                              HSK {lv}
                              <span>{label}</span>
                            </strong>
                            <small>
                              {count}/{pool.length} từ <b>{pct}%</b>
                            </small>
                          </div>
                          <Progress
                            value={pct}
                            className={state.level === lv ? "warm" : ""}
                          />
                        </div>
                        {state.level === lv ? (
                          <span className="tag red-tag">Đang học</span>
                        ) : (
                          <ChevronRight size={16} className="muted" />
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="panel-foot">
                  <CircleHelp size={14} />
                  <span>
                    Tiến độ tính trên bộ từ tuyển chọn, chưa phải toàn bộ từ của
                    mỗi cấp.
                  </span>
                </div>
              </section>
              <aside className="dashboard-aside">
                <section className="panel daily-goal">
                  <div className="section-head">
                    <h2>
                      <span className="mini-icon amber">
                        <Flame size={17} />
                      </span>
                      Mục tiêu hôm nay
                    </h2>
                    <button
                      className="icon-btn small"
                      onClick={() => setSettings(true)}
                      aria-label="Thay đổi mục tiêu"
                    >
                      <Settings2 size={15} />
                    </button>
                  </div>
                  <div className="goal-body">
                    <div
                      className="goal-ring"
                      style={{
                        background: `conic-gradient(var(--red) ${Math.min(100, (todayCount / state.goal) * 100)}%, var(--track) 0)`,
                      }}
                    >
                      <div>
                        <strong>
                          {Math.min(
                            100,
                            Math.round((todayCount / state.goal) * 100),
                          )}
                          <small>%</small>
                        </strong>
                      </div>
                    </div>
                    <div>
                      <strong>
                        {todayCount} <span>/ {state.goal} lượt</span>
                      </strong>
                      <p>
                        {todayCount >= state.goal
                          ? "Bạn đã hoàn thành mục tiêu!"
                          : "Mỗi lượt ôn thẻ hoặc nộp bài đều được tính."}
                      </p>
                    </div>
                  </div>
                  <button
                    className="btn primary full"
                    onClick={() =>
                      startLearning(due.length ? due : currentWords)
                    }
                  >
                    {due.length
                      ? `Ôn ${due.length} từ đến hạn`
                      : "Bắt đầu phiên học"}
                    <ArrowRight size={16} />
                  </button>
                </section>
                <section className="tip-card">
                  <span className="eyebrow">
                    <Lightbulb size={15} />
                    GÓC HỌC THÔNG MINH
                  </span>
                  <h3>{tips[tip].title}</h3>
                  <p>{tips[tip].text}</p>
                  <div>
                    <small>{tips[tip].label}</small>
                    <button
                      onClick={() => setTip((t) => (t + 1) % tips.length)}
                      aria-label="Xem mẹo tiếp theo"
                    >
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </section>
              </aside>
            </div>
            <div className="dashboard-bottom">
              <section className="panel activity">
                <div className="section-head">
                  <div>
                    <h2>Nhịp học 7 ngày qua</h2>
                    <p>Đều đặn là bí quyết của sự tiến bộ</p>
                  </div>
                  <span className="tag green-tag">
                    <span className="green-dot" />
                    {week.reduce((s, d) => s + d.count, 0)} lượt học
                  </span>
                </div>
                <div className="week-chart">
                  {week.map((day) => (
                    <div
                      className={`day ${day.date === today ? "today" : ""}`}
                      key={day.date}
                    >
                      <span>{day.count}</span>
                      <div className="bar-track">
                        <div
                          style={{
                            height: `${Math.max(4, (day.count / Math.max(state.goal, ...week.map((d) => d.count))) * 100)}%`,
                          }}
                        />
                      </div>
                      <small>{day.label}</small>
                    </div>
                  ))}
                </div>
              </section>
              <section className="panel word-of-day">
                <div className="section-head">
                  <h2>
                    <Sparkles size={17} />
                    Từ mới mỗi ngày
                  </h2>
                  <span className="tag red-tag">HSK {state.level}</span>
                </div>
                <div className="daily-word">
                  <div>
                    <strong lang="zh-CN">{dailyWord.hanzi}</strong>
                    <span>{dailyWord.pinyin}</span>
                  </div>
                  <button
                    className="audio-btn"
                    onClick={() => speak(dailyWord.hanzi)}
                    aria-label={`Nghe ${dailyWord.hanzi}`}
                  >
                    <Volume2 size={21} />
                  </button>
                </div>
                <p className="word-meaning">{dailyWord.meaning}</p>
                <p className="word-example" lang="zh-CN">
                  {dailyWord.example}
                </p>
                <p className="muted small-text">{dailyWord.translation}</p>
                <button
                  className="text-btn"
                  onClick={() => startLearning([dailyWord])}
                >
                  Học từ này
                  <ArrowRight size={15} />
                </button>
              </section>
            </div>
          </div>
        )}

        {tab === "learn" && (
          <div className="page-enter">
            <PageHeading
              eyebrow={`GÓC HỌC TẬP · HSK ${state.level}`}
              title="Từ vựng & ngữ pháp"
              text={`${currentWords.length} từ vựng tuyển chọn và ${grammar.filter((g) => g.level === state.level).length} cấu trúc ngữ pháp, sẵn sàng để bạn khám phá.`}
            />
            <div className="learning-toolbar panel">
              <div className="segmented" aria-label="Chế độ học">
                {[
                  {
                    id: "flashcard" as Mode,
                    icon: Layers3,
                    label: "Flashcard",
                  },
                  { id: "list" as Mode, icon: List, label: "Danh sách từ" },
                  { id: "grammar" as Mode, icon: BookOpen, label: "Ngữ pháp" },
                ].map((m) => (
                  <button
                    key={m.id}
                    aria-pressed={mode === m.id}
                    className={mode === m.id ? "active" : ""}
                    onClick={() => {
                      if (m.id === "flashcard") startLearning();
                      else setMode(m.id);
                    }}
                  >
                    <m.icon size={16} />
                    {m.label}
                  </button>
                ))}
              </div>
              <span className="muted small-text">
                <CheckCircle2 size={14} />
                Đã nhớ {learned}/{currentWords.length} từ
              </span>
            </div>
            {mode === "flashcard" && (
              <div className="flash-layout">
                <section className="flash-main">
                  <div className="flash-top">
                    <span className="tag red-tag">
                      BỘ THẺ HSK {state.level}
                    </span>
                    <div className="inline-actions">
                      <label className="check-label">
                        <input
                          type="checkbox"
                          checked={showPinyin}
                          onChange={(e) => setShowPinyin(e.target.checked)}
                        />
                        Hiện pinyin
                      </label>
                      <button
                        className="icon-btn"
                        aria-label="Trộn thẻ"
                        onClick={() => {
                          setDeck(shuffle(deck));
                          setCard(0);
                          setFlipped(false);
                          setDeckFinished(false);
                          setSessionReviews(0);
                          setToast("Đã trộn thứ tự thẻ.");
                        }}
                      >
                        <RotateCcw size={17} />
                      </button>
                    </div>
                  </div>
                  {!deck.length ? (
                    <div className="panel">
                      <Empty
                        title="Bạn đã ôn hết từ đến hạn"
                        text="Hãy học thêm từ mới hoặc quay lại khi đến lịch ôn tiếp theo."
                        action={
                          <button
                            className="btn primary"
                            onClick={() => startLearning()}
                          >
                            Học toàn bộ thẻ
                          </button>
                        }
                      />
                    </div>
                  ) : deckFinished ? (
                    <div className="panel session-done">
                      <span className="success-medal">
                        <Trophy size={36} />
                      </span>
                      <span className="eyebrow">LÀM TỐT LẮM!</span>
                      <h2>Bạn vừa hoàn thành phiên học.</h2>
                      <p>
                        Đã ghi nhận {sessionReviews} lượt ôn. Những từ chưa nhớ
                        sẽ đến hạn sau 10 phút.
                      </p>
                      <button
                        className="btn primary"
                        onClick={() => startLearning()}
                      >
                        Tiếp tục học
                        <ArrowRight size={16} />
                      </button>
                      <button
                        className="text-btn"
                        onClick={() => go("dashboard")}
                      >
                        Xem tiến độ của tôi
                      </button>
                    </div>
                  ) : (
                    activeWord && (
                      <>
                        <div
                          className={`flashcard ${flipped ? "flipped" : ""}`}
                        >
                          <div className="flash-card-head">
                            <span>{activeWord.topic}</span>
                            <div className="inline-actions">
                              <button
                                className={`icon-btn ${state.favorites.includes(activeWord.id) ? "saved" : ""}`}
                                onClick={() => favorite(activeWord.id)}
                                aria-label={
                                  state.favorites.includes(activeWord.id)
                                    ? "Bỏ lưu từ"
                                    : "Lưu từ"
                                }
                                aria-pressed={state.favorites.includes(
                                  activeWord.id,
                                )}
                              >
                                <Bookmark
                                  size={20}
                                  fill={
                                    state.favorites.includes(activeWord.id)
                                      ? "currentColor"
                                      : "none"
                                  }
                                />
                              </button>
                              <button
                                className="audio-btn"
                                onClick={() => speak(activeWord.hanzi)}
                                aria-label="Nghe phát âm"
                              >
                                <Volume2 size={21} />
                              </button>
                            </div>
                          </div>
                          <button
                            className="flash-face"
                            onClick={() => setFlipped(!flipped)}
                            aria-label={
                              flipped
                                ? "Ẩn nghĩa của từ"
                                : "Lật thẻ để xem nghĩa"
                            }
                          >
                            <span className="flash-hanzi" lang="zh-CN">
                              {activeWord.hanzi}
                            </span>
                            {showPinyin && (
                              <span className="flash-pinyin">
                                {activeWord.pinyin}
                              </span>
                            )}
                            {flipped ? (
                              <div className="flash-answer">
                                <strong>{activeWord.meaning}</strong>
                                {activeWord.example ? <><p lang="zh-CN">{activeWord.example}</p><small>{activeWord.translation}</small></> : <small>Chưa có câu ví dụ cho từ này.</small>}
                              </div>
                            ) : (
                              <div className="flip-hint">
                                <RotateCcw size={14} />
                                Chạm để khám phá nghĩa
                              </div>
                            )}
                          </button>
                          <div className="flash-card-foot">
                            <span>
                              {String(card + 1).padStart(2, "0")}
                              <small>
                                {" "}
                                / {String(deck.length).padStart(2, "0")}
                              </small>
                            </span>
                            <span>
                              {flipped
                                ? "Bạn nhớ từ này đến đâu?"
                                : "Thử nhớ nghĩa trước khi lật thẻ nhé"}
                            </span>
                            <span>汉语</span>
                          </div>
                        </div>
                        <div className="flash-navigation">
                          <button
                            className="round-btn"
                            aria-label="Thẻ trước"
                            onClick={() => moveCard(-1)}
                          >
                            <ChevronLeft size={21} />
                          </button>
                          {flipped ? (
                            <div className="rating-actions">
                              <button
                                className="btn secondary"
                                onClick={() => rate(false)}
                              >
                                <RotateCcw size={16} />
                                Cần học lại
                              </button>
                              <button
                                className="btn primary"
                                onClick={() => rate(true)}
                              >
                                <Check size={17} />
                                Đã ghi nhớ
                              </button>
                            </div>
                          ) : (
                            <button
                              className="btn primary flip-btn"
                              onClick={() => setFlipped(true)}
                            >
                              <RotateCcw size={16} />
                              Lật thẻ
                            </button>
                          )}
                          <button
                            className="round-btn"
                            aria-label="Thẻ tiếp theo"
                            onClick={() => moveCard(1)}
                          >
                            <ChevronRight size={21} />
                          </button>
                        </div>
                        <p className="keyboard-hint">
                          <kbd>Space</kbd> lật thẻ <span>·</span>
                          <kbd>←</kbd>
                          <kbd>→</kbd> chuyển thẻ
                        </p>
                      </>
                    )
                  )}
                </section>
                <aside className="study-aside">
                  <section className="panel">
                    <h3>Học ít hơn, nhớ lâu hơn.</h3>
                    <p className="muted">
                      Lịch ôn cách quãng giúp bạn gặp lại từ đúng lúc.
                    </p>
                    <div className="study-steps">
                      <div>
                        <span>1</span>
                        <p>Tự nhớ nghĩa trước khi lật thẻ.</p>
                      </div>
                      <div>
                        <span>2</span>
                        <p>Nghe và đọc to câu ví dụ.</p>
                      </div>
                      <div>
                        <span>3</span>
                        <p>Đánh giá thật: nhớ hay cần học lại?</p>
                      </div>
                    </div>
                    <div className="note-box">
                      <Clock3 size={17} />
                      <p>
                        Đã nhớ: ôn sau 1, 3, 7, 14, rồi 30 ngày. Cần học lại:
                        sau 10 phút.
                      </p>
                    </div>
                  </section>
                  <section className="panel compact">
                    <span className="mini-icon amber">
                      <Bookmark size={18} />
                    </span>
                    <h3>Bộ từ của riêng bạn</h3>
                    <p className="muted">
                      Lưu các từ muốn chú ý và học lại bất cứ lúc nào.
                    </p>
                    <button
                      className="text-btn"
                      onClick={() => {
                        setSearch("");
                        setTopic("all");
                        setFilter("saved");
                        setMode("list");
                      }}
                    >
                      Xem từ đã lưu
                      <ArrowRight size={15} />
                    </button>
                  </section>
                </aside>
              </div>
            )}
            {mode === "list" && (
              <section className="panel vocabulary">
                <div className="filter-bar">
                  <label className="search-box">
                    <Search size={18} />
                    <input
                      placeholder="Tìm chữ Hán, pinyin hoặc nghĩa tiếng Việt…"
                      aria-label="Tìm từ vựng"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    {search && (
                      <button
                        className="icon-btn small"
                        onClick={() => setSearch("")}
                        aria-label="Xóa tìm kiếm"
                      >
                        <X size={15} />
                      </button>
                    )}
                  </label>
                  <select
                    aria-label="Lọc theo chủ đề"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  >
                    <option value="all">Tất cả chủ đề</option>
                    {topics.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                  <button
                    className="btn secondary"
                    onClick={exportWords}
                    disabled={!filtered.length}
                  >
                    <Download size={16} />
                    Xuất CSV
                  </button>
                </div>
                <div className="filter-tabs">
                  {[
                    { id: "all", label: "Tất cả" },
                    { id: "new", label: "Chưa học" },
                    { id: "due", label: "Đến hạn ôn" },
                    { id: "learned", label: "Đã nhớ" },
                    { id: "saved", label: "Đã lưu" },
                  ].map((f) => (
                    <button
                      key={f.id}
                      className={filter === f.id ? "active" : ""}
                      onClick={() => setFilter(f.id)}
                    >
                      {f.label}
                    </button>
                  ))}
                  <span>{filtered.length} từ</span>
                </div>
                {filtered.length ? (
                  <>
                    <div className="table-scroll">
                      <table>
                        <thead>
                          <tr>
                            <th>TỪ VỰNG</th>
                            <th>NGHĨA & VÍ DỤ</th>
                            <th>CHỦ ĐỀ</th>
                            <th>TRẠNG THÁI</th>
                            <th>
                              <span className="sr-only">Thao tác</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map((w) => (
                            <tr key={w.id}>
                              <td>
                                <div className="table-word">
                                  <button
                                    className="icon-btn"
                                    onClick={() => speak(w.hanzi)}
                                    aria-label={`Nghe ${w.hanzi}`}
                                  >
                                    <Volume2 size={17} />
                                  </button>
                                  <div>
                                    <strong lang="zh-CN">{w.hanzi}</strong>
                                    <span>{w.pinyin}</span>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <strong className="meaning">{w.meaning}</strong>
                                {w.example ? <><p lang="zh-CN">{w.example}</p><small>{w.translation}</small></> : <small>Chưa có câu ví dụ.</small>}
                              </td>
                              <td>
                                <span className="topic-chip">{w.topic}</span>
                              </td>
                              <td>
                                <span
                                  className={`word-status ${state.progress[w.id]?.learned ? "known" : ""}`}
                                >
                                  {state.progress[w.id]?.learned ? (
                                    <>
                                      <Check size={12} />
                                      Đã nhớ
                                    </>
                                  ) : state.progress[w.id] ? (
                                    "Đang học"
                                  ) : (
                                    "Chưa học"
                                  )}
                                </span>
                                {state.progress[w.id] && (
                                  <small className="due-date">
                                    Ôn:{" "}
                                    {new Date(
                                      state.progress[w.id].due,
                                    ).toLocaleDateString("vi-VN")}
                                  </small>
                                )}
                              </td>
                              <td>
                                <button
                                  className={`icon-btn ${state.favorites.includes(w.id) ? "saved" : ""}`}
                                  onClick={() => favorite(w.id)}
                                  aria-label={`${state.favorites.includes(w.id) ? "Bỏ lưu" : "Lưu"} ${w.hanzi}`}
                                  aria-pressed={state.favorites.includes(w.id)}
                                >
                                  <Bookmark
                                    size={18}
                                    fill={
                                      state.favorites.includes(w.id)
                                        ? "currentColor"
                                        : "none"
                                    }
                                  />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="table-footer">
                      <span>
                        Tra cứu thêm:{" "}
                        <a
                          href="https://www.mdbg.net/chinese/dictionary"
                          target="_blank"
                          rel="noreferrer"
                        >
                          MDBG <ExternalLink size={11} />
                        </a>
                      </span>
                      <button
                        className="text-btn"
                        onClick={() => startLearning(filtered)}
                      >
                        Học {filtered.length} từ này
                        <ArrowRight size={15} />
                      </button>
                    </div>
                  </>
                ) : (
                  <Empty
                    title="Chưa có từ phù hợp"
                    text="Hãy thử từ khóa khác hoặc đổi bộ lọc."
                    action={
                      <button
                        className="btn secondary"
                        onClick={() => {
                          setSearch("");
                          setTopic("all");
                          setFilter("all");
                        }}
                      >
                        Xóa bộ lọc
                      </button>
                    }
                  />
                )}
              </section>
            )}
            {mode === "grammar" && (
              <>
                <div className="info-banner">
                  <Lightbulb size={19} />
                  <p>
                    Hiểu cấu trúc, đọc ví dụ rồi tự đặt một câu. Các cấu trúc
                    được nhóm theo độ khó để tiện ôn tập.
                  </p>
                </div>
                <div className="grammar-grid">
                  {grammar
                    .filter((g) => g.level === state.level)
                    .map((g, i) => (
                      <article className="panel grammar-card" key={g.id}>
                        <div className="grammar-top">
                          <span className="grammar-number">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span className="tag red-tag">HSK {g.level}</span>
                        </div>
                        <h2>{g.title}</h2>
                        <div className="formula">{g.formula}</div>
                        <p>{g.explanation}</p>
                        <div className="grammar-example">
                          <div>
                            <strong lang="zh-CN">{g.example}</strong>
                            <button
                              className="icon-btn small"
                              onClick={() => speak(g.example)}
                              aria-label={`Nghe câu ${g.example}`}
                            >
                              <Volume2 size={16} />
                            </button>
                          </div>
                          <small>{g.pinyin}</small>
                          <p>{g.translation}</p>
                        </div>
                        <details>
                          <summary>
                            <CircleHelp size={14} />
                            Lưu ý sử dụng
                            <ChevronDown size={14} />
                          </summary>
                          <p>{g.note}</p>
                        </details>
                        <a
                          className="source-link"
                          href={sources.find((s) => s.id === g.source)?.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Nguồn tham khảo
                          <ArrowUpRight size={14} />
                        </a>
                      </article>
                    ))}
                </div>
                <div className="grammar-cta">
                  <div>
                    <h3>Hiểu rồi? Thử sức một chút nhé.</h3>
                    <p className="muted">
                      Kiểm tra cách dùng qua câu hỏi điền từ có giải thích.
                    </p>
                  </div>
                  <button
                    className="btn primary"
                    onClick={() => {
                      setExamMode("grammar");
                      go("exam");
                    }}
                  >
                    Luyện ngữ pháp
                    <ArrowRight size={16} />
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {tab === "exam" && (
          <div className="page-enter">
            <PageHeading
              eyebrow={`TỰ TIN HƠN MỖI NGÀY · HSK ${examStatus === "active" ? examLevel : state.level}`}
              title={
                examStatus === "active"
                  ? "Đang làm bài luyện tập"
                  : examStatus === "result"
                    ? "Kết quả luyện tập"
                    : "Luyện tập HSK"
              }
              text="Bài luyện tập tự biên soạn có giải thích đáp án. Không phải đề thi HSK chính thức hay điểm quy đổi HSK."
            />
            {examStatus === "intro" && (
              <>
                <section className="panel exam-intro">
                  <div className="exam-illustration">
                    <div className="exam-paper">
                      <span>HSK {state.level}</span>
                      <FileText size={52} />
                      <div />
                      <div />
                      <div />
                      <span className="paper-check">
                        <Check size={24} />
                      </span>
                    </div>
                    <div className="exam-decoration">练</div>
                  </div>
                  <div className="exam-description">
                    <span className="tag red-tag">
                      THỬ THÁCH NHỎ · TIẾN BỘ LỚN
                    </span>
                    <h2>Sẵn sàng kiểm tra kiến thức?</h2>
                    <p>
                      Chọn nội dung muốn ôn, trả lời theo nhịp của bạn và xem
                      lại từng câu sau khi hoàn thành.
                    </p>
                    <div className="exam-mode-options">
                      {[
                        {
                          id: "mixed",
                          title: "Tổng hợp",
                          text: "Từ vựng + ngữ pháp",
                          icon: Layers3,
                        },
                        {
                          id: "vocab",
                          title: "Từ vựng",
                          text: "Nhận diện nghĩa của từ",
                          icon: BookOpen,
                        },
                        {
                          id: "grammar",
                          title: "Ngữ pháp",
                          text: "Chọn từ điền vào câu",
                          icon: FileText,
                        },
                        {
                          id: "listening",
                          title: "Nghe từ",
                          text: "Cần giọng đọc zh-CN",
                          icon: Headphones,
                        },
                      ].map((m) => (
                        <button
                          key={m.id}
                          aria-pressed={examMode === m.id}
                          className={examMode === m.id ? "active" : ""}
                          onClick={() => setExamMode(m.id)}
                        >
                          <m.icon size={19} />
                          <strong>{m.title}</strong>
                          <small>{m.text}</small>
                        </button>
                      ))}
                    </div>
                    <div className="exam-facts">
                      <span>
                        <List size={16} />
                        {examMode === "grammar" ? grammar.filter((g) => g.level === state.level).length : 50} câu hỏi
                      </span>
                      <span>
                        <Clock3 size={16} />
                        30 phút
                      </span>
                      <span>
                        <CheckCheck size={16} />
                        Giải thích chi tiết
                      </span>
                    </div>
                    <button className="btn primary" onClick={startExam}>
                      Bắt đầu luyện tập
                      <ArrowRight size={17} />
                    </button>
                    {examMode === "listening" && <div className="listening-check"><button className="btn secondary" onClick={() => speak("你好，欢迎学习汉语。")}> <Volume2 size={16}/>Nghe thử</button><p className="muted small-text">Hãy nghe thử trước khi bắt đầu. Nếu thiết bị thiếu giọng tiếng Trung, hãy cài giọng zh-CN hoặc chọn bài từ vựng.</p><button className="text-btn" onClick={() => setExamMode("vocab")}>Chuyển sang bài từ vựng</button></div>}
                  </div>
                </section>
                <section className="panel history">
                  <div className="section-head">
                    <div>
                      <h2>Lịch sử luyện tập</h2>
                      <p>Nhìn lại hành trình, thấy mình tiến bộ</p>
                    </div>
                    <span className="tag neutral">
                      {state.history.length} bài
                    </span>
                  </div>
                  {!state.history.length ? (
                    <Empty
                      title="Hành trình bắt đầu từ bài đầu tiên"
                      text="Kết quả và lời giải sẽ được lưu tại đây sau khi bạn hoàn thành."
                    />
                  ) : (
                    <div className="history-list">
                      {state.history.slice(0, 10).map((r) => (
                        <button
                          key={r.id}
                          onClick={() => {
                            setResult(r);
                            setExamStatus("result");
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                        >
                          <span className="mini-icon green">
                            <FileText size={19} />
                          </span>
                          <span>
                            <strong>
                              HSK {r.level} ·{" "}
                              {r.questions.every((q) => q.kind === "grammar")
                                ? "Ngữ pháp"
                                : r.questions.every(
                                      (q) => q.kind === "listening",
                                    )
                                  ? "Nghe từ"
                                  : "Luyện tập"}
                            </strong>
                            <small>
                              {new Date(r.date).toLocaleString("vi-VN")} ·{" "}
                              {timeLabel(r.seconds)}
                            </small>
                          </span>
                          <span className="history-score">
                            {Math.round((r.correct / r.total) * 100)}%
                            <small>
                              {r.correct}/{r.total} câu
                            </small>
                          </span>
                          <ChevronRight size={17} />
                        </button>
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}
            {examStatus === "active" && questions[questionIndex] && (
              <div className="exam-layout">
                <section className="panel question-card">
                  <div className="question-top">
                    <span className="tag red-tag">
                      {questions[questionIndex].kind === "grammar"
                        ? "NGỮ PHÁP"
                        : questions[questionIndex].kind === "listening"
                          ? "NGHE TỪ"
                          : "TỪ VỰNG"}
                    </span>
                    <span>
                      Câu {questionIndex + 1}
                      <small> / {questions.length}</small>
                    </span>
                  </div>
                  <Progress
                    value={
                      (Object.keys(answers).length / questions.length) * 100
                    }
                  />
                  <p className="question-instruction">
                    {questions[questionIndex].kind === "grammar"
                      ? "Chọn đáp án phù hợp điền vào chỗ trống."
                      : questions[questionIndex].kind === "listening"
                        ? "Bấm nút nghe, sau đó chọn nghĩa của từ."
                        : "Từ dưới đây có nghĩa là gì?"}
                  </p>
                  {questions[questionIndex].kind === "listening" ? (
                    <button
                      className="listen-question"
                      onClick={() => speak(questions[questionIndex].audio!)}
                    >
                      <Volume2 size={34} />
                      Nghe từ tiếng Trung
                    </button>
                  ) : (
                    <h2
                      className={`question-prompt ${questions[questionIndex].kind === "vocab" ? "vocab-prompt" : ""}`}
                      lang="zh-CN"
                    >
                      {questions[questionIndex].prompt}
                    </h2>
                  )}
                  {questions[questionIndex].kind === "vocab" && (
                    <p className="question-pinyin">
                      {questions[questionIndex].pinyin}
                    </p>
                  )}
                  <div
                    className="answers"
                    role="group"
                    aria-label="Chọn đáp án"
                  >
                    {questions[questionIndex].options.map((option, i) => (
                      <button
                        key={i}
                        aria-pressed={answers[questionIndex] === i}
                        className={revealed[questionIndex] && i === questions[questionIndex].answer ? "answer-correct" : revealed[questionIndex] && answers[questionIndex] === i ? "answer-wrong" : answers[questionIndex] === i ? "chosen" : ""}
                        disabled={!!revealed[questionIndex]}
                        onClick={() =>
                          setAnswers((a) => ({ ...a, [questionIndex]: i }))
                        }
                      >
                        <span>{String.fromCharCode(65 + i)}</span>
                        {option}
                        {answers[questionIndex] === i && (
                          <CheckCircle2 size={19} />
                        )}
                      </button>
                    ))}
                  </div>
                  {revealed[questionIndex] && <p className="answer-feedback" role="status">{answers[questionIndex] === questions[questionIndex].answer ? "Chính xác!" : "Chưa đúng. Đáp án đúng được đánh dấu màu xanh."}</p>}
                  <div className="question-nav">
                    <button
                      className="btn secondary"
                      disabled={!questionIndex || feedbackPending}
                      onClick={() => goToQuestion(questionIndex - 1)}
                    >
                      <ArrowLeft size={16} />
                      Câu trước
                    </button>
                    {questionIndex < questions.length - 1 ? (
                      <button
                        className="btn primary"
                        disabled={feedbackPending}
                        onClick={nextQuestion}
                      >
                        Câu tiếp
                        <ArrowRight size={16} />
                      </button>
                    ) : (
                      <button
                        className="btn primary"
                        onClick={() => setSubmitOpen(true)}
                      >
                        Nộp bài
                        <Check size={16} />
                      </button>
                    )}
                  </div>
                </section>
                <aside className="panel exam-sidebar">
                  <div
                    className={`exam-timer ${remaining < 60 ? "urgent" : ""}`}
                  >
                    <Clock3 size={21} />
                    <span>
                      Thời gian còn lại<strong>{timeLabel(remaining)}</strong>
                    </span>
                  </div>
                  <h3>Danh sách câu hỏi</h3>
                  <p className="muted small-text">
                    Đã trả lời {Object.keys(answers).length}/{questions.length}{" "}
                    câu
                  </p>
                  <div className="question-palette">
                    {questions.map((q, i) => (
                      <button
                        aria-label={`Đến câu ${i + 1}${answers[i] === undefined ? ", chưa trả lời" : !revealed[i] || (feedbackPending && i === questionIndex) ? ", đã chọn đáp án" : answers[i] === q.answer ? ", đúng" : ", sai"}`}
                        aria-current={i === questionIndex ? "step" : undefined}
                        className={`${revealed[i] && answers[i] !== undefined && !(feedbackPending && i === questionIndex) ? answers[i] === q.answer ? "correct" : "wrong" : ""} ${i === questionIndex ? "current" : ""}`}
                        key={q.id}
                        disabled={feedbackPending}
                        onClick={() => goToQuestion(i)}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                  <div className="palette-key">
                    <span>
                      <i />
                      Chưa trả lời
                    </span>
                    <span>
                      <i />
                      Đúng
                    </span>
                    <span><i />Sai</span>
                  </div>
                  <div className="exam-actions">
                  <button
                    className="btn primary"
                    disabled={feedbackPending}
                    onClick={() => setSubmitOpen(true)}
                  >
                    Nộp bài
                    <Check size={16} />
                  </button>
                  <button
                    className="btn secondary"
                    disabled={feedbackPending}
                    onClick={() => setExitOpen(true)}
                  >
                    Kết thúc
                  </button>
                  </div>
                </aside>
              </div>
            )}
            {examStatus === "result" && result && (
              <>
                <section className="panel result-summary">
                  <span className="success-medal">
                    <Trophy size={33} />
                  </span>
                  <div>
                    <span className="eyebrow">
                      ĐÃ HOÀN THÀNH · HSK {result.level}
                    </span>
                    <h2>
                      {result.correct / result.total >= 0.8
                        ? "Một kết quả thật đáng vui!"
                        : "Thêm một bước trên hành trình."}
                    </h2>
                    <p className="muted">
                      Xem lại lời giải để biến những câu chưa đúng thành kiến
                      thức mới.
                    </p>
                  </div>
                  <div className="result-score">
                    <strong>
                      {Math.round((result.correct / result.total) * 100)}
                      <small>%</small>
                    </strong>
                    <span>
                      {result.correct}/{result.total} câu đúng ·{" "}
                      {timeLabel(result.seconds)}
                    </span>
                  </div>
                </section>
                <div className="section-head result-heading">
                  <h2>Đáp án & giải thích</h2>
                  <button
                    className="btn secondary"
                    onClick={() => setExamStatus("intro")}
                  >
                    <RotateCcw size={16} />
                    Luyện bài mới
                  </button>
                </div>
                <div className="result-list">
                  {result.questions.map((q, i) => {
                    const correct = result.answers[i] === q.answer;
                    return (
                      <article
                        className={`panel result-item ${correct ? "correct" : "incorrect"}`}
                        key={q.id}
                      >
                        <div className="result-item-top">
                          <span
                            className={`result-icon ${correct ? "good" : "bad"}`}
                          >
                            {correct ? <Check size={17} /> : <X size={17} />}
                          </span>
                          <h3>
                            Câu {i + 1} ·{" "}
                            <span lang="zh-CN">
                              {q.kind === "listening" ? q.audio : q.prompt}
                            </span>
                          </h3>
                          <span
                            className={`tag ${correct ? "green-tag" : "red-tag"}`}
                          >
                            {correct
                              ? "Chính xác"
                              : result.answers[i] === undefined
                                ? "Chưa trả lời"
                                : "Cần ôn lại"}
                          </span>
                        </div>
                        <div className="answer-breakdown">
                          <p>
                            Bạn chọn:{" "}
                            <strong>
                              {result.answers[i] === undefined
                                ? "Bỏ trống"
                                : q.options[result.answers[i]]}
                            </strong>
                          </p>
                          {!correct && (
                            <p>
                              Đáp án đúng:{" "}
                              <strong>{q.options[q.answer]}</strong>
                            </p>
                          )}
                        </div>
                        <div className="explanation">
                          <Lightbulb size={16} />
                          <p>{q.explanation}</p>
                        </div>
                      </article>
                    );
                  })}
                </div>
                <div className="result-bottom">
                  <button
                    className="btn secondary"
                    onClick={() => go("dashboard")}
                  >
                    Về tổng quan
                  </button>
                  <button
                    className="btn primary"
                    onClick={() => {
                      const ids = result.questions
                        .filter(
                          (q, i) => result.answers[i] !== q.answer && q.wordId,
                        )
                        .map((q) => q.wordId);
                      changeLevel(result.level);
                      if (ids.length)
                        startLearning(words.filter((w) => ids.includes(w.id)));
                      else {
                        setMode("grammar");
                        go("learn");
                      }
                    }}
                  >
                    Ôn lại kiến thức
                    <ArrowRight size={16} />
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {tab === "sources" && (
          <div className="page-enter">
            <PageHeading
              eyebrow="HỌC CÓ CƠ SỞ · KHÁM PHÁ CÓ CHỌN LỌC"
              title="Thư viện tài liệu"
              text="Từ điển, khóa học và tài liệu gốc để bạn học sâu hơn. Các liên kết dẫn trực tiếp đến đơn vị xuất bản."
            />
            <div className="source-overview">
              <span className="mini-icon red">
                <ShieldCheck size={24} />
              </span>
              <div>
                <h2>Nội dung rõ nguồn, lộ trình rõ ràng.</h2>
                <p>
                  Ứng dụng gồm <strong>{words.length} từ</strong>,{" "}
                  <strong>{grammar.length} điểm ngữ pháp</strong> và bài luyện
                  tập theo lộ trình HSK 2.0. Từ vựng được cập nhật từ các tệp
                  HSK 1–6 của dự án; những mục chưa đủ dữ liệu dùng nội dung
                  đã biên soạn hoặc từ điển tiếng Anh trước đó, nếu có.
                </p>
                <p>
                  HSK 3.0 có đề cương riêng trên website CTI. Hãy đối chiếu
                  phiên bản và yêu cầu kỳ thi của bạn trước khi dùng bộ học này
                  để chuẩn bị thi.
                </p>
              </div>
            </div>
            <div className="source-grid">
              {sources.map((s, i) => (
                <a
                  className="panel source-card"
                  key={s.id}
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <div className="source-card-top">
                    <span className={`source-logo logo-${i}`}>
                      {["汉", "词", "学", "语", "比", "文"][i]}
                    </span>
                    <span className="tag neutral">{s.badge}</span>
                    <ArrowUpRight size={18} />
                  </div>
                  <span className="eyebrow">{s.type}</span>
                  <h2>{s.name}</h2>
                  <p>{s.description}</p>
                  <span className="source-domain">
                    {new URL(s.url).hostname}
                    <ExternalLink size={13} />
                  </span>
                </a>
              ))}
            </div>
            <section className="panel content-notes">
              <h2>
                <CircleHelp size={20} />
                Về bộ nội dung này
              </h2>
              <div className="notes-grid">
                <div>
                  <h3>Phiên bản & phạm vi</h3>
                  <p>
                    Biên soạn ngày 07/11/2026. Từ vựng đối chiếu theo HSK 2.0;
                    你好 là lời chào bổ trợ ở cấp 1. Các bài ngữ pháp được nhóm
                    theo độ khó. Các bài luyện dùng thang % đúng, không quy đổi
                    thành điểm HSK.
                  </p>
                </div>
                <div>
                  <h3>Đối chiếu & quyền sử dụng</h3>
                  <p>
                    Chữ Hán và pinyin tham khảo MDBG; khung chủ điểm tham khảo
                    CTI, OpenLearn và chương trình tiếng Trung Liên Hợp Quốc.
                    Đối chiếu cấp từ với{" "}
                    <a
                      href="https://github.com/drkameleon/complete-hsk-vocabulary"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Complete HSK Vocabulary
                    </a>
                    . CC-CEDICT được công bố theo{" "}
                    <a
                      href="https://creativecommons.org/licenses/by-sa/4.0/"
                      target="_blank"
                      rel="noreferrer"
                    >
                      CC BY-SA 4.0
                    </a>
                    .
                  </p>
                </div>
                <div>
                  <h3>Tiến độ & âm thanh</h3>
                  <p>
                    Tiến độ lưu trên trình duyệt hiện tại, chưa đồng bộ tài
                    khoản. Dùng xuất/nhập sao lưu để chuyển thiết bị. Phát âm sử
                    dụng giọng tiếng Trung có sẵn trên thiết bị; chất lượng phụ
                    thuộc hệ điều hành.
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
      <footer className="footer wrap">
        <span>
          <span className="footer-mark" lang="zh-CN">
            漢
          </span>
          HSK Master <span className="footer-separator">·</span>
          <span>Học một chút, tiến một bước.</span>
        </span>
        <div>
          <span>为梦想，每天进步一点</span>
          <button onClick={() => go("sources")}>
            Nguồn nội dung
            <ArrowUpRight size={12} />
          </button>
        </div>
      </footer>
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={19} />
          <span>{toast}</span>
          <button onClick={() => setToast("")} aria-label="Đóng thông báo">
            <X size={16} />
          </button>
        </div>
      )}
      <input
        ref={fileInput}
        type="file"
        accept="application/json,.json"
        hidden
        aria-label="Nhập tệp sao lưu"
        onChange={(e) => importBackup(e.target.files?.[0])}
      />
      {modalOpen && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSettings(false);
              setPendingImport(null);
              setSubmitOpen(false);
              setExitOpen(false);
            }
          }}
        >
          <div
            ref={modalRef}
            className="modal panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            {settings ? (
              <>
                <div className="section-head">
                  <h2 id="modal-title">Học theo cách của bạn</h2>
                  <button
                    className="icon-btn"
                    onClick={() => setSettings(false)}
                    aria-label="Đóng cài đặt"
                  >
                    <X size={20} />
                  </button>
                </div>
                <p className="muted">
                  Đặt mục tiêu nhỏ, giữ thói quen lâu dài.
                </p>
                <label className="setting-label" htmlFor="goal">
                  Mục tiêu mỗi ngày
                </label>
                <select
                  id="goal"
                  className="full"
                  value={state.goal}
                  onChange={(e) =>
                    setState((s) => ({ ...s, goal: Number(e.target.value) }))
                  }
                >
                  {[5, 10, 20, 30].map((n) => (
                    <option key={n} value={n}>
                      {n} lượt học / ngày
                    </option>
                  ))}
                </select>
                <div className="settings-section">
                  <h3>Sao lưu tiến độ</h3>
                  <p className="muted small-text">
                    Dữ liệu lưu trên trình duyệt này. Xuất tệp để giữ tiến độ
                    hoặc chuyển sang thiết bị khác.
                  </p>
                  <div className="backup-actions">
                    <button
                      className="btn secondary"
                      onClick={() => {
                        download(
                          `hsk-master-${today}.json`,
                          JSON.stringify(state, null, 2),
                        );
                        setToast("Đã xuất bản sao lưu tiến độ.");
                      }}
                    >
                      <Download size={16} />
                      Xuất sao lưu
                    </button>
                    <button
                      className="btn secondary"
                      onClick={() => fileInput.current?.click()}
                    >
                      <Upload size={16} />
                      Nhập sao lưu
                    </button>
                  </div>
                </div>
                <button
                  className="btn primary full"
                  onClick={() => setSettings(false)}
                >
                  Xong
                  <Check size={16} />
                </button>
              </>
            ) : pendingImport ? (
              <>
                <h2 id="modal-title">Khôi phục tiến độ học?</h2>
                <p className="muted">
                  Bản sao lưu có {Object.keys(pendingImport.progress).length} từ
                  đã học và {pendingImport.history.length} bài luyện tập. Nhập
                  tệp sẽ thay thế tiến độ hiện tại trên trình duyệt này.
                </p>
                <div className="modal-actions">
                  <button
                    className="btn secondary"
                    onClick={() => setPendingImport(null)}
                  >
                    Hủy
                  </button>
                  <button
                    className="btn primary"
                    onClick={() => {
                      changeLevel(pendingImport.level);
                      setState(pendingImport);
                      setExamStatus("intro");
                      setPendingImport(null);
                      setToast("Đã khôi phục tiến độ học tập.");
                    }}
                  >
                    Khôi phục
                  </button>
                </div>
              </>
            ) : submitOpen ? (
              <>
                <h2 id="modal-title">Nộp bài luyện tập?</h2>
                <p className="muted">
                  Bạn đã trả lời {Object.keys(answers).length}/
                  {questions.length} câu.{" "}
                  {Object.keys(answers).length < questions.length
                    ? "Câu chưa trả lời sẽ được tính là chưa đúng."
                    : "Kết quả và lời giải sẽ được lưu trong lịch sử."}
                </p>
                <div className="modal-actions">
                  <button
                    className="btn secondary"
                    onClick={() => setSubmitOpen(false)}
                  >
                    Làm tiếp
                  </button>
                  <button className="btn primary" onClick={finishExam}>
                    Nộp bài
                    <Check size={16} />
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 id="modal-title">Kết thúc phiên luyện tập?</h2>
                <p className="muted">
                  Nộp bài để lưu các đáp án hiện tại, hoặc rời phiên và bỏ bài
                  chưa hoàn thành.
                </p>
                <div className="modal-actions">
                  <button
                    className="btn secondary"
                    onClick={() => {
                      setExitOpen(false);
                      setExamStatus("intro");
                    }}
                  >
                    Bỏ phiên
                  </button>
                  <button
                    className="btn primary"
                    onClick={() => {
                      setExitOpen(false);
                      finishExam();
                    }}
                  >
                    Nộp & lưu kết quả
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({
  icon,
  color,
  label,
  value,
  suffix,
  note,
}: {
  icon: React.ReactNode;
  color: string;
  label: string;
  value: string;
  suffix: string;
  note: string;
}) {
  return (
    <section className="panel stat">
      <div className={`stat-icon ${color}`}>{icon}</div>
      <p>{label}</p>
      <div className="stat-value">
        {value}
        <span>{suffix}</span>
      </div>
      <small>{note}</small>
    </section>
  );
}
function PageHeading({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text: string;
}) {
  return (
    <div className="page-heading">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p className="muted">{text}</p>
    </div>
  );
}
