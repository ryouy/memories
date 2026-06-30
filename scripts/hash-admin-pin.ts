import { hashPin } from "@/lib/auth/pin";

const pin = process.argv[2];
if (!pin) {
  console.error("Usage: npm run admin:hash-pin -- 1234");
  process.exit(1);
}

console.log(await hashPin(pin));
