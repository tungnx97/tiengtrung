import { Client } from "pg";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function withDatabase<T>(
  operation: (client: Client) => Promise<T>,
): Promise<T> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString)
    throw new HttpError(
      503,
      "Chưa cấu hình kết nối PostgreSQL. Hãy liên hệ quản trị viên.",
    );
  const client = new Client({
    connectionString,
    connectionTimeoutMillis: 5000,
    query_timeout: 10_000,
  });
  try {
    await client.connect();
    return await operation(client);
  } finally {
    await client.end();
  }
}

export async function transaction<T>(
  client: Client,
  operation: () => Promise<T>,
): Promise<T> {
  await client.query("BEGIN");
  try {
    const result = await operation();
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}
