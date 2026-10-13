import Script from "next/script";
import manifest from "@/lynk/generated/manifest.json";
import mobileCss from "@/lynk/generated/mobile.css";
import mobileHtml from "@/lynk/generated/mobile.html";
import desktopCss from "@/lynk/generated/desktop.css";
import desktopHtml from "@/lynk/generated/desktop.html";
import { DESKTOP_MIN_WIDTH, VIEW_COOKIE, type Variant } from "@/lib/variant";
import ViewGuard from "./ViewGuard";

const UI: Record<Variant, { css: string; html: string; js: string }> = {
  mobile: { css: mobileCss, html: mobileHtml, js: manifest.mobile },
  desktop: { css: desktopCss, html: desktopHtml, js: manifest.desktop },
};

/* Until the guard confirms the variant fits the screen, keep the root hidden;
   the CSS animation reveals it anyway after 600ms as a fail-safe. */
const guardCss = `#lynk-root[data-guard]:not([data-ready]){visibility:hidden;animation:lynk-reveal 0s 600ms forwards}@keyframes lynk-reveal{to{visibility:visible}}`;

/* Runs during HTML parsing, before first paint: if the screen width wants the other
   variant, remember it in the cookie and reload straight away (max 2 tries per 10s). */
function prePaintScript(variant: Variant) {
  return `(function(){try{var r=document.getElementById('lynk-root'),want=matchMedia('(min-width: ${DESKTOP_MIN_WIDTH}px)').matches?'desktop':'mobile';
if(want!=='${variant}'){var k='lynk_reloads',now=Date.now(),s=JSON.parse(sessionStorage.getItem(k)||'{"n":0,"t":0}');if(now-s.t>10000)s={n:0,t:now};
if(s.n<2){s.n++;sessionStorage.setItem(k,JSON.stringify(s));document.cookie='${VIEW_COOKIE}='+want+'; path=/; max-age=31536000; samesite=lax';window.__lynkSwitching=1;location.reload();return;}}
else sessionStorage.removeItem('lynk_reloads');r.setAttribute('data-ready','');}catch(e){document.getElementById('lynk-root').setAttribute('data-ready','');}})();`;
}

export default function LynkApp({ variant, auto }: { variant: Variant; auto: boolean }) {
  const ui = UI[variant];
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: ui.css + (auto ? guardCss : "") }} />
      <div
        id="lynk-root"
        data-variant={variant}
        data-guard={auto ? "" : undefined}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: ui.html }}
      />
      {auto && <script dangerouslySetInnerHTML={{ __html: prePaintScript(variant) }} />}
      {auto && <ViewGuard variant={variant} />}
      <Script src={`/lynk/${ui.js}`} strategy="afterInteractive" />
    </>
  );
}
