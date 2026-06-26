import Stripe from "stripe";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import {
  subscriptions,
  googleAdsConnections,
  ghlConnections,
  users,
} from "../drizzle/schema";
import { PLANS } from "./products";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2026-06-24.dahlia",
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function getOrCreateStripeCustomer(
  userId: number,
  email: string,
  name?: string | null
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  if (sub?.stripeCustomerId) return sub.stripeCustomerId;

  const customer = await stripe.customers.create({
    email,
    name: name ?? undefined,
    metadata: { userId: userId.toString() },
  });

  return customer.id;
}

// ─── App Router ───────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,

  // ── Auth ──────────────────────────────────────────────────────────────────
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ── User / Profile ────────────────────────────────────────────────────────
  user: router({
    updateAgencyName: protectedProcedure
      .input(z.object({ agencyName: z.string().min(1).max(255) }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        await db
          .update(users)
          .set({ agencyName: input.agencyName })
          .where(eq(users.id, ctx.user.id));
        return { success: true };
      }),

    getProfile: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);
      return user ?? null;
    }),
  }),

  // ── Subscription ──────────────────────────────────────────────────────────
  subscription: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const [sub] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, ctx.user.id))
        .limit(1);
      return sub ?? null;
    }),

    createCheckout: protectedProcedure
      .input(z.object({ origin: z.string().url() }))
      .mutation(async ({ ctx, input }) => {
        const customerId = await getOrCreateStripeCustomer(
          ctx.user.id,
          ctx.user.email ?? "",
          ctx.user.name
        );

        const session = await stripe.checkout.sessions.create({
          customer: customerId,
          mode: "subscription",
          allow_promotion_codes: true,
          line_items: [
            {
              price_data: {
                currency: "usd",
                product_data: {
                  name: `Attribution Intelligence — ${PLANS.starter.name}`,
                  description: PLANS.starter.description,
                },
                unit_amount: PLANS.starter.priceMonthly,
                recurring: { interval: PLANS.starter.interval },
              },
              quantity: 1,
            },
          ],
          client_reference_id: ctx.user.id.toString(),
          metadata: {
            user_id: ctx.user.id.toString(),
            customer_email: ctx.user.email ?? "",
            customer_name: ctx.user.name ?? "",
          },
          success_url: `${input.origin}/dashboard?checkout=success`,
          cancel_url: `${input.origin}/pricing?checkout=canceled`,
        });

        return { url: session.url };
      }),

    createPortal: protectedProcedure
      .input(z.object({ origin: z.string().url() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        const [sub] = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.userId, ctx.user.id))
          .limit(1);

        if (!sub?.stripeCustomerId) throw new Error("No Stripe customer found");

        const session = await stripe.billingPortal.sessions.create({
          customer: sub.stripeCustomerId,
          return_url: `${input.origin}/dashboard/billing`,
        });

        return { url: session.url };
      }),
  }),

  // ── Google Ads Connection ─────────────────────────────────────────────────
  googleAds: router({
    getConnection: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const [conn] = await db
        .select({
          id: googleAdsConnections.id,
          googleAccountId: googleAdsConnections.googleAccountId,
          googleAccountName: googleAdsConnections.googleAccountName,
          googleEmail: googleAdsConnections.googleEmail,
          isConnected: googleAdsConnections.isConnected,
          connectedAt: googleAdsConnections.connectedAt,
        })
        .from(googleAdsConnections)
        .where(eq(googleAdsConnections.userId, ctx.user.id))
        .limit(1);
      return conn ?? null;
    }),

    disconnect: protectedProcedure.mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db
        .update(googleAdsConnections)
        .set({
          isConnected: false,
          accessToken: null,
          refreshToken: null,
          googleAccountId: null,
          googleAccountName: null,
          googleEmail: null,
        })
        .where(eq(googleAdsConnections.userId, ctx.user.id));
      return { success: true };
    }),
  }),

  // ── GoHighLevel Connection ────────────────────────────────────────────────
  ghl: router({
    getConnection: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const [conn] = await db
        .select({
          id: ghlConnections.id,
          locationId: ghlConnections.locationId,
          locationName: ghlConnections.locationName,
          isConnected: ghlConnections.isConnected,
          connectedAt: ghlConnections.connectedAt,
        })
        .from(ghlConnections)
        .where(eq(ghlConnections.userId, ctx.user.id))
        .limit(1);
      return conn ?? null;
    }),

    saveApiKey: protectedProcedure
      .input(
        z.object({
          apiKey: z.string().min(10, "API key is too short"),
          locationId: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");

        let locationName = "GoHighLevel Account";
        let locationId = input.locationId ?? "";
        try {
          const res = await fetch("https://rest.gohighlevel.com/v1/locations/", {
            headers: { Authorization: `Bearer ${input.apiKey}` },
          });
          if (res.ok) {
            const data = (await res.json()) as {
              locations?: { id: string; name: string }[];
            };
            if (data.locations?.[0]) {
              locationName = data.locations[0].name;
              locationId = data.locations[0].id;
            }
          }
        } catch {
          // GHL API call failed — still save
        }

        const [existing] = await db
          .select({ id: ghlConnections.id })
          .from(ghlConnections)
          .where(eq(ghlConnections.userId, ctx.user.id))
          .limit(1);

        if (existing) {
          await db
            .update(ghlConnections)
            .set({
              apiKey: input.apiKey,
              locationId,
              locationName,
              isConnected: true,
              connectedAt: new Date(),
            })
            .where(eq(ghlConnections.userId, ctx.user.id));
        } else {
          await db.insert(ghlConnections).values({
            userId: ctx.user.id,
            apiKey: input.apiKey,
            locationId,
            locationName,
            isConnected: true,
            connectedAt: new Date(),
          });
        }

        return { success: true, locationName, locationId };
      }),

    disconnect: protectedProcedure.mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db
        .update(ghlConnections)
        .set({ isConnected: false, apiKey: null })
        .where(eq(ghlConnections.userId, ctx.user.id));
      return { success: true };
    }),
  }),
});

export type AppRouter = typeof appRouter;
