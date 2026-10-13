export type Variant = "mobile" | "desktop";

/** Cookie the client guard writes when screen width disagrees with the server's guess. */
export const VIEW_COOKIE = "lynk_view";

/** Screen-width rule used on the client: at least this wide → desktop, else mobile. */
export const DESKTOP_MIN_WIDTH = 1024;

export function isVariant(v: unknown): v is Variant {
  return v === "mobile" || v === "desktop";
}

const PHONE_OR_TABLET =
  /iPhone|iPod|iPad|Android|Windows Phone|IEMobile|BlackBerry|BB10|webOS|Opera Mini|Mobile|Silk|Kindle|Tablet/i;

/**
 * Server-side first guess, before the client can measure the screen.
 * Phones and tablets (assumed portrait) → mobile; everything else → desktop.
 */
export function variantFromRequest(h: { get(name: string): string | null }, cookie?: string): Variant {
  if (isVariant(cookie)) return cookie;
  if (h.get("sec-ch-ua-mobile") === "?1") return "mobile";
  return PHONE_OR_TABLET.test(h.get("user-agent") ?? "") ? "mobile" : "desktop";
}
