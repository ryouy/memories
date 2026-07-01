import { fail, ok, requireApiSession } from "@/lib/api";
import { putUploadToGitHub } from "@/lib/github/client";
import { createUploadFilename } from "@/lib/images/filenames";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const unauthorized = await requireApiSession();
  if (unauthorized) return unauthorized;
  const body = (await request.json().catch(() => null)) as { slug?: string; files?: { dataUrl: string; width: number; height: number; alt: string }[] } | null;
  if (!body?.slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(body.slug)) return fail("VALIDATION_FAILED", "slugが不正です。", 422);
  const files = body.files ?? [];
  if (files.length === 0 || files.length > 10) return fail("VALIDATION_FAILED", "アップロードする画像を選択してください。", 422);
  const totalPayloadSize = files.reduce((sum, file) => sum + file.dataUrl.length, 0);
  if (totalPayloadSize > 42_000_000) return fail("PAYLOAD_TOO_LARGE", "一度に送信する画像サイズが大きすぎます。枚数を分けて再試行してください。", 413);
  try {
    const images = [];
    for (const file of files) {
      const match = file.dataUrl.match(/^data:image\/(?:webp|jpeg|png);base64,(.+)$/);
      if (!match) return fail("VALIDATION_FAILED", "対応していない画像形式です。", 422);
      if (file.dataUrl.length > 4_500_000) return fail("PAYLOAD_TOO_LARGE", "1枚あたりの画像サイズが大きすぎます。", 413);
      if (!Number.isInteger(file.width) || !Number.isInteger(file.height) || file.width <= 0 || file.height <= 0) {
        return fail("VALIDATION_FAILED", "画像サイズ情報が不正です。", 422);
      }
      const filename = createUploadFilename(new Date(), "webp");
      const src = `/uploads/${body.slug}/${filename}`;
      await putUploadToGitHub(`public${src}`, match[1]);
      images.push({
        src,
        alt: file.alt || "旅行写真",
        caption: "",
        width: file.width,
        height: file.height
      });
    }
    return ok({ images });
  } catch (error) {
    return fail("UPLOAD_FAILED", uploadMessage(error), uploadStatus(error));
  }
}

export async function DELETE() {
  const unauthorized = await requireApiSession();
  if (unauthorized) return unauthorized;
  return ok({ deleted: true });
}

function uploadStatus(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message.includes("GitHub 401") || message.includes("GitHub 403")) return 403;
  if (message.includes("GitHub 409")) return 409;
  if (message.includes("GitHub 422")) return 422;
  return 500;
}

function uploadMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message.includes("environment variables")) return "GitHub設定が不足しています。";
  if (message.includes("GitHub 401") || message.includes("GitHub 403")) return "GitHubへの書き込み権限を確認してください。";
  if (message.includes("GitHub 409")) return "GitHub上のデータが更新されています。もう一度アップロードしてください。";
  if (message.includes("GitHub 422")) return "画像の保存先に問題があります。";
  return "画像アップロードに失敗しました。";
}
