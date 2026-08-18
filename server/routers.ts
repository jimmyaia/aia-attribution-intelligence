import Stripe from "stripe";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME, SUPPORT_VIEW_COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, paymentRecoveryWriteProcedure, paymentRecoveryProcedure, protectedProcedure, publicProcedure, router, subscriptionAccessProcedure, subscriptionWriteProcedure } from "./_core/trpc";
import { createEmailUser, createSupportViewSession, endActiveSupportViewSessionsForAdmin, endSupportViewSession, getDb, getUserByEmail, getUserById } from "./db";
import { sdk } from "./_core/sdk";
import {
  subscriptions,
  googleAdsConnections,
  ghlConnections,
  users,
} from "../drizzle/schema";
import { PLANS } from "./products";
import { adminRouter } from "./adminRouter";
import { getBillingAccessForUser } from "./subscriptionAccess";
import { storagePut } from "./storage";

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

function parseProfileImage(dataUrl: string) {
  const match = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) throw new TRPCError({ code: "BAD_REQUEST", message: "Upload a PNG, JPEG, or WebP image." });
  const buffer = Buffer.from(match[2], "base64");
  if (!buffer.length || buffer.length > 2 * 1024 * 1024) {
    throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "Profile images must be 2 MB or smaller." });
  }
  const extension = match[1] === "image/png" ? "png" : match[1] === "image/webp" ? "webp" : "jpg";
  return { buffer, contentType: match[1], extension };
}

// ─── App Router ───────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,
  admin: adminRouter,

  // ── Auth ──────────────────────────────────────────────────────────────────
  auth: router({
    me: publicProcedure.query(opts => {
      if (!opts.ctx.user) return null;
      return {
        ...opts.ctx.user,
        supportView: opts.ctx.supportView
          ? {
              ...opts.ctx.supportView,
              adminName: opts.ctx.actor?.name ?? opts.ctx.actor?.email ?? "AIA administrator",
            }
          : null,
      };
    }),

    register: publicProcedure
      .input(z.object({
        firstName: z.string().min(1).max(128),
        lastName: z.string().min(1).max(128),
        email: z.string().email().max(320),
        password: z.string().min(8).max(128),
        phone: z.string().max(32).optional(),
        website: z.string().max(512).optional(),
        agencyName: z.string().max(255).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Check if email already exists
        const existing = await getUserByEmail(input.email);
        if (existing) {
          throw new Error("An account with this email already exists.");
        }
        const passwordHash = await bcrypt.hash(input.password, 12);
        const user = await createEmailUser({
          email: input.email,
          passwordHash,
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone,
          website: input.website,
          agencyName: input.agencyName,
        });
        // Issue session cookie using the same JWT mechanism
        const token = await sdk.createSessionToken(user.id.toString(), {
          name: user.name ?? user.email ?? "",
        });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, {
          ...cookieOptions,
          maxAge: 365 * 24 * 60 * 60 * 1000,
        });
        return { success: true, userId: user.id };
      }),

    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = await getUserByEmail(input.email);
        if (!user || !user.passwordHash) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid email or password.",
          });
        }
        const valid = await bcrypt.compare(input.password, user.passwordHash);
        if (!valid) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid email or password.",
          });
        }
        const billingAccess = await getBillingAccessForUser(user);
        // Update last signed in
        const db = await getDb();
        if (db) {
          await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user.id));
        }
        const token = await sdk.createSessionToken(user.id.toString(), {
          name: user.name ?? user.email ?? "",
        });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, {
          ...cookieOptions,
          maxAge: 365 * 24 * 60 * 60 * 1000,
        });
        return { success: true, userId: user.id, accountLocked: !billingAccess.allowed };
      }),

    logout: publicProcedure.mutation(async ({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      if (ctx.supportView && ctx.actor) {
        await endSupportViewSession(ctx.supportView.sessionId, ctx.actor.id);
      }
      ctx.res.clearCookie(COOKIE_NAME, cookieOptions);
      ctx.res.clearCookie(SUPPORT_VIEW_COOKIE_NAME, cookieOptions);
      return { success: true } as const;
    }),
  }),

  support: router({
    start: adminProcedure
      .input(z.object({
        targetUserId: z.number().int().positive(),
        customerId: z.string().regex(/^\d{7}$/, "Enter the seven-digit Customer ID."),
        verification: z.string().trim().min(4).max(320),
        reason: z.string().trim().min(3).max(255).default("Support review"),
      }))
      .mutation(async ({ ctx, input }) => {
        const target = await getUserById(input.targetUserId);
        if (!target) throw new TRPCError({ code: "NOT_FOUND", message: "Client account not found" });
        if (target.role === "admin" || target.id === ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Client View is only available for customer accounts." });
        }
        const emailMatches = Boolean(target.email && target.email.toLowerCase() === input.verification.toLowerCase());
        const phoneLastFour = target.phone?.replace(/\D/g, "").slice(-4);
        const phoneMatches = Boolean(phoneLastFour && input.verification.replace(/\D/g, "").slice(-4) === phoneLastFour);
        if (target.customerId !== input.customerId || (!emailMatches && !phoneMatches)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Customer verification did not match this account." });
        }
        await endActiveSupportViewSessionsForAdmin(ctx.user.id);
        const expiresInMs = 60 * 60 * 1000;
        const session = await createSupportViewSession({
          adminUserId: ctx.user.id,
          targetUserId: target.id,
          reason: input.reason,
          expiresAt: new Date(Date.now() + expiresInMs),
        });
        const token = await sdk.createSupportViewToken({
          sessionId: session.id,
          adminUserId: ctx.user.id,
          targetUserId: target.id,
          expiresInMs,
        });
        ctx.res.cookie(SUPPORT_VIEW_COOKIE_NAME, token, {
          ...getSessionCookieOptions(ctx.req),
          maxAge: expiresInMs,
        });
        return { success: true, targetName: target.agencyName ?? target.name ?? target.email, expiresAt: session.expiresAt };
      }),

    exit: protectedProcedure.mutation(async ({ ctx }) => {
      if (!ctx.supportView || !ctx.actor || ctx.actor.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "No active Client View session." });
      }
      await endSupportViewSession(ctx.supportView.sessionId, ctx.actor.id);
      ctx.res.clearCookie(SUPPORT_VIEW_COOKIE_NAME, getSessionCookieOptions(ctx.req));
      return { success: true } as const;
    }),
  }),

  // ── User / Profile ────────────────────────────────────────────────────────
  user: router({
    updateAgencyName: subscriptionWriteProcedure
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

    getProfile: subscriptionAccessProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);
      return user ?? null;
    }),

    saveProfile: subscriptionWriteProcedure
      .input(
        z.object({
          firstName: z.string().min(1).max(128),
          lastName: z.string().min(1).max(128),
          email: z.string().email().max(320).optional(),
          phone: z.string().max(32).optional(),
          website: z.string().max(512).optional(),
          businessName: z.string().min(1).max(255),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        await db
          .update(users)
          .set({
            firstName: input.firstName,
            lastName: input.lastName,
            email: input.email ?? ctx.user.email,
            phone: input.phone ?? null,
            website: input.website ?? null,
            agencyName: input.businessName,
            name: `${input.firstName} ${input.lastName}`,
            profileComplete: true,
          })
          .where(eq(users.id, ctx.user.id));
        return { success: true };
      }),

    uploadProfileImage: paymentRecoveryWriteProcedure
      .input(z.object({ dataUrl: z.string().max(3_000_000) }))
      .mutation(async ({ ctx, input }) => {
        const { buffer, contentType, extension } = parseProfileImage(input.dataUrl);
        const stored = await storagePut(`profile-images/${ctx.user.id}/avatar.${extension}`, buffer, contentType);
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        await db.update(users).set({ profileImageUrl: stored.url }).where(eq(users.id, ctx.user.id));
        return { success: true, profileImageUrl: stored.url };
      }),

    changePassword: paymentRecoveryWriteProcedure
      .input(z.object({ currentPassword: z.string().min(1).max(128), newPassword: z.string().min(8).max(128) }))
      .mutation(async ({ ctx, input }) => {
        const account = await getUserById(ctx.user.id);
        if (!account?.passwordHash) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Password changes are only available for email-password accounts." });
        }
        const currentMatches = await bcrypt.compare(input.currentPassword, account.passwordHash);
        if (!currentMatches) throw new TRPCError({ code: "UNAUTHORIZED", message: "Current password is incorrect." });
        const passwordHash = await bcrypt.hash(input.newPassword, 12);
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        await db.update(users).set({ passwordHash }).where(eq(users.id, ctx.user.id));
        return { success: true };
      }),
  }),

  // ── Subscription ──────────────────────────────────────────────────────────
  subscription: router({
    getAccess: protectedProcedure.query(async ({ ctx }) => getBillingAccessForUser(ctx.user)),

    get: paymentRecoveryProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const [sub] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, ctx.user.id))
        .limit(1);
      return sub ?? null;
    }),

    createCheckout: paymentRecoveryWriteProcedure
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

    createPortal: paymentRecoveryWriteProcedure
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
    getAuthorizeUrl: subscriptionWriteProcedure
      .input(z.object({ origin: z.string().url() }))
      .query(({ ctx, input }) => {
        const clientId = process.env.GOOGLE_CLIENT_ID ?? "";
        if (!clientId) return { url: null, configured: false };
        const state = Buffer.from(
          JSON.stringify({ userId: ctx.user.id, ts: Date.now() })
        ).toString("base64url");
        const callbackUrl = `${input.origin}/api/google-ads/callback`;
        const params = new URLSearchParams({
          client_id: clientId,
          redirect_uri: callbackUrl,
          response_type: "code",
          scope: [
            "https://www.googleapis.com/auth/adwords",
            "https://www.googleapis.com/auth/userinfo.email",
            "https://www.googleapis.com/auth/userinfo.profile",
          ].join(" "),
          access_type: "offline",
          prompt: "consent",
          state,
        });
        return {
          url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
          configured: true,
        };
      }),

    getConnection: subscriptionAccessProcedure.query(async ({ ctx }) => {
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

    disconnect: subscriptionWriteProcedure.mutation(async ({ ctx }) => {
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
    getConnection: subscriptionAccessProcedure.query(async ({ ctx }) => {
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

    saveApiKey: subscriptionWriteProcedure
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

    disconnect: subscriptionWriteProcedure.mutation(async ({ ctx }) => {
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
