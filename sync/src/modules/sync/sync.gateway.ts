import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Server as SocketIOServer } from 'socket.io';
import { PuzzleService } from '../puzzle/puzzle.service';
import { wsHasAccessMiddlware } from './middleware/has-access-ws.middleware';
import { wsIsAuthMiddleware } from './middleware/auth-ws.middleware';
import { AuthSocket } from './middleware/types';
import { AuthService } from '../auth/auth.service';
import { PuzzleEvent } from './types';

@WebSocketGateway({
  serveClient: false,
  path: '/socket.io',
  cors: {
    // TODO: change to somehow to use the config
    // key frontend url
    origin: '*',
  },
  credentials: true,
  namespace: '/',
})
export class SyncGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: SocketIOServer;

  constructor(
    @InjectPinoLogger(SyncGateway.name)
    private logger: PinoLogger,
    private puzzleService: PuzzleService,
    private authService: AuthService,
  ) {}

  async afterInit(@ConnectedSocket() socket: SocketIOServer) {
    socket.use(wsIsAuthMiddleware(this.logger, this.authService));
    socket.use(wsHasAccessMiddlware(this.logger, this.puzzleService));

    this.logger.info('Added middleware');
  }

  handleConnection(client: AuthSocket) {
    this.logger.info(
      `User ${client.user.id} connected (${client.id}) with puzzle id ${client.puzzleId}`,
    );

    // first we add client to the requested room
    client.join(client.puzzleId);

    // then we need to send them the progress

    // TODO: get state
    client.emit(PuzzleEvent.ServerPuzzleState, {});
  }

  handleDisconnect(client: AuthSocket) {
    this.logger.info(`User ${client.user.id} disconnected (${client.id})`);
    client.leave(client.puzzleId);

    // const room = this.server.sockets.adapter.rooms.get(client.puzzleId);

    // if (room.size === 0) {
    //   // TODO: create snapshot here
    // }
  }

  @SubscribeMessage(PuzzleEvent.ClientMovePiece)
  async handleMovePiece(
    @MessageBody() data: any,
    @ConnectedSocket() client: AuthSocket,
  ) {
    console.log(data);
    this.logger.info('Received move event');
    const roomId = client.puzzleId;

    console.log(roomId);

    // TODO: record action into action log

    this.server.to(roomId).emit(PuzzleEvent.ServerPieceMoved, data);
  }
}
