import type { Patrol } from "@prisma/client";
import { contrastText, patrolBackground } from "@/lib/colors";
import { patrolLabel } from "@/lib/constants";

export function PatrolBadge({ patrol }: { patrol: Patrol }) {
  const background = patrolBackground(patrol);
  return (
    <span
      className="inline-block rounded px-2 py-0.5 text-sm font-medium"
      style={{ backgroundColor: background, color: contrastText(background) }}
    >
      {patrolLabel(patrol)}
    </span>
  );
}
