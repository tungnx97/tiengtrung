import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { Client } from "pg";
import { hashPassword, verifyPassword } from "../lib/server/password.ts";

// This test creates and removes its own accounts in a running local application.
const origin = process.env.APP_ORIGIN || "http://127.0.0.1:5173";
if (
  new URL(origin).hostname !== "127.0.0.1" ||
  !process.env.DATABASE_URL ||
  new URL(process.env.DATABASE_URL).hostname !== "127.0.0.1"
)
  throw new Error(
    "Chỉ chạy integration test với web và PostgreSQL tại 127.0.0.1.",
  );
const client = new Client({ connectionString: process.env.DATABASE_URL });
const tag = `qa_${randomBytes(5).toString("hex")}`;
const password = randomBytes(18).toString("hex");
const ids = [];
const scopes = [];
async function request(path, { body, cookie, requestOrigin = origin, method = 'POST' } = {}) {
  const response = await fetch(`${origin}${path}`, {
    method: body ? method : "GET",
    headers: {
      ...(body
        ? { "Content-Type": "application/json", Origin: requestOrigin }
        : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json();
  return {
    status: response.status,
    data,
    cookie: response.headers.get("set-cookie")?.split(";")[0],
    headers: response.headers,
  };
}
async function login(username, suppliedPassword = password) {
  scopes.push(`login:${username}`);
  return request("/api/auth/login", {
    body: { username, password: suppliedPassword },
  });
}
try {
  await client.connect();
  const hash = await hashPassword(password);
  assert.ok(await verifyPassword(password, hash));
  assert.equal(await verifyPassword("wrong-password", hash), false);
  const adminRow = await client.query(
    `INSERT INTO accounts(username, display_name, password_hash, role, must_change_password)
    VALUES($1, 'QA Admin', $2, 'admin', false) RETURNING id`,
    [`${tag}_admin`, hash],
  );
  ids.push(adminRow.rows[0].id);
  assert.equal((await request("/api/admin/accounts")).status, 401);
  assert.equal(
    (
      await request("/api/admin/accounts", {
        body: {},
        requestOrigin: "https://example.invalid",
      })
    ).status,
    403,
  );

  const adminLogin = await login(`${tag}_admin`);
  assert.equal(adminLogin.status, 200);
  const localhostLogin = await fetch(`http://localhost:${new URL(origin).port}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: `http://localhost:${new URL(origin).port}` },
    body: JSON.stringify({ username: `${tag}_admin`, password }),
  });
  assert.equal(localhostLogin.status, 200);
  assert.ok(adminLogin.headers.get("set-cookie").includes("HttpOnly"));
  assert.ok(adminLogin.headers.get("set-cookie").includes("SameSite=Lax"));
  assert.equal(adminLogin.data.account.password_hash, undefined);
  const adminCookie = adminLogin.cookie;
  const username = `${tag}_user`;
  const createBody = {
    username,
    displayName: "QA User",
    password,
    role: "user",
  };
  const simultaneous = await Promise.all(
    [1, 2].map(() =>
      request("/api/admin/accounts", { cookie: adminCookie, body: createBody }),
    ),
  );
  assert.deepEqual(
    simultaneous.map((result) => result.status).sort(),
    [201, 409],
  );
  const created = simultaneous.find((result) => result.status === 201).data
    .account;
  ids.push(created.id);
  assert.equal(created.mustChangePassword, true);
  const pendingLogin = await login(username);
  assert.equal(
    (await request("/api/admin/accounts", { cookie: pendingLogin.cookie }))
      .status,
    403,
  );
  const registration = {
    username: `${tag}_join`,
    displayName: "Người học tự đăng ký",
    password,
  };
  scopes.push(`register:${registration.username}`);
  assert.equal(
    (
      await request("/api/auth/register", {
        body: registration,
        requestOrigin: "https://example.invalid",
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await request("/api/auth/register", {
        body: { ...registration, password: "short" },
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await request("/api/auth/register", {
        body: { ...registration, displayName: " " },
      })
    ).status,
    400,
  );
  const registered = await request("/api/auth/register", {
    body: {
      ...registration,
      role: "admin",
      must_change_password: true,
      created_by: ids[0],
    },
  });
  if (registered.status === 201) ids.push(registered.data.account.id);
  assert.equal(registered.status, 201);
  assert.equal(registered.data.account.role, "user");
  assert.equal(registered.data.account.mustChangePassword, false);
  assert.equal(registered.data.account.password_hash, undefined);
  assert.ok(registered.cookie);
  assert.equal(
    (await request("/api/auth/session", { cookie: registered.cookie })).data
      .account.id,
    registered.data.account.id,
  );
  assert.equal(
    (await request("/api/admin/accounts", { cookie: registered.cookie }))
      .status,
    403,
  );
  assert.equal(
    (
      await request("/api/admin/accounts", {
        cookie: registered.cookie,
        body: createBody,
      })
    ).status,
    403,
  );
  const persisted = await client.query(
    "SELECT role, created_by FROM accounts WHERE id = $1",
    [registered.data.account.id],
  );
  assert.equal(persisted.rows[0].role, "user");
  assert.equal(persisted.rows[0].created_by, null);

  const raceUsername = `${tag}_public`;
  scopes.push(`register:${raceUsername}`);
  const registrations = await Promise.all(
    [raceUsername, raceUsername.toUpperCase()].map((name) =>
      request("/api/auth/register", {
        body: { ...registration, username: name },
      }),
    ),
  );
  for (const response of registrations)
    if (response.status === 201) ids.push(response.data.account.id);
  assert.deepEqual(
    registrations.map((response) => response.status).sort(),
    [201, 409],
  );
  const publicAccount = registrations.find(
    (response) => response.status === 201,
  ).data.account;
  assert.equal(publicAccount.role, "user");
  assert.equal(publicAccount.username, raceUsername);
  assert.equal((await login(raceUsername)).status, 200);
  assert.equal(
    (
      await request("/api/admin/accounts", {
        cookie: adminCookie,
        body: { ...createBody, username: `${tag}_invalid`, role: "owner" },
      })
    ).status,
    400,
  );

  scopes.push(`password:${created.id}`);
  const newPassword = randomBytes(18).toString("hex");
  const changed = await request("/api/auth/password", {
    cookie: pendingLogin.cookie,
    body: { currentPassword: password, newPassword },
  });
  assert.equal(changed.status, 200);
  assert.equal(changed.data.account.mustChangePassword, false);
  assert.equal(
    (await request("/api/auth/session", { cookie: pendingLogin.cookie })).data
      .account,
    null,
  );
  assert.equal((await login(username)).status, 401);
  const userLogin = await login(username, newPassword);
  assert.equal(userLogin.status, 200);
  const editBody = {displayName: "Tên đã sửa", role: "user", isActive: false};
  const accountPath = `/api/admin/accounts/${created.id}`;
  assert.equal((await request(accountPath, {cookie: userLogin.cookie, body: editBody, method: 'PATCH'})).status, 403);
  assert.equal((await request(`/api/admin/accounts/${ids[0]}`, {cookie: adminCookie, body: {displayName:"QA Admin", role:"user", isActive:true}, method:'PATCH'})).status, 400);
  const locked = await request(accountPath, {cookie:adminCookie, body:editBody, method:'PATCH'});
  assert.equal(locked.status, 200);
  assert.equal(locked.data.account.isActive, false);
  assert.equal((await request('/api/auth/session', {cookie:userLogin.cookie})).data.account, null);
  assert.equal((await login(username, newPassword)).status, 401);
  const unlocked = await request(accountPath, {cookie:adminCookie, body:{...editBody,isActive:true}, method:'PATCH'});
  assert.equal(unlocked.status, 200);
  assert.equal(unlocked.data.account.displayName, 'Tên đã sửa');
  const refreshedLogin = await login(username, newPassword);
  assert.equal(refreshedLogin.status, 200);
  assert.equal(
    (await request("/api/admin/accounts", { cookie: refreshedLogin.cookie })).status,
    403,
  );
  assert.equal(
    (
      await request("/api/admin/accounts", {
        cookie: refreshedLogin.cookie,
        body: { ...createBody, username: `${tag}_forged`, role: "admin" },
      })
    ).status,
    403,
  );
  const logout = await request("/api/auth/logout", {
    cookie: refreshedLogin.cookie,
    body: {},
  });
  assert.equal(logout.status, 200);
  assert.equal(
    (await request("/api/auth/session", { cookie: refreshedLogin.cookie })).data
      .account,
    null,
  );

  const blockedName = `${tag}_blocked`;
  for (let attempt = 0; attempt < 5; attempt++)
    assert.equal((await login(blockedName, "incorrect")).status, 401);
  assert.equal((await login(blockedName, "incorrect")).status, 429);
  const stored = await client.query(
    "SELECT token_hash FROM account_sessions WHERE account_id = $1",
    [ids[0]],
  );
  assert.ok(
    stored.rows.every(
      (row) =>
        /^[a-f0-9]{64}$/.test(row.token_hash) &&
        !adminCookie.includes(row.token_hash),
    ),
  );
  console.log(
    "PASS · public registration, forced user role, duplicate signup race, server RBAC, password change, session revocation, logout, CSRF, rate limiting",
  );
} finally {
  // Use built-in SHA-256 for cleanup so the test does not depend on path aliases.
  const { createHash } = await import("node:crypto");
  for (const scope of scopes)
    await client.query("DELETE FROM auth_rate_limits WHERE scope_key = $1", [
      createHash("sha256").update(scope).digest("hex"),
    ]);
  await client.query(
    "DELETE FROM account_audit_logs WHERE actor_id = ANY($1::uuid[]) OR target_id = ANY($1::uuid[])",
    [ids],
  );
  await client.query("DELETE FROM accounts WHERE id = ANY($1::uuid[])", [ids]);
  await client.end();
}
