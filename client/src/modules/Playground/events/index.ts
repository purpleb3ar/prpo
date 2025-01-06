export enum PuzzleEvent {
  ClientCreatePiece = "client:createPiece",

  // emitted by the person who moved (picked up and dropped) a puzzle piece
  // and broadcasted to everyone in the room
  ClientMovePiece = "client:movePiece",
  ServerPieceMoved = "server:pieceMoved",

  // emitted by the person who moved a puzzle group
  // and broadcasted to everyone in the room
  ClientMoveGroup = "client:moveGroup",
  ServerGroupMoved = "server:groupMoved",

  // emitted when a new group is created
  // this happens when two pieces
  // are connected together
  ClientCreateGroup = "client:createGroup",
  ServerGroupCreated = "server:groupCreated",

  // emitted when a new puzzle is connected
  // to an existing puzzle group
  // emitted when two puzzle groups are merged
  // into a single group and all puzzles
  // from the one group are moved
  // into one
  ClientJoinPiece = "client:joinPiece",
  ServerPieceJoined = "server:pieceJoined",

  // emitted when a user clicks on a puzzle
  // emitted when a user clicks on a puzzle within a group
  // this locks the group as well
  ClientLockPiece = "client:lockPiece",
  ServerPieceLocked = "server:pieceLocked",

  // emitted when a user drops the puzzle
  // that they were holding and had a lock on
  ClientUnlockPiece = "client:unlockPiece",
  ServerPieceUnlocked = "server:pieceUnlocked",

  // emitted when a user connects to the sync service
  // this event contains the current puzzle state
  // (locations of puzzles, groups, connections, etc, etc)
  ServerPuzzleState = "server:puzzleState",
  ClientRequestActions = "client:request:actions",
  ServerResponseActions = "server:response:actions",

  // emitted when new connections are made
  // connections are defined in a special way
  ClientProgress = "client:progress",

  // emitted by the server when the puzzle is solved
  ServerPuzzleSolved = "server:puzzleSolved",
}
