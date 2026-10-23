import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { Actor, UnitScope } from "./session";

// REQ-27.6: the cross-tenant isolation suite. Unlike the rest of `npm test`
// it runs against a real database -- the Neon development branch (ADR
// 0014), never production -- because what it checks lives there: Row-
// Level Security, the same-unit triggers, and the indexes (ADR 0036). It
// seeds dozens of units, then acts as a member of Unit A against Unit B's
// ids, through both the data layer and every Server Action that takes an
// id, and asserts Unit B's data comes out byte-for-byte unchanged.
//
// Skipped (not failed) only when there's no DATABASE_URL at all, e.g. a
// checkout without .env.

const { session, RedirectSignal } = vi.hoisted(() => {
  class RedirectSignal extends Error {
    constructor(readonly url: string) {
      super(`redirect: ${url}`);
    }
  }
  return {
    RedirectSignal,
    session: {
      scope: null as UnitScope | null,
      userId: "",
    },
  };
});

// Actions get "who's acting, in which unit" from lib/session.ts; this
// stands in for a signed-in request. Everything below it (the unit-scoped
// client, RLS, triggers) is real.
vi.mock("@/lib/session", () => {
  class StepUpRequiredError extends Error {}
  class NoUnitScopeError extends Error {}
  return {
    StepUpRequiredError,
    NoUnitScopeError,
    getActor: async () => session.scope?.actor ?? null,
    getUnitScope: async () => session.scope,
    requireUnitScope: async () => {
      if (!session.scope) throw new NoUnitScopeError();
      return session.scope;
    },
    getActiveMembership: async () =>
      session.scope
        ? { userId: session.userId, sessionId: "test-session", unitId: session.scope.unitId, actor: session.scope.actor }
        : null,
    requireStepUp: async () => {},
  };
});
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new RedirectSignal(url);
  },
  notFound: () => {
    throw new RedirectSignal("not-found");
  },
}));
vi.mock("@/lib/auth", () => ({ auth: {}, baseURL: "http://localhost:3000" }));
vi.mock("@/lib/ingredient-categorization", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./ingredient-categorization")>()),
  classifyIngredientWithClaude: async () => "OTHER",
}));

const hasDatabase = !!process.env.DATABASE_URL;

// Every troop-data table (REQ-27.1), and the ADR 0035 tables that also
// carry unitId but are the identity layer, read by lib/session.ts before
// any unit is chosen -- deliberately not under RLS.
const SCOPED_TABLES = [
  "Patrol",
  "Campout",
  "CampoutUploadBatch",
  "Menu",
  "Meal",
  "Dish",
  "Ingredient",
  "Review",
  "Comment",
  "CommentActivity",
  "MealFrameworkException",
] as const;
const IDENTITY_TABLES_WITH_UNIT_ID = ["UnitMembership", "UnitInvitation", "UnitEvent"];

// Every reference between unit-scoped rows: [child table, column, parent table].
const UNIT_REFERENCES: [string, string, string][] = [
  ["Menu", "campoutId", "Campout"],
  ["Menu", "patrolId", "Patrol"],
  ["Meal", "menuId", "Menu"],
  ["Dish", "mealId", "Meal"],
  ["Ingredient", "dishId", "Dish"],
  ["Review", "menuId", "Menu"],
  ["Comment", "menuId", "Menu"],
  ["Comment", "dishId", "Dish"],
  ["Comment", "ingredientId", "Ingredient"],
  ["Comment", "parentId", "Comment"],
  ["CommentActivity", "menuId", "Menu"],
  ["CommentActivity", "commentId", "Comment"],
  ["MealFrameworkException", "campoutId", "Campout"],
  ["MealFrameworkException", "patrolId", "Patrol"],
  ["UnitMembership", "patrolId", "Patrol"],
  ["UnitInvitation", "patrolId", "Patrol"],
];

const UNIT_COUNT = 24;
// Not a real council number (real ones are three digits), so a leftover
// from a crashed run is unmistakable and swept on the next run.
const TEST_COUNCIL_NUMBER = 990027;

type SeededUnit = {
  id: string;
  patrolId: string;
  otherPatrolId: string;
  campoutId: string;
  menuId: string;
  mealId: string;
  dishId: string;
  ingredientId: string;
  reviewId: string;
  commentId: string;
  exceptionId: string;
  batchId: string;
  membershipId: string;
  invitationId: string;
};

describe.skipIf(!hasDatabase)("cross-tenant isolation (REQ-27.6)", { timeout: 180_000 }, () => {
  let db: typeof import("./db").db;
  let unitDb: typeof import("./unit-db").unitDb;
  let units: SeededUnit[] = [];
  let userId = "";
  let A: SeededUnit;
  let B: SeededUnit;

  async function cleanUp() {
    const council = await db.council.findUnique({
      where: { number: TEST_COUNCIL_NUMBER },
      include: { districts: { include: { units: { select: { id: true } } } } },
    });
    const unitIds = council?.districts.flatMap((d) => d.units.map((u) => u.id)) ?? [];
    if (unitIds.length > 0) {
      const where = { unitId: { in: unitIds } };
      // Leaves first; the foreign keys between these are RESTRICT.
      await db.commentActivity.deleteMany({ where });
      await db.comment.deleteMany({ where });
      await db.ingredient.deleteMany({ where });
      await db.dish.deleteMany({ where });
      await db.meal.deleteMany({ where });
      await db.review.deleteMany({ where });
      await db.menu.deleteMany({ where });
      await db.mealFrameworkException.deleteMany({ where });
      await db.campout.deleteMany({ where });
      await db.campoutUploadBatch.deleteMany({ where });
      await db.unitMembership.deleteMany({ where });
      await db.unitInvitation.deleteMany({ where });
      await db.patrol.deleteMany({ where });
      await db.unit.deleteMany({ where: { id: { in: unitIds } } });
    }
    if (council) {
      await db.district.deleteMany({ where: { councilId: council.id } });
      await db.council.delete({ where: { id: council.id } });
    }
    await db.user.deleteMany({ where: { email: { endsWith: "@unit-isolation.test" } } });
  }

  beforeAll(async () => {
    const { NEON_DEVELOPMENT_HOST } = await import("./db-environment-guard");
    const host = new URL(process.env.DATABASE_URL!).host;
    if (host !== NEON_DEVELOPMENT_HOST) {
      throw new Error(`The isolation suite only runs against the development branch, not ${host}.`);
    }
    ({ db } = await import("./db"));
    ({ unitDb } = await import("./unit-db"));
    await cleanUp();

    // Seeded with the plain client and explicit unitIds -- the connection's
    // own role bypasses RLS, which is what lets a test (or a migration)
    // set up several units at once.
    const council = await db.council.create({
      data: { number: TEST_COUNCIL_NUMBER, name: "Unit Isolation Test Council" },
    });
    const district = await db.district.create({
      data: { councilId: council.id, name: "Isolation District", normalizedName: "isolation district" },
    });
    const user = await db.user.create({ data: { name: "Isolation Tester", email: `tester@unit-isolation.test` } });
    userId = user.id;
    session.userId = userId;

    const unitRows = await db.unit.createManyAndReturn({
      data: Array.from({ length: UNIT_COUNT }, (_, i) => ({
        unitType: "TROOP" as const,
        unitNumber: i + 1,
        genderDesignation: "BOYS" as const,
        districtId: district.id,
      })),
      select: { id: true, unitNumber: true },
    });
    unitRows.sort((a, b) => a.unitNumber - b.unitNumber);
    const ids = unitRows.map((u) => u.id);
    const each = <T>(make: (unitId: string, i: number) => T) => ids.map(make);
    const byUnit = <R extends { unitId: string; id: string }>(rows: R[]) => new Map(rows.map((r) => [r.unitId, r.id]));

    const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const patrols = await db.patrol.createManyAndReturn({
      data: each((unitId) => ({ unitId, name: "Eagle Patrol", color: "#1f4e99", order: 0 })),
    });
    const otherPatrols = await db.patrol.createManyAndReturn({
      data: each((unitId) => ({ unitId, name: "Puma Patrol", color: "#d4a017", order: 1 })),
    });
    const campouts = await db.campout.createManyAndReturn({
      data: each((unitId, i) => ({ unitId, name: `Isolation Campout ${i + 1}`, date: future })),
    });
    const patrolOf = byUnit(patrols);
    const campoutOf = byUnit(campouts);
    const menus = await db.menu.createManyAndReturn({
      data: each((unitId) => ({
        unitId,
        campoutId: campoutOf.get(unitId)!,
        patrolId: patrolOf.get(unitId)!,
        dueDate: future,
        status: "SUBMITTED" as const,
      })),
    });
    const menuOf = byUnit(menus);
    const meals = await db.meal.createManyAndReturn({
      data: each((unitId) => ({ unitId, menuId: menuOf.get(unitId)!, occasion: "SATURDAY_DINNER" as const })),
    });
    const mealOf = byUnit(meals);
    const dishes = await db.dish.createManyAndReturn({
      data: each((unitId) => ({ unitId, mealId: mealOf.get(unitId)!, name: "Foil packets" })),
    });
    const dishOf = byUnit(dishes);
    const ingredients = await db.ingredient.createManyAndReturn({
      data: each((unitId) => ({ unitId, dishId: dishOf.get(unitId)!, name: "Potatoes", quantity: "4" })),
    });
    const reviews = await db.review.createManyAndReturn({
      data: each((unitId) => ({ unitId, menuId: menuOf.get(unitId)!, decision: "CHANGES_REQUESTED" as const, comment: "More veggies" })),
    });
    const comments = await db.comment.createManyAndReturn({
      data: each((unitId) => ({
        unitId,
        menuId: menuOf.get(unitId)!,
        targetType: "MENU" as const,
        body: "Looks good",
        authorRole: "ASPL" as const,
      })),
    });
    await db.commentActivity.createMany({
      data: comments.map((c) => ({
        unitId: c.unitId,
        menuId: c.menuId,
        commentId: c.id,
        action: "CREATED" as const,
        actorRole: "ASPL" as const,
        targetSummary: "Whole menu",
      })),
    });
    const exceptions = await db.mealFrameworkException.createManyAndReturn({
      data: each((unitId) => ({ unitId, campoutId: campoutOf.get(unitId)!, occasion: "SUNDAY_BREAKFAST" as const })),
    });
    const batches = await db.campoutUploadBatch.createManyAndReturn({
      data: each((unitId) => ({ unitId, sourceFileName: "flyer.pdf", candidates: [] })),
    });
    const memberships = await db.unitMembership.createManyAndReturn({
      data: each((unitId) => ({ unitId, userId, role: "ASPL" as const, source: "MIGRATION" as const })),
    });
    const invitations = await db.unitInvitation.createManyAndReturn({
      data: each((unitId, i) => ({
        unitId,
        email: `invitee@unit-isolation.test`,
        role: "ASPL" as const,
        tokenHash: `isolation-test-token-${i}-${unitId}`,
        expiresAt: future,
      })),
    });

    const pick = <R extends { unitId: string; id: string }>(rows: R[], unitId: string) =>
      rows.find((r) => r.unitId === unitId)!.id;
    units = ids.map((id) => ({
      id,
      patrolId: pick(patrols, id),
      otherPatrolId: pick(otherPatrols, id),
      campoutId: pick(campouts, id),
      menuId: pick(menus, id),
      mealId: pick(meals, id),
      dishId: pick(dishes, id),
      ingredientId: pick(ingredients, id),
      reviewId: pick(reviews, id),
      commentId: pick(comments, id),
      exceptionId: pick(exceptions, id),
      batchId: pick(batches, id),
      membershipId: pick(memberships, id),
      invitationId: pick(invitations, id),
    }));
    // Two units from the middle of the pack rather than the first two, so
    // nothing passes just because a query happened to return rows in
    // insertion order.
    A = units[11];
    B = units[12];
  });

  afterAll(async () => {
    if (db) {
      await cleanUp();
      await db.$disconnect();
    }
  });

  beforeEach(() => {
    session.scope = null;
  });

  function actAs(unit: SeededUnit, actor: "ASPL" | "PATROL_LEADER") {
    const a: Actor =
      actor === "ASPL" ? { role: "ASPL", unitId: unit.id } : { role: "PATROL_LEADER", patrolId: unit.patrolId, unitId: unit.id };
    session.scope = { actor: a, unitId: unit.id, db: unitDb(unit.id) };
  }

  // Everything Unit B owns, read with the plain client -- the thing every
  // attack below must leave untouched.
  async function snapshot(unit: SeededUnit) {
    const where = { unitId: unit.id };
    const orderBy = { id: "asc" as const };
    return JSON.stringify(
      await Promise.all([
        db.patrol.findMany({ where, orderBy }),
        db.campout.findMany({ where, orderBy }),
        db.campoutUploadBatch.findMany({ where, orderBy }),
        db.menu.findMany({ where, orderBy }),
        db.meal.findMany({ where, orderBy }),
        db.dish.findMany({ where, orderBy }),
        db.ingredient.findMany({ where, orderBy }),
        db.review.findMany({ where, orderBy }),
        db.comment.findMany({ where, orderBy }),
        db.commentActivity.findMany({ where, orderBy }),
        db.mealFrameworkException.findMany({ where, orderBy }),
        db.unitMembership.findMany({ where, orderBy }),
        db.unitInvitation.findMany({ where, orderBy }),
      ])
    );
  }

  function form(fields: Record<string, string | string[]>) {
    const fd = new FormData();
    for (const [key, value] of Object.entries(fields)) {
      for (const v of Array.isArray(value) ? value : [value]) fd.append(key, v);
    }
    return fd;
  }

  describe("database layer", () => {
    it("every troop-data table has RLS on, an index led by unitId, and no unit-bearing table is left unprotected", async () => {
      const columns = await db.$queryRaw<{ table_name: string }[]>`
        SELECT table_name FROM information_schema.columns
        WHERE table_schema = current_schema() AND column_name = 'unitId'`;
      const withUnitId = columns.map((c) => c.table_name).sort();
      // A future table that gains unitId must join one list or the other on purpose.
      expect(withUnitId).toEqual([...SCOPED_TABLES, ...IDENTITY_TABLES_WITH_UNIT_ID].sort());

      const rls = await db.$queryRaw<{ relname: string }[]>`
        SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = current_schema() AND c.relkind = 'r' AND c.relrowsecurity`;
      expect(rls.map((r) => r.relname).sort()).toEqual([...SCOPED_TABLES].sort());

      const indexed = await db.$queryRaw<{ table_name: string }[]>`
        SELECT t.relname AS table_name
        FROM pg_index i
        JOIN pg_class t ON t.oid = i.indrelid
        JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = i.indkey[0]
        JOIN pg_namespace n ON n.oid = t.relnamespace
        WHERE n.nspname = current_schema() AND a.attname = 'unitId'`;
      const indexedTables = new Set(indexed.map((r) => r.table_name));
      for (const table of withUnitId) expect(indexedTables, `${table}.unitId index`).toContain(table);
    });

    it("a unit sees exactly its own rows in every table, out of dozens of units", async () => {
      const scoped = unitDb(A.id);
      const counts = await Promise.all([
        scoped.patrol.findMany(),
        scoped.campout.findMany(),
        scoped.campoutUploadBatch.findMany(),
        scoped.menu.findMany(),
        scoped.meal.findMany(),
        scoped.dish.findMany(),
        scoped.ingredient.findMany(),
        scoped.review.findMany(),
        scoped.comment.findMany(),
        scoped.commentActivity.findMany(),
        scoped.mealFrameworkException.findMany(),
      ]);
      for (const rows of counts) {
        expect(rows.length).toBeGreaterThan(0);
        expect(rows.every((r) => r.unitId === A.id)).toBe(true);
      }
      expect(counts[0].map((p) => p.id).sort()).toEqual([A.patrolId, A.otherPatrolId].sort());
    });

    it("another unit's ids find nothing, and updates/deletes by them touch nothing", async () => {
      const scoped = unitDb(A.id);
      const before = await snapshot(B);
      expect(await scoped.campout.findUnique({ where: { id: B.campoutId } })).toBeNull();
      expect(await scoped.menu.findUnique({ where: { id: B.menuId } })).toBeNull();
      expect(await scoped.ingredient.findFirst({ where: { id: B.ingredientId } })).toBeNull();
      expect(await scoped.menu.count({ where: { patrolId: B.patrolId } })).toBe(0);
      expect((await scoped.menu.updateMany({ where: { id: B.menuId }, data: { status: "APPROVED" } })).count).toBe(0);
      expect((await scoped.comment.deleteMany({ where: { id: B.commentId } })).count).toBe(0);
      await expect(scoped.patrol.update({ where: { id: B.patrolId }, data: { name: "Taken" } })).rejects.toThrow();
      await expect(scoped.campout.delete({ where: { id: B.campoutId } })).rejects.toThrow();
      expect(await snapshot(B)).toBe(before);
    });

    it("new rows land in the acting unit, and can't be written into another", async () => {
      const scoped = unitDb(A.id);
      const created = await scoped.campout.create({ data: { name: "Lands in A", date: new Date() } });
      expect(created.unitId).toBe(A.id);
      await scoped.campout.delete({ where: { id: created.id } });

      await expect(scoped.campout.create({ data: { unitId: B.id, name: "Smuggled", date: new Date() } })).rejects.toThrow();
    });

    it("no reference can cross a unit boundary (REQ-27.3)", async () => {
      const scoped = unitDb(A.id);
      const due = new Date();
      await expect(
        scoped.menu.create({ data: { campoutId: B.campoutId, patrolId: A.otherPatrolId, dueDate: due } })
      ).rejects.toThrow(/cross-unit reference/);
      await expect(
        scoped.menu.create({ data: { campoutId: A.campoutId, patrolId: B.otherPatrolId, dueDate: due } })
      ).rejects.toThrow(/cross-unit reference/);
      await expect(scoped.ingredient.create({ data: { dishId: B.dishId, name: "x", quantity: "1" } })).rejects.toThrow(
        /cross-unit reference/
      );
      await expect(
        scoped.comment.create({
          data: { menuId: A.menuId, targetType: "DISH", dishId: B.dishId, body: "x", authorRole: "ASPL" },
        })
      ).rejects.toThrow(/cross-unit reference/);
      await expect(
        scoped.mealFrameworkException.create({ data: { campoutId: A.campoutId, patrolId: B.patrolId, occasion: "SATURDAY_LUNCH" } })
      ).rejects.toThrow(/cross-unit reference/);
      // The identity tables get the same rule, even through the unrestricted client.
      await expect(
        db.unitMembership.update({ where: { id: A.membershipId }, data: { patrolId: B.patrolId } })
      ).rejects.toThrow(/cross-unit reference/);
    });

    it("rejects even the unrestricted client moving a row between units or inserting with no unit", async () => {
      await expect(db.patrol.update({ where: { id: A.patrolId }, data: { unitId: B.id } })).rejects.toThrow(
        /cannot move to another unit/
      );
      await expect(db.campout.create({ data: { name: "No unit", date: new Date() } })).rejects.toThrow();
    });

    it("the error for a cross-unit reference names no other unit's data (REQ-27.13)", async () => {
      const error = await unitDb(A.id)
        .menu.create({ data: { campoutId: B.campoutId, patrolId: A.otherPatrolId, dueDate: new Date() } })
        .catch((e: Error) => e);
      expect(String(error)).not.toContain(B.id);
      expect(String(error)).not.toContain(B.campoutId);
    });
  });

  describe("unit export and deletion (REQ-27.15)", () => {
    it("exports only the acting unit's data", async () => {
      const { exportUnitData } = await import("./unit-data");
      const data = await exportUnitData(unitDb(A.id), A.id);
      expect(data.unit.id).toBe(A.id);
      const tables = [
        data.patrols,
        data.campouts,
        data.mealFrameworkExceptions,
        data.menus,
        data.meals,
        data.dishes,
        data.ingredients,
        data.reviews,
        data.comments,
        data.commentActivity,
      ];
      for (const rows of tables) {
        expect(rows.length).toBeGreaterThan(0);
        expect(rows.every((r) => r.unitId === A.id)).toBe(true);
      }
      expect(JSON.stringify(data)).not.toContain(B.id);
    });

    it("deletes one unit entirely and leaves every other unit untouched", async () => {
      const { deleteUnitData } = await import("./unit-data");
      const doomed = units[0];
      const before = await snapshot(B);
      await deleteUnitData(unitDb(doomed.id), doomed.id, userId);

      expect(await db.unit.findUnique({ where: { id: doomed.id } })).toBeNull();
      const where = { unitId: doomed.id };
      const left = await Promise.all([
        db.patrol.count({ where }),
        db.campout.count({ where }),
        db.menu.count({ where }),
        db.ingredient.count({ where }),
        db.comment.count({ where }),
        db.unitMembership.count({ where }),
      ]);
      expect(left).toEqual([0, 0, 0, 0, 0, 0]);
      expect(await snapshot(B)).toBe(before);
      expect(await db.unit.count({ where: { id: { in: units.map((u) => u.id) } } })).toBe(UNIT_COUNT - 1);
      await db.authEvent.deleteMany({ where: { userId, type: "UNIT_DELETED" } });
    });
  });

  describe("Server Actions invoked with another unit's ids", () => {
    // Each runs as Unit A against Unit B's ids. It may throw, redirect, or
    // return an error state -- what it must never do is change Unit B.
    async function attempt(fn: () => Promise<unknown>) {
      try {
        return await fn();
      } catch (error) {
        return error;
      }
    }

    it("campout and meal-framework actions", async () => {
      const actions = await import("@/app/(app)/campouts/[id]/actions");
      const before = await snapshot(B);
      actAs(A, "ASPL");
      await attempt(() => actions.assignMenu(form({ campoutId: B.campoutId, patrolId: B.otherPatrolId, dueDate: "2026-12-01" })));
      await attempt(() => actions.assignMenu(form({ campoutId: A.campoutId, patrolId: B.otherPatrolId, dueDate: "2026-12-01" })));
      await attempt(() => actions.removePatrolFromCampout(form({ campoutId: B.campoutId, patrolId: B.patrolId })));
      await attempt(() => actions.removeOccasion(form({ campoutId: B.campoutId, occasion: "SATURDAY_DINNER", scope: "ALL" })));
      await attempt(() => actions.removeOccasion(form({ campoutId: A.campoutId, occasion: "SATURDAY_LUNCH", scope: B.patrolId })));
      await attempt(() => actions.restoreOccasion(form({ exceptionId: B.exceptionId })));
      expect(await snapshot(B)).toBe(before);
    });

    it("menu-editing and review actions", async () => {
      const actions = await import("@/app/(app)/menus/[id]/actions");
      const before = await snapshot(B);

      actAs(A, "PATROL_LEADER");
      const b = { menuId: B.menuId };
      await attempt(() => actions.updateNotes(form({ ...b, nutritionNote: "x", allergyNote: "x" })));
      await attempt(() => actions.addDish(form({ ...b, mealId: B.mealId, name: "x" })));
      await attempt(() => actions.renameDish(form({ ...b, dishId: B.dishId, name: "x" })));
      await attempt(() => actions.removeDish(form({ ...b, dishId: B.dishId })));
      await attempt(() => actions.addIngredient(form({ ...b, dishId: B.dishId, name: "x", quantity: "1" })));
      await attempt(() => actions.editIngredient(form({ ...b, ingredientId: B.ingredientId, name: "x", quantity: "1" })));
      await attempt(() => actions.removeIngredient(form({ ...b, ingredientId: B.ingredientId })));
      await attempt(() => actions.submitMenu(form(b)));
      // Own menu, other unit's child ids.
      const a = { menuId: A.menuId };
      await attempt(() => actions.addDish(form({ ...a, mealId: B.mealId, name: "x" })));
      await attempt(() => actions.renameDish(form({ ...a, dishId: B.dishId, name: "x" })));
      await attempt(() => actions.removeDish(form({ ...a, dishId: B.dishId })));
      await attempt(() => actions.addIngredient(form({ ...a, dishId: B.dishId, name: "x", quantity: "1" })));
      await attempt(() => actions.editIngredient(form({ ...a, ingredientId: B.ingredientId, name: "x", quantity: "1" })));
      await attempt(() => actions.removeIngredient(form({ ...a, ingredientId: B.ingredientId })));
      await attempt(() => actions.undoRemoveDish(form({ ...a, mealId: B.mealId, name: "x", ingredients: "[]" })));
      await attempt(() => actions.undoRemoveIngredient(form({ ...a, dishId: B.dishId, name: "x", quantity: "1" })));

      actAs(A, "ASPL");
      await attempt(() => actions.approveMenu(form(b)));
      await attempt(() => actions.rejectMenu(form({ ...b, comment: "x" })));
      expect(await snapshot(B)).toBe(before);
    });

    it("comment actions", async () => {
      const actions = await import("@/app/(app)/menus/[id]/comment-actions");
      const before = await snapshot(B);
      for (const role of ["ASPL", "PATROL_LEADER"] as const) {
        actAs(A, role);
        await attempt(() => actions.addComment(form({ menuId: B.menuId, target: "MENU", body: "x" })));
        await attempt(() => actions.addComment(form({ menuId: A.menuId, target: "DISH", dishId: B.dishId, body: "x" })));
        await attempt(() =>
          actions.addComment(form({ menuId: A.menuId, target: "INGREDIENT", ingredientId: B.ingredientId, body: "x" }))
        );
        for (const menuId of [A.menuId, B.menuId]) {
          await attempt(() => actions.replyToComment(form({ menuId, parentId: B.commentId, body: "x" })));
          await attempt(() => actions.assignComment(form({ menuId, commentId: B.commentId, assigneeRole: "ASPL" })));
          await attempt(() => actions.resolveComment(form({ menuId, commentId: B.commentId })));
          await attempt(() => actions.reopenComment(form({ menuId, commentId: B.commentId })));
          await attempt(() => actions.deleteComment(form({ menuId, commentId: B.commentId })));
        }
      }
      expect(await snapshot(B)).toBe(before);
    });

    it("patrol actions", async () => {
      const actions = await import("@/app/(app)/patrols/actions");
      const before = await snapshot(B);
      actAs(A, "ASPL");
      const idle = { error: null };
      await attempt(() =>
        actions.updatePatrol(idle, form({ patrolId: B.patrolId, name: "x", color: "#336699", type: "YOUTH", order: "0" }))
      );
      await attempt(() => actions.setPatrolActive(form({ patrolId: B.patrolId, isActive: "false" })));
      await attempt(() => actions.movePatrol(form({ patrolId: B.patrolId, direction: "down" })));
      await attempt(() => actions.assignToFutureCampouts(form({ patrolId: B.otherPatrolId })));
      await attempt(() => actions.assignPatrolToCampouts(form({ patrolId: B.otherPatrolId, campoutId: [A.campoutId] })));
      await attempt(() => actions.assignPatrolToCampouts(form({ patrolId: A.otherPatrolId, campoutId: [B.campoutId] })));
      await attempt(() => actions.deletePatrol(form({ patrolId: B.otherPatrolId })));
      expect(await snapshot(B)).toBe(before);
    });

    it("campout-upload actions", async () => {
      const actions = await import("@/app/(app)/campouts/upload/actions");
      const before = await snapshot(B);
      actAs(A, "ASPL");
      const result = await attempt(() =>
        actions.confirmCampoutUpload({ error: null }, form({ batchId: B.batchId, edits: "[]" }))
      );
      expect(result).toEqual({ error: "This upload has expired. Please upload the file again." });
      await attempt(() => actions.discardCampoutUpload(form({ batchId: B.batchId })));
      expect(await snapshot(B)).toBe(before);
    });

    it("unit-membership actions", async () => {
      const actions = await import("@/app/(app)/unit/actions");
      const before = await snapshot(B);
      actAs(A, "ASPL");
      await attempt(() => actions.removeMember(form({ membershipId: B.membershipId })));
      await attempt(() => actions.revokeInvitation(form({ invitationId: B.invitationId })));
      expect(await snapshot(B)).toBe(before);
    });

    it("still work normally inside the acting unit -- the attacks above aren't failing for some unrelated reason", async () => {
      const actions = await import("@/app/(app)/menus/[id]/actions");
      actAs(A, "PATROL_LEADER");
      const outcome = await attempt(() => actions.addDish(form({ menuId: A.menuId, mealId: A.mealId, name: "Cobbler" })));
      expect(outcome).toBeInstanceOf(RedirectSignal);
      expect(await db.dish.count({ where: { unitId: A.id, name: "Cobbler" } })).toBe(1);
    });

    it("leave no row anywhere pointing across a unit boundary", async () => {
      for (const [child, column, parent] of UNIT_REFERENCES) {
        const [{ count }] = await db.$queryRawUnsafe<{ count: number }[]>(
          `SELECT count(*)::int AS count FROM "${child}" c JOIN "${parent}" p ON p."id" = c."${column}" WHERE c."unitId" <> p."unitId"`
        );
        expect(count, `${child}.${column}`).toBe(0);
      }
    });
  });
});
