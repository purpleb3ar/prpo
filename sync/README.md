# Sync Service

This is the most interesting service of all.

It is in charge of the following:

- keeping track of progress for each puzzle
- informing users in real-time of progress and all the actions made on the playground
- managing an action log, snapshots and a numeric progress variable (number of connections made)
- optimisic locking to prevent multiple users from acting upon the same jigsaw piece

## Keeping track of progress

For each puzzle we keep an action log. This is a redis stream of all events ever recorded on
the puzzle (events which contribute meaningfully to a change in state, locking events are excluded here)

Every 100 events a snapshot is generated, snapshot is generated using the following algorithm:

- ensure that event counter is >= 100
- take all actions from last snapshot, if any, to now
- load last snapshot
- apply all actions to last snapshot to derive a new snapshot
- save this derived snapshot
- reset event counter to 0

If a new user connects to a puzzle that is already being solved, there is a good chance
that some actions have not been applied yet. This is true if the event counter is larger than zero
if that is so, we run the above algorithm prematurely to get the latest puzzle state.
For each puzzle we also track a variable called "connectionsMade". This is a numeric
value which tracks how many puzzles have been connected to their respective neighbours.
This number is increased when a progress event is received.
Increasing this number is done using redis incr and incrby methods which make sure
that the increases are atomic to prevent any kind of race conditions.

Any events which are received by the sync service are broadcasted to all members
of the group in which the event was received.

All progress and snapshots are delivered by the sync service not the puzzle service
via events.

## Locking

To prevent any two users from interacting with the same puzzle we introduce the concept of locking.
When the user clicks on a puzzle, starting the drag action, an event is emitted called
request-lock.

We optimistically assume that the locking will be successful and allow the user to move the puzzle before reciving the lock-granted event.
The backend checks if nobody has the puzzle locked and emits a lock-granted event if that is the case.

There is an indicator of when a puzzle is locked. (border and a user name for example).
Clicking a locked puzzle would have no effect.

Any lock events are broadcasted to all players in on the playground.

Now lets assume that two players try to access the same puzzle at the same time.
Both will send the request-lock event and for both we will assume that locking will be successful.
And both will be allowed to move the puzzle.
The server will receive one event before the other and lock the puzzle for the first user.
When the other event will be processed it will see that this puzzle is already locked
and emit the lock-denied event.

The user will drop the puzzle and an indicator will be shown of the other user moving it.

We could also lock pessimistically instead. In this case, we would wait for the lock
before we would be allowed to move it.
