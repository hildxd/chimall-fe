import { IronSessionData } from "iron-session";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";

export const _SystemRouter = createTRPCRouter({
    session: publicProcedure.query(async ({ ctx }) => {
        const session = Object.keys(ctx.session).reduce((acc, key) => {
            if (!key.startsWith('_')) {
                // @ts-ignore
                acc[key] = ctx.session[key]
            }
            return acc
        }, {})
        return session as IronSessionData
    }),
    logout: protectedProcedure.mutation(async ({ ctx }) => {
        ctx.session.destroy()
        return true
    })
});
