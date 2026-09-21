import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoSansDevanagari = Noto_Sans_Devanagari({
  variable: "--font-devanagari",
  subsets: ["devanagari"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "ServiceApp — Ambikapur Home Services",
  description:
    "Ambikapur mein ghar baithe book karo cleaning, electrical, plumbing aur 100+ home services. Verified professionals, fixed pricing, quality guarantee.",
  keywords: [
    "home services ambikapur",
    "cleaning services ambikapur",
    "electrician ambikapur",
    "plumber ambikapur",
    "ac service ambikapur",
    "painting services ambikapur",
    "pest control ambikapur",
    "ambikapur services",
    "chhattisgarh home services",
  ],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://serviceapp.com",
    siteName: "ServiceApp",
    title: "ServiceApp — Ambikapur Home Services",
    description:
      "Ambikapur mein ghar baithe book karo cleaning, electrical, plumbing aur 100+ home services.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ServiceApp - Ambikapur Home Services",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ServiceApp — Ambikapur Home Services",
    description:
      "Ambikapur mein ghar baithe book karo cleaning, electrical, plumbing aur 100+ home services.",
    images: ["/og-image.png"],
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
        className={`${geistSans.variable} ${geistMono.variable} ${notoSansDevanagari.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}