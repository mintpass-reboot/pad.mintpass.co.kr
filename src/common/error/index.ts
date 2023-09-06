import { FastifyReply } from 'fastify';

export interface ErrorResponse {
  type: APIErrorType;
  description?: string;
  details?: any;
  debug?: any;
  stack?: string;

  code?: string;
  url?: string;
}

export enum APIErrorType {
  TOKEN_NOT_FOUND = 'token_not_found',
  INVALID_TOKEN = 'invalid_token',
  INVALID_REQUEST = 'invalid_request',
  INSUFFICIENT_PERMISSION = 'insufficient_permission',
  USER_NOT_FOUND = 'user_not_found',
  INTERNAL_SERVER_ERROR = 'internal_server_error',
  HAVE_A_NICE_PAY = 'Have_a_Nice_Pay___LG_Pay',
  UNSUPPORTED = 'unsupported',
  UNAUTHORIZED = 'unauthorized',
}

export class APIError extends Error {
  public _isAPI: true = true;

  public type: APIErrorType;
  public description?: string;

  constructor(type: APIErrorType, description?: string) {
    const internalDesc = description ? description : type;

    super(internalDesc);
    this.type = type;
    this.name = 'API Error';
    this.description = description;
    this.message = internalDesc;
  }

  public toString() {
    return this.description;
  }

  public static load(error: APIError) {
    const apiError = new APIError(error.type, error.description);
    return apiError;
  }

  public loadError(error: Error) {
    this.name = error.name;
    this.message = error.message;
    this.description = error.message;
    this.stack = error.stack;
  }

  public serialize(): ErrorResponse {
    let base: ErrorResponse = {
      type: this.type,
      description: this.description,
    };

    if (process.env.NODE_ENV && process.env.NODE_ENV.startsWith('dev')) {
      base = {
        ...base,
        stack: this.stack,
      };
    }

    return base;
  }

  public getStatusCode() {
    const type = this.type;
    return getStatusCode(type);
  }

  public sendFastify(rep: FastifyReply) {
    rep.status(this.getStatusCode()).send(this.serialize());
  }
}

export function getStatusCode(error: APIErrorType): number {
  switch (error) {
    case APIErrorType.TOKEN_NOT_FOUND:
    case APIErrorType.INVALID_REQUEST:
      return 400;
    case APIErrorType.UNAUTHORIZED:
      return 401;
    case APIErrorType.INVALID_TOKEN:
    case APIErrorType.INSUFFICIENT_PERMISSION:
    case APIErrorType.USER_NOT_FOUND:
      return 403;
    case APIErrorType.HAVE_A_NICE_PAY:
      return 418;
    case APIErrorType.INTERNAL_SERVER_ERROR:
      return 500;
    case APIErrorType.UNSUPPORTED:
      return 501;
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  ((n: never) => {})(error);
}
