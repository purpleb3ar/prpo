# Puzzle Service

The puzzle service is responsible for managing
the puzzle resource.

## Puzzle resource

This service is in charge of managing the puzzle resource. This means
that is represents the single source of truth for this resrouce. All
modifications must be made through this service.

On creation or modification of a resource this service publishes a replication event
to the event broker so other interested services can update/create their
own replica of the resource.

## Puzzle visibility

Each puzzle has a property called `visibility`. It can
be one of these three values: `invite-only`, `private`, `public`.
The default value is `private`

### Public puzzles

This property can be updated but not freely. If the puzzle was created with the `public` visibility or at any point updated to have `public` visibility, any subsequent update or delete operation on the puzzle becomes invalid.

This means that only puzzles which are not `public` can be updated or deleted.
This approach was chosen because creating a `public` puzzle creates an implict contract with the collaborators that any work they do on it
is also public. If the creator had the ability to remove public puzzles
they would not be truly public.

### Invite-only puzzles

Visibility of the `invite-only` is probably more what the users will
be looking for. When visibility is changed to `invite-only` an invite link is created which can be sent to other users to invote them to collaborate.

The puzzle creator has the ability to remove collaborators normally,
and update or delete the puzzle normally.

The collaborator can also exceptionally delete themselves from being a collaborator.

### Private puzzles

Private. Only the creator can access and manage them. Their visibility can be changed to `invite-only` or `public` normally. But like I described above after it becomes `public` no more changes are allowed.

## Creation process

For the puzzle to be created user has to supply a source image
which will be used to generate the jigsaw pieces.

The image is uploaded to object storage and an event is emitted,
which signifies that a new puzzle was added to the system.
All further work on the puzzle is done by the `processing` service.

When the `processing` service is done it emits an event.
The service then marks the puzzle as ready and the puzzle is able to be solved finally.

## User replication

This service listens for the user replication events.
So all the events that the `auth` service generates (new user and user updated).

The service keeps its own replica of the user resource in order to know
the details about puzzle creators.

## Static assets

This service is in charge of service puzzle static assets.
The first asset is the thumbnail which is the source image that the puzzle pieces were generated from.
The second asset is the spritesheet of all puzzle pieces
The third asset is a `.json` file containing all information and
metadata about the puzzle to allow it to be solvable.

These assets (with the exception of thumbnail) can only be served
if the user is authenticated. In addition, no resource can be served
before the puzzle processing is done.
