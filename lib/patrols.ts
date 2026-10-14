import { db } from "./db";

export function getActivePatrols() {
  return db.patrol.findMany({ where: { isActive: true }, orderBy: { order: "asc" } });
}

export function getAllPatrols() {
  return db.patrol.findMany({ orderBy: { order: "asc" } });
}
