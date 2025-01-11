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
import { ConfigService } from '@nestjs/config';
import { SnapshotService } from '../snapshot/snapshot.service';
import { PuzzleMove } from '../snapshot/actions/puzzle-move.action';
import { PuzzleCreate } from '../snapshot/actions/puzzle-create.action';
import { GroupCreate } from '../snapshot/actions/group-create.action';
import { PuzzleJoinGroup } from '../snapshot/actions/puzzle-join-group.action';
import { GroupMove } from '../snapshot/actions/group-move.action';

interface RoomMetadata {
  totalPieces: number;
}

// Configuring cors though DI is not supported sadly
const frontendURL =
  process.env.NODE_ENV === 'production'
    ? 'https://prpo.purplebear.io'
    : 'http://localhost:5173';

@WebSocketGateway({
  serveClient: false,
  path: '/socket.io',
  cors: {
    origin: frontendURL,
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
    private configService: ConfigService,
    private snapshotService: SnapshotService,
  ) {}

  async afterInit(@ConnectedSocket() socket: SocketIOServer) {
    const cookieName = this.configService.get('app.cookie.name');

    socket.use(wsIsAuthMiddleware(this.logger, this.authService, cookieName));
    socket.use(wsHasAccessMiddlware(this.logger, this.puzzleService));

    this.logger.info('Added middleware');
  }

  async handleConnection(client: AuthSocket) {
    this.logger.info(
      `User ${client.user.id} connected (${client.id}) with puzzle id ${client.puzzleId}`,
    );

    const roomId = client.puzzleId;

    client.join(client.puzzleId);

    const state = await this.snapshotService.getLatestState(roomId);
    const connectionsMade =
      await this.snapshotService.getConnectionsMade(roomId);

    // TODO: handle this better
    client.emit(PuzzleEvent.ServerPuzzleState, {
      solved: connectionsMade === client.totalPieces - 1,
      connectionsMade,
      state,
    });
  }

  handleDisconnect(client: AuthSocket) {
    this.logger.info(`User ${client.user.id} disconnected (${client.id})`);
    client.leave(client.puzzleId);
  }

  @SubscribeMessage(PuzzleEvent.ClientMoveGroup)
  async handleGroupMove(
    @MessageBody() data: any,
    @ConnectedSocket() client: AuthSocket,
  ) {
    this.logger.info(`Received '${PuzzleEvent.ClientMoveGroup}' event`);
    const roomId = client.puzzleId;

    this.snapshotService.recordAction(roomId, new GroupMove(data));
    this.server.to(roomId).emit(PuzzleEvent.ServerGroupMoved, data);
  }

  @SubscribeMessage(PuzzleEvent.ClientMovePiece)
  async handleMovePiece(
    @MessageBody() data: any,
    @ConnectedSocket() client: AuthSocket,
  ) {
    this.logger.info('Received move event');
    const roomId = client.puzzleId;

    await this.snapshotService.recordAction(roomId, new PuzzleMove(data));

    this.server.to(roomId).emit(PuzzleEvent.ServerPieceMoved, data);
  }

  @SubscribeMessage(PuzzleEvent.ClientCreatePiece)
  async handleCreatePiece(
    @MessageBody() data: any,
    @ConnectedSocket() client: AuthSocket,
  ) {
    this.logger.info('Received create event');
    const roomId = client.puzzleId;
    await this.snapshotService.recordAction(roomId, new PuzzleCreate(data));
  }

  @SubscribeMessage(PuzzleEvent.ClientProgress)
  async handleProgress(
    @MessageBody() data: any,
    @ConnectedSocket() client: AuthSocket,
  ) {
    this.logger.info(`Received '${PuzzleEvent.ClientProgress}' event`);
    const roomId = client.puzzleId;
    const connectionsMade = await this.snapshotService.incrementConnectionsMade(
      roomId,
      data.progress,
    );

    if (connectionsMade === client.totalPieces - 1) {
      this.server.to(roomId).emit(PuzzleEvent.ServerPuzzleSolved);
    }
  }

  @SubscribeMessage(PuzzleEvent.ClientCreateGroup)
  async handleCreateGroup(
    @MessageBody() data: any, // not interested
    @ConnectedSocket() client: AuthSocket,
  ) {
    this.logger.info(`Received '${PuzzleEvent.ClientCreateGroup}' event`);
    const roomId = client.puzzleId;

    await this.snapshotService.recordAction(roomId, new GroupCreate(data));
    this.server.to(roomId).emit(PuzzleEvent.ServerGroupCreated, data);
  }

  @SubscribeMessage(PuzzleEvent.ClientJoinPiece)
  async handleJoinPiece(
    @MessageBody() data: any,
    @ConnectedSocket() client: AuthSocket,
  ) {
    this.logger.info(`Received '${PuzzleEvent.ClientJoinPiece}' event`);
    const roomId = client.puzzleId;

    await this.snapshotService.recordAction(roomId, new PuzzleJoinGroup(data));
    this.server.to(roomId).emit(PuzzleEvent.ServerPieceJoined, data);
  }

  @SubscribeMessage(PuzzleEvent.ClientRequestActions)
  async handleRequestActions(@ConnectedSocket() client: AuthSocket) {
    const roomId = client.puzzleId;
    const actionStream = await this.snapshotService.streamAllActions(roomId);
    client.emit(PuzzleEvent.ServerResponseActions, actionStream);
  }
}
