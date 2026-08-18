import { describe, expect, it } from "vitest";
import type { Subscription, User } from "../drizzle/schema";
import { evaluateBillingAccess, PAYMENT_GRACE_PERIOD_MS } from "./subscriptionAccess";

const now = new Date("2026-08-18T12:00:00.000Z");

function account(role: User["role"] = "user", billingAccessOverrideUntil: Date | null = null) {
  return { role, billingAccessOverrideUntil } as Pick<User, "role" | "billingAccessOverrideUntil">;
}

function subscription(status: Subscription["status"], currentPeriodEnd: Date | null = null) {
  return { status, currentPeriodEnd } as Subscription;
}

describe("subscription access", () => {
  it("allows active subscriptions", () => {
    expect(evaluateBillingAccess(account(), subscription("active"), now)).toMatchObject({
      allowed: true,
      reason: "active_subscription",
    });
  });

  it("allows a past-due account only during the limited grace period", () => {
    const currentPeriodEnd = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    expect(evaluateBillingAccess(account(), subscription("past_due", currentPeriodEnd), now)).toMatchObject({
      allowed: true,
      reason: "past_due_grace",
    });

    const afterGrace = new Date(currentPeriodEnd.getTime() + PAYMENT_GRACE_PERIOD_MS + 1);
    expect(evaluateBillingAccess(account(), subscription("past_due", currentPeriodEnd), afterGrace)).toMatchObject({
      allowed: false,
      reason: "payment_required",
    });
  });

  it("allows a controlled temporary override without changing Stripe status", () => {
    const overrideUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    expect(evaluateBillingAccess(account("user", overrideUntil), subscription("unpaid"), now)).toMatchObject({
      allowed: true,
      reason: "manual_override",
      overrideUntil,
    });
  });

  it("locks canceled accounts after their paid period ends", () => {
    const periodEnd = new Date(now.getTime() - 1);
    expect(evaluateBillingAccess(account(), subscription("canceled", periodEnd), now)).toMatchObject({
      allowed: false,
      reason: "payment_required",
    });
  });

  it("keeps administrators able to support the platform regardless of subscription state", () => {
    expect(evaluateBillingAccess(account("admin"), subscription("unpaid"), now)).toMatchObject({
      allowed: true,
      reason: "administrator",
    });
  });
});
