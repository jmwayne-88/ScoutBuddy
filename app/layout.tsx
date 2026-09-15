import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Montserrat } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { getActor } from "@/lib/session";
import { PatrolBadge } from "@/components/PatrolBadge";

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
        <header className="bg-scout-gray-dark text-white px-4 py-3 flex items-center justify-between gap-4">
          <span className="font-heading font-extrabold tracking-wide">ScoutBuddy</span>
          <span className="text-sm flex items-center gap-2">
            {actor ? (
              actor.role === "ASPL" ? (
                "Acting as: ASPL of Camping"
              ) : (
                <span className="flex items-center gap-2">
                  Acting as: Patrol Leader — <PatrolBadge patrol={actor.patrol} />
                </span>
              )
            ) : (
              "No role selected"
            )}
            {" · "}
            <Link href="/" className="underline text-white">
              Switch role
            </Link>
          </span>
        </header>
        <main className="p-4 max-w-3xl mx-auto">{children}</main>
      </body>
    </html>
  );
}
