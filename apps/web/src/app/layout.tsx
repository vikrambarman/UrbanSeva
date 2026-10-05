import type { Metadata, Viewport } from "next";
import { Urbanist, Geist_Mono, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { SITE_CONFIG, getSiteTitle, getSiteDescription } from "@/lib/config";

const urbanist = Urbanist({
  variable: "--font-urbanist",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
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

const title = getSiteTitle();
const description = getSiteDescription();
const cityLower = SITE_CONFIG.city.toLowerCase();

export const metadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.url),
  title: {
    default: title,
    template: `%s | ${SITE_CONFIG.name}`,
  },
  description,
  keywords: [
    `home services ${cityLower}`,
    `cleaning services ${cityLower}`,
    `electrician ${cityLower}`,
    `plumber ${cityLower}`,
    `ac service ${cityLower}`,
    `painting services ${cityLower}`,
    `pest control ${cityLower}`,
    `${cityLower} services`,
    "chhattisgarh home services",
  ],
  authors: [{ name: SITE_CONFIG.name }],
  creator: SITE_CONFIG.name,
  publisher: SITE_CONFIG.name,
  formatDetection: {
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: SITE_CONFIG.url,
    siteName: SITE_CONFIG.name,
    title,
    description,
    images: [
      {
        url: SITE_CONFIG.ogImage,
        width: 1200,
        height: 630,
        alt: title,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [SITE_CONFIG.ogImage],
  },
  // verification: { google: "xxxxxxxxxxxx" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0D9488" },  // ✅ orange → teal
    { media: "(prefers-color-scheme: dark)", color: "#1E3A5F" },   // unchanged
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // ✅ FIXED: Font variable classes ab <html> par hain, <body> par nahi.
    // Pehle ye <body> par the, jabki globals.css mein `html { font-sans }`
    // apply hota hai — <html>, <body> ka PARENT hai, aur CSS variables sirf
    // neeche (descendants) ki taraf inherit hote hain, upar nahi. Isliye
    // <html> ko --font-urbanist kabhi mila hi nahi, aur browser default
    // serif font par fallback ho gaya tha.
    <html
      lang="en"
      suppressHydrationWarning
      className={`${urbanist.variable} ${geistMono.variable} ${notoSansDevanagari.variable}`}
    >
      <body className="antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              name: SITE_CONFIG.name,
              "@id": SITE_CONFIG.url,
              url: SITE_CONFIG.url,
              image: `${SITE_CONFIG.url}${SITE_CONFIG.ogImage}`,
              ...(SITE_CONFIG.phone && { telephone: SITE_CONFIG.phone }),
              priceRange: "₹₹",
              address: {
                "@type": "PostalAddress",
                ...(SITE_CONFIG.address && { streetAddress: SITE_CONFIG.address }),
                addressLocality: SITE_CONFIG.city,
                addressRegion: "Chhattisgarh",
                ...(SITE_CONFIG.pincode && { postalCode: SITE_CONFIG.pincode }),
                addressCountry: "IN",
              },
              areaServed: {
                "@type": "City",
                name: SITE_CONFIG.city,
              },
            }),
          }}
        />
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