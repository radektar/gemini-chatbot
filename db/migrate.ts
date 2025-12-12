import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

config({
  path: ".env.local",
});

const runMigrate = async () => {
  if (!process.env.POSTGRES_URL) {
    console.log("⚠️  POSTGRES_URL is not defined - skipping migrations (PoC mode)");
    process.exit(0);
  }

  // Check if POSTGRES_URL is a placeholder (common placeholder patterns)
  const postgresUrl = process.env.POSTGRES_URL;
  const isPlaceholder = 
    postgresUrl.includes('user:password@host:port') ||
    postgresUrl.includes('localhost') && postgresUrl.includes('password') ||
    postgresUrl === 'postgresql://user:password@host:port/database?sslmode=require';

  if (isPlaceholder) {
    console.log("⚠️  POSTGRES_URL appears to be a placeholder - skipping migrations (PoC mode)");
    process.exit(0);
  }

  // Validate POSTGRES_URL format
  try {
    new URL(postgresUrl);
  } catch (error) {
    console.log("⚠️  Invalid POSTGRES_URL format - skipping migrations (PoC mode)");
    console.log("   Set a valid POSTGRES_URL to enable database migrations");
    process.exit(0); // Exit with success to allow build to continue
  }

  const connection = postgres(process.env.POSTGRES_URL, { max: 1 });
  const db = drizzle(connection);

  console.log("⏳ Running migrations...");

  const start = Date.now();
  await migrate(db, { migrationsFolder: "./lib/drizzle" });
  const end = Date.now();

  console.log("✅ Migrations completed in", end - start, "ms");
  process.exit(0);
};

runMigrate().catch((err) => {
  console.error("❌ Migration failed");
  console.error(err);
  process.exit(1);
});
