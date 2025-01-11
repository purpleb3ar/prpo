import { registerAs } from '@nestjs/config';

export default registerAs('app', (): Record<string, unknown> => {
  const frontendURL =
    process.env.NODE_ENV === 'production'
      ? 'https://prpo.purplebear.io'
      : 'http://localhost:5173';

  return {
    appName: process.env.APP_NAME,
    env: process.env.NODE_ENV || 'development',
    frontendURL,

    jwt: {
      secret: process.env.JWT_SECRET,
      algorithm: 'HS512',
      expiresIn: '14d',
      issuer: 'puzzle-app-auth-service',
    },

    cookie: {
      name: 'prpo_app_access_token',
    },

    globalPrefix: '/api',
    http: {
      enable: process.env.HTTP_ENABLE === 'true',
      host: '0.0.0.0',
      port: process.env.PORT,
    },
  };
});
