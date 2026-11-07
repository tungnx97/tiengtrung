import { existsSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const binary = path.join(
  root,
  ".sites-runtime/postgresql/pgsql/bin/pg_ctl.exe",
);
const data = path.join(root, ".sites-runtime/postgres-data");
const command = process.argv[2];
if (!["start", "stop"].includes(command))
  throw new Error("Dùng start hoặc stop.");
if (!existsSync(binary) || !existsSync(path.join(data, "PG_VERSION")))
  throw new Error(
    "PostgreSQL local chưa được khởi tạo. Xem docs/database.md để dùng PostgreSQL của bạn.",
  );
const status = spawnSync(binary, ["-D", data, "status"], {
  windowsHide: true,
  stdio: "ignore",
});
if (
  (command === "start" && status.status === 0) ||
  (command === "stop" && status.status !== 0)
) {
  console.log(
    command === "start"
      ? "PostgreSQL local đang chạy ở 127.0.0.1:55432."
      : "PostgreSQL local đã dừng.",
  );
} else {
  const args =
    command === "start"
      ? [
          "-D",
          data,
          "-l",
          path.join(root, ".sites-runtime/postgres.log"),
          "-o",
          "-h 127.0.0.1 -p 55432",
          "-w",
          "start",
        ]
      : ["-D", data, "-m", "fast", "-w", "stop"];
  const result = spawnSync(binary, args, {
    windowsHide: true,
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  process.exitCode = result.status || 0;
}
