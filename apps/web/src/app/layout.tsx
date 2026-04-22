import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/layout/header";
import { XPToastContainer } from "@/components/gamification/xp-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kitpot — Trustless Savings Circles on Initia",
  description:
    "The first trustless rotating savings circle on-chain. Approve once, contributions run automatically every cycle. No middleman, no trust needed.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <Providers>
          <Header />
          <XPToastContainer />
          <main className="min-h-screen">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
