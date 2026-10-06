"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  RefreshCw,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  AlertCircle,
  Users,
  Layers,
  ScanLine,
  FileInput,
  Download,
  ChevronRight,
  Mail,
  Settings2,
} from "lucide-react";
import type { DomainState } from "@/lib/domain";
import type {
  FoundationEvent,
  RegistrationView,
  AdminCommand,
  EventCategory,
} from "@/lib/models";
import { Modal } from "./modal";
import { Button } from "./ui/button";
type Section =
  | "overview"
  | "participants"
  | "payments"
  | "allocations"
  | "ids"
  | "settings"
  | "imports"
  | "activity";
type Snapshot = {
  state: DomainState;
  events: (FoundationEvent & { matrixApproved: boolean })[];
  provider: string;
  emailProvider: string;
  emailConfigured: boolean;
};
const titles: Record<Section, { title: string; description: string }> = {
  overview: {
    title: "A clear view of your event.",
    description:
      "From registration to the committee room. Everything that needs your attention.",
  },
  participants: {
    title: "The people behind the event.",
    description:
      "Search registrations and view participant, payment, allocation and E-ID details.",
  },
  payments: {
    title: "Verify. Confirm. Allocate.",
    description:
      "Razorpay payments confirm automatically. Review legacy UPI references against funds received.",
  },
  allocations: {
    title: "Every delegate. A place.",
    description:
      "Monitor capacity and assign verified delegates to available portfolios.",
  },
  ids: {
    title: "Ready for the committee room.",
    description:
      "Issue, view, regenerate and revoke secure digital delegate IDs.",
  },
  settings: {
    title: "Your event, configured.",
    description:
      "Edit portfolio sequences and capacities. Occupied portfolios are protected.",
  },
  imports: {
    title: "Bring your form responses in.",
    description:
      "Google Forms can import automatically. Use this workspace for manual imports and corrections.",
  },
  activity: {
    title: "A record of every step.",
    description:
      "Payment decisions, allocations, credential changes and transactional email status.",
  },
};
export function StatusBadge({ value }: { value: string }) {
  return (
    <span
      className={`admin-badge badge-${value
        .toLowerCase()
        .replaceAll("_", "-")}`}
    >
      {value.replaceAll("_", " ")}
    </span>
  );
}
function shortDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(new Date(date));
}
async function requestJson(url: string, body?: unknown) {
  const r = await fetch(
    url,
    body
      ? {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      : { cache: "no-store" }
  );
  const data = await r.json();
  if (!r.ok) {
    if (r.status === 401) window.location.href = "/admin/login";
    throw Error(data.error ?? "The request failed.");
  }
  return data;
}
export function AdminWorkspace({ section }: { section: Section }) {
  const [data, setData] = useState<Snapshot>(),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [eventId, setEventId] = useState(""),
    [search, setSearch] = useState(""),
    [filter, setFilter] = useState("all"),
    [selected, setSelected] = useState<string>(),
    [matrix, setMatrix] = useState<EventCategory>(),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [importOpen, setImportOpen] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = (await requestJson("/api/admin/snapshot")) as Snapshot;
      setData(result);
      setEventId((prev) => prev || result.events[0]?.id || "");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  const state = data?.state,
    event = data?.events.find((e) => e.id === eventId),
    rows: RegistrationView[] = state
      ? state.registrations
          .filter((r) => r.event_id === eventId)
          .map((registration) => ({
            registration,
            participant: state.participants.find(
              (p) => p.participant_id === registration.participant_id
            )!,
            allocation: state.allocations.find(
              (a) => a.registration_id === registration.registration_id
            ),
            credential: state.credentials.find(
              (c) => c.registration_id === registration.registration_id
            ),
          }))
      : [];
  const verified = rows.filter(
      (v) => v.registration.payment_status === "PAYMENT_VERIFIED"
    ),
    pending = rows.filter(
      (v) => v.registration.payment_status === "PENDING_PAYMENT"
    ),
    allocated = rows.filter((v) => v.allocation),
    unallocated = verified.filter((v) => !v.allocation);
  const filtered = rows.filter((v) => {
    const match = [
      v.participant.name,
      v.participant.email,
      v.participant.institution,
      v.registration.registration_id,
      v.registration.payment_reference,
      v.allocation?.committee,
      v.allocation?.portfolio,
      v.credential?.credential_id,
    ]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase());
    const stateMatch =
      filter === "all" ||
      v.registration.payment_status === filter ||
      v.registration.registration_status === filter ||
      (filter === "unallocated" && !v.allocation) ||
      (filter === "ACTIVE" && v.credential?.status === "ACTIVE") ||
      (filter === "REVOKED" && v.credential?.status === "REVOKED");
    return match && stateMatch && (section !== "ids" || v.credential);
  });
  const current = rows.find((r) => r.registration.registration_id === selected);
  async function action(command: AdminCommand) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await requestJson("/api/admin/command", command);
      setNotice(
        command.action === "verify-payment"
          ? response.result.registration.registration_status ===
            "MANUAL_ALLOCATION_REQUIRED"
            ? "Payment verified. The selected committees are full; assign a portfolio manually."
            : "Payment verified. Allocation and E-ID processing completed."
          : command.action === "retry-email"
          ? "Email queued for delivery."
          : "The change has been saved."
      );
      await load();
    } catch (e) {
      setError((e as Error).message);
      throw e;
    } finally {
      setBusy(false);
    }
  }
  function exportCsv() {
    const columns = [
      "registration_id",
      "name",
      "institution",
      "class",
      "email",
      "phone",
      "experience",
      "preferences",
      "payment_reference",
      "payment_status",
      "registration_status",
      "committee",
      "portfolio",
      "valora_e_id",
    ];
    const csv = [
      columns,
      ...filtered.map((v) => [
        v.registration.registration_id,
        v.participant.name,
        v.participant.institution,
        v.participant.class,
        v.participant.email,
        v.participant.phone,
        v.participant.experience,
        v.registration.preferences.join("|"),
        v.registration.payment_reference,
        v.registration.payment_status,
        v.registration.registration_status,
        v.allocation?.committee ?? "",
        v.allocation?.portfolio ?? "",
        v.credential?.credential_id ?? "",
      ]),
    ]
      .map((line) =>
        line
          .map(
            (x) =>
              '"' +
              String(x)
                .replace(/^[=+@-]/, "'$&")
                .replaceAll('"', '""') +
              '"'
          )
          .join(",")
      )
      .join("\r\n");
    const url = URL.createObjectURL(
      new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" })
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `${event?.slug ?? "event"}-registrations.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <>
      <div className="admin-page-heading">
        <div>
          <span className="micro-label">
            {section === "overview"
              ? "EVENT OVERVIEW"
              : section.replaceAll("-", " ").toUpperCase()}
          </span>
          <h1>{titles[section].title}</h1>
          <p>{titles[section].description}</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh
        </Button>
      </div>
      {error && (
        <div className="admin-alert alert-error" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}
      {notice && (
        <div className="admin-alert alert-success" role="status">
          <CheckCircle2 size={18} />
          <span>{notice}</span>
        </div>
      )}
      {loading && !data ? (
        <div className="admin-loading">
          <RefreshCw className="spin" /> Loading event operations…
        </div>
      ) : !data ? (
        <div className="admin-empty">
          <Settings2 size={32} />
          <h2>Connect your operations.</h2>
          <p>
            Configure the datastore and organiser credentials in your
            environment, then refresh this page.
          </p>
          <p>The setup steps are in the project’s README.</p>
        </div>
      ) : (
        <>
          <div className="admin-event-bar">
            <label>
              EVENT
              <select
                value={eventId}
                onChange={(e) => {
                  setEventId(e.target.value);
                  setFilter("all");
                  setSelected(undefined);
                  setMatrix(undefined);
                }}
              >
                {data.events.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.shortTitle} · {new Date(e.date).getFullYear()}
                  </option>
                ))}
              </select>
            </label>
            <span className="admin-source">
              <span />
              {data.provider}
            </span>
            <Link href={`/events/${event?.slug}`}>
              View event <ArrowUpRight size={14} />
            </Link>
          </div>
          {data.provider === "Local development" && (
            <div className="admin-alert">
              <InfoIcon />
              <span>
                Development workspace. Records stay on this computer and email
                delivery follows your email provider setting. Connect Google
                Sheets for live operations.
              </span>
            </div>
          )}
          {data.emailProvider === "Nodemailer SMTP" &&
            !data.emailConfigured && (
              <div className="admin-alert">
                <Mail size={18} />
                <span>
                  Nodemailer is enabled. Configure SMTP_HOST, SMTP_USER,
                  SMTP_PASSWORD and EMAIL_FROM before messages can be delivered.
                </span>
              </div>
            )}
          {section === "overview" && (
            <>
              <div className="stats-grid">
                {[
                  {
                    title: "Total registrations",
                    value: rows.length,
                    icon: Users,
                  },
                  {
                    title: "Verified payments",
                    value: verified.length,
                    icon: CheckCircle2,
                  },
                  {
                    title: "Pending payments",
                    value: pending.length,
                    icon: Clock3,
                  },
                  { title: "Allocated", value: allocated.length, icon: Layers },
                  {
                    title: "Paid, unallocated",
                    value: unallocated.length,
                    icon: AlertCircle,
                  },
                ].map((s) => (
                  <div className="stat-card" key={s.title}>
                    <s.icon size={18} />
                    <span>{s.title}</span>
                    <strong>{s.value}</strong>
                  </div>
                ))}
              </div>
              <div className="overview-grid">
                <section className="admin-panel">
                  <div className="panel-heading">
                    <h2>What needs attention</h2>
                    <span>LIVE STATUS</span>
                  </div>
                  <Link className="attention-row" href="/admin/payments">
                    <Clock3 size={20} />
                    <div>
                      <strong>{pending.length} payments to review</strong>
                      <span>
                        Review pending registrations and legacy payment references.
                      </span>
                    </div>
                    <ChevronRight size={18} />
                  </Link>
                  <Link className="attention-row" href="/admin/allocations">
                    <Layers size={20} />
                    <div>
                      <strong>
                        {unallocated.length} verified delegates without a place
                      </strong>
                      <span>
                        Review full preference choices and assign an available
                        portfolio.
                      </span>
                    </div>
                    <ChevronRight size={18} />
                  </Link>
                  <Link className="attention-row" href="/admin/activity">
                    <Mail size={20} />
                    <div>
                      <strong>
                        {
                          state!.outbox.filter(
                            (m) =>
                              m.status === "PENDING" &&
                              rows.some((v) => v.participant.email === m.to)
                          ).length
                        }{" "}
                        messages awaiting delivery
                      </strong>
                      <span>
                        Review the email outbox and SMTP delivery status.
                      </span>
                    </div>
                    <ChevronRight size={18} />
                  </Link>
                </section>
                <section className="admin-panel">
                  <div className="panel-heading">
                    <h2>Committee capacity</h2>
                    <Link href="/admin/allocations">View all →</Link>
                  </div>
                  {event?.categories.map((c) => {
                    const count = allocated.filter(
                      (v) => v.allocation?.committee_id === c.id
                    ).length;
                    return (
                      <div className="capacity-row" key={c.id}>
                        <div>
                          <span>{c.name}</span>
                          <strong>
                            {count} / {c.capacity}
                          </strong>
                        </div>
                        <div className="capacity-track">
                          <span
                            style={{
                              width: `${Math.min(
                                100,
                                (count / c.capacity) * 100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </section>
              </div>
              <section className="admin-panel">
                <div className="panel-heading">
                  <h2>Recent registrations</h2>
                  <Link href="/admin/participants">All participants →</Link>
                </div>
                <RegistrationTable
                  rows={rows.slice().reverse().slice(0, 5)}
                  onSelect={setSelected}
                />
              </section>
            </>
          )}
          {["participants", "payments", "ids"].includes(section) && (
            <section className="admin-panel">
              <div className="table-toolbar">
                <label className="search-input">
                  <Search size={16} />
                  <input
                    placeholder="Search name, email, reference or ID…"
                    aria-label="Search participants"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </label>
                <select
                  aria-label="Filter status"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="all">All statuses</option>
                  {(section === "ids"
                    ? ["ACTIVE", "REVOKED"]
                    : [
                        "PENDING_PAYMENT",
                        "PAYMENT_VERIFIED",
                        "PAYMENT_REJECTED",
                        "ALLOCATED",
                        "MANUAL_ALLOCATION_REQUIRED",
                      ]
                  ).map((s) => (
                    <option value={s} key={s}>
                      {s.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportCsv}
                  disabled={!filtered.length}
                >
                  <Download size={14} />
                  Export CSV
                </Button>
              </div>
              <RegistrationTable
                rows={filtered}
                onSelect={setSelected}
                section={section}
              />
            </section>
          )}
          {section === "allocations" && (
            <>
              <div className="allocation-summary">
                <span>{allocated.length} allocated</span>
                <span>{unallocated.length} paid, awaiting allocation</span>
                <span>
                  {event?.categories.reduce((a, c) => a + c.capacity, 0)} total
                  places
                </span>
              </div>
              {unallocated.length > 0 && (
                <section className="admin-panel">
                  <div className="panel-heading">
                    <h2>Needs a manual allocation</h2>
                  </div>
                  <RegistrationTable
                    rows={unallocated}
                    onSelect={setSelected}
                  />
                </section>
              )}
              <div className="admin-committee-grid">
                {event?.categories.map((c) => (
                  <CommitteePanel
                    key={c.id}
                    category={c}
                    rows={rows}
                    onSelect={setSelected}
                  />
                ))}
              </div>
            </>
          )}
          {section === "settings" && (
            <>
              <div className="admin-panel event-config-summary">
                <div>
                  <span className="micro-label">EVENT CONFIGURATION</span>
                  <h2>{event?.title}</h2>
                  <p>
                    {event?.preferenceCount} committee preferences ·{" "}
                    {event?.allocationRule.replaceAll("-", " ")} · E-ID prefix{" "}
                    {event?.idPrefix}
                  </p>
                  <p>
                    Dates, fees, form URLs, registration fields and content are
                    configured in <code>src/data/events.ts</code>. Public
                    foundation content is in <code>src/data/foundation.ts</code>
                    .
                  </p>
                </div>
                <StatusBadge
                  value={
                    event?.matrixApproved ? "MATRIX_APPROVED" : "DRAFT_MATRIX"
                  }
                />
              </div>
              <div className="admin-alert">
                <InfoIcon />
                <span>
                  Edit the ordered portfolio lists below. Before importing live
                  registrations, review every committee and set{" "}
                  <code>{event?.matrixApprovalEnvKey}=true</code> in Vercel and{" "}
                  <code>MATRIX_APPROVED=true</code> in Apps Script.
                </span>
              </div>
              <div className="admin-committee-grid">
                {event?.categories.map((c) => (
                  <section className="admin-panel" key={c.id}>
                    <div className="panel-heading">
                      <h2>{c.name}</h2>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setMatrix(c)}
                      >
                        Edit matrix
                      </Button>
                    </div>
                    <p className="matrix-meta">
                      {c.capacity} places · {c.portfolios.length} ordered
                      portfolios
                    </p>
                    <ol className="matrix-preview">
                      {c.portfolios.map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ol>
                  </section>
                ))}
              </div>
            </>
          )}
          {section === "imports" && (
            <>
              <section className="admin-panel import-intro">
                <FileInput size={34} />
                <div>
                  <h2>Your form. Connected to your event.</h2>
                  <p>
                    Configure the Google Forms submit trigger using the included
                    Apps Script setup guide. Responses import automatically,
                    with payment status pending manual verification.
                  </p>
                  <p>
                    For other form providers or a missed response, add a
                    registration here. Importing the same response ID again
                    returns the existing record.
                  </p>
                  <Button onClick={() => setImportOpen(true)}>
                    Add a form response <ArrowUpRight size={15} />
                  </Button>
                </div>
              </section>
              <section className="admin-panel">
                <div className="panel-heading">
                  <h2>Import reference</h2>
                </div>
                <div className="import-reference">
                  <p>
                    External registration URL is configured with{" "}
                    <code>{event?.formEnvKey}</code>.
                  </p>
                  <p>
                    The form must collect participant details,{" "}
                    {event?.preferenceCount} distinct committee preferences, UPI
                    transaction reference and payment confirmation. Do not
                    collect country or portfolio preferences.
                  </p>
                  <p>
                    Google Forms field mapping, installation and failed-import
                    recovery are documented in{" "}
                    <code>apps-script/README.md</code>.
                  </p>
                </div>
              </section>
            </>
          )}
          {section === "activity" && (
            <>
              <section className="admin-panel">
                <div className="panel-heading">
                  <h2>Transactional email outbox</h2>
                  <div className="email-actions">
                    <span>{data.emailProvider}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={async () => {
                        setBusy(true);
                        setError("");
                        try {
                          const result = await requestJson(
                            "/api/admin/email/deliver",
                            {}
                          );
                          setNotice(
                            result.disabled
                              ? "Set EMAIL_PROVIDER=nodemailer and configure SMTP to send emails."
                              : `${result.sent} sent · ${result.failed} failed. Retryable messages remain in the outbox.`
                          );
                          await load();
                        } catch (e) {
                          setError((e as Error).message);
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      Send pending emails
                    </Button>
                  </div>
                </div>
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Recipient / message</th>
                        <th>Queued</th>
                        <th>Delivery</th>
                      </tr>
                    </thead>
                    <tbody>
                      {state!.outbox
                        .filter((m) =>
                          rows.some((v) => v.participant.email === m.to)
                        )
                        .slice()
                        .reverse()
                        .map((m) => (
                          <tr key={m.id}>
                            <td>
                              <strong>{m.subject}</strong>
                              <span>{m.to}</span>
                            </td>
                            <td>{shortDate(m.created_at)}</td>
                            <td>
                              <StatusBadge value={m.status} />
                              {m.last_error && <span>{m.last_error}</span>}
                              {m.attempts && (
                                <span>{m.attempts} attempt(s)</span>
                              )}
                              {m.sent_at && <span>{shortDate(m.sent_at)}</span>}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                {state!.outbox.length === 0 && (
                  <Empty
                    title="No messages queued yet"
                    text="Registration and allocation confirmations appear here when participants are imported."
                  />
                )}
              </section>
              <section className="admin-panel">
                <div className="panel-heading">
                  <h2>Activity log</h2>
                  <span>ORGANISER AUDIT TRAIL</span>
                </div>
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Action</th>
                        <th>Record</th>
                        <th>Organiser</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {state!.audit
                        .filter(
                          (a) =>
                            a.registration_id === eventId ||
                            rows.some(
                              (v) =>
                                v.registration.registration_id ===
                                a.registration_id
                            )
                        )
                        .slice()
                        .reverse()
                        .map((a) => (
                          <tr key={a.id}>
                            <td>
                              <strong>{a.action.replaceAll("-", " ")}</strong>
                              {a.detail && <span>{a.detail}</span>}
                            </td>
                            <td>{a.registration_id}</td>
                            <td>{a.actor}</td>
                            <td>{shortDate(a.at)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                {state!.audit.length === 0 && (
                  <Empty
                    title="No activity yet"
                    text="Every organiser decision is recorded here."
                  />
                )}
              </section>
            </>
          )}
        </>
      )}
      {current && event && (
        <ParticipantDetail
          row={current}
          event={event}
          rows={rows}
          onClose={() => setSelected(undefined)}
          onAction={action}
          busy={busy}
        />
      )}
      {matrix && event && (
        <MatrixEditor
          category={matrix}
          event={event}
          onClose={() => setMatrix(undefined)}
          onSave={async (portfolios, capacity) => {
            await requestJson("/api/admin/matrix", {
              event_id: eventId,
              committee_id: matrix.id,
              portfolios,
              capacity,
            });
            setMatrix(undefined);
            setNotice("Portfolio matrix saved.");
            await load();
          }}
        />
      )}
      {importOpen && event && (
        <ImportForm
          event={event}
          onClose={() => setImportOpen(false)}
          onSave={async (input) => {
            await requestJson("/api/admin/import", input);
            setImportOpen(false);
            setNotice(
              "Form response imported. Payment is pending verification."
            );
            await load();
          }}
        />
      )}
    </>
  );
}
function InfoIcon() {
  return <AlertCircle size={18} />;
}
function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="admin-empty">
      <Users size={28} />
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
function RegistrationTable({
  rows,
  onSelect,
  section = "participants",
}: {
  rows: RegistrationView[];
  onSelect: (id: string) => void;
  section?: string;
}) {
  return (
    <>
      {rows.length ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Participant</th>
                <th>
                  {section === "payments" ? "Payment reference" : "Institution"}
                </th>
                <th>Payment</th>
                <th>{section === "ids" ? "Valora E-ID" : "Allocation"}</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((v) => (
                <tr key={v.registration.registration_id}>
                  <td>
                    <strong>{v.participant.name}</strong>
                    <span>{v.participant.email}</span>
                  </td>
                  <td>
                    {section === "payments" ? (
                      <>
                        <code>
                          {v.registration.payment_reference || "Not submitted"}
                        </code>
                        <span>
                          {v.registration.payment_confirmation
                            ? "Payment confirmed by participant"
                            : "Confirmation missing"}
                        </span>
                      </>
                    ) : (
                      <>
                        {v.participant.institution}
                        <span>{v.participant.class}</span>
                      </>
                    )}
                  </td>
                  <td>
                    <StatusBadge value={v.registration.payment_status} />
                  </td>
                  <td>
                    {section === "ids" ? (
                      <>
                        <strong>{v.credential?.credential_id}</strong>
                        <StatusBadge
                          value={v.credential?.status ?? "NOT_ISSUED"}
                        />
                      </>
                    ) : v.allocation ? (
                      <>
                        <strong>{v.allocation.committee}</strong>
                        <span>{v.allocation.portfolio}</span>
                      </>
                    ) : (
                      <StatusBadge value={v.registration.registration_status} />
                    )}
                  </td>
                  <td>
                    <button
                      className="table-detail"
                      onClick={() => onSelect(v.registration.registration_id)}
                      aria-label={`View ${v.participant.name}`}
                    >
                      View <ChevronRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty
          title="No registrations to show"
          text="Responses from your official form will appear here after import."
        />
      )}
    </>
  );
}
function CommitteePanel({
  category,
  rows,
  onSelect,
}: {
  category: EventCategory;
  rows: RegistrationView[];
  onSelect: (id: string) => void;
}) {
  const allocated = rows.filter(
    (v) => v.allocation?.committee_id === category.id
  );
  return (
    <section className="admin-panel">
      <div className="panel-heading">
        <h2>{category.name}</h2>
        <span>
          {allocated.length} / {category.capacity} allocated
        </span>
      </div>
      <ol className="portfolio-list">
        {category.portfolios.map((p) => {
          const occupant = allocated.find((v) => v.allocation?.portfolio === p);
          return (
            <li key={p}>
              <span>{p}</span>
              {occupant ? (
                <button
                  onClick={() =>
                    onSelect(occupant.registration.registration_id)
                  }
                >
                  {occupant.participant.name}
                  <ChevronRight size={13} />
                </button>
              ) : (
                <span className="portfolio-available">Available</span>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
function ParticipantDetail({
  row,
  event,
  rows,
  onClose,
  onAction,
  busy,
}: {
  row: RegistrationView;
  event: FoundationEvent;
  rows: RegistrationView[];
  onClose: () => void;
  onAction: (command: AdminCommand) => Promise<void>;
  busy: boolean;
}) {
  const [reason, setReason] = useState(""),
    [category, setCategory] = useState(
      row.allocation?.committee_id ?? event.categories[0]?.id ?? ""
    ),
    [portfolio, setPortfolio] = useState(""),
    [error, setError] = useState(""),
    [reference, setReference] = useState(row.registration.payment_reference),
    [confirmed, setConfirmed] = useState(row.registration.payment_confirmation);
  const selected = event.categories.find((c) => c.id === category);
  const available =
    selected?.portfolios.filter(
      (p) =>
        !rows.some(
          (v) =>
            v.registration.registration_id !==
              row.registration.registration_id &&
            v.allocation?.committee_id === category &&
            v.allocation.portfolio === p
        )
    ) ?? [];
  async function run(
    action: AdminCommand["action"],
    extra: Partial<AdminCommand> = {}
  ) {
    setError("");
    try {
      await onAction({
        action,
        registration_id: row.registration.registration_id,
        reason,
        ...extra,
      });
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <Modal title={row.participant.name} onClose={onClose}>
      <div className="detail-reference">{row.registration.registration_id}</div>
      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}
      <div className="detail-grid">
        {[
          ["Institution", row.participant.institution],
          ["Class / grade", row.participant.class],
          ["Email", row.participant.email],
          ["Contact", row.participant.phone],
          ["Experience", row.participant.experience],
          ["Submitted", shortDate(row.registration.created_at)],
        ].map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <section className="detail-section">
        <h3>Payment & registration</h3>
        <div className="detail-badges">
          <StatusBadge value={row.registration.payment_status} />
          <StatusBadge value={row.registration.registration_status} />
        </div>
        <p>
          Payment reference:{" "}
          <code>{row.registration.payment_reference || "Not submitted"}</code>
        </p>
        {row.registration.additional_fields.gateway_order_id && <p>Razorpay order: <code>{row.registration.additional_fields.gateway_order_id}</code> · confirmation is automatic.</p>}
        <p>
          Participant confirmation:{" "}
          {row.registration.payment_confirmation ? "Provided" : "Missing"}
        </p>
        <p>
          Preferences:{" "}
          {row.registration.preferences
            .map((id) => event.categories.find((c) => c.id === id)?.name ?? id)
            .join(" → ")}
        </p>
        {row.registration.payment_status !== "PAYMENT_VERIFIED" && !row.registration.additional_fields.gateway_order_id && (
          <>
            <label className="admin-field">
              Transaction reference
              <input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                maxLength={100}
              />
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
              />{" "}
              Participant supplied payment confirmation
            </label>
            <div className="detail-actions">
              <Button
                size="sm"
                onClick={() => run("verify-payment")}
                disabled={
                  busy ||
                  !row.registration.payment_reference ||
                  !row.registration.payment_confirmation ||
                  reference !== row.registration.payment_reference ||
                  confirmed !== row.registration.payment_confirmation
                }
              >
                Verify received payment
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => run("reject-payment")}
                disabled={busy || !reason.trim()}
              >
                Reject payment
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  run("update-payment", {
                    payment_reference: reference,
                    payment_confirmation: confirmed,
                  })
                }
                disabled={busy || !reason.trim() || !reference.trim()}
              >
                Save reference correction
              </Button>
            </div>
            <p className="detail-help">
              Save reference corrections before verifying. Verification confirms
              the payment was actually received and automatically runs
              allocation.
            </p>
          </>
        )}
      </section>
      <section className="detail-section">
        <h3>Committee & portfolio</h3>
        {row.allocation ? (
          <div className="allocation-detail">
            <strong>{row.allocation.committee}</strong>
            <span>{row.allocation.portfolio}</span>
          </div>
        ) : (
          <p>No allocation yet.</p>
        )}
        {row.registration.payment_status === "PAYMENT_VERIFIED" && (
          <>
            <div className="manual-allocation-fields">
              <label className="admin-field">
                Committee / category
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setPortfolio("");
                  }}
                >
                  {event.categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="admin-field">
                Available portfolio
                <select
                  value={portfolio}
                  onChange={(e) => setPortfolio(e.target.value)}
                >
                  <option value="">Select a portfolio</option>
                  {available.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="detail-actions">
              <Button
                size="sm"
                variant="outline"
                onClick={() => run("allocate")}
                disabled={busy}
              >
                Run preference allocation
              </Button>
              <Button
                size="sm"
                onClick={() =>
                  run("manual-allocate", { committee_id: category, portfolio })
                }
                disabled={busy || !portfolio || !reason.trim()}
              >
                Save manual allocation
              </Button>
            </div>
          </>
        )}
      </section>
      <section className="detail-section">
        <h3>Digital Valora E-ID</h3>
        {row.credential ? (
          <>
            <div className="allocation-detail">
              <strong>{row.credential.credential_id}</strong>
              <StatusBadge value={row.credential.status} />
            </div>
            <div className="detail-actions">
              <a
                className="button button-outline button-sm"
                href={`/id/${row.credential.token}`}
                target="_blank"
                rel="noreferrer"
              >
                View E-ID <ArrowUpRight size={14} />
              </a>
              <a
                className="button button-outline button-sm"
                href={`/verify/${row.credential.credential_id}?token=${row.credential.token}`}
                target="_blank"
                rel="noreferrer"
              >
                Verify <ScanLine size={14} />
              </a>
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => run("regenerate-id")}
              >
                Regenerate secure QR
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={
                  busy || !reason.trim() || row.credential.status === "REVOKED"
                }
                onClick={() => run("revoke-id")}
              >
                Revoke
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={busy || row.credential.status === "REVOKED"}
                onClick={() => run("retry-email")}
              >
                Resend E-ID email
              </Button>
            </div>
            <p className="detail-help">
              Regeneration and allocation overrides invalidate the previous QR
              link. The visible Valora E-ID stays the same.
            </p>
          </>
        ) : (
          <p>Issued automatically after payment verification and allocation.</p>
        )}
      </section>
      <label className="admin-field">
        Reason for rejection, correction, override or revocation
        <textarea
          rows={2}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Required for decisions that need an audit explanation"
          maxLength={500}
        />
      </label>
      {Object.keys(row.registration.additional_fields).length > 0 && (
        <section className="detail-section">
          <h3>Additional form fields</h3>
          {Object.entries(row.registration.additional_fields).map(([k, v]) => (
            <p key={k}>
              {k}: {v}
            </p>
          ))}
        </section>
      )}
    </Modal>
  );
}
function MatrixEditor({
  category,
  event,
  onClose,
  onSave,
}: {
  category: EventCategory;
  event: FoundationEvent;
  onClose: () => void;
  onSave: (portfolios: string[], capacity: number) => Promise<void>;
}) {
  const [text, setText] = useState(category.portfolios.join("\n")),
    [capacity, setCapacity] = useState(category.capacity),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const lines = text
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);
  return (
    <Modal title={`Edit ${category.name} matrix`} onClose={onClose}>
      <p className="dialog-copy">
        One portfolio per line, in allocation order. Occupied portfolios cannot
        be removed. This changes the operational matrix for {event.shortTitle}.
      </p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            await onSave(lines, capacity);
          } catch (err) {
            setError((err as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className="admin-field">
          Committee capacity
          <input
            type="number"
            min={1}
            max={1000}
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))}
            required
          />
        </label>
        <label className="admin-field">
          Ordered portfolio matrix
          <textarea
            rows={15}
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
            spellCheck={false}
          />
        </label>
        <p className="detail-help">
          {lines.length} portfolios · {new Set(lines).size} unique
        </p>
        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}
        <Button
          type="submit"
          disabled={
            busy ||
            lines.length < capacity ||
            new Set(lines).size !== lines.length
          }
        >
          {busy ? "Saving…" : "Save matrix"}
        </Button>
      </form>
    </Modal>
  );
}
function ImportForm({
  event,
  onClose,
  onSave,
}: {
  event: FoundationEvent;
  onClose: () => void;
  onSave: (input: unknown) => Promise<void>;
}) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <Modal title="Import a form response" onClose={onClose}>
      <p className="dialog-copy">
        Use the details supplied in the external registration form. New records
        always start with pending payment.
      </p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          const f = new FormData(e.currentTarget);
          const input: Record<string, unknown> = {
            event_id: event.id,
            form_response_id: f.get("form_response_id"),
            payment_reference: f.get("payment_reference") ?? "",
            payment_confirmation: f.get("payment_confirmation") === "on",
            preferences: Array.from({ length: event.preferenceCount }, (_, i) =>
              f.get("preference-" + i)
            ),
            additional_fields: {},
          };
          event.fields.forEach((field) => {
            if (
              [
                "name",
                "institution",
                "class",
                "email",
                "phone",
                "experience",
              ].includes(field.key)
            )
              input[field.key] = f.get(field.key);
            else
              (input.additional_fields as Record<string, unknown>)[field.key] =
                f.get(field.key);
          });
          try {
            await onSave(input);
          } catch (err) {
            setError((err as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="import-form-grid">
          {event.fields.map((field) => (
            <label className="admin-field" key={field.key}>
              {field.label}
              {field.type === "select" ? (
                <select name={field.key} required={field.required}>
                  <option value="">Select…</option>
                  {field.options?.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  name={field.key}
                  type={
                    field.type === "tel"
                      ? "tel"
                      : field.type === "email"
                      ? "email"
                      : "text"
                  }
                  required={field.required}
                  maxLength={
                    field.key === "email"
                      ? 254
                      : field.key === "phone"
                      ? 20
                      : field.key === "class"
                      ? 80
                      : 120
                  }
                />
              )}
            </label>
          ))}
          {Array.from({ length: event.preferenceCount }, (_, i) => (
            <label className="admin-field" key={i}>
              Committee preference {i + 1}
              <select name={"preference-" + i} required>
                <option value="">Select a committee</option>
                {event.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          ))}
          <label className="admin-field">
            Form response ID
            <input
              name="form_response_id"
              required
              maxLength={200}
              placeholder="Original response ID or unique import reference"
            />
          </label>
          <label className="admin-field">
            UPI transaction reference
            <input name="payment_reference" maxLength={100} />
          </label>
        </div>
        <label className="checkbox-label">
          <input type="checkbox" name="payment_confirmation" /> Participant
          confirmed payment in the form
        </label>
        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}
        <Button type="submit" disabled={busy}>
          {busy ? "Importing…" : "Import response"}
        </Button>
      </form>
    </Modal>
  );
}
