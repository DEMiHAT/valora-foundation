import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DomainError } from "./domain";
import { checkPassword, issueSession, readSession } from "./security";
const cookieName = "valora-admin";
function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32)
    throw new DomainError(
      "CONFIG",
      "Admin authentication is not configured.",
      503
    );
  return s;
}
export function validPassword(password: string) {
  return checkPassword(password, process.env.ADMIN_PASSWORD_HASH ?? "");
}
export function sessionToken(username: string) {
  return issueSession(username, secret());
}
export async function getSession() {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return null;
  try {
    return readSession(
      token,
      secret(),
      process.env.ADMIN_USERNAME ?? "organiser"
    );
  } catch {
    return null;
  }
}
export async function requireSession() {
  const s = await getSession();
  if (!s) throw new DomainError("UNAUTHENTICATED", "Please sign in.", 401);
  return s;
}
export async function requireAdminPage() {
  const s = await getSession();
  if (!s) redirect("/admin/login");
  return s;
}
export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
  maxAge: 8 * 60 * 60,
};
export { cookieName };
