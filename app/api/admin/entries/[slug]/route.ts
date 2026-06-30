import { revalidatePath } from "next/cache";
import { fail, ok, requireApiSession } from "@/lib/api";
import { deleteEntryFromGitHub, getEntryFromGitHub, putEntryToGitHub } from "@/lib/github/client";
import { entrySchema } from "@/lib/validation/content";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const unauthorized = await requireApiSession();
  if (unauthorized) return unauthorized;
  try {
    return ok(await getEntryFromGitHub((await params).slug));
  } catch {
    return fail("ENTRY_NOT_FOUND", "記録が見つかりません。", 404);
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const unauthorized = await requireApiSession();
  if (unauthorized) return unauthorized;
  const { slug } = await params;
  const body = await request.json().catch(() => null);
  const parsed = entrySchema.safeParse(body?.entry);
  if (!parsed.success) return fail("VALIDATION_FAILED", "入力内容を確認してください。", 422);
  try {
    const current = await getEntryFromGitHub(slug);
    if (body?.sha && body.sha !== current.sha) {
      return fail("GITHUB_CONFLICT", "この記録は別の場所で更新されています。最新データを取得してから再度編集してください。", 409);
    }
    await putEntryToGitHub(parsed.data, current.sha);
    revalidatePath("/");
    revalidatePath(`/entries/${slug}`);
    revalidatePath(`/entries/${parsed.data.slug}`);
    return ok({ entry: parsed.data });
  } catch {
    return fail("GITHUB_SAVE_FAILED", "保存に失敗しました。入力内容はブラウザに保持されています。", 500);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const unauthorized = await requireApiSession();
  if (unauthorized) return unauthorized;
  const { slug } = await params;
  const body = await request.json().catch(() => null);
  try {
    const current = await getEntryFromGitHub(slug);
    if (body?.title !== current.entry.title) return fail("DELETE_CONFIRM_FAILED", "削除確認のタイトルが一致しません。", 422);
    await deleteEntryFromGitHub(slug, current.sha);
    revalidatePath("/");
    revalidatePath(`/entries/${slug}`);
    return ok({ deleted: true });
  } catch {
    return fail("GITHUB_DELETE_FAILED", "削除に失敗しました。", 500);
  }
}
