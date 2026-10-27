"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import SignOutButton from "@/app/dashboard/sign-out-button";

type AccountMenuProps = {
  name: string;
};

export default function AccountMenu({ name }: AccountMenuProps) {
  const displayName = name.trim() || "Minha conta";
  const menuRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    function closeOnOutsideClick(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !menuRef.current?.contains(event.target)
      ) {
        if (menuRef.current) {
          menuRef.current.open = false;
        }
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && menuRef.current?.open) {
        menuRef.current.open = false;
        menuRef.current.querySelector("summary")?.focus();
      }
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  return (
    <details className="account-menu" ref={menuRef}>
      <summary
        aria-label={`Opções da conta de ${displayName}`}
        className="account-menu-trigger"
      >
        <span className="account-menu-name">{displayName}</span>
        <span aria-hidden="true" className="account-menu-chevron" />
      </summary>
      <nav
        aria-label="Opções da conta"
        className="account-menu-panel"
        onClick={(event) => {
          if (event.target instanceof Element && event.target.closest("a")) {
            if (menuRef.current) {
              menuRef.current.open = false;
            }
          }
        }}
      >
        <Link href="/dashboard#perfil">Editar meu nome</Link>
        <Link href="/dashboard#agenda">Próximos horários</Link>
        <Link href="/dashboard#historico">Histórico de cortes</Link>
        <Link href="/dashboard#pagamentos">Pagamentos</Link>
        <div className="account-menu-divider" />
        <SignOutButton />
      </nav>
    </details>
  );
}
