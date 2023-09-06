import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { isDevelopment, packageJson, prisma } from '..';
import * as XMLBuilder from 'xmlbuilder2';

function rootPlugin(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void): void {
  app.get('/', (req, rep) => {
    const xml = XMLBuilder.create();

    xml
      .ele('info')
      .ele('hello')
      .txt('world')
      .up()
      .ele('name')
      .txt('pad.mintpass.co.kr')
      .up()
      .ele('description')
      .txt('mintpass reboot project')
      .up()
      .up();

    rep.header('Content-Type', 'application/xml').send(xml.end());
  });

  app.post('/c_pad_upload.asp', async (req, rep) => {
    const { target } = (req.query as Record<string, string>) || { target: 'lol' };
    for await (const file of req.files()) {
      const data = await file.toBuffer();
      const filename = await file.filename;

      await prisma.file.create({
        data: {
          target,
          filename,
          data,
        },
      });
    }

    rep.send('OK');
  });

  done();
}

export default rootPlugin;

// Did you know?
// This Project is started at 2021-02-09, which is Maintainer's 20th Birthday.
