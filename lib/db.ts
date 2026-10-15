import { PrismaClient } from "@prisma/client";
import { assertCorrectDatabaseHost } from "./db-environment-guard";

assertCorrectDatabaseHost();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
