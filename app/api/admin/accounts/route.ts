import { hashPassword } from "@/lib/server/password";
import { HttpError, transaction, withDatabase } from "@/lib/server/postgres";
import {
  assertSameOrigin,
  displayNameValue,
  errorResponse,
  jsonResponse,
  managedAccount,
  passwordValue,
  readBody,
  requireAdmin,
  usernameValue,
  type AccountRow,
} from "@/lib/server/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  try {
    return await withDatabase(async (client) => {
      await requireAdmin(client, request);
      const result =
        await client.query<AccountRow>(`SELECT id, username, display_name, role,
        must_change_password, is_active, created_at, last_login_at FROM accounts ORDER BY created_at DESC LIMIT 200`);
      return jsonResponse({ accounts: result.rows.map(managedAccount) });
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOrigin(request);
    return await withDatabase(async (client) => {
      await requireAdmin(client, request);
      const body = await readBody(request);
      const username = usernameValue(body.username);
      const password = passwordValue(body.password);
      const displayName = displayNameValue(body.displayName);
      if (body.role !== "user" && body.role !== "admin")
        throw new HttpError(400, "Vai trò không hợp lệ.");
      const hash = await hashPassword(password);
      return transaction(client, async () => {
        const admin = await requireAdmin(client, request);
        const result = await client.query<AccountRow>(
          `INSERT INTO accounts(username, display_name, password_hash, role, created_by)
          VALUES($1, $2, $3, $4, $5) ON CONFLICT(username) DO NOTHING RETURNING *`,
          [username, displayName, hash, body.role, admin.id],
        );
        const account = result.rows[0];
        if (!account)
          throw new HttpError(409, "Tên đăng nhập này đã được sử dụng.");
        await client.query(
          "INSERT INTO account_audit_logs(actor_id, target_id, action) VALUES($1, $2, 'account.created')",
          [admin.id, account.id],
        );
        return jsonResponse({ account: managedAccount(account) }, 201);
      });
    });
  } catch (error) {
    return errorResponse(error);
  }
}
