import "server-only";
import { siteOrigin } from "./site-origin";
import {
  readFile,
  writeFile,
  mkdir,
  rename,
  open,
  unlink,
  stat,
} from "node:fs/promises";
import { randomUUID, randomBytes } from "node:crypto";
import path from "node:path";
import { events, getEvent } from "@/data/events";
import {
  adminCommand,
  settleGatewayPayment,
  createDelegationRegistrations,
  type CapturedPayment,
  createRegistration,
  emptyState,
  publicCredential,
  consumeRate,
  updateMatrix,
  DomainError,
  claimEmail,
  finishEmail,
  type DomainState,
  type Runtime,
} from "./domain";
import type {
  AdminCommand,
  RegistrationInput,
  RegistrationView,
  PublicCredential,
  DeliveryEnvelope,
} from "./models";
const runtime: Runtime = {
  uuid: randomUUID,
  token: () => randomBytes(32).toString("hex"),
  now: () => new Date().toISOString(),
};
export interface Repository {
  importDelegation(inputs: RegistrationInput[]): Promise<RegistrationView[]>;
  settlePayment(payment: CapturedPayment): Promise<RegistrationView>;
  claimEmail(): Promise<DeliveryEnvelope | null>;
  finishEmail(
    id: string,
    lease: string,
    result: { sent: boolean; messageId?: string; error?: string }
  ): Promise<void>;
  snapshot(): Promise<DomainState>;
  importRegistration(
    input: RegistrationInput,
    actor: string
  ): Promise<RegistrationView>;
  command(command: AdminCommand, actor: string): Promise<RegistrationView>;
  verify(token: string, id?: string): Promise<PublicCredential | null>;
  rateLimit(key: string, limit: number, windowMs: number): Promise<boolean>;
  matrix(
    eventId: string,
    categoryId: string,
    portfolios: string[],
    capacity: number,
    actor: string
  ): Promise<void>;
}
const file = path.join(process.cwd(), ".data", "state.json");
async function readState(): Promise<DomainState> {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return emptyState();
    throw e;
  }
}
async function transact<T>(fn: (state: DomainState) => T): Promise<T> {
  await mkdir(path.dirname(file), { recursive: true });
  const lock = file + ".lock";
  let handle;
  for (let i = 0; i < 100; i++) {
    try {
      handle = await open(lock, "wx");
      break;
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "EEXIST") throw e;
      try {
        if (Date.now() - (await stat(lock)).mtimeMs > 60000) await unlink(lock);
      } catch {}
      await new Promise((r) => setTimeout(r, 50));
    }
  }
  if (!handle)
    throw new DomainError(
      "BUSY",
      "The platform is busy. Please try again.",
      503
    );
  try {
    const state = await readState();
    const result = fn(state);
    const temp = file + "." + randomUUID();
    await writeFile(temp, JSON.stringify(state), { mode: 0o600 });
    await rename(temp, file);
    return result;
  } finally {
    await handle.close();
    await unlink(lock);
  }
}
class LocalRepository implements Repository {
  importDelegation(inputs: RegistrationInput[]) {
    return transact(s => createDelegationRegistrations(s, inputs, events, runtime));
  }
  settlePayment(payment: CapturedPayment) {
    return transact(s => settleGatewayPayment(s, payment, events, runtime, appUrl()));
  }
  claimEmail() {
    return transact((s) => claimEmail(s, events, runtime));
  }
  finishEmail(
    id: string,
    lease: string,
    result: { sent: boolean; messageId?: string; error?: string }
  ) {
    return transact((s) => finishEmail(s, id, lease, result, runtime));
  }
  snapshot() {
    return transact((s) => s);
  }
  importRegistration(input: RegistrationInput, actor: string) {
    return transact((s) =>
      createRegistration(s, input, events, runtime, actor)
    );
  }
  command(command: AdminCommand, actor: string) {
    return transact((s) =>
      adminCommand(s, command, events, runtime, actor, appUrl())
    );
  }
  verify(token: string, id?: string) {
    return transact((s) =>
      publicCredential(s, token, events, runtime.now(), id)
    );
  }
  rateLimit(key: string, limit: number, windowMs: number) {
    return transact((s) => consumeRate(s, key, limit, windowMs, Date.now()));
  }
  matrix(
    eventId: string,
    categoryId: string,
    portfolios: string[],
    capacity: number,
    actor: string
  ) {
    const event = getEvent(eventId);
    if (!event) throw new DomainError("NOT_FOUND", "Event not found.", 404);
    return transact((s) =>
      updateMatrix(s, event, categoryId, portfolios, capacity, runtime, actor)
    );
  }
}
export function appUrl() {
  const u = new URL(siteOrigin());
  if (process.env.NODE_ENV === "production" && u.protocol !== "https:")
    throw new DomainError(
      "CONFIG",
      "A secure APP_URL must be configured.",
      503
    );
  return u.origin;
}
class AppsScriptRepository implements Repository {
  importDelegation(inputs: RegistrationInput[]) {
    return this.call<RegistrationView[]>("delegation-import", { inputs });
  }
  settlePayment(payment: CapturedPayment) {
    return this.call<RegistrationView>("settle-payment", { payment });
  }
  claimEmail() {
    return this.call<DeliveryEnvelope | null>("email-claim", {});
  }
  finishEmail(
    id: string,
    lease: string,
    result: { sent: boolean; messageId?: string; error?: string }
  ) {
    return this.call<void>("email-finish", { id, lease, result });
  }
  private async call<T>(action: string, payload: unknown): Promise<T> {
    const url = process.env.APPS_SCRIPT_URL,
      secret = process.env.APPS_SCRIPT_SECRET;
    if (!url || !secret || secret.length < 32)
      throw new DomainError(
        "CONFIG",
        "The operational datastore is not configured.",
        503
      );
    if (!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(url))
      throw new DomainError(
        "CONFIG",
        "Invalid Apps Script deployment URL.",
        503
      );
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret,
        action,
        payload,
        events,
        appUrl: appUrl(),
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(25000),
    });
    if (!response.ok)
      throw new DomainError(
        "DATASTORE",
        "The operational datastore is unavailable. Please try again.",
        503
      );
    const result = await response.json();
    if (!result.ok)
      throw new DomainError(
        result.code ?? "DATASTORE",
        result.error ?? "The operation failed.",
        result.status ?? 503
      );
    return result.data as T;
  }
  snapshot() {
    return this.call<DomainState>("snapshot", {});
  }
  importRegistration(input: RegistrationInput, actor: string) {
    return this.call<RegistrationView>("import", { input, actor });
  }
  command(command: AdminCommand, actor: string) {
    return this.call<RegistrationView>("command", { command, actor });
  }
  verify(token: string, id?: string) {
    return this.call<PublicCredential | null>("verify", { token, id });
  }
  rateLimit(key: string, limit: number, windowMs: number) {
    return this.call<boolean>("rate", { key, limit, windowMs });
  }
  matrix(
    eventId: string,
    categoryId: string,
    portfolios: string[],
    capacity: number,
    actor: string
  ) {
    return this.call<void>("matrix", {
      eventId,
      categoryId,
      portfolios,
      capacity,
      actor,
    });
  }
}
export function repository(): Repository {
  if (process.env.DATA_PROVIDER === "apps-script")
    return new AppsScriptRepository();
  if (process.env.NODE_ENV === "production")
    throw new DomainError(
      "CONFIG",
      "Configure the Google Sheets datastore before opening operations.",
      503
    );
  return new LocalRepository();
}
