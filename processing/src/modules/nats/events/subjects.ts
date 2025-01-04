export enum Subjects {
  PuzzleCreated = 'puzzle:created', // interest: processing service collaboration service

  PuzzleProcessingStarted = 'puzzle:processing:started',
  PuzzleProcessingDone = 'puzzle:processing:done',
}

// Both processing and collab service listen for PuzzleCreated event.
// The collab service stores the puzzle inside db.
// The processing services starts processing the request.
// When it is done, it emits a ProcessingRequestDone event
// which only the Puzzle service listens to.
// This event updates the puzzle state to "ready"
// this fact is relayed to the collab service via "PuzzleUpdated"
// event.

// We could make things simpler by not having any way of notifying specifics
// We have two states, started (or pending) and done
// We show a loader while the generation is in progress
// but we will need to know when to hide the loader

// The problem is, that we cannot know that an event will be received by the same instance of puzzle service.
// I think we need a notifications service which would be in charge of these things.

// There would be only one instance
// The user would connect to it
// and all services would send events to it instead

// The collab service has a similar problem
// We technically cannot scale it at all
// because if we do, we have no guarantee that the participants
// of the same room, will connect to the same instance.
// we would need to have some kind of system where rooms tied to specific services.
// But we will not worry about it, we can still scale puzzle service, processing service and auth service
