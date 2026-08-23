import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { VisitTracker } from "@/components/visit-tracker";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bible-rank.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "BibleRank — The internet's Bible leaderboard",
    template: "%s — BibleRank",
  },
  description:
    "BibleRank is a public leaderboard of Bible verses. Support real, canonical Bible verses and watch them rise to #1.",
  openGraph: {
    title: "BibleRank — The internet's Bible leaderboard",
    description:
      "Support real, canonical Bible verses and watch them rise to #1.",
    url: siteUrl,
    siteName: "BibleRank",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BibleRank — The internet's Bible leaderboard",
    description:
      "Support real, canonical Bible verses and watch them rise to #1.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-white text-slate-900">
        <VisitTracker />
        <Nav />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
