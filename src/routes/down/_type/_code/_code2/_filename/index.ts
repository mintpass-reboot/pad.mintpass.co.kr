import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import * as XMLBuilder from 'xmlbuilder2';
import { APIError, APIErrorType } from '../../../../../../common/error';
import { prisma } from '../../../../../..';
import mime from 'mime';

export default function pad(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void) {
  app.get('/', async (req, rep) => {
    const { type, filename } = req.params as Record<string, string>;

    if (!type || !filename) throw new APIError(APIErrorType.NOT_FOUND);
    const file = await prisma.file.findFirst({
      where: {
        target: type,
        filename,
      },
    });
    if (!file) throw new APIError(APIErrorType.NOT_FOUND);

    const ext = filename.split('.')[filename.split('.').length - 1];
    const mimeType = mime.getType(ext);

    rep.header('Content-Type', mimeType).send(file.data);
  });

  done();
}
