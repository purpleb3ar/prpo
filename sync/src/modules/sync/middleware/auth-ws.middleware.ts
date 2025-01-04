import { WsException } from '@nestjs/websockets';
import { AuthSocket, SocketMiddleware, TokenPayload } from './types';
import { PinoLogger } from 'nestjs-pino';
import { AuthService } from 'src/modules/auth/auth.service';

export const wsIsAuthMiddleware = (
  logger: PinoLogger,
  authService: AuthService,
): SocketMiddleware => {
  return async (socket: AuthSocket, next) => {
    try {
      const token = Array.isArray(socket.handshake.auth.token)
        ? socket.handshake.auth.token[0]
        : socket.handshake.auth.token;

      if (!token) {
        logger.error('User tried to connect without token');
        return next(new WsException('Missing token'));
      }

      const tokenPayload = await authService.verifyToken<TokenPayload>(token);

      socket.user = tokenPayload;

      logger.info('Token is valid, next middleware');

      return next();
    } catch (error) {
      console.log(error);
      logger.error('User connect with token, but was invalid');
      next(new WsException('Invalid token'));
    }
  };
};
