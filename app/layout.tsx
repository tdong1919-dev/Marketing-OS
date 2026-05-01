import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Autom8 — AI Instagram Reply Automation",
  description: "Automate your Instagram comment replies with AI. Built for creators, coaches, agencies, and brands.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.className} h-full`}>
      <body className="min-h-full bg-charcoal text-white antialiased">
        {children}
      </body>
    </html>
  );
}
