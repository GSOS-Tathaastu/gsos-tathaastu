import "./../styles/globals.css";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://example.com"),
  title: "GSOS TATHAASTU — A neutral operating layer for global trade",
  description: "GSOS connects identity, finance, logistics, and compliance—so SMEs trade like enterprises.",
  openGraph: {
    title: "GSOS TATHAASTU",
    description: "Neutral operating layer for global trade.",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://example.com",
    siteName: "GSOS TATHAASTU",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "GSOS TATHAASTU",
    description: "Neutral operating layer for global trade."
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
