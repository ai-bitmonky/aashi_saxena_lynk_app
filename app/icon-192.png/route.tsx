import { ImageResponse } from "next/og";
import { LogoMark } from "@/lib/logo";

export const dynamic = "force-static";

/** 192x192 PNG for the web app manifest (maskable-safe padding). */
export function GET() {
  return new ImageResponse(<LogoMark size={192} padding={0.2} />, { width: 192, height: 192 });
}
