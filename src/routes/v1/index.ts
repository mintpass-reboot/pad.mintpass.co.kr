import { FastifyRequest, FastifyInstance, FastifyPluginOptions } from 'fastify';
import { MeilingV1OAuthOpenIDData } from '../../common/meiling/interface';

export interface FastifyRequestWithUser extends FastifyRequest {
  user: MeilingV1OAuthOpenIDData;
  isAdmin: boolean;
}

const v1Handler = (app: FastifyInstance, opts: FastifyPluginOptions, done: () => void): void => {
  app.get('/', (req, rep) => {
    rep.send({
      version: 1,
    });
  });

  done();
};

export default v1Handler;
