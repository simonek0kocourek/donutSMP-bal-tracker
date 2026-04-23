import type { Metadata } from "next";
import localFont from "next/font/local";
import { DM_Mono } from "next/font/google";
import "./globals.css";

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
    <html lang="en" className={`${fodax.variable} ${dmMono.variable}`}>
      <body className="min-h-screen bg-navy text-white antialiased">
        {children}
      </body>
    </html>
  );
}
