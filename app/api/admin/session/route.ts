import { ok } from "@/lib/api";
import { requireAdminSession } from "@/lib/auth/session";

export async function GET() {
  return ok({ authenticated: await requireAdminSession() });
}
