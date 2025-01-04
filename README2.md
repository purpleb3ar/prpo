# Puzzle app

A simple application which allows users to collaboratively
solve jigsaw puzzles.

There are three main ways of interacting with the platform:

- You can solve the puzzle alone
- You can create a collab puzzle which can be shared via an invite link generated on the ui, and solve the puzzle toghether with friends or whomever you invite.
- Lastly, you can solve what are called "public" puzzles. These differ
  from the above two in that they are persistent (cannot be deleted or updated)
  and anyone with the access to the platform can join and solve them.

The platform includes all the desired synchronization features
that allow users to solve puzzles togehter in a true "multiplayer" fashion.

Each user can create their own puzzles and has a nice view of owned,
joined and public puzzles.

The platform allows users to create puzzles from their own images.
The creation wizard allows users to supply their own images,
dimensions and puzzle piece size.
In this way the entire experience can be customized to suit the users
desires.

User can create an account with username and password
or simply sign in using Google SSO.

## Architecture

The project uses the microservices architecture.
There are 4 main service each of which is briefly described below.

NOTE: for more specific information about microservices
there is a `README.md` file inside each of their respective directories.

The services use what is called `async` communication.
This means that services do not interact with each other directly,
but instead via a central piece of software often called an `event broker`.
The event broker implementation that I chose was `nats-streaming-server`.

It was chosen because it includes the essential features for a multi-instance, multi-service deployment:

- `queue groups`: essentially a way to group multiple instances of the same service together in order to enable efficient load-balancing of events.
- `durable subscription`: essentially a way for services to not miss out
  on events in case they go offline for brief amounts of time. On reconnect the missed events immediately redelivered instead.
- `manual acknowledgement`: a way for the services to manually acknowledge an event in order to signal its successful processing and handling.

This approach allows the microservices to be truly independent.
Meaning that any microservice can do its job correctly even
if all the other ones are experiencing downtime.

### Sync

The service users `redis` to save and track progress.

NOTE: This service cannot be scaled at this time because the `socket.io`
adapter uses an in-memory store implementation instead of `redis` (or something more appropriate for multiple instances).
Making this change would require a lot of testing which I do not have time for.

The sync service is in charge of:

- tracking and saving progress
- recording an event log and snapshots
- managing rooms and players
- broadcasting the events to all room members
- synchnonizing puzzle state accross all players in real time

It exposes a single `websocket` route which the users connect to.

### Puzzle

The puzzle service is in charge of managing a single resource called
`puzzle`. It represents the single source of truth for this resource
and any and all updates to it have to be made through it.

The puzzle service is in charge of:

- managing the puzzle resource
- serving static assets (thumbnails)
- publishing replication events for other services
- subscribing to replication events from other services

It exposes an http interface which can be used to manipulate the
`puzzle` resource.

### Processing

This service is in charge of:

- subscribing to replication events from the `puzzle` service
- generating a spritesheet of all puzzle pieces from the given source image
- generating a puzzle spec which includes all data necessary to
  have a solvable jigsaw puzzle
- informing users of progress
- informing `puzzle` service of progress

It exposes a single SSE route which users can connect to, to
receive a notification when their puzzle is ready (has been successfully processed)

### Auth

The service generates JWTs for users and distributes them via
cookies.

This service is in charge of:

- authenticating users, either locally or externally via SSO
- generating JWTs and setting cookies
- managing the user resource
- publishing replicating events related to the user resource

It exposes an HTTP interface that features the standard authentication
routes as well as routes for managing the current user.

## Building

### Development

The build the project for local development
you will need to have a working installation of
`Docker Desktop`.

First run the below command to create database container
for each of the services, the nats instance for cross-service
communication, minio instance for storage of user assets
and a redis instance used to provide synchronization and notification
features.

NOTE: this command must be run in the same root project directory (where the `docker-compose.yml` file resides)

```sh
docker compose up -d
```

Then to run each of the `microservices`, move into their
respestive directories and run

```sh
npm install
npm run start:dev
```

An environment file (`.env.example`) is provided for each
of the `microservices`. You simply need to rename it to `.env`
and optionally change any keys to values you desire.

The decision to NOT run the microservices inside `docker` containers was simple.:

- easier to inspect logs
- easier to restart the service
- hot module reloading works better and more predicatbly

If you want to run the microservices inside `docker` anyway, the included
`Dockerfile` includes a multi-stage build, which includes the `development` target. Simply add the services to the `docker-compose.yaml` file and specify the correct target.

### Production

To build for production, you need to
replace the above commands for each of the microservies with:

```sh
npm run install
npm run build
npm run start:prod
```

This will create production versions of the application locally.
Optionally change the NODE_ENV variable inside `.env` files.

## Deploying

Deploying is automatic using `Github Actions`.
The action is configured to trigger on any changes to the `main` branch.
(merges, pushes, ...).

There is a single `workflow` file for each of the services which
triggers when any changes are made within its respective directory.

Example:
if I make changes within the `auth` directory only its workflow
will trigger.

A workflow file logs into my private container registry (`registry.purplebear.io`) and runs the docker build commands.
After the image has been built, it is pushed to to the container registry.
Then the correct deployment within the `kubernetes` cluter is updated
and rolled out with zero downtime.
