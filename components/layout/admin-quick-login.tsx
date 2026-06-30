"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminQuickLogin() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [pending, setPending] = useState(false);

  async function login() {
    if (pin.length !== 4 || pending) return;
    setPending(true);
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pin })
    });
    setPending(false);
    if (response.ok) router.push("/admin");
    else router.push("/admin/login");
  }

  return (
    <div className="flex items-center gap-2">
      <input
        value={pin}
        onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 4))}
        onKeyDown={(event) => {
          if (event.key === "Enter") void login();
        }}
        inputMode="numeric"
        pattern="\d{4}"
        maxLength={4}
        aria-label="PIN"
        className="h-9 w-20 rounded-md border border-stone-300 bg-white px-2 text-center text-sm"
      />
      <button
        type="button"
        onClick={login}
        disabled={pin.length !== 4 || pending}
        className="h-9 rounded-md border border-stone-300 bg-white px-3 text-sm disabled:opacity-40"
      >
        管理
      </button>
    </div>
  );
}
