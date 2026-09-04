import type { Metadata } from "next";
import { IM_Fell_English, Crimson_Pro, Special_Elite, Caveat } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/Session";
import Nav from "@/components/Nav";
import Motion from "@/components/Motion";

const fell = IM_Fell_English({ weight: "400", subsets: ["latin"], variable: "--font-fell" });
const body = Crimson_Pro({ weight: ["400", "600"], subsets: ["latin"], variable: "--font-body" });
const type = Special_Elite({ weight: "400", subsets: ["latin"], variable: "--font-type" });
const hand = Caveat({ weight: ["400", "600"], subsets: ["latin"], variable: "--font-hand" });

export const metadata: Metadata = {
  title: "EcoTrack",
  description: "An honest ledger of what you take from the world, and the habits worth keeping.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fell.variable} ${body.variable} ${type.variable} ${hand.variable}`} suppressHydrationWarning>
      <head>
        {/* Adds the `js` class before hydration so the motion CSS can hide things safely; hence suppressHydrationWarning on <html>. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>
        <SessionProvider>
          <Motion />
          <Nav />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
