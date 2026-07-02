import { revalidatePath } from "next/cache";
import { fail, ok, requireApiSession } from "@/lib/api";
import { deleteEntryFromGitHub, getEntryFromGitHub, putEntryToGitHub } from "@/lib/github/client";
import { entrySchema } from "@/lib/validation/content";
import { ZodError } from "zod";

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
  if (!parsed.success) return fail("VALIDATION_FAILED", validationMessage(parsed.error), 422);
  try {
    const current = await getEntryFromGitHub(slug);
    if (body?.sha && body.sha !== current.sha) {
      return fail("GITHUB_CONFLICT", "この記録は別の場所で更新されています。最新データを取得してから再度編集してください。", 409);
    }
    if (parsed.data.slug === slug) {
      await putEntryToGitHub(parsed.data, current.sha);
    } else {
      await putEntryToGitHub(parsed.data);
      await deleteEntryFromGitHub(slug, current.sha);
    }
    revalidatePath("/");
    revalidatePath(`/entries/${slug}`);
    revalidatePath(`/entries/${parsed.data.slug}`);
    return ok({ entry: parsed.data });
  } catch (error) {
    return fail("GITHUB_SAVE_FAILED", githubSaveMessage(error), githubStatus(error));
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

function validationMessage(error: ZodError) {
  const issue = error.issues[0];
  const field = issue?.path.join(".");
  return field ? `${field} を確認してください。` : "入力内容を確認してください。";
}

function githubStatus(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message.includes("GitHub 401") || message.includes("GitHub 403")) return 403;
  if (message.includes("GitHub 409")) return 409;
  if (message.includes("GitHub 422")) return 422;
  return 500;
}

function githubSaveMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message.includes("environment variables")) return "GitHub設定が不足しています。";
  if (message.includes("GitHub 401") || message.includes("GitHub 403")) return "GitHubへの書き込み権限を確認してください。";
  if (message.includes("GitHub 409")) return "GitHub上のデータが更新されています。再度保存してください。";
  if (message.includes("GitHub 422")) return "同じslugの記録があるか、保存内容に問題があります。";
  return "保存に失敗しました。入力内容はブラウザに保持されています。";
}
