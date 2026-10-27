"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

type GoogleSignInButtonProps = {
  enabled: boolean;
};

export default function GoogleSignInButton({
  enabled,
}: GoogleSignInButtonProps) {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSignIn() {
    setIsSigningIn(true);
    setErrorMessage(null);

    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
      });

      if (result.error) {
        setErrorMessage(
          "Não foi possível iniciar o login. Tente novamente.",
        );
        setIsSigningIn(false);
      }
    } catch {
      setErrorMessage("O login falhou. Tente novamente.");
      setIsSigningIn(false);
    }
  }

  return (
    <div className="auth-action">
      <button
        className="google-sign-in"
        disabled={!enabled || isSigningIn}
        onClick={handleSignIn}
        type="button"
      >
        <span aria-hidden="true" className="google-mark">
          G
        </span>
        {isSigningIn ? "Conectando ao Google..." : "Continuar com Google"}
      </button>
      {errorMessage && (
        <p aria-live="polite" className="auth-error" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
