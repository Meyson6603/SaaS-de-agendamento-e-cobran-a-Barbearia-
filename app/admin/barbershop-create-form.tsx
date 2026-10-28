"use client";

import { useActionState, useState } from "react";
import {
  createBarbershopForOwner,
  type CreateBarbershopState,
} from "@/app/actions/barbershop";

const initialState: CreateBarbershopState = {
  error: null,
  success: null,
};

function createSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export default function BarbershopCreateForm() {
  const [state, formAction, isPending] = useActionState(
    createBarbershopForOwner,
    initialState,
  );
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);

  return (
    <form action={formAction} className="manager-setup-form">
      <div className="manager-form-heading">
        <p className="eyebrow">NOVO CADASTRO</p>
        <h2>Cadastrar barbearia</h2>
        <p>
          O proprietário precisa ter uma conta verificada. O vínculo OWNER
          será criado junto com a barbearia.
        </p>
      </div>

      <div className="manager-form-field">
        <label htmlFor="admin-shop-name">Nome da barbearia</label>
        <input
          autoComplete="organization"
          id="admin-shop-name"
          maxLength={100}
          name="name"
          onChange={(event) => {
            const value = event.currentTarget.value;
            setName(value);
            if (!slugEdited) setSlug(createSlug(value));
          }}
          required
          value={name}
        />
      </div>

      <div className="manager-form-field">
        <label htmlFor="admin-shop-slug">Identificador</label>
        <div className="manager-slug-input">
          <span>navalha/</span>
          <input
            autoCapitalize="none"
            autoComplete="off"
            id="admin-shop-slug"
            maxLength={60}
            name="slug"
            onChange={(event) => {
              setSlugEdited(true);
              setSlug(createSlug(event.currentTarget.value));
            }}
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            required
            value={slug}
          />
        </div>
      </div>

      <div className="manager-form-field">
        <label htmlFor="admin-shop-owner">E-mail do proprietário</label>
        <input
          autoComplete="email"
          id="admin-shop-owner"
          name="ownerEmail"
          required
          type="email"
        />
      </div>

      <div className="manager-form-field">
        <label htmlFor="admin-shop-phone">
          Telefone <span>(opcional)</span>
        </label>
        <input
          autoComplete="tel"
          id="admin-shop-phone"
          inputMode="tel"
          maxLength={20}
          name="phone"
          placeholder="(11) 99999-9999"
          type="tel"
        />
      </div>

      {state.error && (
        <p aria-live="polite" className="auth-error" role="alert">
          {state.error}
        </p>
      )}
      {state.success && (
        <p aria-live="polite" className="profile-success" role="status">
          {state.success}
        </p>
      )}

      <button className="auth-submit" disabled={isPending} type="submit">
        {isPending ? "Cadastrando..." : "Cadastrar e atribuir OWNER"}
      </button>
    </form>
  );
}
