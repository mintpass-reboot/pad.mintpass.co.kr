import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { FastifyRequestWithUser } from '.';
import { APIError, APIErrorType } from '../../common/error';
import { getTokenFromRequest } from '../../common/token';
import * as Meiling from '../../common/meiling';
import * as User from '../../common/user';
import { config, prisma } from '../..';

export default async function (app: FastifyInstance, opts: FastifyPluginOptions): Promise<void> {
  app.decorateRequest('user', null);
  app.decorateRequest('isAdmin', false);

  app.addHook('onRequest', async (req, rep) => {
    const token = getTokenFromRequest(req);
    if (!token) {
      throw new APIError(APIErrorType.TOKEN_NOT_FOUND, 'token not found');
    }

    if (config.admin.token.includes(token.token)) {
      (req as FastifyRequestWithUser).isAdmin = true;
    } else {
      if (!config.meiling) throw new APIError(APIErrorType.UNSUPPORTED);

      const data = await Meiling.getToken(token.token);
      if (!data) {
        throw new APIError(APIErrorType.INVALID_TOKEN, 'token is invalid');
      }

      const permCheck = await Meiling.permCheck(token.token, config.permissions.required);
      if (!permCheck) {
        throw new APIError(
          APIErrorType.INSUFFICIENT_PERMISSION,
          'token does not meet with minimum sufficient permission',
        );
      }

      const user = await Meiling.getUser(token.token);
      if (!user) {
        throw new APIError(APIErrorType.UNAUTHORIZED);
      }

      (req as FastifyRequestWithUser).user = user;
      (req as FastifyRequestWithUser).isAdmin = await User.checkIsAdmin(user);

      await User.createUserIfNotExist(user);
      await User.updateLastAuthorized(user);
    }
  });
}
