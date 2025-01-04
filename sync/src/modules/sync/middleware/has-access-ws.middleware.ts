import { PuzzleService } from 'src/modules/puzzle/puzzle.service';
import { AuthSocket, SocketMiddleware } from './types';
import { WsException } from '@nestjs/websockets';
import { PinoLogger } from 'nestjs-pino';

export const wsHasAccessMiddlware = (
  logger: PinoLogger,
  puzzleService: PuzzleService,
): SocketMiddleware => {
  return async (socket: AuthSocket, next) => {
    console.log(socket.handshake.headers);
    try {
      logger.info('Checking whether user can access this room');

      const puzzleId = Array.isArray(socket.handshake.headers.puzzleid)
        ? socket.handshake.headers.puzzleid[0]
        : socket.handshake.headers.puzzleid;

      if (!puzzleId) {
        logger.error('Missing puzzleId');
        return next(new WsException('Missing puzzleId'));
      }

      const hasAccess = await puzzleService.wsCheckAccess(
        socket.user,
        puzzleId,
      );

      if (hasAccess) {
        logger.info('Puzzle id is valid and user has permission to access it');
        socket.puzzleId = puzzleId;
        return next();
      }
    } catch (error) {
      logger.error('Missing puzzleId', error);
      return next(error);
    }
  };
};
