import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "LYNK — One route. Every mode.",
  description:
    "Compare metro, bus, auto and cab routes across Delhi NCR by cost, time, reliability and convenience — in one place.",
  applicationName: "LYNK",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "LYNK" },
  formatDetection: { telephone: false },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF7F2" },
    { media: "(prefers-color-scheme: dark)", color: "#0F0E0C" },
  ],
};

/* Apply the saved theme before first paint (the engine sets the same attribute once it loads). */
const themeScript = `try{var t=JSON.parse(localStorage.getItem('lynk_theme')||'"auto"');if(t==='dark'||t==='light'||t==='auto')document.documentElement.dataset.theme=t}catch(e){}`;

const FONTS =
  "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:opsz,wght@14..32,400;14..32,500;14..32,600&family=Noto+Sans+Devanagari:wght@500&display=swap";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href={FONTS} />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
