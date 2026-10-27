"use client";

import type { SubmitEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

type EditProfileFormProps = {
  name: string;
};

export default function EditProfileForm({ name }: EditProfileFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setErrorMessage(null);

    const formData = new FormData(event.currentTarget);
    const updatedName = String(formData.get("name") ?? "").trim();

    if (!updatedName) {
      setErrorMessage("Digite seu nome para salvar as alterações.");
      return;
    }

    setIsSaving(true);

    try {
      const result = await authClient.updateUser({ name: updatedName });

      if (result.error) {
        setErrorMessage("Não foi possível atualizar seu nome. Tente novamente.");
        setIsSaving(false);
        return;
      }

      setMessage("Seu nome foi atualizado.");
      setIsSaving(false);
      router.refresh();
    } catch {
      setErrorMessage("Não foi possível atualizar seu nome. Tente novamente.");
      setIsSaving(false);
    }
  }

  return (
    <form className="profile-form" onSubmit={handleSubmit}>
      <div className="auth-form-field">
        <label htmlFor="profile-name">Nome completo</label>
        <input
          autoComplete="name"
          defaultValue={name}
          id="profile-name"
          maxLength={100}
          name="name"
          required
          type="text"
        />
      </div>
      {message && (
        <p aria-live="polite" className="profile-success" role="status">
          {message}
        </p>
      )}
      {errorMessage && (
        <p aria-live="polite" className="auth-error" role="alert">
          {errorMessage}
        </p>
      )}
      <button className="auth-submit profile-save" disabled={isSaving} type="submit">
        {isSaving ? "Salvando..." : "Salvar nome"}
      </button>
    </form>
  );
}
