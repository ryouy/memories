import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/session";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function fail(code: string, message: string, status = 400) {
  return NextResponse.json({ ok: false, error: { code, message } }, { status });
}

export async function requireApiSession() {
  if (!(await requireAdminSession())) {
    return fail("UNAUTHORIZED", "ログインが必要です。", 401);
  }
  return null;
}
