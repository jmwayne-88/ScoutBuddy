import type { UnitDb } from "./unit-db";

export function getActivePatrols(db: UnitDb) {
  return db.patrol.findMany({ where: { isActive: true }, orderBy: { order: "asc" } });
}

export function getAllPatrols(db: UnitDb) {
  return db.patrol.findMany({ orderBy: { order: "asc" } });
}
