import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createContext, runInContext } from "node:vm";
import { createHash, randomUUID } from "node:crypto";
class FakeSheet {
  rows: unknown[][] = [];
  maxRows = 1000;
  hidden = false;
  constructor(public name: string, private fail: (name: string) => void) {}
  appendRow(row: unknown[]) {
    this.fail(this.name);
    this.rows.push([...row]);
    return this;
  }
  getLastRow() {
    return this.rows.length;
  }
  getMaxRows() {
    return this.maxRows;
  }
  insertRowsAfter(_row: number, count: number) {
    this.maxRows += count;
    return this;
  }
  clearContents() {
    this.fail(this.name);
    this.rows = [];
    return this;
  }
  setFrozenRows() {
    return this;
  }
  isSheetHidden() {
    return this.hidden;
  }
  hideSheet() {
    this.hidden = true;
    return this;
  }
  deleteRow(row: number) {
    this.rows.splice(row - 1, 1);
    return this;
  }
  getDataRange() {
    return this.getRange(
      1,
      1,
      Math.max(this.rows.length, 1),
      Math.max(...this.rows.map((x) => x.length), 1)
    );
  }
  getRange(row: number, col: number, numRows = 1, numCols = 1) {
    const sheet = this;
    return {
      getValues() {
        return Array.from({ length: numRows }, (_, r) =>
          Array.from(
            { length: numCols },
            (_, c) => sheet.rows[row - 1 + r]?.[col - 1 + c] ?? ""
          )
        );
      },
      setValues(values: unknown[][]) {
        sheet.fail(sheet.name);
        for (let r = 0; r < numRows; r++) {
          sheet.rows[row - 1 + r] ??= [];
          for (let c = 0; c < numCols; c++)
            sheet.rows[row - 1 + r][col - 1 + c] = values[r][c];
        }
        return this;
      },
      setValue(value: unknown) {
        return this.setValues([[value]]);
      },
      setFontWeight() {
        return this;
      },
      setBackground() {
        return this;
      },
      setFontColor() {
        return this;
      },
    };
  }
}
function harness() {
  const props = new Map<string, string>([
      ["SPREADSHEET_ID", "test-sheet"],
      ["API_SECRET", "s".repeat(64)],
      ["APP_URL", "https://valora.example"],
      ["MATRIX_APPROVED", "true"],
    ]),
    sheets = new Map<string, FakeSheet>();
  let failSheet = "",
    failFlush = false,
    locked = false;
  const properties = {
    getProperty: (key: string) => props.get(key) ?? null,
    setProperty: (key: string, value: string) => {
      props.set(key, value);
      return properties;
    },
    deleteProperty: (key: string) => {
      props.delete(key);
      return properties;
    },
  };
  const book = {
    getSheetByName: (name: string) => sheets.get(name) ?? null,
    insertSheet: (name: string) => {
      const s = new FakeSheet(name, (n) => {
        if (n === failSheet) throw Error("Injected projection failure");
      });
      sheets.set(name, s);
      return s;
    },
  };
  const context = createContext({
    console: { error: () => {}, warn: () => {}, log: () => {} },
    PropertiesService: { getScriptProperties: () => properties },
    SpreadsheetApp: {
      openById: () => book,
      flush: () => {
        if (failFlush) throw Error("Injected flush failure");
      },
    },
    LockService: {
      getScriptLock: () => ({
        tryLock: () => {
          if (locked) return false;
          locked = true;
          return true;
        },
        releaseLock: () => {
          locked = false;
        },
      }),
    },
    Utilities: {
      getUuid: randomUUID,
      DigestAlgorithm: { SHA_256: "sha256" },
      computeDigest: (_alg: string, text: string) =>
        Array.from(createHash("sha256").update(text).digest()),
    },
    ContentService: {
      MimeType: { JSON: "application/json" },
      createTextOutput: (text: string) => ({ setMimeType: () => text }),
    },
    UrlFetchApp: {
      fetch: () => {
        assert.equal(
          locked,
          false,
          "Worker notification must happen after releasing the Sheets lock"
        );
        return { getResponseCode: () => 200 };
      },
    },
  });
  for (const file of ["Domain.gs", "Config.gs", "Code.gs"])
    runInContext(readFileSync("apps-script/" + file, "utf8"), context);
  const call = (
    action: string,
    payload: unknown = {},
    secret = "s".repeat(64)
  ) =>
    JSON.parse(
      context.doPost({
        postData: {
          contents: JSON.stringify({
            secret,
            action,
            payload,
            appUrl: "https://valora.example",
          }),
        },
      })
    );
  return {
    context,
    call,
    props,
    sheets,
    failProjection: () => {
      failSheet = "Participants";
    },
    heal: () => {
      failSheet = "";
      failFlush = false;
    },
    failFlush: () => {
      failFlush = true;
    },
  };
}
const response = {
  event_id: "valora-mun-2026",
  name: "Arjun Kumar",
  institution: "Test School",
  class: "10",
  email: "arjun@example.org",
  phone: "+919000000000",
  experience: "Beginner",
  preferences: ["who", "unga", "unhrc"],
  payment_reference: "UPI123456",
  payment_confirmation: true,
  form_response_id: "response-1",
};
test("actual Apps Script adapter imports, verifies, allocates, projects and issues secure E-ID", () => {
  const h = harness();
  h.context.setupValora();
  const imported = h.call("import", { input: response, actor: "test" });
  assert.equal(imported.ok, true);
  const id = imported.data.registration.registration_id;
  const paid = h.call("command", {
    command: { action: "verify-payment", registration_id: id },
    actor: "organiser",
  });
  assert.equal(paid.ok, true);
  assert.equal(paid.data.allocation.portfolio, "India");
  assert.equal(paid.data.credential.credential_id, "VM26-00001");
  assert.equal(h.sheets.get("Participants")!.rows.length, 2);
  assert.equal(h.sheets.get("Allocations")!.rows.length, 2);
  assert.equal(h.sheets.get("Portfolios")!.rows.length, 181);
  const checked = h.call("verify", {
    token: paid.data.credential.token,
    id: "VM26-00001",
  });
  assert.equal(checked.data.status, "ACTIVE");
  assert.equal("email" in checked.data, false);
  assert.equal(
    h.call("command", {
      command: { action: "verify-payment", registration_id: id },
      actor: "organiser",
    }).ok,
    true
  );
  assert.equal(h.call("snapshot").data.allocations.length, 1);
});
test("invalid API secret cannot read participant data", () => {
  const h = harness();
  const result = h.call("snapshot", {}, "wrong");
  assert.equal(result.ok, false);
  assert.equal(result.code, "UNAUTHENTICATED");
  assert.equal(h.props.get("STATE_VERSION"), undefined);
});
test("a projection failure does not lose the committed payment or create a duplicate on retry", () => {
  const h = harness();
  h.context.setupValora();
  const v = h.call("import", { input: response, actor: "form" });
  h.failProjection();
  const id = v.data.registration.registration_id;
  const result = h.call("command", {
    command: { action: "verify-payment", registration_id: id },
    actor: "organiser",
  });
  assert.equal(result.ok, true);
  assert.ok(h.props.get("PROJECTION_ERROR"));
  h.heal();
  h.context.rebuildOperationalViews();
  assert.equal(h.props.get("PROJECTION_ERROR"), undefined);
  const state = h.call("snapshot").data;
  assert.equal(state.allocations.length, 1);
  assert.equal(state.credentials.length, 1);
  assert.equal(h.sheets.get("Allocations")!.rows.length, 2);
});
test("failure before snapshot commit leaves the previous version authoritative", () => {
  const h = harness();
  h.context.setupValora();
  const pointer = h.props.get("STATE_VERSION");
  h.failFlush();
  assert.equal(h.call("import", { input: response, actor: "form" }).ok, false);
  assert.equal(h.props.get("STATE_VERSION"), pointer);
  h.heal();
  assert.equal(h.call("snapshot").data.registrations.length, 0);
  assert.equal(h.call("import", { input: response, actor: "form" }).ok, true);
  assert.equal(h.call("snapshot").data.registrations.length, 1);
});
test("form submit trigger maps external fields and is idempotent", () => {
  const h = harness();
  h.context.setupValora();
  h.props.set("EMAIL_WORKER_URL", "https://valora.example/api/email/process");
  h.props.set("EMAIL_WORKER_SECRET", "w".repeat(64));
  const values: Record<string, string> = {
    "Full Name": "Arjun Kumar",
    "School/Institution": "Test School",
    "Class/Grade": "10",
    Email: "arjun@example.org",
    "Contact Number": "+919000000000",
    "MUN experience": "Beginner",
    "Preference 1": "WHO",
    "Preference 2": "UNGA",
    "Preference 3": "UNHRC",
    "UPI transaction/reference ID": "UPI123456",
    "Payment confirmation": "I confirm that I have paid",
  };
  const googleResponse = {
    getId: () => response.form_response_id,
    getItemResponses: () =>
      Object.entries(values).map(([title, value]) => ({
        getItem: () => ({ getTitle: () => title }),
        getResponse: () => value,
      })),
  };
  h.context.onValoraFormSubmit({ response: googleResponse });
  h.context.onValoraFormSubmit({ response: googleResponse });
  const state = h.call("snapshot").data;
  assert.equal(state.registrations.length, 1);
  assert.deepEqual(state.registrations[0].preferences, [
    "who",
    "unga",
    "unhrc",
  ]);
  assert.equal(state.registrations[0].payment_confirmation, true);
  assert.equal(state.registrations[0].payment_status, "PENDING_PAYMENT");
});
test("live forms are held until draft portfolio matrices are approved", () => {
  const h = harness();
  h.props.delete("MATRIX_APPROVED");
  assert.equal(
    h.call("import", { input: response, actor: "form" }).code,
    "MATRIX_DRAFT"
  );
});
test("Sheets adapter supports fenced email claiming and SMTP delivery acknowledgement", () => {
  const h = harness();
  h.context.setupValora();
  h.call("import", { input: response, actor: "form" });
  const claimed = h.call("email-claim").data;
  assert.equal(claimed.message.status, "SENDING");
  assert.equal(h.call("email-claim").data, null);
  assert.equal(
    h.call("email-finish", {
      id: claimed.message.id,
      lease: "invalid",
      result: { sent: true },
    }).code,
    "LEASE"
  );
  assert.equal(
    h.call("email-finish", {
      id: claimed.message.id,
      lease: claimed.message.lease_token,
      result: { sent: true, messageId: "test-provider-id" },
    }).ok,
    true
  );
  assert.equal(h.call("snapshot").data.outbox[0].status, "SENT");
});

test("Apps Script settles captured Razorpay payments atomically across callback/webhook retries", () => {
  const h = harness(); h.context.setupValora();
  const imported = h.call("import", {input: {...response, payment_reference: "", payment_confirmation: false, form_response_id: "checkout:test", additional_fields: {gateway_order_id: "order_Test123", gateway_amount: "99900"}}, actor: "website-checkout"});
  assert.equal(imported.ok, true);
  const payment = {id: "pay_Test123", order_id: "order_Test123", amount: 99900, currency: "INR", status: "captured"};
  assert.equal(h.call("settle-payment", {payment: {...payment, amount: 1}}).ok, false);
  assert.equal(h.call("settle-payment", {payment: {...payment, status: "authorized"}}).ok, false);
  const settled = h.call("settle-payment", {payment});
  assert.equal(settled.ok, true);
  assert.equal(settled.data.registration.payment_status, "PAYMENT_VERIFIED");
  assert.equal(settled.data.allocation.committee_id, "who");
  assert.equal(settled.data.credential.credential_id, "VM26-00001");
  assert.equal(h.call("settle-payment", {payment}).ok, true);
  const state = h.call("snapshot").data;
  assert.equal(state.credentials.length, 1);
  assert.equal(state.allocations.length, 1);
  assert.equal(state.outbox.length, 2);
  assert.equal(h.call("command", {command: {action: "verify-payment", registration_id: imported.data.registration.registration_id}, actor: "organiser"}).ok, false);
});
