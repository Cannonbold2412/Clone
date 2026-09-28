import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import { StoreProvider } from "@/components/Store";
import "./globals.css";

const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat", weight: ["400", "500", "600", "700", "800"] });

const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: { default: "Buy ZARI LANE products online at best prices on zarilane.in", template: "%s | ZARI LANE" },
  description: "Shop lehenga cholis, sarees and festive ethnic wear from Zari Lane at the best prices. Cash on delivery, easy returns and free delivery across India.",
  applicationName: "Zari Lane",
  openGraph: { siteName: "Zari Lane", type: "website", locale: "en_IN", images: ["/logo.svg"] },
  twitter: { card: "summary" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#000000" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={montserrat.variable}>
      <body id="top">
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
