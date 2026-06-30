import crypto from "node:crypto";

export function createUploadFilename(date = new Date(), extension = "webp") {
  const stamp = date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "");
  const suffix = crypto.randomBytes(3).toString("hex");
  const ext = extension.toLowerCase().replace(/[^a-z0-9]/g, "") || "webp";
  return `${stamp}-${suffix}.${ext}`;
}
