import { registerAs } from '@nestjs/config';

export default registerAs('app', (): Record<string, unknown> => {
  const frontendURL =
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:5173'
      : 'https://prpo.purplebear.io';

  const cookieDomain =
    process.env.NODE_ENV === 'development' ? undefined : 'prpo.purplebear.io';

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
      libraryOpts: {
        secure: true,
        domain: cookieDomain,
        sameSite: 'none',
        httpOnly: true,
        expires: new Date(
          new Date().getTime() + 100 * 365 * 24 * 60 * 60 * 1000,
        ),
      },
    },

    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackUrl: process.env.GOOGLE_CALLBACK_URL,
    },

    globalPrefix: '/api',
    http: {
      enable: process.env.HTTP_ENABLE === 'true',
      host: '0.0.0.0',
      port: process.env.PORT,
    },
  };
});
