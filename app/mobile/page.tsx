import type { Metadata } from "next";
import LynkApp from "@/components/LynkApp";

export const metadata: Metadata = { title: "LYNK (Mobile view)" };

/** Always the mobile view, whatever the screen size (handy for demos). */
export default function MobilePage() {
  return <LynkApp variant="mobile" auto={false} />;
}
