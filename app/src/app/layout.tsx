import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chemistry Curriculum — NYS Regents (Honors)",
  description:
    "A curated, human-sourced guide to NYS Regents Physical Setting/Chemistry, adapted for specialized high school rigor.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
