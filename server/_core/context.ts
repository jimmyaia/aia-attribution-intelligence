import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk, type ResolvedSupportView } from "./sdk";

export type SupportViewContext = Omit<ResolvedSupportView, "targetUser">;

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  actor: User | null;
  supportView: SupportViewContext | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  let actor: User | null = null;
  let supportView: SupportViewContext | null = null;

  try {
    actor = await sdk.authenticateRequest(opts.req);
    user = actor;
    const resolved = await sdk.resolveSupportView(opts.req, actor);
    if (resolved) {
      user = resolved.targetUser;
      supportView = {
        sessionId: resolved.sessionId,
        reason: resolved.reason,
        startedAt: resolved.startedAt,
        expiresAt: resolved.expiresAt,
      };
    }
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    actor,
    supportView,
  };
}
