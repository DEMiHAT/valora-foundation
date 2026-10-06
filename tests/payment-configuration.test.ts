import { test } from "node:test";
import assert from "node:assert/strict";
import { checkoutConfigured, checkoutPolicyText } from "../src/lib/payment-configuration";
import { events } from "../src/data/events";
const env = {NODE_ENV:"production",DATA_PROVIDER:"supabase",DATABASE_URL:"postgresql://localhost/test",RAZORPAY_KEY_ID:"rzp_test_example",RAZORPAY_KEY_SECRET:"test",RAZORPAY_WEBHOOK_SECRET:"test"};
test("isolated test checkout needs credentials and database but no live policy approval",()=>{
  assert.equal(checkoutConfigured(events[0],env),true);
  assert.match(checkoutPolicyText(env), /does not reserve/);
  assert.equal(checkoutConfigured(events[0],{...env,DATABASE_URL:""}),false);
  assert.equal(checkoutConfigured(events[0],{...env,RAZORPAY_KEY_SECRET:""}),false);
});
test("live checkout cannot inherit test-mode policy or skip organiser approvals",()=>{
  const live = {...env,RAZORPAY_KEY_ID:"rzp_live_example"};
  assert.equal(checkoutConfigured(events[0],live),false);
  assert.equal(checkoutConfigured(events[0],{...live,PAYMENT_REFUND_POLICY:"Approved policy"}),false);
  assert.equal(checkoutConfigured(events[0],{...live,PAYMENT_REFUND_POLICY:"Approved policy",[events[0].matrixApprovalEnvKey]:"true"}),true);
});
