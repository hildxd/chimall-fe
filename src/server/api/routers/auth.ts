import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import hashPassword from "~/utils/password";
import { omit } from "lodash";

export const authRouter = createTRPCRouter({
  login: publicProcedure
    .input(
      z.object({
        phone: z.string(),
        password: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      input.password = hashPassword(input.password);
      const user = await ctx.api
        .post(
          {
            ...input,
          },
          "/login"
        )
        .res<UserInfoState>();
      ctx.session.user = omit(user, "token");
      ctx.session.token = user.token;
      await ctx.session.save();
      return user;
    }),
  register: publicProcedure
    .input(
      z.object({
        phone: z.string(),
        password: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      input.password = hashPassword(input.password);
      const user = await ctx.api
        .post(
          {
            ...input,
          },
          "/login"
        )
        .res<UserInfoState>();
      ctx.session.user = omit(user, "token");
      ctx.session.token = user.token;
      await ctx.session.save();
      return user;
    }),
});
