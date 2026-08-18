/**
 * Google Ads OAuth 2.0 flow
 * 
 * Endpoints:
 *   GET /api/google-ads/authorize   — builds the Google OAuth URL and redirects
 *   GET /api/google-ads/callback    — exchanges code for tokens, stores in DB
 */

import type { Express, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { getAgencyOwnerForMember, getDb } from "./db";
import { googleAdsConnections } from "../drizzle/schema";
import { sdk } from "./_core/sdk";
import { encryptConnectionToken } from "./tokenEncryption";

// ─── Config ────────────────────────────────────────────────────────────────────
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? "";
const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/adwords",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
].join(" ");

function getCallbackUrl(req: Request): string {
  const origin = req.headers["x-forwarded-host"]
    ? `${req.headers["x-forwarded-proto"] ?? "https"}://${req.headers["x-forwarded-host"]}`
    : `${req.protocol}://${req.get("host")}`;
  return `${origin}/api/google-ads/callback`;
}

// ─── Route registration ────────────────────────────────────────────────────────
export function registerGoogleAdsOAuthRoutes(app: Express) {
  // Step 1: Redirect user to Google's OAuth consent screen
  app.get("/api/google-ads/authorize", async (req: Request, res: Response) => {
    if (!GOOGLE_CLIENT_ID) {
      res.status(503).json({ error: "Google Ads OAuth not configured (missing GOOGLE_CLIENT_ID)" });
      return;
    }

    // Authenticate the current user so we can embed their ID in state
    let user: Awaited<ReturnType<typeof sdk.authenticateRequest>> | null = null;
    try {
      user = await sdk.authenticateRequest(req);
    } catch {
      res.redirect(302, "/login?error=auth_required");
      return;
    }

    if (!user || user.agencyMemberRole !== "owner" || (user.agencyId ?? user.id) !== user.id) {
      res.redirect(302, "/dashboard/integrations?google_error=owner_required");
      return;
    }

    const workspaceOwner = await getAgencyOwnerForMember(user.id);
    if (!workspaceOwner) {
      res.redirect(302, "/dashboard/integrations?google_error=workspace_unavailable");
      return;
    }

    const state = Buffer.from(JSON.stringify({ userId: workspaceOwner.id, ts: Date.now() })).toString("base64url");
    const callbackUrl = getCallbackUrl(req);

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: callbackUrl,
      response_type: "code",
      scope: GOOGLE_SCOPES,
      access_type: "offline",
      prompt: "consent",
      state,
    });

    res.redirect(302, `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  });

  // Step 2: Google redirects back here with ?code=...&state=...
  app.get("/api/google-ads/callback", async (req: Request, res: Response) => {
    const code = req.query["code"] as string | undefined;
    const state = req.query["state"] as string | undefined;
    const error = req.query["error"] as string | undefined;

    if (error) {
      console.error("[Google Ads OAuth] User denied or error:", error);
      res.redirect(302, "/dashboard/integrations?google_error=" + encodeURIComponent(error));
      return;
    }

    if (!code || !state) {
      res.redirect(302, "/dashboard/integrations?google_error=missing_params");
      return;
    }

    // Decode state to get userId
    let userId: number;
    try {
      const decoded = JSON.parse(Buffer.from(state, "base64url").toString("utf-8"));
      userId = decoded.userId;
      if (!userId) throw new Error("Missing userId in state");
    } catch {
      res.redirect(302, "/dashboard/integrations?google_error=invalid_state");
      return;
    }

    const callbackUrl = getCallbackUrl(req);

    // Exchange code for tokens
    let accessToken: string;
    let refreshToken: string | undefined;
    let expiresAt: Date;
    try {
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: callbackUrl,
          grant_type: "authorization_code",
        }),
      });
      if (!tokenRes.ok) {
        const body = await tokenRes.text();
        console.error("[Google Ads OAuth] Token exchange failed:", body);
        res.redirect(302, "/dashboard/integrations?google_error=token_exchange_failed");
        return;
      }
      const tokenData = (await tokenRes.json()) as {
        access_token: string;
        refresh_token?: string;
        expires_in: number;
      };
      accessToken = tokenData.access_token;
      refreshToken = tokenData.refresh_token;
      expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);
    } catch (err) {
      console.error("[Google Ads OAuth] Token exchange error:", err);
      res.redirect(302, "/dashboard/integrations?google_error=token_exchange_error");
      return;
    }

    // Fetch Google user info (email)
    let googleEmail = "";
    let googleName = "";
    try {
      const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (userInfoRes.ok) {
        const info = (await userInfoRes.json()) as { email?: string; name?: string };
        googleEmail = info.email ?? "";
        googleName = info.name ?? "";
      }
    } catch {
      // Non-fatal — we still have tokens
    }

    // Fetch Google Ads customer ID using the Ads API
    let googleAccountId = "";
    let googleAccountName = googleName || googleEmail;
    try {
      const adsRes = await fetch(
        "https://googleads.googleapis.com/v17/customers:listAccessibleCustomers",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN ?? "",
          },
        }
      );
      if (adsRes.ok) {
        const adsData = (await adsRes.json()) as { resourceNames?: string[] };
        // resourceNames are like "customers/1234567890"
        if (adsData.resourceNames?.[0]) {
          googleAccountId = adsData.resourceNames[0].replace("customers/", "");
        }
      }
    } catch {
      // Non-fatal — store tokens without account ID
    }

    // Upsert google_ads_connections row
    const db = await getDb();
    if (!db) {
      res.redirect(302, "/dashboard/integrations?google_error=db_unavailable");
      return;
    }

    const [existing] = await db
      .select({ id: googleAdsConnections.id })
      .from(googleAdsConnections)
      .where(eq(googleAdsConnections.userId, userId))
      .limit(1);

    if (existing) {
      await db
        .update(googleAdsConnections)
        .set({
          accessToken: encryptConnectionToken(accessToken),
          refreshToken: refreshToken ? encryptConnectionToken(refreshToken) : null,
          tokenExpiresAt: expiresAt,
          googleEmail,
          googleAccountId,
          googleAccountName,
          isConnected: true,
          connectedAt: new Date(),
        })
        .where(eq(googleAdsConnections.userId, userId));
    } else {
      await db.insert(googleAdsConnections).values({
        userId,
        accessToken: encryptConnectionToken(accessToken),
        refreshToken: refreshToken ? encryptConnectionToken(refreshToken) : null,
        tokenExpiresAt: expiresAt,
        googleEmail,
        googleAccountId,
        googleAccountName,
        isConnected: true,
        connectedAt: new Date(),
      });
    }

    res.redirect(302, "/dashboard/integrations?google_connected=1");
  });
}
