import { Client } from "pg";
import { hashPassword } from "../lib/server/password.ts";

const username = (process.env.BOOTSTRAP_ADMIN_USERNAME || "tungnx")
  .trim()
  .toLowerCase();
const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
if (
  !process.env.DATABASE_URL ||
  !password ||
  password.length < 6 ||
  password.length > 128 ||
  !/^[a-z0-9_]{3,32}$/.test(username)
)
  throw new Error(
    "Cấu hình DATABASE_URL và BOOTSTRAP_ADMIN_PASSWORD (6–128 ký tự) trước khi seed.",
  );
const client = new Client({ connectionString: process.env.DATABASE_URL });
try {
  await client.connect();
  const hash = await hashPassword(password);
  const result = await client.query(
    `INSERT INTO accounts(username, display_name, password_hash, role)
    VALUES($1, $2, $3, 'admin') ON CONFLICT(username) DO NOTHING RETURNING id`,
    [username, "Quản trị viên", hash],
  );
  if (!result.rowCount) {
    const existing = await client.query(
      "SELECT role FROM accounts WHERE username = $1",
      [username],
    );
    if (existing.rows[0]?.role !== "admin")
      throw new Error("Username đã tồn tại với vai trò khác.");
  }
  console.log(
    result.rowCount
      ? `Đã tạo admin ${username}. Đổi mật khẩu ở lần đăng nhập đầu tiên.`
      : `Admin ${username} đã tồn tại. Giữ mật khẩu hiện tại.`,
  );
} catch {
  console.error("Không tạo được admin. Kiểm tra migration và cấu hình seed.");
  process.exitCode = 1;
} finally {
  await client.end();
}
