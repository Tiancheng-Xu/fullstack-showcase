import { createClient } from "@libsql/client";
import { env } from "@nurture-bloom-mvp-99d5175d/env/server";
import { drizzle } from "drizzle-orm/libsql";

import * as schema from "./schema";

export function createDb() {
  const client = createClient({
    url: env.DATABASE_URL,
  });

  return drizzle({ client, schema });
}

export const db = createDb();
