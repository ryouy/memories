import { fail, ok, requireApiSession } from "@/lib/api";
import { githubStatus } from "@/lib/github/client";

export const runtime = "nodejs";

export async function GET() {
  const unauthorized = await requireApiSession();
  if (unauthorized) return unauthorized;
  try {
    return ok(await githubStatus());
  } catch {
    return fail("GITHUB_STATUS_FAILED", "GitHub接続状態を確認できませんでした。", 500);
  }
}
