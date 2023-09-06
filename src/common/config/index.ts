export interface Config {
  meiling: {
    hostname: string;
  };
  fastify: {
    listen: {
      port: number;
      bind?: string;
    };
    unixSocket?: {
      chown?: {
        uid?: number;
        gid?: number;
      };
      chmod?: number;
    };
    proxy?: {
      allowedHosts?: string[];
    };
  };
  permissions: {
    required: string[];
  };
  admin: {
    token: string[];
  };
  sentry?: {
    serverName?: string;
    dsn: string;
  };
}
