import type { Metadata } from "next";
import localFont from "next/font/local";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";

import "@material-symbols/font-400/outlined.css";
import { BANNER_H, DevBanner } from "@/components/platform/dev-banner";
import { AnimationProvider } from "@/components/providers/animation-provider";
import { ToastProvider } from "@/components/ui/toast";
import { PricingProvider } from "@/components/providers/pricing-provider";
import { loadPricingView } from "@/lib/pricing-store";
import { getBanner } from "@/lib/site-banner";

import "./globals.css";

const montserrat = localFont({
  src: [
    {
      path: "../node_modules/@fontsource/montserrat/files/montserrat-latin-700-normal.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../node_modules/@fontsource/montserrat/files/montserrat-latin-800-normal.woff2",
      weight: "800",
      style: "normal",
    },
    {
      path: "../node_modules/@fontsource/montserrat/files/montserrat-latin-900-normal.woff2",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: "Node — Bridging the gap in computer science",
  description:
    "Node is a computer-science training platform that bridges the gap between education and the market — helping newcomers kick-start a career, fresh graduates get market-ready, and experienced professionals scale, switch and adapt.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [banner, pricing] = await Promise.all([getBanner(), loadPricingView()]);
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} ${montserrat.variable}`}
      style={{ "--nb": banner.enabled ? BANNER_H : "0px" } as React.CSSProperties}
    >
      <body>
        <DevBanner banner={banner} />
        <AnimationProvider>
          <PricingProvider value={pricing}>
            <ToastProvider>{children}</ToastProvider>
          </PricingProvider>
        </AnimationProvider>
      </body>
    </html>
  );
}
