import {
  boolean,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).unique(),
  passwordHash: varchar("passwordHash", { length: 255 }),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  agencyName: varchar("agencyName", { length: 255 }),
  firstName: varchar("firstName", { length: 128 }),
  lastName: varchar("lastName", { length: 128 }),
  phone: varchar("phone", { length: 32 }),
  website: varchar("website", { length: 512 }),
  profileComplete: boolean("profileComplete").default(false).notNull(),
  onboardingStatus: varchar("onboardingStatus", { length: 32 })
    .default("not_started")
    .notNull(),
  onboardingNotes: text("onboardingNotes"),
  onboardingUpdatedAt: timestamp("onboardingUpdatedAt"),
  billingAccessOverrideUntil: timestamp("billingAccessOverrideUntil"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Subscriptions ────────────────────────────────────────────────────────────
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  stripePriceId: varchar("stripePriceId", { length: 255 }),
  status: mysqlEnum("status", [
    "active",
    "trialing",
    "past_due",
    "canceled",
    "incomplete",
    "unpaid",
  ])
    .default("incomplete")
    .notNull(),
  planName: varchar("planName", { length: 100 }).default("Starter").notNull(),
  priceMonthly: int("priceMonthly").default(4900).notNull(),
  currentPeriodStart: timestamp("currentPeriodStart"),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  cancelAtPeriodEnd: boolean("cancelAtPeriodEnd").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

// ─── Google Ads Connections ───────────────────────────────────────────────────
export const googleAdsConnections = mysqlTable("google_ads_connections", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  googleAccountId: varchar("googleAccountId", { length: 64 }),
  googleAccountName: varchar("googleAccountName", { length: 255 }),
  googleEmail: varchar("googleEmail", { length: 320 }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  tokenExpiresAt: timestamp("tokenExpiresAt"),
  isConnected: boolean("isConnected").default(false).notNull(),
  connectedAt: timestamp("connectedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GoogleAdsConnection = typeof googleAdsConnections.$inferSelect;
export type InsertGoogleAdsConnection = typeof googleAdsConnections.$inferInsert;

// ─── GoHighLevel Connections ──────────────────────────────────────────────────
export const ghlConnections = mysqlTable("ghl_connections", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  apiKey: text("apiKey"),
  locationId: varchar("locationId", { length: 255 }),
  locationName: varchar("locationName", { length: 255 }),
  isConnected: boolean("isConnected").default(false).notNull(),
  connectedAt: timestamp("connectedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GhlConnection = typeof ghlConnections.$inferSelect;
export type InsertGhlConnection = typeof ghlConnections.$inferInsert;
