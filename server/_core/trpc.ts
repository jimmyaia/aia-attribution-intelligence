import { NOT_ADMIN_ERR_MSG, PAYMENT_REQUIRED_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { getBillingAccessForUser } from "../subscriptionAccess";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const paymentRecoveryProcedure = protectedProcedure;

const rejectSupportViewWrites = t.middleware(async opts => {
  if (opts.ctx.supportView) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Client View is read-only. Exit Client View to make changes." });
  }
  return opts.next();
});

export const paymentRecoveryWriteProcedure = paymentRecoveryProcedure.use(rejectSupportViewWrites);

export const subscriptionAccessProcedure = paymentRecoveryProcedure.use(
  t.middleware(async opts => {
    if (opts.ctx.supportView && opts.ctx.actor?.role === "admin") {
      return opts.next();
    }
    const user = opts.ctx.user;
    if (!user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
    }
    const access = await getBillingAccessForUser(user);
    if (!access.allowed) {
      throw new TRPCError({ code: "FORBIDDEN", message: PAYMENT_REQUIRED_ERR_MSG });
    }
    return opts.next();
  }),
);

export const subscriptionWriteProcedure = subscriptionAccessProcedure.use(rejectSupportViewWrites);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);
