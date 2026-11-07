import assert from "node:assert/strict";
import { moneyToCents } from "../lib/money.ts";
import { normalizePhone } from "../lib/phone.ts";
import { nextStatus } from "../lib/status.ts";
import { parseSendAt } from "../lib/time.ts";

assert.equal(normalizePhone("+1 (555) 123-4567"), "15551234567");
assert.equal(normalizePhone("123"), null);

assert.equal(moneyToCents("75"), 7500);
assert.equal(moneyToCents("75.5"), 7550);
assert.equal(moneyToCents(""), 0);
assert.equal(moneyToCents("nope"), null);

assert.equal(nextStatus("sending", "sent"), "sent");
assert.equal(nextStatus("sent", "delivered"), "delivered");
assert.equal(nextStatus("delivered", "read"), "read");
assert.equal(nextStatus("read", "delivered"), null);
assert.equal(nextStatus("sent", "failed"), "failed");
assert.equal(nextStatus("read", "failed"), null);
assert.equal(nextStatus("failed", "sent"), null);

const kolkata = parseSendAt("2026-11-07 09:00", "Asia/Kolkata");
assert.equal(kolkata?.toISOString(), "2026-11-07T03:30:00.000Z");

const absolute = parseSendAt("2026-11-07T09:00:00Z", "Asia/Kolkata");
assert.equal(absolute?.toISOString(), "2026-11-07T09:00:00.000Z");

const newYork = parseSendAt("2026-07-01 12:00", "America/New_York");
assert.equal(newYork?.toISOString(), "2026-07-01T16:00:00.000Z");

console.log("lib checks passed");
