import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
export interface AdminSession {
  username: string;
  exp: number;
  nonce: string;
}
export function hashPassword(
  password: string,
  salt = randomBytes(16).toString("hex")
) {
  return salt + ":" + scryptSync(password, salt, 64).toString("hex");
}
export function checkPassword(password: string, encoded: string) {
  const [salt, hash] = encoded.split(":");
  if (!/^[a-f0-9]{32}$/.test(salt ?? "") || !/^[a-f0-9]{128}$/.test(hash ?? ""))
    return false;
  return timingSafeEqual(
    scryptSync(password, salt, 64),
    Buffer.from(hash, "hex")
  );
}
function signature(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}
export function issueSession(
  username: string,
  secret: string,
  now = Date.now()
) {
  if (secret.length < 32)
    throw Error("Session secret must be at least 32 characters.");
  const payload = Buffer.from(
    JSON.stringify({
      username,
      exp: now + 8 * 60 * 60 * 1000,
      nonce: randomBytes(16).toString("hex"),
    })
  ).toString("base64url");
  return payload + "." + signature(payload, secret);
}
export function readSession(
  token: string,
  secret: string,
  username: string,
  now = Date.now()
): AdminSession | null {
  try {
    if (secret.length < 32 || token.length > 1500) return null;
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [payload, provided] = parts,
      expected = signature(payload, secret),
      a = Buffer.from(provided),
      b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const session = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (
      typeof session.exp !== "number" ||
      session.exp <= now ||
      session.username !== username ||
      typeof session.nonce !== "string"
    )
      return null;
    return session;
  } catch {
    return null;
  }
}
