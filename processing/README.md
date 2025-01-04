# Processing Service

The processing service is in charge of two things:

- generating puzzles from images
- creating final image thumbnails

## Generating puzzles from images

The received event `puzzle:created` will include all the data necessary to create a puzzle.
This event is not a replication event. It only notifies the puzzle service that some processing is required.

The event will include the following data:

- since each puzzle has a bucket on s3 it will include the bucket name
- it will include the SSE channel name which can be used by users to track realtime progress
- it will include all other data needed to generate the puzzle (such as size of puzzle in pixels, number of rows and columns, etc)

The service will prompty read the image from s3, process it and create a new image which
stores all the puzzle pieces, a puzzle.json file which describes all the pieces and
replace the original image with a smaller thumbnail variant.

The service will create the SSE channel and publish events to it related to progress of generation.
This way the user can track the progress.

There is only one caveat here.
We need a way to notify the `puzzle` service that generation way complete.
This breaks our golden rule that only one service is considered to be the resource owner
and all updates happen though it.

There are 2 methods we can use for getting around this:

- We can track a status for each puzzle. While the status is `GENERATING` all updates and changes
  to this specific puzzle are forbidden and will be rejected by the puzzle service.
  During this time, we will allow the `processing` service to send updates to the puzzle service
  informing it when the generation is successful. This way no issues can happen

- Another more reliable method is that for each puzzle we keep records of `processing_requests` (this would be another resource owned by the processing service)
- When the puzzle is created a record would be created for the `puzzle`. The `processing` service would receive it
  and create a `processing_request`. Immediately upon creation an event would be triggered which would inform the `puzzle` service
  that the processing request was created.
  This way updates would be made to `processing_request` and all ownership rules and modification rules would be obeyed.

  For each puzzle we will track a status. This status will be one of the following values

When the puzzle is created using the `puzzle` microservice a `puzzle:created` event is published.
When this service receives the event a couple of things need to happen.
