/** Valora V1 Sheets adapter. Deploy with Domain.gs + Config.gs + appsscript.json. */
var PROJECTION_HEADERS = {
  Participants: [
    "participant_id",
    "name",
    "institution",
    "class",
    "email",
    "phone",
    "experience",
  ],
  Registrations: [
    "registration_id",
    "event_id",
    "participant_id",
    "preferences",
    "payment_reference",
    "payment_confirmation",
    "payment_status",
    "registration_status",
    "created_at",
    "form_response_id",
    "additional_fields",
  ],
  Committees: ["event_id", "committee_id", "name", "capacity"],
  Portfolios: [
    "event_id",
    "committee_id",
    "sequence",
    "portfolio_name",
    "occupied",
    "assigned_registration_id",
  ],
  Allocations: [
    "registration_id",
    "event_id",
    "committee_id",
    "committee",
    "portfolio",
    "allocated_at",
  ],
  Credentials: [
    "credential_id",
    "registration_id",
    "participant_id",
    "event_id",
    "status",
    "issued_at",
    "version",
  ],
  Outbox: [
    "id",
    "to",
    "subject",
    "status",
    "created_at",
    "sent_at",
    "attempts",
    "last_error",
    "provider_message_id",
  ],
  Audit: ["id", "action", "registration_id", "actor", "at", "detail"],
  ImportErrors: ["response_id", "event_id", "error", "created_at", "resolved"],
};
function properties_() {
  return PropertiesService.getScriptProperties();
}
function runtime_() {
  return {
    uuid: function () {
      return Utilities.getUuid();
    },
    token: function () {
      return (
        Utilities.getUuid().replace(/-/g, "") +
        Utilities.getUuid().replace(/-/g, "")
      );
    },
    now: function () {
      return new Date().toISOString();
    },
  };
}
function book_() {
  var id = properties_().getProperty("SPREADSHEET_ID");
  if (!id)
    throw new ValoraDomain.DomainError(
      "CONFIG",
      "Set SPREADSHEET_ID in Script Properties.",
      503
    );
  return SpreadsheetApp.openById(id);
}
function sheet_(name, headers) {
  var book = book_(),
    sheet = book.getSheetByName(name) || book.insertSheet(name);
  if (sheet.getLastRow() === 0 && headers) sheet.appendRow(headers);
  return sheet;
}
function withLock_(fn) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000))
    throw new ValoraDomain.DomainError(
      "BUSY",
      "Operations are busy. Please try again.",
      503
    );
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}
function secretMatches_(supplied, expected) {
  if (!expected || expected.length < 32 || typeof supplied !== "string")
    return false;
  var a = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, supplied),
    b = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, expected),
    difference = 0;
  for (var i = 0; i < a.length; i++) difference |= a[i] ^ b[i];
  return difference === 0;
}
function reply_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON
  );
}
function safeError_(error) {
  if (error.name === "ZodError")
    return {
      ok: false,
      code: "VALIDATION",
      status: 400,
      error: "Check the form fields and committee preferences.",
    };
  if (error instanceof ValoraDomain.DomainError)
    return {
      ok: false,
      code: error.code,
      status: error.status,
      error: error.message,
    };
  console.error("Valora operation failed: " + (error.name || "Error"));
  return {
    ok: false,
    code: "DATASTORE",
    status: 503,
    error: "The operational datastore is unavailable. Please try again.",
  };
}
function doPost(e) {
  try {
    if (!e || !e.postData || e.postData.contents.length > 262144)
      throw new ValoraDomain.DomainError("REQUEST", "Invalid request.", 400);
    var request = JSON.parse(e.postData.contents);
    if (
      !secretMatches_(request.secret, properties_().getProperty("API_SECRET"))
    )
      throw new ValoraDomain.DomainError(
        "UNAUTHENTICATED",
        "Unauthorised.",
        401
      );
    var result = withLock_(function () {
      var state = readState_(),
        p = request.payload || {},
        events = request.events || VALORA_EVENTS,
        runtime = runtime_(),
        origin = request.appUrl || origin_(),
        data,
        write = true;
      switch (request.action) {
        case "snapshot":
          data = state;
          write = false;
          break;
        case "verify":
          data = ValoraDomain.publicCredential(
            state,
            p.token,
            events,
            runtime.now(),
            p.id
          );
          write = false;
          break;
        case "rate":
          if (
            typeof p.key !== "string" ||
            p.key.length > 128 ||
            !Number.isInteger(p.limit) ||
            p.limit < 1 ||
            p.limit > 1000 ||
            !Number.isInteger(p.windowMs) ||
            p.windowMs < 1000 ||
            p.windowMs > 86400000
          )
            throw new ValoraDomain.DomainError(
              "RATE",
              "Invalid rate request.",
              400
            );
          data = ValoraDomain.consumeRate(
            state,
            p.key,
            p.limit,
            p.windowMs,
            Date.now()
          );
          break;
        case "import":
          var input = ValoraDomain.registrationSchema.parse(p.input);
          requireApproved_(input.event_id);
          data = ValoraDomain.createRegistration(
            state,
            input,
            events,
            runtime,
            p.actor || "organiser"
          );
          break;
        case "delegation-import":
          if (!Array.isArray(p.inputs) || p.inputs.length < 2 || p.inputs.length > 30)
            throw new ValoraDomain.DomainError("ROSTER", "Add between 2 and 30 students.");
          var delegationInputs = p.inputs.map(function (item) { return ValoraDomain.registrationSchema.parse(item); });
          requireApproved_(delegationInputs[0].event_id);
          data = ValoraDomain.createDelegationRegistrations(state, delegationInputs, events, runtime);
          break;
        case "settle-payment":
          data = ValoraDomain.settleGatewayPayment(
            state, ValoraDomain.capturedPaymentSchema.parse(p.payment), events, runtime, origin
          );
          break;
        case "command":
          data = ValoraDomain.adminCommand(
            state,
            ValoraDomain.commandSchema.parse(p.command),
            events,
            runtime,
            p.actor || "organiser",
            origin
          );
          break;
        case "matrix":
          var event = events.find(function (item) {
            return item.id === p.eventId;
          });
          if (!event)
            throw new ValoraDomain.DomainError(
              "NOT_FOUND",
              "Event not found.",
              404
            );
          if (!Array.isArray(p.portfolios) || p.portfolios.length > 1000)
            throw new ValoraDomain.DomainError(
              "MATRIX",
              "Invalid matrix.",
              400
            );
          ValoraDomain.updateMatrix(
            state,
            event,
            p.categoryId,
            p.portfolios,
            p.capacity,
            runtime,
            p.actor || "organiser"
          );
          data = null;
          break;
        case "email-claim":
          data = ValoraDomain.claimEmail(state, events, runtime);
          break;
        case "email-finish":
          ValoraDomain.finishEmail(state, p.id, p.lease, p.result, runtime);
          data = null;
          break;
        default:
          throw new ValoraDomain.DomainError(
            "ACTION",
            "Unknown operation.",
            400
          );
      }
      if (write) {
        commitState_(state);
        if (request.action !== "rate") tryProject_(state, events);
      }
      return data;
    });
    return reply_({ ok: true, data: result });
  } catch (error) {
    return reply_(safeError_(error));
  }
}
function doGet() {
  return reply_({
    ok: false,
    error: "This is a private operational endpoint. Use the Valora website.",
  });
}
function origin_() {
  var origin = properties_().getProperty("APP_URL");
  if (!origin || !/^https:\/\/[^/?#]+$/.test(origin))
    throw new ValoraDomain.DomainError(
      "CONFIG",
      "Set APP_URL to the HTTPS website origin.",
      503
    );
  return origin;
}
function requireApproved_(eventId) {
  var props = properties_();
  if (
    props.getProperty("MATRIX_APPROVED_" + eventId) !== "true" &&
    props.getProperty("MATRIX_APPROVED") !== "true"
  )
    throw new ValoraDomain.DomainError(
      "MATRIX_DRAFT",
      "Review and approve portfolio matrices before importing live responses.",
      409
    );
}
/**
 * Sheets cannot atomically update several tabs. _State is the authoritative,
 * versioned snapshot; one Script Property commits its pointer only after all
 * chunks are flushed. Visible tabs are rebuildable operational projections.
 */
function readState_() {
  var pointer = properties_().getProperty("STATE_VERSION");
  if (!pointer) return ValoraDomain.emptyState();
  var sheet = sheet_("_State", ["version", "sequence", "json_chunk"]);
  var rows = sheet
    .getDataRange()
    .getValues()
    .slice(1)
    .filter(function (row) {
      return row[0] === pointer;
    })
    .sort(function (a, b) {
      return a[1] - b[1];
    });
  if (!rows.length)
    throw new ValoraDomain.DomainError(
      "INTEGRITY",
      "The committed datastore snapshot is missing.",
      503
    );
  return JSON.parse(
    rows
      .map(function (row) {
        return row[2];
      })
      .join("")
  );
}
function commitState_(state) {
  var props = properties_(),
    previous = props.getProperty("STATE_VERSION"),
    version = Utilities.getUuid(),
    json = JSON.stringify(state),
    chunks = [];
  for (var i = 0; i < json.length; i += 35000)
    chunks.push([version, i / 35000, json.slice(i, i + 35000)]);
  var sheet = sheet_("_State", ["version", "sequence", "json_chunk"]),
    start = sheet.getLastRow() + 1;
  if (start + chunks.length > sheet.getMaxRows())
    sheet.insertRowsAfter(sheet.getMaxRows(), chunks.length + 50);
  sheet.getRange(start, 1, chunks.length, 3).setValues(chunks);
  SpreadsheetApp.flush();
  props.setProperty("STATE_VERSION", version);
  // Keep the current and previous complete versions. Uncommitted rows are removable.
  try {
    var versions = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
    for (var row = versions.length - 1; row >= 0; row--) {
      if (versions[row][0] !== version && versions[row][0] !== previous)
        sheet.deleteRow(row + 2);
    }
  } catch (error) {
    console.warn("Snapshot cleanup deferred.");
  }
}
function cell_(value) {
  if (value === undefined || value === null) return "";
  if (typeof value === "object") value = JSON.stringify(value);
  if (typeof value === "string" && /^[=+@-]/.test(value)) return "'" + value;
  return value;
}
function replaceRows_(name, records) {
  var headers = PROJECTION_HEADERS[name],
    sheet = sheet_(name, headers),
    values = [headers].concat(
      records.map(function (record) {
        return headers.map(function (key) {
          return cell_(record[key]);
        });
      })
    );
  if (values.length > sheet.getMaxRows())
    sheet.insertRowsAfter(
      sheet.getMaxRows(),
      values.length - sheet.getMaxRows() + 20
    );
  sheet.clearContents();
  sheet.getRange(1, 1, values.length, headers.length).setValues(values);
  sheet.setFrozenRows(1);
  sheet
    .getRange(1, 1, 1, headers.length)
    .setFontWeight("bold")
    .setBackground("#650b25")
    .setFontColor("#ffffff");
}
function project_(state, events) {
  replaceRows_("Participants", state.participants);
  replaceRows_("Registrations", state.registrations);
  replaceRows_(
    "Allocations",
    state.allocations.map(function (a) {
      return Object.assign({}, a, {
        event_id: state.registrations.find(function (r) {
          return r.registration_id === a.registration_id;
        }).event_id,
      });
    })
  );
  replaceRows_("Credentials", state.credentials);
  replaceRows_("Outbox", state.outbox);
  replaceRows_("Audit", state.audit);
  var committees = [],
    portfolios = [];
  events.forEach(function (event) {
    (state.matrices[event.id] || event.categories).forEach(function (c) {
      committees.push({
        event_id: event.id,
        committee_id: c.id,
        name: c.name,
        capacity: c.capacity,
      });
      c.portfolios.forEach(function (name, i) {
        var occupied = state.allocations.find(function (a) {
          return (
            a.committee_id === c.id &&
            a.portfolio === name &&
            state.registrations.find(function (r) {
              return r.registration_id === a.registration_id;
            }).event_id === event.id
          );
        });
        portfolios.push({
          event_id: event.id,
          committee_id: c.id,
          sequence: i + 1,
          portfolio_name: name,
          occupied: !!occupied,
          assigned_registration_id: occupied ? occupied.registration_id : "",
        });
      });
    });
  });
  replaceRows_("Committees", committees);
  replaceRows_("Portfolios", portfolios);
}
function tryProject_(state, events) {
  try {
    project_(state, events);
    properties_().deleteProperty("PROJECTION_ERROR");
  } catch (error) {
    properties_().setProperty("PROJECTION_ERROR", new Date().toISOString());
    console.error("Operational views need rebuilding; committed data is safe.");
  }
}
function rebuildOperationalViews() {
  withLock_(function () {
    tryProject_(readState_(), VALORA_EVENTS);
  });
}
function setupValora() {
  withLock_(function () {
    Object.keys(PROJECTION_HEADERS).forEach(function (name) {
      sheet_(name, PROJECTION_HEADERS[name]);
    });
    sheet_("_State", ["version", "sequence", "json_chunk"]);
    var state = readState_();
    if (!properties_().getProperty("STATE_VERSION")) commitState_(state);
    tryProject_(state, VALORA_EVENTS);
    var hidden = book_().getSheetByName("_State");
    if (!hidden.isSheetHidden()) hidden.hideSheet();
  });
}
/** Install once from the Apps Script editor after setting FORM_ID. */
function installFormTrigger() {
  var formId = properties_().getProperty("FORM_ID");
  if (!formId) throw Error("Set FORM_ID first.");
  ScriptApp.getProjectTriggers()
    .filter(function (t) {
      return t.getHandlerFunction() === "onValoraFormSubmit";
    })
    .forEach(function (t) {
      ScriptApp.deleteTrigger(t);
    });
  ScriptApp.newTrigger("onValoraFormSubmit")
    .forForm(FormApp.openById(formId))
    .onFormSubmit()
    .create();
}
function formInput_(response, event) {
  var values = {};
  response.getItemResponses().forEach(function (item) {
    values[item.getItem().getTitle()] = item.getResponse();
  });
  var overrides = JSON.parse(
      properties_().getProperty("FORM_FIELD_MAP") || "{}"
    ),
    defaults = {
      name: "Full Name",
      institution: "School/Institution",
      class: "Class/Grade",
      email: "Email",
      phone: "Contact Number",
      experience: "MUN experience",
      payment_reference: "UPI transaction/reference ID",
      payment_confirmation: "Payment confirmation",
    },
    map = Object.assign(defaults, overrides);
  function answer(key) {
    var value = values[map[key] || key];
    return Array.isArray(value)
      ? value.join(", ")
      : String(value === undefined ? "" : value).trim();
  }
  var input = {
    event_id: event.id,
    form_response_id: response.getId(),
    name: answer("name"),
    institution: answer("institution"),
    class: answer("class"),
    email: answer("email"),
    phone: answer("phone"),
    experience: answer("experience"),
    payment_reference: answer("payment_reference"),
    payment_confirmation: /^(yes|true|paid|confirmed|i confirm)/i.test(
      answer("payment_confirmation")
    ),
    preferences: [],
    additional_fields: {},
  };
  for (var i = 1; i <= event.preferenceCount; i++) {
    var raw = answer("preference_" + i),
      title = overrides["preference_" + i] || "Preference " + i;
    raw = String(values[title] || raw).trim();
    var category = event.categories.find(function (c) {
      return c.id === raw || c.name.toLowerCase() === raw.toLowerCase();
    });
    input.preferences.push(category ? category.id : raw);
  }
  event.fields.forEach(function (field) {
    if (!(field.key in input))
      input.additional_fields[field.key] = String(
        values[map[field.key] || field.label] || ""
      ).trim();
  });
  return ValoraDomain.registrationSchema.parse(input);
}
function onValoraFormSubmit(e) {
  if (!e || !e.response)
    throw Error(
      "Use an installed Form submit trigger, not a spreadsheet trigger."
    );
  importResponse_(e.response);
}
function importResponse_(response) {
  var eventId =
      properties_().getProperty("FORM_EVENT_ID") || VALORA_EVENTS[0].id,
    event = VALORA_EVENTS.find(function (e) {
      return e.id === eventId;
    });
  if (!event) throw Error("Unknown FORM_EVENT_ID.");
  try {
    withLock_(function () {
      requireApproved_(event.id);
      var state = readState_();
      ValoraDomain.createRegistration(
        state,
        formInput_(response, event),
        VALORA_EVENTS,
        runtime_(),
        "google-form"
      );
      commitState_(state);
      tryProject_(state, VALORA_EVENTS);
    });
    markImportResolved_(response.getId());
    pokeEmailWorker_();
  } catch (error) {
    withLock_(function () {
      sheet_("ImportErrors", PROJECTION_HEADERS.ImportErrors).appendRow([
        response.getId(),
        event.id,
        safeError_(error).error,
        new Date().toISOString(),
        false,
      ]);
    });
    console.error("Form response import failed: " + response.getId());
  }
}
function markImportResolved_(id) {
  withLock_(function () {
    var sheet = sheet_("ImportErrors", PROJECTION_HEADERS.ImportErrors);
    if (sheet.getLastRow() < 2) return;
    var rows = sheet.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++)
      if (rows[i][0] === id) sheet.getRange(i + 1, 5).setValue(true);
  });
}
/** Retry failed responses after fixing field mapping or approval. At most 10/run. */
function retryFailedImports() {
  var errors = withLock_(function () {
    return sheet_("ImportErrors", PROJECTION_HEADERS.ImportErrors)
      .getDataRange()
      .getValues()
      .slice(1)
      .filter(function (r) {
        return r[4] !== true;
      });
  });
  var ids = Array.from(
    new Set(
      errors.map(function (r) {
        return r[0];
      })
    )
  ).slice(0, 10);
  if (!ids.length) return;
  var responses = FormApp.openById(
    properties_().getProperty("FORM_ID")
  ).getResponses();
  ids.forEach(function (id) {
    var response = responses.find(function (r) {
      return r.getId() === id;
    });
    if (response) importResponse_(response);
  });
}
/** Optional minute trigger wakes the Nodemailer worker. No mail is sent in Apps Script. */
function installEmailWorkerTrigger() {
  ScriptApp.getProjectTriggers()
    .filter(function (t) {
      return t.getHandlerFunction() === "pokeEmailWorker_";
    })
    .forEach(function (t) {
      ScriptApp.deleteTrigger(t);
    });
  ScriptApp.newTrigger("pokeEmailWorker_").timeBased().everyMinutes(1).create();
}
function pokeEmailWorker_() {
  var props = properties_(),
    url = props.getProperty("EMAIL_WORKER_URL"),
    secret = props.getProperty("EMAIL_WORKER_SECRET");
  if (!url || !secret) return;
  if (!/^https:\/\/[^/?#]+\/api\/email\/process$/.test(url))
    throw Error("Invalid email worker URL.");
  try {
    var result = UrlFetchApp.fetch(url, {
      method: "post",
      headers: { Authorization: "Bearer " + secret },
      muteHttpExceptions: true,
    });
    if (result.getResponseCode() >= 400)
      console.warn("Email worker unavailable; outbox preserved.");
  } catch (error) {
    console.warn("Email worker unavailable; outbox preserved.");
  }
}
