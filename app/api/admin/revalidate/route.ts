import { revalidatePath } from "next/cache";
import { ok, requireApiSession } from "@/lib/api";

export async function POST() {
  const unauthorized = await requireApiSession();
  if (unauthorized) return unauthorized;
  revalidatePath("/");
  return ok({ revalidated: true });
}
