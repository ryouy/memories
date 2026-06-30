import { NextRequest } from "next/server";
import { checkLoginLimit, recordLoginAttempt } from "@/lib/auth/rate-limit";
import { setSessionCookie } from "@/lib/auth/session";
import { verifyPin } from "@/lib/auth/pin";
import { fail, ok } from "@/lib/api";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkLoginLimit(ip).allowed) {
    recordLoginAttempt(ip, false);
    return fail("LOGIN_FAILED", "パスワードナンバーが正しくありません。しばらく時間をおいてから再度お試しください。", 429);
  }

  const body = (await request.json().catch(() => null)) as { pin?: string } | null;
  const valid = await verifyPin(body?.pin ?? "", process.env.ADMIN_PIN_HASH);
  recordLoginAttempt(ip, valid);
  if (!valid) {
    return fail("LOGIN_FAILED", "パスワードナンバーが正しくありません。しばらく時間をおいてから再度お試しください。", 401);
  }

  const response = ok({ authenticated: true });
  setSessionCookie(response);
  return response;
}
