export function getSafeRedirectTo(
  value: string | string[] | undefined,
  fallback = "/dashboard",
) {
  if (typeof value !== "string" || !value.startsWith("/")) {
    return fallback;
  }

  try {
    const url = new URL(value, "http://localhost");
    if (
      url.origin !== "http://localhost" ||
      url.pathname === "/login" ||
      url.pathname === "/cadastro"
    ) {
      return fallback;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
