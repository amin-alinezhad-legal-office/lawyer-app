import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  return drizzle(neon(url), { schema });
}

let database: ReturnType<typeof createDb> | undefined;

export function getDb() {
  if (database === undefined) database = createDb();
  return database;
}

export type Database = NonNullable<ReturnType<typeof getDb>>;
