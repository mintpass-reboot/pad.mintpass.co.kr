export interface Config {
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
  admin: {
    token: string[];
  };
  sentry?: {
    serverName?: string;
    dsn: string;
  };
}
