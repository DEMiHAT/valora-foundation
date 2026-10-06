import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID, randomBytes } from "node:crypto";
import postgres from "postgres";
import { createPostgresStore } from "../src/lib/postgres-store";
import { createRegistration, settleGatewayPayment, type Runtime } from "../src/lib/domain";
import { events } from "../src/data/events";
import { registrationTotals } from "../src/lib/registration-totals";

test("Postgres persists registrations, isolates test data, and serializes payment replays", {skip: !process.env.TEST_DATABASE_URL}, async () => {
  const url = process.env.TEST_DATABASE_URL!;
  assert.ok(["localhost", "127.0.0.1"].includes(new URL(url).hostname), "Integration test only runs on a disposable local database");
  const sql = postgres(url, {onnotice: () => {}});
  const store = createPostgresStore(url, "test"), live = createPostgresStore(url, "live");
  try {
    await sql.unsafe(await readFile("supabase/migrations/20261006000100_registration_store.sql", "utf8"));
    const runtime: Runtime = {uuid:randomUUID, token:()=>randomBytes(32).toString("hex"), now:()=>new Date().toISOString()};
    const input = {event_id:events[0].id,name:"Database Test",institution:"Test School",class:"10",email:"db-test@example.org",phone:"+919000000000",experience:"Beginner" as const,preferences:["who","unga","unhrc"],payment_reference:"",payment_confirmation:false,form_response_id:"db-test-order",additional_fields:{gateway_order_id:"order_DbTest",payment_provider:"razorpay"}};
    await Promise.all(Array.from({length:12}, () => store.transact(s => createRegistration(s,input,events,runtime,"website-checkout"))));
    assert.equal((await store.read()).registrations.length,1);
    await assert.rejects(store.transact(s=>{s.registrations=[];throw new Error("rollback");}), /rollback/);
    assert.equal((await store.read()).registrations.length,1);
    const payment = {id:"pay_DbTest",order_id:"order_DbTest",amount:99900,currency:"INR",status:"captured"};
    await Promise.all(Array.from({length:12}, () => store.transact(s => settleGatewayPayment(s,payment,events,runtime,"https://valora.example"))));
    const state = await store.read();
    assert.equal(state.credentials.length,1);
    assert.equal(state.allocations.length,1);
    assert.deepEqual(registrationTotals(state,events[0].id),{total:1,verified:1,pending:0,allocated:1,unallocated:0});
    assert.equal((await live.read()).registrations.length,0);
    const attempts = await Promise.all(Array.from({length:20},()=>store.rateLimit("concurrent-test",5,60000)));
    assert.equal(attempts.filter(Boolean).length,5);
    await sql`create role valora_untrusted`;
    await assert.rejects(sql.begin(async tx => {await tx`set local role valora_untrusted`;await tx`select state from valora_private.app_state`;}), (e: unknown)=> (e as {code:string}).code === "42501");
    const reopened = createPostgresStore(url,"test");
    try { assert.equal((await reopened.read()).registrations.length,1); } finally { await reopened.close(); }
  } finally { await store.close(); await live.close(); await sql.end(); }
});
