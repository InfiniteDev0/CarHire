import { Outfit } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { PwaRegister } from "@/components/pwa-register";
import { ThemedToaster } from "@/components/theme-toggle";
import { BRAND } from "@/lib/brand";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: "400"
});


export const metadata = {
  // Set NEXT_PUBLIC_SITE_URL in production so social previews get absolute URLs.
  metadataBase: process.env.NEXT_PUBLIC_SITE_URL
    ? new URL(process.env.NEXT_PUBLIC_SITE_URL)
    : undefined,
  title: `${BRAND.name} by ${BRAND.company}`,
  description: BRAND.tagline,
  applicationName: BRAND.name,
  authors: [{ name: BRAND.company, url: BRAND.companyUrl }],
  creator: BRAND.company,
  publisher: BRAND.company,
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: BRAND.name,
    statusBarStyle: "black-translucent",
  },
};

export const viewport = {
  themeColor: BRAND.ink,
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${outfit.variable}  h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <PwaRegister />
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
          <ThemedToaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
