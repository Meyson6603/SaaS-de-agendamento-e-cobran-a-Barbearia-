"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function SignOutButton() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSignOut() {
    setErrorMessage(null);

    try {
      const result = await authClient.signOut();

      if (result.error) {
        setErrorMessage("Não foi possível encerrar a sessão. Tente novamente.");
        return;
      }

      router.replace("/login");
      router.refresh();
    } catch {
      setErrorMessage("Não foi possível encerrar a sessão. Tente novamente.");
    }
  }

  return (
    <div className="auth-sign-out-group">
      <button className="auth-sign-out" onClick={handleSignOut} type="button">
        Sair
      </button>
      {errorMessage && (
        <p aria-live="polite" className="auth-error" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
