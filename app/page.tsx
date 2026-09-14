import { getActor } from "@/lib/session";
import { PATROLS, patrolLabel } from "@/lib/constants";
import { chooseRole } from "./role-actions";

export default async function HomePage() {
  const actor = await getActor();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Who&apos;s using ScoutBuddy?</h1>
      {actor && (
        <p className="text-sm text-slate-600">
          Currently acting as{" "}
          {actor.role === "ASPL" ? "the ASPL of Camping" : `the Patrol Leader for ${patrolLabel(actor.patrol)}`}.
        </p>
      )}
      <form action={chooseRole} className="space-y-4">
        <fieldset className="space-y-2">
          <legend className="font-medium">I am...</legend>
          <label className="flex items-center gap-2">
            <input type="radio" name="role" value="ASPL" defaultChecked={actor?.role === "ASPL"} />
            the ASPL of Camping
          </label>
          {PATROLS.map((p) => (
            <label key={p.value} className="flex items-center gap-2">
              <input
                type="radio"
                name="role"
                value={`PATROL_LEADER:${p.value}`}
                defaultChecked={actor?.role === "PATROL_LEADER" && actor.patrol === p.value}
              />
              the Patrol Leader for {p.label}
            </label>
          ))}
        </fieldset>
        <button type="submit" className="rounded bg-slate-900 px-4 py-2 text-white">
          Continue
        </button>
      </form>
    </div>
  );
}
