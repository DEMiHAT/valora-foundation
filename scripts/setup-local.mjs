import { randomBytes, scryptSync } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
try {
  await readFile(".env.local");
  console.error(
    ".env.local already exists. Update its settings instead of overwriting it."
  );
  process.exit(1);
} catch (e) {
  if (e.code !== "ENOENT") throw e;
}
const password = randomBytes(18).toString("base64url"),
  salt = randomBytes(16).toString("hex"),
  session = randomBytes(32).toString("hex"),
  cron = randomBytes(32).toString("hex");
const template = await readFile(".env.example", "utf8");
await writeFile(
  ".env.local",
  template
    .replace(/^SESSION_SECRET=$/m, "SESSION_SECRET=" + session)
    .replace(
      /^ADMIN_PASSWORD_HASH=$/m,
      "ADMIN_PASSWORD_HASH=" +
        salt +
        ":" +
        scryptSync(password, salt, 64).toString("hex")
    )
    .replace(/^CRON_SECRET=$/m, "CRON_SECRET=" + cron),
  { mode: 0o600, flag: "wx" }
);
console.log(
  "Local organiser access is ready. Save these credentials securely:"
);
console.log("Username: organiser");
console.log("Password: " + password);
console.log(
  "Start the website with npm run dev. Configure SMTP in .env.local to send E-cards."
);
