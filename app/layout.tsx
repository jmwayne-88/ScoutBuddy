import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { getActor } from "@/lib/session";
import { RoleSwitcher } from "@/components/RoleSwitcher";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: "ScoutBuddy",
  description: "Campout menu planning and approval for the troop",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const actor = await getActor();

  return (
    <html lang="en" className={montserrat.variable}>
      <body>
        <header className="bg-scout-blue text-white px-4 py-3 flex items-center justify-between gap-4">
          <span className="font-heading font-extrabold tracking-wide">ScoutBuddy</span>
          <span className="text-sm flex items-center gap-2">
            <span className="text-white/70">Viewing as:</span>
            <RoleSwitcher actor={actor} />
          </span>
        </header>
        <main className="p-4">{children}</main>
      </body>
    </html>
  );
}
