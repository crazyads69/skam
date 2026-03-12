import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

function createDbClient() {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;
  const localUrl = process.env.DATABASE_URL ?? "file:./data/local.db";

  const client =
    tursoUrl && tursoAuthToken
      ? createClient({ url: tursoUrl, authToken: tursoAuthToken })
      : createClient({ url: localUrl });

  return drizzle(client, { schema });
}

export const db = createDbClient();
export type Database = typeof db;
