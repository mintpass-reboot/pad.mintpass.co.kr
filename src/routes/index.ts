import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { isDevelopment, packageJson } from '..';

function rootPlugin(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void): void {
  app.get('/', (req, rep) => {
    rep.send({
      hello: 'world',
      about: {
        name: packageJson.name,
        description: packageJson.description,
        version: isDevelopment ? packageJson.version : undefined,
        repository: isDevelopment ? packageJson.repository : undefined,
      },
    });
  });

  done();
}

export default rootPlugin;

// Did you know?
// This Project is started at 2021-02-09, which is Maintainer's 20th Birthday.
