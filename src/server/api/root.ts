import { createTRPCRouter } from "~/server/api/trpc";
import { exampleRouter } from "~/server/api/routers/example";
import { _SystemRouter } from "./routers/_system";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  example: exampleRouter,
  _system: _SystemRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;