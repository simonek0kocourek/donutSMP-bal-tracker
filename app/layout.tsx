import type { Metadata } from "next";
import localFont from "next/font/local";
import { DM_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const fodax = localFont({
  src: "../public/fonts/Fodax.ttf",
  variable: "--font-display",
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Donut SMP Tracker",
  description: "Track your grind.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn(fodax.variable, dmMono.variable)}>
      <body className="min-h-screen bg-[#0a0a0f] text-white antialiased">
        {children}
      </body>
    </html>
  );
}
