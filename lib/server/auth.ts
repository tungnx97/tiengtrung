import { createHash, randomBytes } from "node:crypto";
import type { Client } from "pg";
import type { Account, ManagedAccount } from "../account-types";
import { HttpError } from "./postgres";

export const SESSION_COOKIE = "hsk_session";
export const SESSION_SECONDS = 60 * 60 * 24 * 7;
export type AccountRow = {
  id: string;
  username: string;
  display_name: string;
  role: "user" | "admin";
  must_change_password: boolean;
  is_active: boolean;
  password_hash: string;
  created_at: Date;
  last_login_at: Date | null;
};

export function publicAccount(row: AccountRow): Account {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    role: row.role,
    mustChangePassword: row.must_change_password,
  };
}

export function managedAccount(row: AccountRow): ManagedAccount {
  return {
    ...publicAccount(row),
    isActive: row.is_active,
    createdAt: row.created_at.toISOString(),
    lastLoginAt: row.last_login_at?.toISOString() || null,
  };
}

export function tokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function readSessionToken(request: Request): string | null {
  const value = request.headers
    .get("cookie")
    ?.split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${SESSION_COOKIE}=`))
    ?.slice(SESSION_COOKIE.length + 1);
  return value && /^[a-f0-9]{64}$/.test(value) ? value : null;
}

export async function findAccount(
  client: Client,
  request: Request,
): Promise<AccountRow | null> {
  const token = readSessionToken(request);
  if (!token) return null;
  const result = await client.query<AccountRow>(
    `SELECT a.* FROM account_sessions s JOIN accounts a ON a.id = s.account_id
     WHERE s.token_hash = $1 AND s.expires_at > now() AND a.is_active = true`,
    [tokenHash(token)],
  );
  return result.rows[0] || null;
}

export async function requireAccount(
  client: Client,
  request: Request,
  allowPasswordChange = false,
): Promise<AccountRow> {
  const account = await findAccount(client, request);
  if (!account)
    throw new HttpError(
      401,
      "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
    );
  if (account.must_change_password && !allowPasswordChange)
    throw new HttpError(403, "Vui lòng đổi mật khẩu trước khi tiếp tục.");
  return account;
}

export async function requireAdmin(
  client: Client,
  request: Request,
): Promise<AccountRow> {
  const account = await requireAccount(client, request);
  if (account.role !== "admin")
    throw new HttpError(403, "Chỉ admin có quyền quản lý tài khoản.");
  return account;
}

export async function createSession(
  client: Client,
  accountId: string,
): Promise<string> {
  const token = randomBytes(32).toString("hex");
  await client.query(
    `INSERT INTO account_sessions(token_hash, account_id, expires_at)
    VALUES($1, $2, now() + interval '7 days')`,
    [tokenHash(token), accountId],
  );
  return token;
}

export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  const allowedOrigin = process.env.APP_ORIGIN || new URL(request.url).origin;
  let localAlias = false;
  if (process.env.NODE_ENV === "development" && origin) {
    try {
      const actual = new URL(origin);
      const configured = new URL(allowedOrigin);
      const loopback = new Set(["localhost", "127.0.0.1"]);
      localAlias = loopback.has(actual.hostname) && loopback.has(configured.hostname) &&
        actual.protocol === configured.protocol && actual.port === configured.port &&
        actual.host === request.headers.get("host");
    } catch {
      localAlias = false;
    }
  }
  if (
    (origin !== allowedOrigin && !localAlias) ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    throw new HttpError(403, "Yêu cầu phải được gửi từ trang ứng dụng.");
  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  )
    throw new HttpError(415, "Định dạng yêu cầu không được hỗ trợ.");
}

export async function readBody(
  request: Request,
): Promise<Record<string, unknown>> {
  const body = await request.text();
  if (body.length > 4096) throw new HttpError(413, "Dữ liệu gửi lên quá lớn.");
  try {
    const value: unknown = JSON.parse(body);
    if (!value || typeof value !== "object" || Array.isArray(value))
      throw new Error();
    return value as Record<string, unknown>;
  } catch {
    throw new HttpError(400, "Dữ liệu không hợp lệ.");
  }
}

export function usernameValue(value: unknown): string {
  const username = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (!/^[a-z0-9_]{3,32}$/.test(username))
    throw new HttpError(
      400,
      "Tên đăng nhập gồm 3–32 chữ cái không dấu, số hoặc dấu gạch dưới.",
    );
  return username;
}

export function passwordValue(value: unknown, minimum = 8): string {
  if (typeof value !== "string" || value.length < minimum || value.length > 128)
    throw new HttpError(400, `Mật khẩu cần có từ ${minimum} đến 128 ký tự.`);
  return value;
}

export function displayNameValue(value: unknown): string {
  const displayName = typeof value === "string" ? value.trim() : "";
  if (!displayName || displayName.length > 80)
    throw new HttpError(400, "Tên hiển thị cần có từ 1 đến 80 ký tự.");
  return displayName;
}

export async function limitAttempts(
  client: Client,
  scope: string,
  maximum = 5,
): Promise<void> {
  const result = await client.query<{ attempts: number }>(
    `INSERT INTO auth_rate_limits(scope_key) VALUES($1)
     ON CONFLICT(scope_key) DO UPDATE SET
       attempts = CASE WHEN auth_rate_limits.window_started_at < now() - interval '15 minutes'
         THEN 1 ELSE auth_rate_limits.attempts + 1 END,
       window_started_at = CASE WHEN auth_rate_limits.window_started_at < now() - interval '15 minutes'
         THEN now() ELSE auth_rate_limits.window_started_at END
     RETURNING attempts`,
    [tokenHash(scope)],
  );
  if (result.rows[0].attempts > maximum)
    throw new HttpError(
      429,
      "Bạn đã thử quá nhiều lần. Vui lòng thử lại sau 15 phút.",
    );
}

export function sessionCookie(token: string, request: Request): string {
  const origin = process.env.APP_ORIGIN || request.url;
  const secure = new URL(origin).protocol === "https:" ? "; Secure" : "";
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${token ? SESSION_SECONDS : 0}${secure}`;
}

export function jsonResponse(
  data: unknown,
  status = 200,
  cookie?: string,
): Response {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...(cookie ? { "Set-Cookie": cookie } : {}),
    },
  });
}

export function errorResponse(error: unknown): Response {
  if (error instanceof HttpError)
    return jsonResponse({ error: error.message }, error.status);
  // Keep database details and credentials out of responses and logs.
  return jsonResponse(
    { error: "Chưa kết nối được hệ thống tài khoản. Vui lòng thử lại sau." },
    503,
  );
}
