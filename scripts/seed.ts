import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  const { ensureRbacSeed } = await import("../src/db/rbac");
  await ensureRbacSeed();
  console.log("RBAC seed complete: lawyer 09122391810");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
