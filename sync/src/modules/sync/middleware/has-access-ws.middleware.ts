import { PuzzleService } from 'src/modules/puzzle/puzzle.service';
import { AuthSocket, SocketMiddleware } from './types';
import { WsException } from '@nestjs/websockets';
import { PinoLogger } from 'nestjs-pino';

export const wsHasAccessMiddlware = (
  logger: PinoLogger,
  puzzleService: PuzzleService,
): SocketMiddleware => {
  return async (socket: AuthSocket, next) => {
    logger.info('Checking whether user can access this room');

    try {
      const query = socket.handshake.query;
      const puzzleId = Array.isArray(query.room) ? query.room[0] : query.room;

      if (!puzzleId) {
        logger.error('Missing puzzleId');
        return next(new WsException('Missing puzzleId'));
      }

      const { hasAccess, puzzle } = await puzzleService.wsCheckAccess(
        socket.user,
        puzzleId,
      );

      if (hasAccess) {
        logger.info('Puzzle id is valid and user has permission to access it');
        socket.puzzleId = puzzle.id;
        socket.totalPieces = puzzle.rows * puzzle.columns;
        return next();
      }
    } catch (error) {
      logger.error('authentication error', error);
      return next(error);
    }
  };
};
