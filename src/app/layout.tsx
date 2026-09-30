import type { Metadata } from "next";
import localFont from "next/font/local";
import { SiteChrome } from "@/components/site-chrome";
import { site, siteCredit } from "@/lib/site";
import "./globals.css";

const vazirmatn = localFont({
  src: "../fonts/Vazirmatn-wght.woff2",
  variable: "--font-vazir",
  display: "swap",
  weight: "100 900",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} | ${site.role}`,
    template: `%s | ${site.name}`,
  },
  description: site.summary,
  applicationName: site.name,
  authors: [{ name: siteCredit.designer, url: siteCredit.github }],
  creator: siteCredit.designer,
  alternates: { canonical: "/" },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon.png", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    locale: "fa_IR",
    url: site.url,
    siteName: site.name,
    title: `${site.name} | ${site.role}`,
    description: site.summary,
  },
  other: {
    "designer:url": siteCredit.github,
    "web_author": siteCredit.github,
  },
};

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: site.name,
  jobTitle: site.role,
  url: site.url,
  email: site.email,
  telephone: site.phoneTel,
  identifier: site.license,
  sameAs: [site.social.instagram, site.social.linkedin],
  address: {
    "@type": "PostalAddress",
    streetAddress: "خیابان آقابزرگی، نبش بن‌بست بیژن، پلاک ۱، طبقه ۴",
    addressLocality: "تهران",
    addressRegion: "تهران",
    addressCountry: "IR",
  },
  memberOf: {
    "@type": "Organization",
    name: site.bar,
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: site.name,
  url: site.url,
  inLanguage: "fa-IR",
  creator: {
    "@type": "Person",
    name: siteCredit.designer,
    url: siteCredit.github,
  },
  designer: {
    "@type": "Person",
    name: siteCredit.designer,
    url: siteCredit.github,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" className={`${vazirmatn.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        {/* Designed & developed by https://github.com/amirnsamimi — not shown in the public UI */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
