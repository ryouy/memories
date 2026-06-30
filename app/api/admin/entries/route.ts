import { revalidatePath } from "next/cache";
import { fail, ok, requireApiSession } from "@/lib/api";
import { getAllEntries } from "@/lib/content/local";
import { putEntryToGitHub } from "@/lib/github/client";
import { entrySchema } from "@/lib/validation/content";

export const runtime = "nodejs";

export async function GET() {
  const unauthorized = await requireApiSession();
  if (unauthorized) return unauthorized;
  return ok({ entries: await getAllEntries() });
}

export async function POST(request: Request) {
  const unauthorized = await requireApiSession();
  if (unauthorized) return unauthorized;
  const body = await request.json().catch(() => null);
  const parsed = entrySchema.safeParse(body?.entry);
  if (!parsed.success) return fail("VALIDATION_FAILED", "入力内容を確認してください。", 422);
  try {
    await putEntryToGitHub(parsed.data);
    revalidatePath("/");
    revalidatePath(`/entries/${parsed.data.slug}`);
    return ok({ entry: parsed.data });
  } catch {
    return fail("GITHUB_SAVE_FAILED", "保存に失敗しました。入力内容はブラウザに保持されています。", 500);
  }
}
