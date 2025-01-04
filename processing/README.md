# Processing Service

The processing service is in charge of two things:

- generating puzzles from images
- creating final image thumbnails

## Generating puzzles from images

The service listens for the puzzle created event which includes all the
necessary data to process it into a solvable jigsaw puzzle.
This event is not a replication event. It only notifies the puzzle service that some processing is required.

The event includes include the following data:

- since each puzzle has a bucket on s3 it will include the bucket name
- it will include the SSE channel name which can be used by users to track realtime progress
- it will include all other data needed to generate the puzzle (such as size of puzzle in pixels, number of rows and columns, etc)

Before the server starts the processing step, it emits an event
informing the puzzle service that the request was accepted
and that the processing will begin shortly.

The service promptly reads the image from object storage. Creates an
instance of the `PuzzleEngine` which generates a spritesheet of all puzzles and a `.json` specification file which describes all the jigsaw pieces and includes metadata to make the puzzle solvable

The service will expose an SSE endpoint that users can connect to to receive a notification when the processing is finished. The processing method will publish events to a `redis` channel. All events sent to the channel will be proxied to users connected to the SSE endpoint

The redis is used because when there are multiple instances of the `processing` service available, we have no way to guarantee that the user
will connect to the instance that is generating the puzzle.
This way all events related to processing are pushed into a central location (redis)
and each instance reads data from it and sends it to subscribed users.

When processing is done the service emits an event to the event broker
to inform the puzzle service that the puzzle is ready and can be solved.
