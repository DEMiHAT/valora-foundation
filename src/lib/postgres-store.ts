import postgres from "postgres";
import { DomainError, type DomainState } from "./domain";

/** Only imported by the server repository. No database credentials reach clients. */
export function createPostgresStore(url: string, environment: "test" | "live" = "test") {
  const host = new URL(url).hostname;
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(host);
  const sql = postgres(url, {
    max: 3,
    prepare: false, // Required by Supabase's transaction pooler.
    ssl: local ? false : { rejectUnauthorized: true, ...(process.env.DATABASE_CA_CERT ? {ca: process.env.DATABASE_CA_CERT.replace(/\\n/g, "\n")} : {}) },
    connect_timeout: 10,
    idle_timeout: 20,
    max_lifetime: 300,
    connection: { application_name: "valora", statement_timeout: 15000 },
    onnotice: () => {},
  });

  async function read() {
    const [row] = await sql<{ state: DomainState }[]>`
      select state from valora_private.app_state where environment = ${environment}
    `;
    if (!row) throw new DomainError("CONFIG", "The registration database needs its initial migration.", 503);
    return row.state;
  }

  async function transact<T>(fn: (state: DomainState) => T): Promise<T> {
    // The row lock serializes all allocation/payment mutations across Vercel
    // instances. A failed operation rolls back the entire registration batch.
    const result = await sql.begin(async tx => {
      const [row] = await tx<{ state: DomainState }[]>`
        select state from valora_private.app_state where environment = ${environment} for update
      `;
      if (!row) throw new DomainError("CONFIG", "The registration database needs its initial migration.", 503);
      const value = fn(row.state);
      await tx`
        update valora_private.app_state
        set state = ${tx.json(row.state as unknown as postgres.JSONValue)}, updated_at = now()
        where environment = ${environment}
      `;
      return { value };
    });
    return (result as { value: T }).value;
  }

  async function rateLimit(key: string, limit: number, windowMs: number) {
    // Keep request counters separate so they do not lock registration records.
    const now = Date.now();
    await sql`delete from valora_private.rate_limits where reset_at < ${now - 86400000}`;
    const [row] = await sql<{ hits: number }[]>`
      insert into valora_private.rate_limits (key, hits, reset_at)
      values (${key}, 1, ${now + windowMs})
      on conflict (key) do update set
        hits = case when rate_limits.reset_at <= ${now} then 1 else rate_limits.hits + 1 end,
        reset_at = case when rate_limits.reset_at <= ${now} then ${now + windowMs} else rate_limits.reset_at end
      returning hits
    `;
    return row.hits <= limit;
  }

  return { read, transact, rateLimit, close: () => sql.end({ timeout: 5 }) };
}

let store: ReturnType<typeof createPostgresStore> | undefined;
export function postgresStore() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new DomainError("CONFIG", "Configure the Supabase database connection before opening registrations.", 503);
  return store ??= createPostgresStore(url, process.env.RAZORPAY_KEY_ID?.startsWith("rzp_test_") ? "test" : "live");
}
