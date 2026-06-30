import crypto from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(crypto.scrypt);

export async function hashPin(pin: string) {
  if (!/^\d{4}$/.test(pin)) throw new Error("PIN must be four digits.");
  const salt = crypto.randomBytes(16).toString("base64url");
  const derived = (await scrypt(pin, salt, 64)) as Buffer;
  return `scrypt$${salt}$${derived.toString("base64url")}`;
}

export async function verifyPin(pin: string, hash: string | undefined) {
  if (!hash || !/^\d{4}$/.test(pin)) return false;
  const [scheme, salt, stored] = hash.split("$");
  if (scheme !== "scrypt" || !salt || !stored) return false;
  const derived = (await scrypt(pin, salt, 64)) as Buffer;
  const storedBuffer = Buffer.from(stored, "base64url");
  return storedBuffer.length === derived.length && crypto.timingSafeEqual(storedBuffer, derived);
}
