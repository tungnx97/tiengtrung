import { HttpError, transaction, withDatabase } from "@/lib/server/postgres";
import { assertSameOrigin, displayNameValue, errorResponse, jsonResponse, managedAccount, readBody, requireAdmin, type AccountRow } from "@/lib/server/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context): Promise<Response> {
  try {
    assertSameOrigin(request);
    const { id } = await context.params;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) throw new HttpError(400, "Tài khoản không hợp lệ.");
    const body = await readBody(request);
    const displayName = displayNameValue(body.displayName);
    if ((body.role !== "user" && body.role !== "admin") || typeof body.isActive !== "boolean") throw new HttpError(400, "Vai trò hoặc trạng thái không hợp lệ.");
    return await withDatabase(client => transaction(client, async () => {
      await client.query("SELECT pg_advisory_xact_lock(hashtext('hsk_account_admin_changes'))");
      const admin = await requireAdmin(client, request);
      const found = await client.query<AccountRow>("SELECT * FROM accounts WHERE id = $1 FOR UPDATE", [id]);
      const account = found.rows[0];
      if (!account) throw new HttpError(404, "Không tìm thấy tài khoản.");
      if (admin.id === id && (body.role !== "admin" || !body.isActive)) throw new HttpError(400, "Không thể khóa hoặc hạ quyền tài khoản đang đăng nhập.");
      if (account.role === "admin" && account.is_active && (body.role !== "admin" || !body.isActive)) {
        const count = await client.query<{ count: string }>("SELECT count(*) AS count FROM accounts WHERE role = 'admin' AND is_active = true");
        if (Number(count.rows[0].count) <= 1) throw new HttpError(400, "Cần giữ lại ít nhất một admin đang hoạt động.");
      }
      const result = await client.query<AccountRow>("UPDATE accounts SET display_name=$1, role=$2, is_active=$3, updated_at=now() WHERE id=$4 RETURNING *", [displayName, body.role, body.isActive, id]);
      if (!body.isActive || body.role !== account.role) await client.query("DELETE FROM account_sessions WHERE account_id=$1", [id]);
      return jsonResponse({ account: managedAccount(result.rows[0]) });
    }));
  } catch (error) { return errorResponse(error); }
}
