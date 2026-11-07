"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  LogOut,
  Plus,
  ShieldCheck,
  UserRound,
  Users,
  X,
} from "lucide-react";
import type { Account, ManagedAccount } from "@/lib/account-types";

async function accountRequest<T>(
  path: string,
  body?: Record<string, unknown>,
  method = "POST",
): Promise<T> {
  const response = await fetch(path, {
    method: body ? method : "GET",
    credentials: "same-origin",
    cache: "no-store",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000),
  });
  const data = (await response.json()) as { error?: string };
  if (!response.ok)
    throw new Error(
      data.error || "Không thực hiện được yêu cầu. Vui lòng thử lại.",
    );
  return data as T;
}

function PasswordInput({
  id,
  label,
  autoComplete,
  minimum = 1,
}: {
  id: string;
  label: string;
  autoComplete: string;
  minimum?: number;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="account-field">
      <label htmlFor={id}>{label}</label>
      <div className="password-input">
        <input
          id={id}
          name={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required
          minLength={minimum}
          maxLength={128}
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          aria-label={
            visible
              ? `Ẩn ${label.toLowerCase()}`
              : `Hiện ${label.toLowerCase()}`
          }
        >
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
    </div>
  );
}

function Login({ onLogin }: { onLogin: (account: Account) => void }) {
  const [registering, setRegistering] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (registering && form.get("password") !== form.get("confirmPassword")) {
      setError("Mật khẩu xác nhận chưa khớp.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const data = await accountRequest<{ account: Account }>(
        registering ? "/api/auth/register" : "/api/auth/login",
        {
          username: form.get("username"),
          password: form.get("password"),
          ...(registering ? { displayName: form.get("displayName") } : {}),
        },
      );
      onLogin(data.account);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Chưa thực hiện được. Vui lòng thử lại.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login-page">
      <section className="login-story">
        <a className="brand" href="/">
          <span className="brand-mark" lang="zh-CN">
            漢
          </span>
          <strong>HSK Master.</strong>
        </a>
        <div className="login-story-copy">
          <span className="hero-pill">
            <BookOpen size={14} />
            KHÔNG GIAN HỌC TIẾNG TRUNG
          </span>
          <h1>
            Hôm nay học thêm
            <br />
            <span>một điều mới.</span>
          </h1>
          <p>
            Từ vựng, ngữ pháp và những bài luyện tập nhỏ.
            <br />
            Mỗi ngày một bước tiến trên hành trình của bạn.
          </p>
          <div className="login-characters" aria-hidden="true">
            <span lang="zh-CN">
              学<small>xué · học hỏi</small>
            </span>
            <span lang="zh-CN">
              习<small>xí · luyện tập</small>
            </span>
          </div>
        </div>
        <p className="login-story-footer" lang="zh-CN">
          为梦想，每天进步一点
        </p>
      </section>
      <section className="login-form-side">
        <div className="login-form-card">
          <span className="mini-icon red login-icon">
            <UserRound size={24} />
          </span>
          <p className="eyebrow">
            {registering
              ? "BẮT ĐẦU HÀNH TRÌNH CỦA BẠN"
              : "CHÀO MỪNG BẠN TRỞ LẠI"}
          </p>
          <h2>{registering ? "Đăng ký tài khoản" : "Đăng nhập"}</h2>
          <p className="muted">
            {registering
              ? "Tạo tài khoản và bắt đầu học tiếng Trung ngay hôm nay."
              : "Tiếp tục hành trình học tiếng Trung của bạn."}
          </p>
          <form key={registering ? "register" : "login"} onSubmit={submit}>
            <fieldset disabled={busy}>
              {registering && (
                <label className="account-field" htmlFor="registerDisplayName">
                  <span>Tên hiển thị</span>
                  <input
                    id="registerDisplayName"
                    name="displayName"
                    type="text"
                    autoComplete="name"
                    required
                    maxLength={80}
                    placeholder="Nhập tên của bạn"
                  />
                </label>
              )}
              <label className="account-field" htmlFor="username">
                <span>Tên đăng nhập</span>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                  minLength={3}
                  maxLength={32}
                  placeholder="Nhập tên đăng nhập"
                />
              </label>
              <PasswordInput
                id="password"
                label="Mật khẩu"
                autoComplete={registering ? "new-password" : "current-password"}
                minimum={registering ? 8 : 1}
              />
              {registering && (
                <>
                  <PasswordInput
                    id="confirmPassword"
                    label="Nhập lại mật khẩu"
                    autoComplete="new-password"
                    minimum={8}
                  />
                  <p className="muted small-text">
                    Mật khẩu từ 8 đến 128 ký tự.
                  </p>
                </>
              )}
              {error && (
                <p className="account-error" role="alert">
                  {error}
                </p>
              )}
              <button className="btn primary full" type="submit">
                {busy ? (
                  <LoaderCircle className="spin" size={17} />
                ) : (
                  <>
                    {registering ? "Đăng ký & bắt đầu học" : "Đăng nhập"}
                    <ArrowRight size={17} />
                  </>
                )}
              </button>
            </fieldset>
          </form>
          <div className="account-note">
            <ShieldCheck size={19} />
            <div>
              <p>
                {registering
                  ? "Bạn đã có tài khoản?"
                  : "Bạn chưa có tài khoản?"}
              </p>
              <button
                type="button"
                className="text-btn"
                disabled={busy}
                onClick={() => {
                  setRegistering((value) => !value);
                  setError("");
                }}
              >
                {registering ? "Đăng nhập" : "Đăng ký tài khoản"}
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
        <small className="login-copyright">
          HSK Master · Học một chút, tiến một bước.
        </small>
      </section>
    </main>
  );
}

function ChangePassword({
  required,
  onChanged,
}: {
  required: boolean;
  onChanged: (account: Account) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const data = new FormData(formElement);
    setError("");
    setSuccess(false);
    if (data.get("newPassword") !== data.get("confirmPassword")) {
      setError("Mật khẩu xác nhận chưa khớp.");
      return;
    }
    setBusy(true);
    try {
      const result = await accountRequest<{ account: Account }>(
        "/api/auth/password",
        {
          currentPassword: data.get("currentPassword"),
          newPassword: data.get("newPassword"),
        },
      );
      formElement.reset();
      setSuccess(true);
      onChanged(result.account);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Chưa đổi được mật khẩu.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="change-password">
      <h3>{required ? "Tạo mật khẩu riêng của bạn" : "Đổi mật khẩu"}</h3>
      <p className="muted small-text">
        {required
          ? "Ở lần đăng nhập đầu tiên, hãy thay mật khẩu được cấp bằng mật khẩu riêng để tiếp tục."
          : "Sau khi đổi mật khẩu, các phiên đăng nhập khác sẽ kết thúc."}
      </p>
      <form onSubmit={submit}>
        <fieldset disabled={busy}>
          <PasswordInput
            id="currentPassword"
            label="Mật khẩu hiện tại"
            autoComplete="current-password"
          />
          <PasswordInput
            id="newPassword"
            label="Mật khẩu mới"
            autoComplete="new-password"
            minimum={8}
          />
          <PasswordInput
            id="confirmPassword"
            label="Nhập lại mật khẩu mới"
            autoComplete="new-password"
            minimum={8}
          />
          <small className="muted">Từ 8 đến 128 ký tự.</small>
          {error && (
            <p className="account-error" role="alert">
              {error}
            </p>
          )}
          {success && (
            <p className="account-success" role="status">
              Đã cập nhật mật khẩu.
            </p>
          )}
          <button className="btn primary full" type="submit">
            {busy ? (
              <LoaderCircle size={16} className="spin" />
            ) : (
              <>
                <KeyRound size={16} />
                {required ? "Đổi mật khẩu & bắt đầu học" : "Lưu mật khẩu mới"}
              </>
            )}
          </button>
        </fieldset>
      </form>
    </div>
  );
}

function AdminAccounts() {
  const [accounts, setAccounts] = useState<ManagedAccount[]>([]);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editing, setEditing] = useState<ManagedAccount | null>(null);
  const [page, setPage] = useState(1);
  const filteredAccounts = accounts.filter((account) =>
    `${account.username} ${account.displayName}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()) &&
    (roleFilter === "all" || account.role === roleFilter) &&
    (statusFilter === "all" || String(account.isActive) === statusFilter)
  );
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const pageCount = Math.max(1, Math.ceil(filteredAccounts.length / 5));
  const currentPage = Math.min(page, pageCount);
  const pageAccounts = filteredAccounts.slice((currentPage - 1) * 5, currentPage * 5);
  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const form = new FormData(event.currentTarget);
    setBusy(true); setError(""); setSuccess("");
    try {
      const result = await accountRequest<{ account: ManagedAccount }>(`/api/admin/accounts/${editing.id}`, {
        displayName: form.get("editDisplayName"), role: form.get("editRole"), isActive: form.get("editStatus") === "active",
      }, "PATCH");
      setAccounts(previous => previous.map(account => account.id === result.account.id ? result.account : account));
      setEditing(null); setSuccess("Đã cập nhật tài khoản.");
    } catch (error) { setError(error instanceof Error ? error.message : "Chưa cập nhật được tài khoản."); }
    finally { setBusy(false); }
  }
  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const data = await accountRequest<{ accounts: ManagedAccount[] }>(
        "/api/admin/accounts",
      );
      setAccounts(data.accounts);
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Chưa tải được tài khoản.",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const data = new FormData(formElement);
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const result = await accountRequest<{ account: ManagedAccount }>(
        "/api/admin/accounts",
        {
          username: data.get("newUsername"),
          displayName: data.get("displayName"),
          password: data.get("initialPassword"),
          role: data.get("role"),
        },
      );
      setAccounts((previous) => [result.account, ...previous].slice(0, 200));
      formElement.reset();
      setSuccess(
        `Đã tạo tài khoản ${result.account.username}. Người dùng sẽ đổi mật khẩu khi đăng nhập lần đầu.`,
      );
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Chưa tạo được tài khoản.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="admin-workspace">
      <div className="admin-summary"><div><span>Tổng tài khoản</span><strong>{accounts.length}</strong></div><div><span>Đang hoạt động</span><strong>{accounts.filter(account => account.isActive).length}</strong></div><div><span>Quản trị viên</span><strong>{accounts.filter(account => account.role === "admin").length}</strong></div><div><span>Đã khóa</span><strong>{accounts.filter(account => !account.isActive).length}</strong></div></div>
      <div className="admin-accounts">
      <section className="admin-create">
        <h3>
          <Plus size={18} />
          {editing ? "Chỉnh sửa tài khoản" : "Tạo tài khoản"}
        </h3>
        <p className="muted small-text">
          {editing ? "Cập nhật tên, vai trò và trạng thái tài khoản." : "Cấp tài khoản và mật khẩu ban đầu cho người học."}
        </p>
        {editing ? <form key={editing.id} onSubmit={saveEdit}><fieldset disabled={busy}><h3>Chỉnh sửa @{editing.username}</h3><label className="account-field">Tên hiển thị<input name="editDisplayName" defaultValue={editing.displayName} required maxLength={80}/></label><label className="account-field">Vai trò<select name="editRole" defaultValue={editing.role}><option value="user">User</option><option value="admin">Admin</option></select></label><label className="account-field">Trạng thái<select name="editStatus" defaultValue={editing.isActive ? "active" : "locked"}><option value="active">Hoạt động</option><option value="locked">Đã khóa</option></select></label>{error && <p className="account-error" role="alert">{error}</p>}<div className="admin-edit-actions"><button className="btn save-edit" type="submit">Lưu thay đổi</button><button className="btn cancel-edit" type="button" onClick={() => { setEditing(null); setError(""); }}>Hủy</button></div></fieldset></form> : <form onSubmit={submit}>
          <fieldset disabled={busy}>
            <label className="account-field" htmlFor="displayName">
              <span>Tên hiển thị</span>
              <input
                id="displayName"
                name="displayName"
                required
                maxLength={80}
                placeholder="Ví dụ Nguyễn Minh Anh"
                autoComplete="off"
              />
            </label>
            <label className="account-field" htmlFor="newUsername">
              <span>Tên đăng nhập</span>
              <input
                id="newUsername"
                name="newUsername"
                required
                minLength={3}
                maxLength={32}
                pattern="[a-zA-Z0-9_]{3,32}"
                placeholder="minhanh"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
              />
              <small>3–32 chữ cái không dấu, số hoặc dấu gạch dưới.</small>
            </label>
            <PasswordInput
              id="initialPassword"
              label="Mật khẩu ban đầu"
              minimum={8}
              autoComplete="new-password"
            />
            <label className="account-field" htmlFor="role">
              <span>Vai trò</span>
              <select id="role" name="role" defaultValue="user">
                <option value="user">User · Người học</option>
                <option value="admin">Admin · Quản trị viên</option>
              </select>
            </label>
            {error && (
              <p className="account-error" role="alert">
                {error}
              </p>
            )}
            {success && (
              <p className="account-success" role="status">
                {success}
              </p>
            )}
            <button className="btn primary full" type="submit">
              {busy ? (
                <LoaderCircle size={16} className="spin" />
              ) : (
                <>
                  <Plus size={16} />
                  Tạo tài khoản
                </>
              )}
            </button>
          </fieldset>
        </form>}
      </section>
      <section className="admin-list">
        <div className="section-head">
          <h3>
            <Users size={18} />
            Tài khoản đã cấp
          </h3>
          <button className="text-btn" onClick={load} disabled={loading}>
            Tải lại
          </button>
        </div>
        <p className="muted small-text">200 tài khoản được tạo gần nhất.</p>
        <div className="admin-filters">
          <label className="account-field">Tìm người dùng<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tên hoặc tài khoản" /></label>
          <label className="account-field">Vai trò<select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}><option value="all">Tất cả vai trò</option><option value="admin">Admin</option><option value="user">User</option></select></label>
          <label className="account-field">Trạng thái<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">Tất cả trạng thái</option><option value="true">Hoạt động</option><option value="false">Đã khóa</option></select></label>
        </div>
        {!loading && !loadError && <p className="muted small-text">{filteredAccounts.length} tài khoản phù hợp · {accounts.filter((account) => account.isActive).length} hoạt động · {accounts.filter((account) => !account.isActive).length} đã khóa</p>}
        {loading ? (
          <p className="account-loading">
            <LoaderCircle size={18} className="spin" />
            Đang tải…
          </p>
        ) : loadError ? (
          <p className="account-error" role="alert">
            {loadError}
          </p>
        ) : (
          <div className="admin-account-list">
            {pageAccounts.map((account) => (
              <article key={account.id}>
                <span
                  className={`mini-icon ${account.role === "admin" ? "red" : "blue"}`}
                >
                  {account.role === "admin" ? (
                    <ShieldCheck size={17} />
                  ) : (
                    <UserRound size={17} />
                  )}
                </span>
                <div>
                  <strong>{account.displayName}</strong>
                  <small>@{account.username}</small>
                  <small>{account.isActive ? "Đang hoạt động" : "Đã khóa"}</small>
                  <small>Tham gia {new Date(account.createdAt).toLocaleDateString("vi-VN")}</small>
                  <small>
                    {account.mustChangePassword
                      ? "Chờ đổi mật khẩu lần đầu"
                      : account.lastLoginAt
                        ? `Đăng nhập ${new Date(account.lastLoginAt).toLocaleDateString("vi-VN")}`
                        : "Chưa đăng nhập"}
                  </small>
                </div>
                <span
                  className={`tag ${account.role === "admin" ? "red-tag" : "neutral"}`}
                >
                  {account.role}
                </span>
                <button className="text-btn" onClick={() => { setEditing(account); setError(""); setSuccess(""); }}>Chỉnh sửa</button>
              </article>
            ))}
            {!filteredAccounts.length && <p className="muted small-text">Không tìm thấy tài khoản phù hợp.</p>}
          </div>
        )}
        <div className="admin-pagination"><button className="btn secondary" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>Trước</button><span>Trang {currentPage} / {pageCount}</span><button className="btn secondary" disabled={currentPage >= pageCount} onClick={() => setPage(currentPage + 1)}>Sau</button></div>
      </section>
      </div>
    </div>
  );
}

function AccountPanel({
  account,
  onChanged,
  onClose,
  onLogout,
}: {
  account: Account;
  onChanged: (account: Account) => void;
  onClose: () => void;
  onLogout: () => void;
}) {
  const [panel, setPanel] = useState(
    account.role === "admin" ? "admin" : "profile",
  );
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    ref.current?.querySelector<HTMLElement>("button")?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function key(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;
      const controls = Array.from(
        ref.current?.querySelectorAll<HTMLElement>(
          "button:not(:disabled),input:not(:disabled),select:not(:disabled)",
        ) || [],
      );
      const first = controls[0],
        last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, [onClose]);
  return (
    <div className="modal-overlay account-overlay">
      <div
        className="panel account-modal"
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-title"
      >
        <div className="account-modal-head">
          <div>
            <p className="eyebrow">
              {account.role === "admin"
                ? "KHU VỰC QUẢN TRỊ"
                : "TÀI KHOẢN CỦA BẠN"}
            </p>
            <h2 id="account-title">{account.displayName}</h2>
            <p className="muted small-text">
              @{account.username}{" "}
              <span className="tag neutral">{account.role}</span>
            </p>
          </div>
          <button
            className="icon-btn"
            aria-label="Đóng quản lý tài khoản"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        <div className="account-panel-nav">
          {account.role === "admin" && (
            <button
              className={panel === "admin" ? "active" : ""}
              onClick={() => setPanel("admin")}
            >
              <Users size={16} />
              Quản lý tài khoản
            </button>
          )}
          <button
            className={panel === "profile" ? "active" : ""}
            onClick={() => setPanel("profile")}
          >
            <KeyRound size={16} />
            Mật khẩu
          </button>
          <button className="logout-btn" onClick={onLogout}>
            <LogOut size={15} />
            Đăng xuất
          </button>
        </div>
        {panel === "admin" && account.role === "admin" ? (
          <AdminAccounts />
        ) : (
          <ChangePassword required={false} onChanged={onChanged} />
        )}
      </div>
    </div>
  );
}

export function AccountShell({
  children,
}: {
  children: (session: {
    account: Account;
    openAccount: () => void;
  }) => ReactNode;
}) {
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const sessionRevision = useRef(0);
  const updateAccount = useCallback((nextAccount: Account) => {
    sessionRevision.current += 1;
    setAccount(nextAccount);
  }, []);
  const closePanel = useCallback(() => setPanelOpen(false), []);
  const refresh = useCallback(async () => {
    const revision = sessionRevision.current;
    try {
      const data = await accountRequest<{ account: Account | null }>(
        "/api/auth/session",
      );
      if (revision !== sessionRevision.current) return;
      setAccount(data.account);
      setError("");
    } catch {
      if (revision === sessionRevision.current)
        setError(
          "Không kiểm tra được phiên đăng nhập. Hãy kiểm tra kết nối và thử lại.",
        );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  useEffect(() => {
    if (!account) return;
    const timer = setInterval(() => {
      void refresh();
    }, 60_000);
    const focus = () => {
      void refresh();
    };
    window.addEventListener("focus", focus);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", focus);
    };
  }, [account?.id, refresh]);
  async function logout() {
    sessionRevision.current += 1;
    try {
      await accountRequest("/api/auth/logout", {});
      sessionRevision.current += 1;
      setAccount(null);
      setPanelOpen(false);
      setError("");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Chưa đăng xuất được. Vui lòng thử lại.",
      );
    }
  }
  if (loading)
    return (
      <div className="session-loading">
        <span className="brand-mark" lang="zh-CN">
          漢
        </span>
        <LoaderCircle className="spin" size={23} />
        <p>Đang mở không gian học tập…</p>
      </div>
    );
  if (!account)
    return (
      <>
        {error && (
          <div className="session-warning" role="alert">
            {error}
            <button onClick={refresh}>Thử lại</button>
          </div>
        )}
        <Login onLogin={updateAccount} />
      </>
    );
  if (account.mustChangePassword)
    return (
      <main className="first-password-page">
        <div className="panel first-password-card">
          <span className="brand-mark" lang="zh-CN">
            漢
          </span>
          <p className="eyebrow">XIN CHÀO, {account.username}</p>
          <ChangePassword required onChanged={updateAccount} />
          {error && (
            <p className="account-error" role="alert">
              {error}
            </p>
          )}
          <button className="text-btn" onClick={logout}>
            <ArrowLeft size={14} />
            Đăng xuất
          </button>
        </div>
      </main>
    );
  return (
    <>
      {error && (
        <div className="session-warning" role="alert">
          {error}
          <button onClick={refresh}>Thử lại</button>
        </div>
      )}
      {children({ account, openAccount: () => setPanelOpen(true) })}
      {panelOpen && (
        <AccountPanel
          account={account}
          onChanged={updateAccount}
          onClose={closePanel}
          onLogout={logout}
        />
      )}
    </>
  );
}
