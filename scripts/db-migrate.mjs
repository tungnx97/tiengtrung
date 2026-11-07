import { readdir, readFile } from "node:fs/promises";
import { Client } from "pg";

const connectionString =
  process.env.MIGRATION_DATABASE_URL || process.env.DATABASE_URL;
if (!connectionString)
  throw new Error("Hãy cấu hình DATABASE_URL trong .env.local.");
const client = new Client({ connectionString });
try {
  await client.connect();
  await client.query("BEGIN");
  await client.query(
    "SELECT pg_advisory_xact_lock(hashtext('hsk_master_migrations'))",
  );
  await client.query(
    "CREATE TABLE IF NOT EXISTS app_migrations(name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())",
  );
  const directory = new URL("../db/postgres/", import.meta.url);
  const files = (await readdir(directory))
    .filter((name) => name.endsWith(".sql"))
    .sort();
  for (const name of files) {
    const applied = await client.query(
      "SELECT name FROM app_migrations WHERE name = $1",
      [name],
    );
    if (applied.rowCount) continue;
    await client.query(await readFile(new URL(name, directory), "utf8"));
    await client.query("INSERT INTO app_migrations(name) VALUES($1)", [name]);
    console.log(`Đã áp dụng ${name}`);
  }
  await client.query("COMMIT");
  console.log("PostgreSQL đã cập nhật schema.");
} catch (error) {
  await client.query("ROLLBACK").catch(() => {});
  console.error(
    "Migration thất bại. Kiểm tra kết nối và quyền tạo bảng PostgreSQL.",
  );
  process.exitCode = 1;
} finally {
  await client.end();
}
