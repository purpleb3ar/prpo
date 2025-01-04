# Puzzle App

Solve jigsaw puzzles alone, with friends, or with the world! This application provides a seamless and interactive experience for collaborative puzzle-solving. Users can enjoy puzzles solo, share invite links to solve with friends or whomever they invite, or join public puzzles to collaborate with others.

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Usage](#usage)
6. [Architecture](#architecture)
7. [Contributing](#contributing)
8. [License](#license)
9. [FAQ](#faq)

---

## Overview

The Puzzle App is a web application built for puzzle enthusiasts who want to solve puzzles alone or collaboratively. With an easy-to-use puzzle creation wizard and robust multiplayer features, users can immerse themselves in a fun and engaging experience.

- **Version**: 1.0.0
- **Technologies Used**: NestJS, MongoDB, NATS Streaming Server, Redis, Minio, React
- **Primary Purpose**: Facilitate collaborative jigsaw puzzle-solving

---

## Features

- **Single UI**: Simple and intuitive UI to manage your puzzles
- **Solo Mode**: Solve puzzles on your own.
- **Invite Friends**: Share a private invite link to collaborate on puzzles.
- **Public Puzzles**: Join or create public puzzles for anyone to participate.
- **User Authentication**:
  - Create an account OR
  - Sign in with Google.
- **Puzzle Creation Wizard**: Easily create custom puzzles using any image.
- **Real-Time Multiplayer**: Collaborate in real-time with others.

---

## Installation

### Prerequisites

- **Node.js** (16.x or higher)
- **Docker**

### Steps

---

**_NOTE_**: Steps 3 and 4 need to be repeated for each listed directory:

- `client`
- `auth`
- `sync`
- `puzzle`
- `processing`

---

1. Clone the repository:
   ```bash
   git clone https://github.com/purpleb3ar/prpo.git
   ```
2. Navigate to the directory:
   ```bash
   cd prpo
   ```
3. Navigate to the service directory:
   ```bash
   cd <listed-directory>
   ```
4. Install dependencies
   ```bash
   npm install
   ```

## Configuration

### Application Variables

Each microservice has a `config` folder which
houses service-specific configuration files.
There, you can find additional configuration options
related to each microservice respectively.

Some values are calculated but most are derived from environment variables.

### Environment Variables

Almost all environment variables can be left as-is inside the `.env.example` file. You simply have to rename it to `.env` inside each microservice directory.

- **App Configuration**:
  - `APP_NAME`: Name of the service, used for logging purposes
  - `NODE_ENV`: Environment type
  - `PORT`: HTTP listen port
  - `HTTP_ENABLE`: expose an HTTP interface or not
- **NATS Configuration**:
  - `NATS_SERVER_URL`: URL of the NATS Streaming Server.
  - `NATS_CLUSTER_ID`: The cluster identifier used in nats clustering mode to identify instances within the same cluster. In the context of the service, used to connect to a specific cluster.
  - `NATS_CLIENT_URL`: Nats server url
- **MongoDB Configuration**:
  - `MONGO_URI`: MongoDB connection string.
- **Redis Configuration**:
  - `REDIS_PORT`: Redis server port
  - `REDIS_HOST`: Redis server url
- **Authentication**:
  - `GOOGLE_CLIENT_ID`: Google OAuth client ID.
  - `GOOGLE_CLIENT_SECRET`: Google OAuth client secret.
- **JWT**:
  - `JWT_SECRET`: the JWT signing key used to verify JWTs
- **Minio**:
  - `MINIO_ACCESS_KEY`: minio service account access key (username)
  - `MINIO_SECRET_KEY`: minin service account secret key (password)
  - `MINIO_HOST`: Minio server url
  - `MINIO_PORT`: Minio server port

Example `.env` file:

```env
APP_NAME="sync-service"
NODE_ENV="development"
HTTP_ENABLE="true"
PORT=9003

NATS_CLUSTER_ID="puzzle-app"
NATS_CLIENT_NAME="sync-service"
NATS_CLIENT_URL="http://localhost:4222"

MONGO_URI="mongodb://root:example@localhost:27019/"

JWT_SECRET="vojaško-industrijski-kompleks"

REDIS_PORT=7622
REDIS_HOST="localhost"
```

Each microservice has a different `.env` depending on which
services they depend on. You can get more information about environment variables for each microservice
by looking at the contents of the `config` directory.

**NOTE**: In order for `Google SSO` to work correctly, you will need to supply your own values to the `auth` service.

---

### Minio

In order for microservices to be able to access your local containerized
minio instance, they will need correct credentials and a bucket. Follow
the below steps to generate and apply them.

1. Access the `Minio` management platform at `http://localhost:12001`
2. Login using credentials found inside the `docker-compose.yml` file.
3. Go to the `Buckets` tab under the `Administrator` section
4. Click on the `Create Bucket` button in the top-right.
5. Create a bucket named `puzzles`.
6. Then go to the `Access Keys` tab under the `User` section
7. Click on the `Create access key` button in the top-right.
8. Click on the `Create` button.
9. Copy the `Access Key` and `Secret Key`.

Then go to the `puzzle` microservices `.env` file and replace
the `<minio-access-key>` with your access key and the
`<minio-secret-key>` with your secret key.

Repeat this for the `processing` service and you are done.

> **_NOTE_**: I omit creating an iam policy to limit access because I assume that this minio instance is local to this deployment.

## Usage

### Starting the backend services

---

**_NOTE_**: Step 2 needs to be repeated for each of the listed directories:

- `auth`
- `processing`
- `puzzle`
- `sync`

---

Move into project root (the location where `docker-compose.yaml` resides) then:

1. Spin-up containers:
   ```bash
   docker compose up -d
   ```
2. Start the service
   ```bash
   npm run start:dev
   ```

---

### Starting the React client

After you've successfully started the backend services, in order
to try out the application you need to also start the `React` client.

1. Navigate to the `client` directory:
   ```bash
   cd client
   ```
2. Start the application:
   ```bash
   npm run dev
   ```
3. Access the application at `http://localhost:5173`.

### Puzzle Creation

Create your own puzzle using the creation wizard which can be accessed by pressing the `Create` button in the top right.

After saving, your puzzle will have a loading indicator at the start
which will disappear as soon as the puzzle is ready to be played.

### Browse puzzles

Browse your own puzzles or browse the public puzzles
by changing the filter in the top left.

### Multiplayer

Create a shared puzzle by changing visibility to `invite-only`.
Share the invite link or join an existing public puzzle
by pressing the `Play` button next to the desired puzzle.

You will be able to see your friends usernames
as they solve the puzzle with you.

---

## Architecture

The application follows a **microservices architecture**, ensuring scalability and flexibility.

- **Technologies**:
  - **NestJS**: Framework for building the services.
  - **MongoDB**: Each microservice connects to its own MongoDB instance.
  - **NATS Streaming Server**: Enables asynchronous communication between microservices.
- **Key Microservices**:
  - **Authentication Service**: Handles user sign-up/sign-in and Google OAuth and profile management.
  - **Puzzle Service**: Manages puzzle creation and state.
  - **Sync Service**: Synchronizes multiplayer interactions and tracks progress.
  - **Processing Server**: Turns user-provided images into solvable jigsaw puzzles.

> **_NOTE_**: Specific information and technical details about each microservice is available inside a README.md file located in the microservices respective directory.

### Event broker

All the microservices communicate `asynchronously`.
This means that the microservices do not interact with each other directly, but instead via a central piece of software often called an `event broker`.
The event broker is in charge of distributing received events to
subscribers based on expressed interest.
The event broker implementation that I chose was `nats-streaming-server`.

> **_NOTE_**: `nats-streaming-server` was DEPRECATED in favor of `JetStream`. JetStream sadly doesn't have the same elegance and simplicity as `nats-streaming-server` had and as such I chose to use it regardless.

It was chosen due to its simplicity in setting up the essential features
needed to facilitate efficient and correct multi-service, multi-instance deployments:

- `queue groups`: essentially a way to group multiple instances of the same service together in order to enable efficient load-balancing of events.
- `durable subscription`: essentially a way for services to not miss out
  on events in case they go offline for brief amounts of time. On reconnect the missed events are immediately redelivered instead.
- `manual acknowledgement`: a way for the services to manually acknowledge an event in order to signal its successful processing and handling.

This approach makes the microservices truly independent
meaning that since there are no explicit dependencies,
they can function even when all others are experiencing downtime.

## Cross-service data replication

Each type of microservice has its own database instance.
Although multiple instances of the same microservice share the database instance.

Since we set out to design microservices which were truly independent,
microservices which are able to serve requests without reliance on other ones, we had to opt-in to data replication.

Each resource within our application has an owner.
The owner of a resource is what we call the single source of truth.
All updates to a resource need to happen though the SSOT.
This is a powerful idea because it greatly simplifies issues that we
encounter in event-based data replication.

An owner in this context is a microservice. For example, the `puzzle service` owns the `puzzle resource`. The `auth service` owns the `user resource`.

Anytime we need to update a resource, we go though the SSOT and the SSOT
generates a replication event which other interested services consume
in order to build their own replica of the resource.

To mitigate all the possible concurrency issues and other issues
in event-based replication, we introduce a concept of `versioning` to our
records.
This means each instance of a resource has a version number (which starts with 0 at creation) and anytime this resource is updated though the SSOT the version is increased and send along with the replication event. When the interested service receives the event, it checks that the
version of the local record is only one less than the version in the event
body. If it is, the update is applied, otherwise it is rejected.

This allows the recipient to reject events if they arrived out-of-order.
When they reject an event, there is a grace period that the `nats-streaming-server` waits until it tries to redeliver it.
In this period the correct event arrives and the service happily applies it. Then the event is redelivered, the versions now match and it applies it as well. This is called eventual-consistency.

We also introduce a concept of `optimistic concurrency control`. This is
a method used in distributed systems which does not require locks.
In a traditional system when a shared resource needs to be modified,
the writer needs to lock it in order to prevent data races.
The OCC gets rid of locks and instead of prevetitavely locking
the resource, relies on the version numbers
to check whether the resource has changed after the fact.

This is useful in the context of multiple instances of the same service
which share the database instance.

Assume that the same event got delivered to two identical instances
(something went wrong).

Both services will check the version of the local resource instance and see if it matches (lets assume it does). They will load the resource into memory, change it based on the event data and then try to write it back into the database.

The OOC method used in context of `MongoDB` will check
that the resource has not changed since it was loaded.
This will prevent both events from being applied and version numbers
from being incorrect, as one event will surely be rejected.

---

## Contributing

1. Fork the repository.
2. Create a new branch:
   ```bash
   git checkout -b feature-name
   ```
3. Commit changes:
   ```bash
   git commit -m "Add feature"
   ```
4. Push the branch:
   ```bash
   git push origin feature-name
   ```
5. Submit a pull request.

---

## License

This project is licensed under the [MIT License](LICENSE).

---

## FAQ

1. **Can I play with my friends?**
   Sure! Create an "invite-only" puzzle using the creation wizard
   and share the invite link with them.

2. **Can I upload custom images for puzzles?**
   Yes! Use the puzzle creation wizard to upload your own images.

3. **How can I report a bug?**
   Open an issue on our [GitHub repository](https://github.com/purpleb3ar/prpo/issues).
