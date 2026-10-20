import { ApiRouter, Env } from './router.js';

const router = new ApiRouter();

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return router.handle(request, env);
  },
};

export { ApiRouter };
