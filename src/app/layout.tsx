import { Outfit } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "next-themes";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: "400"
});


export const metadata = {
  title: "Lenzro CarHire",
  description: "Fleet, clients and contracts — one workspace per business.",
  applicationName: "Lenzro CarHire",
  icons: { icon: "/logo.png", apple: "/logo.png" },
  appleWebApp: {
    capable: true,
    title: "Lenzro CarHire",
    statusBarStyle: "black-translucent",
  },
};

export const viewport = {
  themeColor: "#000000",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${outfit.variable}  h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col">
        <PwaRegister />
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {children}
        </ThemeProvider>
        <Toaster position="top-center" theme="dark" richColors />
      </body>
    </html>
  );
}
