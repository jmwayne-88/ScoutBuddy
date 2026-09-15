import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import "./globals.css";
import { getActor } from "@/lib/session";
import { PatrolBadge } from "@/components/PatrolBadge";

export const metadata: Metadata = {
  title: "ScoutBuddy",
  description: "Campout menu planning and approval for the troop",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const actor = await getActor();

  return (
    <html lang="en">
      <body>
        <header className="border-b border-slate-200 bg-white px-4 py-3 flex items-center justify-between gap-4">
          <span className="font-semibold">ScoutBuddy</span>
          <span className="text-sm text-slate-600 flex items-center gap-2">
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
            <Link href="/" className="underline">
              Switch role
            </Link>
          </span>
        </header>
        <main className="p-4 max-w-3xl mx-auto">{children}</main>
      </body>
    </html>
  );
}
