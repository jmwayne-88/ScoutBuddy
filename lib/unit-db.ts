import type { Prisma } from "@prisma/client";
import { db } from "./db";

// REQ-27.5 / ADR 0036: the only way app code reads or writes troop data.
// Every query runs in its own short transaction that first switches into
// the scoutbuddy_unit role (which, unlike the connection's own role, can't
// bypass Row-Level Security) and sets app.current_unit_id. Postgres then
// filters every read and checks every write against that unit, and fills
// in unitId on every insert -- so a query that forgets a unit filter still
// can't see or touch another unit's rows. Both settings are transaction-
// local, so nothing leaks onto the pooled connection afterwards.
export const UNIT_SCOPED_ROLE = "scoutbuddy_unit";

function enterUnit(client: Pick<Prisma.TransactionClient, "$executeRaw">, unitId: string) {
  return client.$executeRaw`SELECT set_config('role', ${UNIT_SCOPED_ROLE}, true), set_config('app.current_unit_id', ${unitId}, true)`;
}

function createUnitDb(unitId: string) {
  return db.$extends({
    name: "unit-scope",
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          const [, result] = await db.$transaction([enterUnit(db, unitId), query(args)]);
          return result;
        },
      },
    },
    client: {
      // For several writes that must land together. Don't use $transaction
      // on this client -- the per-query wrapper above can't nest inside it.
      // `redirect()` must stay outside `fn`: it throws, which would roll
      // the transaction back.
      async $unitTransaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
        return db.$transaction(async (tx) => {
          await enterUnit(tx, unitId);
          return fn(tx);
        });
      },
    },
  });
}

export type UnitDb = ReturnType<typeof createUnitDb>;

// Extending a client is cheap but not free; one per unit is plenty.
const clients = new Map<string, UnitDb>();

export function unitDb(unitId: string): UnitDb {
  let client = clients.get(unitId);
  if (!client) {
    client = createUnitDb(unitId);
    clients.set(unitId, client);
  }
  return client;
}
