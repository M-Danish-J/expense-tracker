import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { siteOrigin } from "@/lib/site";
import "./globals.css";



export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin()),
  title: {
    default: "Expensio — Track every rupee with confidence",
    template: "%s · Expensio",
  },
  description:
    "A clean, fast expense tracker for individuals and shared workspaces. Accounts, categories, transfers and analytics in one place.",
};

const inter = Inter({
  variable: "--font-inter",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
