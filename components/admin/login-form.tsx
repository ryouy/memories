"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <form
      className="mt-6 space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setError("");
        const response = await fetch("/api/admin/login", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ pin })
        });
        setPending(false);
        if (response.ok) {
          router.push("/admin");
        } else {
          setError("パスワードナンバーが正しくありません。しばらく時間をおいてから再度お試しください。");
        }
      }}
    >
      <input
        inputMode="numeric"
        pattern="\d{4}"
        maxLength={4}
        value={pin}
        onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 4))}
        className="h-12 w-full rounded-md border border-stone-300 px-4 text-center text-2xl tracking-[0.35em]"
        aria-label="4桁のパスワードナンバー"
      />
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button disabled={pending || pin.length !== 4} className="h-11 w-full rounded-md bg-ink px-4 text-white disabled:opacity-50">
        ログイン
      </button>
    </form>
  );
}
