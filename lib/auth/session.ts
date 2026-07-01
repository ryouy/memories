import crypto from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export const sessionCookieName = "memories_admin";
const maxAgeSeconds = 60 * 60 * 24 * 30;

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 24) throw new Error("SESSION_SECRET is missing or too short.");
  return value;
}

function sign(payload: string) {
  return crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createSessionToken(now = Date.now()) {
  const payload = Buffer.from(
    JSON.stringify({
      sub: "admin",
      iat: now,
      exp: now + maxAgeSeconds * 1000,
      nonce: crypto.randomBytes(12).toString("base64url")
    })
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined) {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  const expected = sign(payload);
  if (
    expected.length !== signature.length ||
    !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  ) {
    return false;
  }
  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      sub: string;
      exp: number;
    };
    return decoded.sub === "admin" && decoded.exp > Date.now();
  } catch {
    return false;
  }
}

export async function requireAdminSession() {
  const store = await cookies();
  return verifySessionToken(store.get(sessionCookieName)?.value);
}

export function setSessionCookie(response: NextResponse) {
  response.cookies.set(sessionCookieName, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(sessionCookieName, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
}

export function requestHasAdminSession(request: NextRequest) {
  return verifySessionToken(request.cookies.get(sessionCookieName)?.value);
}
