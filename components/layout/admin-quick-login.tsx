"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function AdminQuickLogin({ target = "/admin", label = "管理" }: { target?: string; label?: string }) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [pending, setPending] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/session")
      .then((response) => response.json())
      .then((result) => {
        if (active) setAuthenticated(Boolean(result?.data?.authenticated));
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  async function login() {
    if (pending) return;
    if (pin.length !== 4) {
      router.push(target);
      return;
    }
    setPending(true);
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pin })
    });
    setPending(false);
    if (response.ok) router.push(target);
    else router.push("/admin/login");
  }

  return (
    <div className="flex items-center gap-2">
      {authenticated ? null : (
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
      )}
      <button
        type="button"
        onClick={login}
        disabled={pending}
        className="h-9 rounded-md border border-stone-300 bg-white px-3 text-sm disabled:opacity-40"
      >
        {label}
      </button>
    </div>
  );
}
