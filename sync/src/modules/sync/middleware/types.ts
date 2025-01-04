import { Socket } from 'socket.io';
import { TokenPayload } from '../../auth/types';

export interface AuthSocket extends Socket {
  user: TokenPayload;
  puzzleId: string;
}

export type SocketMiddleware = (
  socket: Socket,
  next: (err?: Error) => void,
) => void;

export { TokenPayload } from '../../auth/types';
