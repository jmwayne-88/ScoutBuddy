import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Montserrat, Inter } from "next/font/google";
import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";
import { ThemeRegistry } from "@/components/ThemeRegistry";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-montserrat",
});

// REQ-13.16: a more current body font than Arial/Helvetica, loaded the same
// way (a next/font/google variable) as the existing Montserrat heading font.
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "ScoutBuddy",
  description: "Campout menu planning and approval for the troop",
};

// REQ-23.4: `viewportFit: "cover"` is what makes `env(safe-area-inset-*)`
// resolve to the device's actual notch/home-indicator insets rather than 0
// -- needed for components/BottomNav.tsx's fixed bar to clear the home
// indicator on notched phones instead of sitting under it.
export const viewport: Viewport = {
  viewportFit: "cover",
};

// Deliberately minimal -- the AppBar/nav chrome lives in app/(app)/layout.tsx
// instead, so routes outside that group (the print view, app/(print)/...)
// never get it, on screen or in print. See docs/requirements/printing-exports/12-menu-print-preview.md.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${montserrat.variable} ${inter.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <InitColorSchemeScript />
        <ThemeRegistry>{children}</ThemeRegistry>
      </body>
    </html>
  );
}
