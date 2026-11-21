// app/layout.jsx
// Root layout – applies fonts, theme, toast provider, navbar, footer.

import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import AuthProvider from "@/components/layout/AuthProvider";
import { ToastProvider } from "@/components/ui/Toast";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

// Load Inter font via next/font – tree-shaken, self-hosted, no layout shift
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = {
  title: {
    default: "Campus Compass – International Student Support",
    template: "%s | Campus Compass",
  },
  description:
    "Personalized support for international students: SIM, banking, food, documentation, buddy matching and an AI chatbot — all tailored to your home country.",
};

/**
 * Inline script injected before React hydrates – prevents the
 * "white flash" on dark mode by reading localStorage synchronously.
 */
const themeScript = `
  (function () {
    try {
      var t = localStorage.getItem('cc-theme');
      var d = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (t === 'dark' || (!t && d)) {
        document.documentElement.classList.add('dark');
      }
    } catch (e) {}
  })();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable} data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        {/* Prevent dark-mode flash */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen flex flex-col antialiased">
        <AuthProvider>
          <ThemeProvider>
            <ToastProvider>
              <Navbar />
              {/* pt-16 = navbar height offset */}
              <main className="flex-1 pt-16">{children}</main>
              <Footer />
            </ToastProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

