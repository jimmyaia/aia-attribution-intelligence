import { eq } from "drizzle-orm";
import type { Subscription, User } from "../drizzle/schema";
import { subscriptions } from "../drizzle/schema";
import { getAgencyOwnerForMember, getDb } from "./db";

export const PAYMENT_GRACE_PERIOD_MS = 3 * 24 * 60 * 60 * 1000;

export type BillingAccessReason =
  | "administrator"
  | "active_subscription"
  | "manual_override"
  | "canceled_period_remaining"
  | "past_due_grace"
  | "payment_required";

export type BillingAccess = {
  allowed: boolean;
  reason: BillingAccessReason;
  subscriptionStatus: Subscription["status"] | null;
  overrideUntil: Date | null;
  graceEndsAt: Date | null;
};

export function evaluateBillingAccess(
  user: Pick<User, "role" | "billingAccessOverrideUntil">,
  subscription: Subscription | null | undefined,
  now = new Date(),
): BillingAccess {
  const overrideUntil = user.billingAccessOverrideUntil ?? null;
  const subscriptionStatus = subscription?.status ?? null;

  if (user.role === "admin") {
    return { allowed: true, reason: "administrator", subscriptionStatus, overrideUntil, graceEndsAt: null };
  }
  if (overrideUntil && overrideUntil.getTime() > now.getTime()) {
    return { allowed: true, reason: "manual_override", subscriptionStatus, overrideUntil, graceEndsAt: null };
  }
  if (subscriptionStatus === "active" || subscriptionStatus === "trialing") {
    return { allowed: true, reason: "active_subscription", subscriptionStatus, overrideUntil, graceEndsAt: null };
  }
  if (
    subscriptionStatus === "canceled" &&
    subscription?.currentPeriodEnd &&
    subscription.currentPeriodEnd.getTime() > now.getTime()
  ) {
    return {
      allowed: true,
      reason: "canceled_period_remaining",
      subscriptionStatus,
      overrideUntil,
      graceEndsAt: subscription.currentPeriodEnd,
    };
  }
  if (subscriptionStatus === "past_due" && subscription?.currentPeriodEnd) {
    const graceEndsAt = new Date(subscription.currentPeriodEnd.getTime() + PAYMENT_GRACE_PERIOD_MS);
    if (graceEndsAt.getTime() > now.getTime()) {
      return { allowed: true, reason: "past_due_grace", subscriptionStatus, overrideUntil, graceEndsAt };
    }
    return { allowed: false, reason: "payment_required", subscriptionStatus, overrideUntil, graceEndsAt };
  }

  return { allowed: false, reason: "payment_required", subscriptionStatus, overrideUntil, graceEndsAt: null };
}

export async function getBillingAccessForUser(user: User, now = new Date()) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const workspaceOwner = await getAgencyOwnerForMember(user.id);
  if (!workspaceOwner) throw new Error("Agency workspace unavailable");
  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, workspaceOwner.id))
    .limit(1);

  return evaluateBillingAccess(
    {
      role: user.role,
      billingAccessOverrideUntil: workspaceOwner.billingAccessOverrideUntil,
    },
    subscription,
    now,
  );
}
