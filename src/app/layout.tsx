import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ChemClass Pro - CBSE Class 12 Chemistry Progress Tracker",
  description: "Track your CBSE Class 12 Chemistry progress with real-time sync. Monitor chapters, topics, test marks, and more.",
  keywords: ["ChemClass", "CBSE", "Class 12", "Chemistry", "Progress Tracker", "Education"],
  authors: [{ name: "ChemClass Pro" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "ChemClass Pro",
    description: "CBSE Class 12 Chemistry Progress Tracker with Real-time Sync",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
