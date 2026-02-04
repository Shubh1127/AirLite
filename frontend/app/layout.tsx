import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import Script from "next/script";
import { BottomNav } from "@/components/navbar/BottomNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AirLite - Find Your Perfect Stay",
  description: "Discover and book unique accommodations worldwide",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script
          id="disable-mapbox-telemetry"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              // Disable Mapbox telemetry
              window.MAPBOX_ACCESS_TOKEN_EXCLUDED = true;
              if (window.navigator) {
                window.navigator.sendBeacon = function() { return true; };
              }
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {children}
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
