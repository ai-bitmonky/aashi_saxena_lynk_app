import { ImageResponse } from "next/og";
import { LogoMark } from "@/lib/logo";

export const dynamic = "force-static";

/** 512x512 PNG for the web app manifest (maskable-safe padding). */
export function GET() {
  return new ImageResponse(<LogoMark size={512} padding={0.2} />, { width: 512, height: 512 });
}
