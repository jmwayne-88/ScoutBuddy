import { db } from "./db";
import type { UnitDb } from "./unit-db";
import { UNIT_HIERARCHY_INCLUDE, unitFullLabel } from "./units";

// REQ-27.15: a unit admin can take their unit's data out, or remove it
// entirely. Troop data is read and deleted through the unit-scoped client,
// so Row-Level Security guarantees neither operation can reach another
// unit's rows even if a filter here were wrong. The unit's own identity,
// members, and membership log live in ADR 0035's tables and are read with
// the plain client, always filtered by this unit's id.

export const UNIT_EXPORT_FORMAT_VERSION = 1;

export async function exportUnitData(unitDb: UnitDb, unitId: string) {
  const [unit, members, events] = await Promise.all([
    db.unit.findUniqueOrThrow({ where: { id: unitId }, include: UNIT_HIERARCHY_INCLUDE }),
    db.unitMembership.findMany({
      where: { unitId },
      select: {
        role: true,
        patrolId: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    db.unitEvent.findMany({ where: { unitId }, orderBy: { createdAt: "asc" } }),
  ]);

  // Flat tables keyed by id, the same shape as the database, rather than a
  // nested tree -- complete by construction, and easy to load elsewhere.
  // Pending upload batches are left out: they're 24-hour staging rows
  // (ADR 0031), not the unit's data.
  const [patrols, campouts, mealFrameworkExceptions, menus, meals, dishes, ingredients, reviews, comments, commentActivity] =
    await Promise.all([
      unitDb.patrol.findMany({ orderBy: { order: "asc" } }),
      unitDb.campout.findMany({ orderBy: { date: "asc" } }),
      unitDb.mealFrameworkException.findMany({ orderBy: { createdAt: "asc" } }),
      unitDb.menu.findMany({ orderBy: { createdAt: "asc" } }),
      unitDb.meal.findMany(),
      unitDb.dish.findMany(),
      unitDb.ingredient.findMany(),
      unitDb.review.findMany({ orderBy: { createdAt: "asc" } }),
      unitDb.comment.findMany({ orderBy: { createdAt: "asc" } }),
      unitDb.commentActivity.findMany({ orderBy: { createdAt: "asc" } }),
    ]);

  return {
    formatVersion: UNIT_EXPORT_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    unit: {
      id: unit.id,
      label: unitFullLabel(unit),
      unitType: unit.unitType,
      unitNumber: unit.unitNumber,
      genderDesignation: unit.genderDesignation,
      district: unit.district.name,
      councilNumber: unit.district.council.number,
      councilName: unit.district.council.name,
    },
    members: members.map((m) => ({ ...m.user, role: m.role, patrolId: m.patrolId, joinedAt: m.createdAt })),
    memberEvents: events,
    patrols,
    campouts,
    mealFrameworkExceptions,
    menus,
    meals,
    dishes,
    ingredients,
    reviews,
    comments,
    commentActivity,
  };
}

// Leaves before parents, since the foreign keys between these tables are
// RESTRICT (the app's manual-cascade style, ADR 0012). Then the Unit row
// itself, which cascades to its memberships, invitations, and membership
// log. Two steps, not one transaction, because the second runs outside the
// unit-scoped role -- if it fails, rerunning finds no troop data left and
// just finishes the job. The explicit unitId filters are redundant with
// RLS on purpose: this is the one operation where a scoping slip would
// destroy data rather than show it, so it doesn't rely on one layer.
export async function deleteUnitData(unitDb: UnitDb, unitId: string, actorUserId: string) {
  const unit = await db.unit.findUniqueOrThrow({ where: { id: unitId }, include: UNIT_HIERARCHY_INCLUDE });

  await unitDb.$unitTransaction(async (tx) => {
    await tx.commentActivity.deleteMany({ where: { unitId } });
    await tx.comment.deleteMany({ where: { unitId } });
    await tx.ingredient.deleteMany({ where: { unitId } });
    await tx.dish.deleteMany({ where: { unitId } });
    await tx.meal.deleteMany({ where: { unitId } });
    await tx.review.deleteMany({ where: { unitId } });
    await tx.menu.deleteMany({ where: { unitId } });
    await tx.mealFrameworkException.deleteMany({ where: { unitId } });
    await tx.campout.deleteMany({ where: { unitId } });
    await tx.campoutUploadBatch.deleteMany({ where: { unitId } });
    await tx.patrol.deleteMany({ where: { unitId } });
  });

  await db.unit.delete({ where: { id: unitId } });

  // The unit's own event log just went with it, so the record that it was
  // deleted -- and by whom -- goes in the account-level auth log instead.
  await db.authEvent.create({
    data: { type: "UNIT_DELETED", userId: actorUserId, identifier: `${unitFullLabel(unit)} (${unitId})` },
  });
}
