import { FastifyRequest } from 'fastify';

export function getTokenFromRequest(req: FastifyRequest):
  | {
      method: string;
      token: string;
    }
  | undefined {
  if (req.headers.authorization) {
    const method = req.headers.authorization.split(' ')[0];
    const token = req.headers.authorization.split(' ').splice(1).join(' ');
    return {
      method,
      token,
    };
  }
  return;
}
