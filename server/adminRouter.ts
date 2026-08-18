import bcrypt from "bcryptjs";
import { desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  ghlConnections,
  googleAdsConnections,
  subscriptions,
  users,
} from "../drizzle/schema";
import { createEmailUser, getDb, getUserByEmail, getUserById } from "./db";
import { adminProcedure, router } from "./_core/trpc";

export const ONBOARDING_STATUSES = [
  "not_started",
  "invited",
  "in_progress",
  "ready",
  "complete",
] as const;

type OnboardingStatus = (typeof ONBOARDING_STATUSES)[number];

function normalizeAgencyRows(
  rows: Array<{
    id: number;
    name: string | null;
    email: string | null;
    agencyName: string | null;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    website: string | null;
    role: "user" | "admin";
    profileComplete: boolean;
    onboardingStatus: string;
    onboardingNotes: string | null;
    onboardingUpdatedAt: Date | null;
    billingAccessOverrideUntil: Date | null;
    createdAt: Date;
    lastSignedIn: Date;
    subscriptionStatus: string | null;
    planName: string | null;
    priceMonthly: number | null;
    currentPeriodEnd: Date | null;
    cancelAtPeriodEnd: boolean | null;
    googleConnected: boolean | null;
    googleAccountName: string | null;
    googleAccountId: string | null;
    ghlConnected: boolean | null;
    ghlLocationName: string | null;
    ghlLocationId: string | null;
  }>,
) {
  const agencies = new Map<number, (typeof rows)[number]>();

  for (const row of rows) {
    const existing = agencies.get(row.id);
    if (!existing) {
      agencies.set(row.id, row);
      continue;
    }

    agencies.set(row.id, {
      ...existing,
      googleConnected: existing.googleConnected || row.googleConnected,
      ghlConnected: existing.ghlConnected || row.ghlConnected,
      subscriptionStatus: existing.subscriptionStatus ?? row.subscriptionStatus,
    });
  }

  return Array.from(agencies.values()).map(row => ({
    id: row.id,
    name: row.name,
    email: row.email,
    agencyName: row.agencyName,
    firstName: row.firstName,
    lastName: row.lastName,
    phone: row.phone,
    website: row.website,
    role: row.role,
    profileComplete: row.profileComplete,
    onboardingStatus: row.onboardingStatus as OnboardingStatus,
    onboardingNotes: row.onboardingNotes,
    onboardingUpdatedAt: row.onboardingUpdatedAt,
    billingAccessOverrideUntil: row.billingAccessOverrideUntil,
    createdAt: row.createdAt,
    lastSignedIn: row.lastSignedIn,
    subscription: {
      status: row.subscriptionStatus,
      planName: row.planName,
      priceMonthly: row.priceMonthly,
      currentPeriodEnd: row.currentPeriodEnd,
      cancelAtPeriodEnd: row.cancelAtPeriodEnd,
    },
    googleAds: {
      isConnected: Boolean(row.googleConnected),
      accountName: row.googleAccountName,
      accountId: row.googleAccountId,
    },
    ghl: {
      isConnected: Boolean(row.ghlConnected),
      locationName: row.ghlLocationName,
      locationId: row.ghlLocationId,
    },
  }));
}

async function loadAgencies() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      agencyName: users.agencyName,
      firstName: users.firstName,
      lastName: users.lastName,
      phone: users.phone,
      website: users.website,
      role: users.role,
      profileComplete: users.profileComplete,
      onboardingStatus: users.onboardingStatus,
      onboardingNotes: users.onboardingNotes,
      onboardingUpdatedAt: users.onboardingUpdatedAt,
      billingAccessOverrideUntil: users.billingAccessOverrideUntil,
      createdAt: users.createdAt,
      lastSignedIn: users.lastSignedIn,
      subscriptionStatus: subscriptions.status,
      planName: subscriptions.planName,
      priceMonthly: subscriptions.priceMonthly,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
      cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd,
      googleConnected: googleAdsConnections.isConnected,
      googleAccountName: googleAdsConnections.googleAccountName,
      googleAccountId: googleAdsConnections.googleAccountId,
      ghlConnected: ghlConnections.isConnected,
      ghlLocationName: ghlConnections.locationName,
      ghlLocationId: ghlConnections.locationId,
    })
    .from(users)
    .leftJoin(subscriptions, eq(subscriptions.userId, users.id))
    .leftJoin(googleAdsConnections, eq(googleAdsConnections.userId, users.id))
    .leftJoin(ghlConnections, eq(ghlConnections.userId, users.id))
    .orderBy(desc(users.createdAt));

  return normalizeAgencyRows(rows);
}

export const adminRouter = router({
  overview: adminProcedure.query(async () => {
    const agencies = await loadAgencies();

    return {
      totals: {
        agencies: agencies.length,
        activeSubscriptions: agencies.filter(agency => agency.subscription.status === "active" || agency.subscription.status === "trialing").length,
        onboardingInProgress: agencies.filter(agency => ["not_started", "invited", "in_progress"].includes(agency.onboardingStatus)).length,
        readyToReport: agencies.filter(agency => agency.googleAds.isConnected && agency.ghl.isConnected).length,
      },
      recentAgencies: agencies.slice(0, 5),
      onboardingStatuses: ONBOARDING_STATUSES,
    };
  }),

  listAgencies: adminProcedure
    .input(z.object({ search: z.string().trim().max(120).optional() }))
    .query(async ({ input }) => {
      const agencies = await loadAgencies();
      const search = input.search?.toLowerCase();
      if (!search) return agencies;

      return agencies.filter(agency =>
        [agency.agencyName, agency.name, agency.email]
          .filter((value): value is string => Boolean(value))
          .some(value => value.toLowerCase().includes(search)),
      );
    }),

  getAgency: adminProcedure
    .input(z.object({ userId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const agency = (await loadAgencies()).find(item => item.id === input.userId);
      if (!agency) throw new TRPCError({ code: "NOT_FOUND", message: "Agency not found" });
      return agency;
    }),

  createAgency: adminProcedure
    .input(
      z.object({
        firstName: z.string().trim().min(1).max(128),
        lastName: z.string().trim().min(1).max(128),
        agencyName: z.string().trim().min(1).max(255),
        email: z.string().trim().email().max(320),
        phone: z.string().trim().max(32).optional(),
        website: z.string().trim().max(512).optional(),
        temporaryPassword: z.string().min(8).max(128),
        notes: z.string().trim().max(4_000).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const existing = await getUserByEmail(input.email);
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "An account with this email already exists." });
      }

      const passwordHash = await bcrypt.hash(input.temporaryPassword, 12);
      const agency = await createEmailUser({
        email: input.email,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone || undefined,
        website: input.website || undefined,
        agencyName: input.agencyName,
      });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      await db
        .update(users)
        .set({
          onboardingStatus: "invited",
          onboardingNotes: input.notes || null,
          onboardingUpdatedAt: new Date(),
          profileComplete: true,
        })
        .where(eq(users.id, agency.id));

      return { success: true, agencyId: agency.id };
    }),

  updateOnboarding: adminProcedure
    .input(
      z.object({
        userId: z.number().int().positive(),
        onboardingStatus: z.enum(ONBOARDING_STATUSES),
        notes: z.string().trim().max(4_000).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const agency = await getUserById(input.userId);
      if (!agency) throw new TRPCError({ code: "NOT_FOUND", message: "Agency not found" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      await db
        .update(users)
        .set({
          onboardingStatus: input.onboardingStatus,
          onboardingNotes: input.notes || null,
          onboardingUpdatedAt: new Date(),
        })
        .where(eq(users.id, input.userId));

      return { success: true };
    }),

  resetPassword: adminProcedure
    .input(
      z.object({
        userId: z.number().int().positive(),
        temporaryPassword: z.string().min(8).max(128),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const agency = await getUserById(input.userId);
      if (!agency) throw new TRPCError({ code: "NOT_FOUND", message: "Agency not found" });
      if (agency.role === "admin" && agency.id !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin credentials can only be reset by that administrator." });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const passwordHash = await bcrypt.hash(input.temporaryPassword, 12);

      await db.update(users).set({ passwordHash }).where(eq(users.id, input.userId));
      return { success: true };
    }),

  grantBillingAccess: adminProcedure
    .input(z.object({ userId: z.number().int().positive(), days: z.number().int().min(1).max(30) }))
    .mutation(async ({ input }) => {
      const agency = await getUserById(input.userId);
      if (!agency) throw new TRPCError({ code: "NOT_FOUND", message: "Agency not found" });
      if (agency.role === "admin") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Administrators do not require a billing access override." });
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const billingAccessOverrideUntil = new Date(Date.now() + input.days * 24 * 60 * 60 * 1000);
      await db.update(users).set({ billingAccessOverrideUntil }).where(eq(users.id, input.userId));
      return { success: true, billingAccessOverrideUntil };
    }),

  clearBillingAccessOverride: adminProcedure
    .input(z.object({ userId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      await db.update(users).set({ billingAccessOverrideUntil: null }).where(eq(users.id, input.userId));
      return { success: true };
    }),
});
