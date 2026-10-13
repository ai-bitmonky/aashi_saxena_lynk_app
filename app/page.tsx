import { cookies, headers } from "next/headers";
import LynkApp from "@/components/LynkApp";
import { VIEW_COOKIE, variantFromRequest } from "@/lib/variant";

export const dynamic = "force-dynamic";

/** Auto view: cookie if set, else a guess from the user-agent; the client guard then checks screen width. */
export default async function Home() {
  const [h, c] = await Promise.all([headers(), cookies()]);
  const variant = variantFromRequest(h, c.get(VIEW_COOKIE)?.value);
  return <LynkApp variant={variant} auto />;
}
