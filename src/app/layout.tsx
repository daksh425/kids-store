import type { Metadata, Viewport } from "next";
import { Fredoka, Nunito } from "next/font/google";
import Script from "next/script";
import { STORE_NAME } from "@/lib/catalog";
import "./globals.css";

const fredoka = Fredoka({ variable: "--font-fredoka", subsets: ["latin"], weight: ["500", "600", "700"] });
const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin"] });

export const metadata: Metadata = {
  // Absolute URLs for social previews and canonical links.
  metadataBase: new URL(process.env.APP_URL || "http://localhost:3100"),
  title: { default: `${STORE_NAME}: printables that help little minds bloom`, template: `%s · ${STORE_NAME}` },
  description:
    "Story e-books, colouring books, activity books, worksheets and learning packs for ages 2–12. Download in a minute, print at home, and watch them grow.",
  openGraph: { siteName: STORE_NAME, type: "website", locale: "en_IN" },
};

export const viewport: Viewport = { themeColor: "#D02B65" };

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN" className={`${fredoka.variable} ${nunito.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        {children}
        {GA_ID ? (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
            <Script id="ga-init" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`}
            </Script>
          </>
        ) : null}
      </body>
    </html>
  );
}
