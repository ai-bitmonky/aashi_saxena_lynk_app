"use client";

import { useEffect } from "react";
import { DESKTOP_MIN_WIDTH, VIEW_COOKIE, type Variant } from "@/lib/variant";

const RELOADS = "lynk_reloads";
const MAX_RELOADS = 2; // per 10 seconds — stops a reload loop if the cookie can't stick

function wanted(mq: MediaQueryList): Variant {
  return mq.matches ? "desktop" : "mobile";
}

/** Switch to the other variant: remember it in the cookie, then do a full reload
 *  (the variant scripts install globals and document listeners, so no soft swap). */
function switchTo(v: Variant): boolean {
  const w = window as Window & { __lynkSwitching?: number };
  if (w.__lynkSwitching) return true; // a reload is already on its way
  try {
    const now = Date.now();
    let s = JSON.parse(sessionStorage.getItem(RELOADS) || '{"n":0,"t":0}') as { n: number; t: number };
    if (now - s.t > 10_000) s = { n: 0, t: now };
    if (s.n >= MAX_RELOADS) return false;
    s.n++;
    sessionStorage.setItem(RELOADS, JSON.stringify(s));
  } catch {
    /* storage blocked: still switch once */
  }
  w.__lynkSwitching = 1;
  document.cookie = `${VIEW_COOKIE}=${v}; path=/; max-age=31536000; samesite=lax`;
  location.reload();
  return true;
}

/** Keeps the auto-selected view in line with the screen: width ≥ 1024px → desktop, else mobile. */
export default function ViewGuard({ variant }: { variant: Variant }) {
  useEffect(() => {
    const root = document.getElementById("lynk-root");
    const reveal = () => root?.setAttribute("data-ready", "");
    const mq = matchMedia(`(min-width: ${DESKTOP_MIN_WIDTH}px)`);

    if (wanted(mq) !== variant) {
      if (!switchTo(wanted(mq))) reveal();
    } else reveal();

    let t: ReturnType<typeof setTimeout> | undefined;
    const onChange = () => {
      clearTimeout(t);
      t = setTimeout(() => {
        const want = wanted(mq);
        if (want !== variant) switchTo(want);
      }, 250);
    };
    mq.addEventListener("change", onChange);
    return () => {
      clearTimeout(t);
      mq.removeEventListener("change", onChange);
    };
  }, [variant]);

  return null;
}
