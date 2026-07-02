import { revalidatePath } from "next/cache";
import { fail, ok, requireApiSession } from "@/lib/api";
import { getAllEntries } from "@/lib/content/local";
import { putEntryToGitHub } from "@/lib/github/client";
import { entrySchema } from "@/lib/validation/content";
import { ZodError } from "zod";

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
  if (!parsed.success) return fail("VALIDATION_FAILED", validationMessage(parsed.error), 422);
  try {
    await putEntryToGitHub(parsed.data);
    revalidatePath("/");
    revalidatePath(`/entries/${parsed.data.slug}`);
    return ok({ entry: parsed.data });
  } catch (error) {
    return fail("GITHUB_SAVE_FAILED", githubSaveMessage(error), githubStatus(error));
  }
}

function validationMessage(error: ZodError) {
  const issue = error.issues[0];
  const field = issue?.path.join(".").replace(/^slug$/, "URL");
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
  if (message.includes("GitHub 422")) return "同じURLの記事があるか、保存内容に問題があります。";
  return "保存に失敗しました。入力内容はブラウザに保持されています。";
}
