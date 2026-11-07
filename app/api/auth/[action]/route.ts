import { hashPassword, verifyPassword } from "@/lib/server/password";
import { HttpError, transaction, withDatabase } from "@/lib/server/postgres";
import {
  assertSameOrigin,
  createSession,
  displayNameValue,
  errorResponse,
  findAccount,
  jsonResponse,
  limitAttempts,
  passwordValue,
  publicAccount,
  readBody,
  readSessionToken,
  requireAccount,
  sessionCookie,
  tokenHash,
  usernameValue,
  type AccountRow,
} from "@/lib/server/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
type Context = { params: Promise<{ action: string }> };

export async function GET(
  request: Request,
  context: Context,
): Promise<Response> {
  const { action } = await context.params;
  if (action !== "session")
    return jsonResponse({ error: "Không tìm thấy chức năng." }, 404);
  if (!readSessionToken(request)) return jsonResponse({ account: null });
  try {
    return await withDatabase(async (client) => {
      const account = await findAccount(client, request);
      return jsonResponse({ account: account ? publicAccount(account) : null });
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(
  request: Request,
  context: Context,
): Promise<Response> {
  try {
    assertSameOrigin(request);
    const { action } = await context.params;
    const body = await readBody(request);
    if (action === "register") {
      const username = usernameValue(body.username);
      const displayName = displayNameValue(body.displayName);
      const password = passwordValue(body.password);
      return await withDatabase(async (client) => {
        await limitAttempts(client, `register:${username}`);
        const hash = await hashPassword(password);
        return transaction(client, async () => {
          // Public registration always assigns the user role on the server.
          const result = await client.query<AccountRow>(
            `INSERT INTO accounts(username, display_name, password_hash, role, must_change_password, last_login_at)
             VALUES($1, $2, $3, 'user', false, now())
             ON CONFLICT(username) DO NOTHING RETURNING *`,
            [username, displayName, hash],
          );
          const account = result.rows[0];
          if (!account)
            throw new HttpError(409, "Tên đăng nhập này đã được sử dụng.");
          await client.query(
            "INSERT INTO account_audit_logs(actor_id, target_id, action) VALUES($1, $1, 'account.created')",
            [account.id],
          );
          const token = await createSession(client, account.id);
          return jsonResponse(
            { account: publicAccount(account) },
            201,
            sessionCookie(token, request),
          );
        });
      });
    }
    if (action === "login") {
      const username = usernameValue(body.username);
      const password = passwordValue(body.password, 1);
      return await withDatabase(async (client) => {
        await limitAttempts(client, `login:${username}`);
        return transaction(client, async () => {
          const result = await client.query<AccountRow>(
            "SELECT * FROM accounts WHERE username = $1 FOR UPDATE",
            [username],
          );
          const account = result.rows[0];
          // Spend the same KDF effort for unknown accounts to reduce enumeration by timing.
          const encoded =
            account?.password_hash ||
            `pbkdf2_sha256$600000$${"0".repeat(32)}$${"0".repeat(64)}`;
          const verified = await verifyPassword(password, encoded);
          if (!account?.is_active || !verified)
            throw new HttpError(401, "Tên đăng nhập hoặc mật khẩu không đúng.");
          await client.query(
            "DELETE FROM account_sessions WHERE expires_at <= now()",
          );
          const token = await createSession(client, account.id);
          await client.query(
            "UPDATE accounts SET last_login_at = now() WHERE id = $1",
            [account.id],
          );
          await client.query(
            "DELETE FROM auth_rate_limits WHERE scope_key = $1",
            [tokenHash(`login:${username}`)],
          );
          await client.query(
            "DELETE FROM auth_rate_limits WHERE window_started_at < now() - interval '1 day'",
          );
          return jsonResponse(
            { account: publicAccount(account) },
            200,
            sessionCookie(token, request),
          );
        });
      });
    }
    if (action === "logout") {
      const token = readSessionToken(request);
      if (token)
        await withDatabase(async (client) => {
          await client.query(
            "DELETE FROM account_sessions WHERE token_hash = $1",
            [tokenHash(token)],
          );
        });
      return jsonResponse({ ok: true }, 200, sessionCookie("", request));
    }
    if (action === "password") {
      const currentPassword = passwordValue(body.currentPassword, 1);
      const newPassword = passwordValue(body.newPassword);
      if (currentPassword === newPassword)
        throw new HttpError(400, "Mật khẩu mới cần khác mật khẩu hiện tại.");
      return await withDatabase(async (client) => {
        const sessionAccount = await requireAccount(client, request, true);
        await limitAttempts(client, `password:${sessionAccount.id}`);
        return transaction(client, async () => {
          const result = await client.query<AccountRow>(
            "SELECT * FROM accounts WHERE id = $1 FOR UPDATE",
            [sessionAccount.id],
          );
          const account = result.rows[0];
          // Recheck the session after acquiring the account lock. A concurrent password change revokes it.
          await requireAccount(client, request, true);
          if (
            !account?.is_active ||
            !(await verifyPassword(currentPassword, account.password_hash))
          )
            throw new HttpError(400, "Mật khẩu hiện tại không đúng.");
          const hash = await hashPassword(newPassword);
          await client.query(
            `UPDATE accounts SET password_hash = $1, must_change_password = false,
            password_changed_at = now(), updated_at = now() WHERE id = $2`,
            [hash, account.id],
          );
          await client.query(
            "DELETE FROM account_sessions WHERE account_id = $1",
            [account.id],
          );
          const token = await createSession(client, account.id);
          await client.query(
            "INSERT INTO account_audit_logs(actor_id, target_id, action) VALUES($1, $1, 'password.changed')",
            [account.id],
          );
          await client.query(
            "DELETE FROM auth_rate_limits WHERE scope_key = $1",
            [tokenHash(`password:${account.id}`)],
          );
          return jsonResponse(
            {
              account: publicAccount({
                ...account,
                must_change_password: false,
              }),
            },
            200,
            sessionCookie(token, request),
          );
        });
      });
    }
    return jsonResponse({ error: "Không tìm thấy chức năng." }, 404);
  } catch (error) {
    return errorResponse(error);
  }
}
