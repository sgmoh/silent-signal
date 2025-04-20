import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Use the provided PostgreSQL connection string directly
const connectionString = "postgresql://neondb_owner:npg_ECmjIl5iPnK2@ep-holy-bread-a4m4upgd-pooler.us-east-1.aws.neon.tech/silent?sslmode=require";

export const pool = new Pool({ connectionString });
export const db = drizzle({ client: pool, schema });
