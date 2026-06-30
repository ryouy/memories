import { describe, expect, it } from "vitest";
import { hashPin, verifyPin } from "@/lib/auth/pin";
import { createSessionToken, verifySessionToken } from "@/lib/auth/session";

describe("auth", () => {
  it("hashes and verifies an admin PIN", async () => {
    const hash = await hashPin("1234");
    expect(await verifyPin("1234", hash)).toBe(true);
    expect(await verifyPin("9999", hash)).toBe(false);
  });

  it("signs session tokens", () => {
    process.env.SESSION_SECRET = "a-development-secret-with-enough-length";
    const token = createSessionToken();
    expect(verifySessionToken(token)).toBe(true);
    expect(verifySessionToken(`${token}x`)).toBe(false);
  });
});
