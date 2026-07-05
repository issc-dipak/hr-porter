import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import ThemeScript from "@/app/components/ThemeScript";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HR Core | Premium Management System",
  description: "Advanced HR management system built with Next.js and Tailwind CSS.",
};

import { QueryProvider } from "@/providers/QueryProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full scroll-smooth dark" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className={`${inter.variable} ${plusJakartaSans.variable} font-sans antialiased h-full overflow-hidden bg-[var(--background)] text-[var(--foreground)]`}>
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
