import { type CreateNextContextOptions } from "@trpc/server/adapters/next";
import { getIronSession, type IronSessionOptions } from "iron-session";
import { sessionOptions } from "~/lib/withSession";
import wretch from "wretch";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { get } from "lodash";

const createNextApiContext = async (
  baseUrl: string,
  opts: CreateNextContextOptions,
  sessionOptions: IronSessionOptions
) => {
  const session = await getIronSession(opts.req, opts.res, sessionOptions);
  let api = wretch(baseUrl, { mode: "cors" });
  if (session.token) {
    api = api.headers({
      authorization: `${session.token}`,
    });
  }
  return {
    session,
    api,
  };
};

export const createTRPCContext = async (opts: CreateNextContextOptions) => {
  return createNextApiContext(
    "http://localhost:3003/api/v1",
    opts,
    sessionOptions
  );
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;

export const publicProcedure = t.procedure;

const enforceUserIsAuthed = t.middleware(async ({ ctx, next }) => {
  const session = ctx.session;

  // 如果在调度 session 的时候用户信息不存在，尝试从 http api 中重新获取
  if (!get(session, "user")) {
    try {
      session.user = await ctx.api.get("/user/info").res();
      await session.save();
    } catch (e) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
  }

  // 如果用户不存在，抛出未授权错误
  if (!session.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return next({
    ctx: {
      session: session,
    },
  });
});

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);

declare module "iron-session" {
  interface IronSessionData {
    user?: Omit<UserInfoState, "token">;
    token?: string;
  }
}
