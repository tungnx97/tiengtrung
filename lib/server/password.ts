import { pbkdf2, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const deriveKey = promisify(pbkdf2);
const ITERATIONS = 600_000;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const hash = await deriveKey(password, salt, ITERATIONS, 32, "sha256");
  return `pbkdf2_sha256$${ITERATIONS}$${salt}$${hash.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  encoded: string,
): Promise<boolean> {
  const [algorithm, iterations, salt, digest] = encoded.split("$");
  if (
    algorithm !== "pbkdf2_sha256" ||
    Number(iterations) !== ITERATIONS ||
    !/^[a-f0-9]{32}$/.test(salt || "") ||
    !/^[a-f0-9]{64}$/.test(digest || "")
  )
    return false;
  const actual = await deriveKey(password, salt, ITERATIONS, 32, "sha256");
  return timingSafeEqual(actual, Buffer.from(digest, "hex"));
}
