import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import * as XMLBuilder from 'xmlbuilder2';

export default function pad(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void) {
  app.get('/', (req, rep) => {
    const xml = XMLBuilder.create();

    xml.ele('info').ele('endpoint').txt('pad').up().up();

    rep.send(xml.end());
  });

  done();
}
