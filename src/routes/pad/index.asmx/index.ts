import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import * as XMLBuilder from 'xmlbuilder2';
import { APIError, APIErrorType } from '../../../common/error';
import sharp from 'sharp';
import axios from 'axios';
import dns from 'dns';
import net from 'net';
import ip from 'ip';

export default function padIndex(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void) {
  app.get('/', (req, rep) => {
    const xml = XMLBuilder.create();

    xml.ele('info').ele('endpoint').txt('pad').up().up();

    rep.send(xml.end());
  });

  app.get('/GetConvertImage', async (req, rep) => {
    const { URL: url, width: _width, height: _height } = req.query as Record<string, any>;

    let convertedURL: URL;
    try {
      convertedURL = new URL(url);
    } catch (e) {
      throw new APIError(APIErrorType.INVALID_REQUEST, 'invalid url');
    }

    const width = parseInt(_width, 10);
    const height = parseInt(_height, 10);

    if (isNaN(width) || isNaN(height)) throw new APIError(APIErrorType.INVALID_REQUEST, 'invalid resolution');

    const hostname = convertedURL.hostname.split(':')[0];
    if (net.isIP(hostname)) {
      const isPrivate = ip.isPrivate(hostname);
      if (isPrivate) throw new APIError(APIErrorType.INVALID_REQUEST, 'private ip');
    } else {
      const lookedUp = await dns.promises.lookup(hostname);
      const isPrivate = ip.isPrivate(lookedUp.address);
      if (isPrivate) throw new APIError(APIErrorType.INVALID_REQUEST, 'private ip');
    }

    const res = await axios.get(url, {
      responseType: 'arraybuffer',
    });

    const file = await sharp(res.data).resize(320, 240).toFormat('jpg').toBuffer();

    const xml = XMLBuilder.create();
    rep.send(xml.ele('base64Binary').txt(file.toString('base64')).up().end());
  });

  app.get('/GetConvertImagePrefferd', async (req, rep) => {
    const { URL: url } = req.query as Record<string, any>;

    let convertedURL: URL;
    try {
      convertedURL = new URL(url);
    } catch (e) {
      throw new APIError(APIErrorType.INVALID_REQUEST, 'invalid url');
    }

    const hostname = convertedURL.hostname.split(':')[0];
    if (net.isIP(hostname)) {
      const isPrivate = ip.isPrivate(hostname);
      if (isPrivate) throw new APIError(APIErrorType.INVALID_REQUEST, 'private ip');
    } else {
      const lookedUp = await dns.promises.lookup(hostname);
      const isPrivate = ip.isPrivate(lookedUp.address);
      if (isPrivate) throw new APIError(APIErrorType.INVALID_REQUEST, 'private ip');
    }

    const res = await axios.get(url, {
      responseType: 'arraybuffer',
    });

    const file = await sharp(res.data).resize(320, 240).toFormat('jpg').toBuffer();

    const xml = XMLBuilder.create();
    rep.send(xml.ele('base64Binary').txt(file.toString('base64')).up().end());
  });

  done();
}
