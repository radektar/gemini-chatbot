import { Metadata } from "next";
import { Space_Grotesk, DM_Sans } from "next/font/google";
import { Toaster } from "sonner";

import { Navbar } from "@/components/custom/navbar";
import { ThemeProvider } from "@/components/custom/theme-provider";

import "./globals.css";

/**
 * TTTR Design System Fonts (Phase 07 - UI Branding)
 * Extracted from Figma via MCP:
 * - Primary: Space Grotesk (headings, buttons, interface)
 * - Secondary: DM Sans (paragraphs, body text)
 */
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--tttr-font-primary",
  display: "swap",
  weight: ["400", "500", "700"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--tttr-font-secondary",
  display: "swap",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://impact-chad.vercel.ai"),
  title: "Impact Chat",
  description: "AI-powered chatbot with Monday.com and Slack integrations.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${dmSans.variable}`}>
      <body className="antialiased font-primary">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Toaster position="top-center" />
          <Navbar />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
