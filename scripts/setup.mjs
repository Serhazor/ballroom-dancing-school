/**
 * Runs before `next build` (see package.json): creates/updates the database tables and
 * seeds the launch classes, so a normal deploy leaves a working site. Safe to repeat.
 */
import { spawnSync } from "node:child_process";
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
config({ quiet: true });

if (!process.env.DATABASE_URL) {
  console.warn("[setup] DATABASE_URL is not set, skipping database setup.");
  process.exit(0);
}

const run = (cmd, args) => {
  const r = spawnSync(cmd, args, { stdio: "inherit", shell: process.platform === "win32" });
  if (r.status !== 0) {
    console.error(`[setup] ${cmd} ${args.join(" ")} failed`);
    process.exit(r.status ?? 1);
  }
};

run("npx", ["drizzle-kit", "push", "--force"]);
run("npx", ["tsx", "scripts/seed.ts"]);
