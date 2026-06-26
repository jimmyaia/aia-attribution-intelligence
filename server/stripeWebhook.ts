import Stripe from "stripe";
import { Express, Request, Response } from "express";
import express from "express";
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { subscriptions } from "../drizzle/schema";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2026-06-24.dahlia",
});

// Map Stripe subscription status to our DB enum (drop unsupported values)
type DbStatus = "active" | "trialing" | "past_due" | "canceled" | "incomplete" | "unpaid";

function mapStatus(stripeStatus: string): DbStatus {
  const allowed: DbStatus[] = ["active", "trialing", "past_due", "canceled", "incomplete", "unpaid"];
  return (allowed.includes(stripeStatus as DbStatus) ? stripeStatus : "incomplete") as DbStatus;
}

export function registerStripeWebhook(app: Express) {
  // MUST register express.raw BEFORE the global express.json middleware
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    async (req: Request, res: Response) => {
      const sig = req.headers["stripe-signature"];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      let event: Stripe.Event;

      try {
        if (!sig || !webhookSecret) {
          console.warn("[Webhook] Missing signature or secret");
          return res.status(400).json({ error: "Missing signature" });
        }
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("[Webhook] Signature verification failed:", message);
        return res.status(400).json({ error: `Webhook error: ${message}` });
      }

      // Required: handle test events from Stripe dashboard
      if (event.id.startsWith("evt_test_")) {
        console.log("[Webhook] Test event detected, returning verification response");
        return res.json({ verified: true });
      }

      console.log(`[Webhook] Received event: ${event.type} (${event.id})`);

      const db = await getDb();
      if (!db) {
        console.error("[Webhook] DB unavailable");
        return res.status(500).json({ error: "DB unavailable" });
      }

      try {
        switch (event.type) {
          case "checkout.session.completed": {
            const session = event.data.object as Stripe.Checkout.Session;
            const userId = parseInt(session.metadata?.user_id ?? "0");
            const customerId =
              typeof session.customer === "string"
                ? session.customer
                : (session.customer as Stripe.Customer | null)?.id ?? "";
            const subscriptionId =
              typeof session.subscription === "string"
                ? session.subscription
                : (session.subscription as Stripe.Subscription | null)?.id ?? "";

            if (!userId || !subscriptionId) break;

            // Fetch full subscription details from Stripe
            const stripeSub = await stripe.subscriptions.retrieve(subscriptionId);
            // In Stripe API v2, period info is on the first item
            const item = stripeSub.items.data[0];
            const periodEnd = item?.billing_thresholds
              ? null
              : (stripeSub as unknown as { current_period_end?: number }).current_period_end;

            const [existing] = await db
              .select({ id: subscriptions.id })
              .from(subscriptions)
              .where(eq(subscriptions.userId, userId))
              .limit(1);

            const subData = {
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscriptionId,
              status: mapStatus(stripeSub.status),
              currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
              cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
            };

            if (existing) {
              await db
                .update(subscriptions)
                .set(subData)
                .where(eq(subscriptions.userId, userId));
            } else {
              await db.insert(subscriptions).values({
                userId,
                ...subData,
              });
            }

            console.log(`[Webhook] Subscription activated for user ${userId}`);
            break;
          }

          case "customer.subscription.updated": {
            const stripeSub = event.data.object as Stripe.Subscription;
            const customerId =
              typeof stripeSub.customer === "string"
                ? stripeSub.customer
                : (stripeSub.customer as Stripe.Customer).id;
            const periodEnd = (stripeSub as unknown as { current_period_end?: number })
              .current_period_end;

            await db
              .update(subscriptions)
              .set({
                status: mapStatus(stripeSub.status),
                currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
                cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
              })
              .where(eq(subscriptions.stripeCustomerId, customerId));

            console.log(`[Webhook] Subscription updated for customer ${customerId}`);
            break;
          }

          case "customer.subscription.deleted": {
            const stripeSub = event.data.object as Stripe.Subscription;
            const customerId =
              typeof stripeSub.customer === "string"
                ? stripeSub.customer
                : (stripeSub.customer as Stripe.Customer).id;

            await db
              .update(subscriptions)
              .set({
                status: "canceled",
                cancelAtPeriodEnd: false,
              })
              .where(eq(subscriptions.stripeCustomerId, customerId));

            console.log(`[Webhook] Subscription canceled for customer ${customerId}`);
            break;
          }

          case "invoice.payment_failed": {
            const invoice = event.data.object as Stripe.Invoice;
            const customerId =
              typeof invoice.customer === "string"
                ? invoice.customer
                : (invoice.customer as Stripe.Customer | null)?.id ?? "";

            if (customerId) {
              await db
                .update(subscriptions)
                .set({ status: "past_due" })
                .where(eq(subscriptions.stripeCustomerId, customerId));
              console.log(`[Webhook] Payment failed for customer ${customerId}`);
            }
            break;
          }

          default:
            console.log(`[Webhook] Unhandled event type: ${event.type}`);
        }
      } catch (err) {
        console.error("[Webhook] Handler error:", err);
        return res.status(500).json({ error: "Webhook handler failed" });
      }

      return res.json({ received: true });
    }
  );
}
