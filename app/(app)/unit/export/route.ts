import { NextResponse } from "next/server";
import { getSessionAssuranceTier, getUnitScope } from "@/lib/session";
import { canManageUnitData } from "@/lib/permissions";
import { exportUnitData } from "@/lib/unit-data";
import { withToast } from "@/lib/toast";

// REQ-27.15: the active unit's data as one JSON download. A Route Handler,
// not a page, so it gates itself (app/(app)/layout.tsx doesn't run for
// it): ASPL of the active unit, on a passkey session, since the export
// includes members' names and email addresses (REQ-31.6's step-up rule).
export async function GET(request: Request): Promise<Response> {
  const scope = await getUnitScope();
  if (!scope || !canManageUnitData(scope.actor)) {
    return NextResponse.json({ error: "Only the ASPL of Camping can export unit data." }, { status: 403 });
  }
  if ((await getSessionAssuranceTier()) !== "passkey") {
    const target = withToast("/unit", "For security, sign out and sign back in with your passkey to export unit data.");
    return NextResponse.redirect(new URL(target, request.url), 303);
  }

  const data = await exportUnitData(scope.db, scope.unitId);
  const fileName = `scoutbuddy-${data.unit.label.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-${data.exportedAt.slice(0, 10)}.json`;

  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
