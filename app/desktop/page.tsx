import type { Metadata } from "next";
import LynkApp from "@/components/LynkApp";

export const metadata: Metadata = { title: "LYNK (Desktop view)" };

/** Always the desktop view, whatever the screen size (handy for demos). */
export default function DesktopPage() {
  return <LynkApp variant="desktop" auto={false} />;
}
