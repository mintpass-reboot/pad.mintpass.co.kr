import fs from 'fs';
import fastify, { FastifyReply, FastifyRequest } from 'fastify';
import { Config } from './common/config';
import { PrismaClient } from '@prisma/client';
import * as Banner from './common/banner';
import fastifyCors from '@fastify/cors';
import { sentryErrorHandler } from './common/sentry';
import { APIError, APIErrorType } from './common/error';
import path from 'path';
import fastifyAutoload from '@fastify/autoload';

export const packageJson = JSON.parse(fs.readFileSync('package.json', { encoding: 'utf-8' }));

if (!fs.existsSync('config.json')) {
  if (fs.existsSync('config.example.json')) {
    fs.copyFileSync('config.example.json', 'config.json');
  }
}
export const config = JSON.parse(fs.readFileSync('config.json', { encoding: 'utf-8' })) as Config;

const env = process.env.NODE_ENV || 'development';

export const isDevelopment = env === 'development';
export const prisma = new PrismaClient();

Banner.showBanner();
Banner.devModeCheck();

const app = fastify({
  logger: true,
  trustProxy: config.fastify.proxy
    ? config.fastify.proxy.allowedHosts
      ? config.fastify.proxy.allowedHosts
      : true
    : false,
});

app.register(fastifyCors, {
  origin: true,
});

console.log('[Startup] Add Authentication Hook for Fastify...');
app.setErrorHandler(async (_err, _req, _rep) => {
  const err = _err as Error;
  const req = _req as unknown as FastifyRequest;
  const rep = _rep as unknown as FastifyReply;

  if (isDevelopment) {
    console.error(_err);
  }

  if ((err as APIError)._isAPI) {
    const apiErr = err as APIError;

    if (apiErr.type === APIErrorType.INTERNAL_SERVER_ERROR) sentryErrorHandler(err, req, rep);

    return apiErr.sendFastify(rep);
  } else {
    const type: APIErrorType = _err.validation ? APIErrorType.INVALID_REQUEST : APIErrorType.INTERNAL_SERVER_ERROR;
    const error = new APIError(type);
    error.loadError(_err);

    if (type === APIErrorType.INTERNAL_SERVER_ERROR) sentryErrorHandler(err, req, rep);

    return error.sendFastify(rep);
  }
});

console.log('[Startup] Setting up autoload for Fastify...');
app.register(fastifyAutoload, {
  dir: path.join(__dirname, 'routes'),
  routeParams: true,
  autoHooks: true,
  cascadeHooks: true,
});

console.log('[Startup] Starting up fastify...');
if (typeof config.fastify.listen === 'string') {
  if (fs.existsSync(config.fastify.listen)) {
    fs.unlinkSync(config.fastify.listen);
  }
}

(async (): Promise<void> => {
  await app.listen(config.fastify.listen);

  if (typeof config.fastify.listen === 'string') {
    if (config.fastify.unixSocket?.chown?.uid !== undefined && config.fastify.unixSocket?.chown?.gid !== undefined) {
      console.log('[Startup] Setting up Owner Permissions of Socket...');
      fs.chownSync(
        config.fastify.listen,
        config.fastify.unixSocket?.chown?.uid as number,
        config.fastify.unixSocket?.chown?.gid as number,
      );
    }
    if (config.fastify.unixSocket?.chmod) {
      console.log('[Startup] Setting up Access Permissions of Socket...');
      fs.chmodSync(config.fastify.listen, config.fastify.unixSocket.chmod);
    }
  }
})();
