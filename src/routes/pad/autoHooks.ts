import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify';

export default async function (app: FastifyInstance, _opts: FastifyPluginOptions): Promise<void> {
  app.addHook('onRequest', async (_request: FastifyRequest, reply: FastifyReply) => {
    (reply as any).isXML = true;
    reply.headers({ 'content-type': 'application/xml' });
  });
}
