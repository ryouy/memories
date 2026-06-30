import { clearSessionCookie } from "@/lib/auth/session";
import { ok } from "@/lib/api";

export async function POST() {
  const response = ok({ authenticated: false });
  clearSessionCookie(response);
  return response;
}
