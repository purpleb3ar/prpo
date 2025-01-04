# Auth Service

The authencation service is responsible for handling user authencation.
We provide two options for authentication, either `local` (with username and password) or `google` (sign in with google sso).

## Passwords

Passwords are hashed before being stored to the database using
`argon2`.

## Tokens

Upon successful authentication the service generates JWT access token.
The token is signed using a signing key which is shared among other
microservices so they can then verify the received tokens and handle the request.

The token is distributed using `cookies` configured as `HttpOnly` to prevent client access and scoped to the appropriate application `Domain`.

## User resource

This service is in charge of managing the user resource. This means that
it represents the single source of truth for this resource. All modifications must be made through this service.

On creation or modification of a resource this service publishes a replication event
to the event broker so other interested services can update/create their
own replica of the resource.

## Google Flow

This service is in charge of handling the entire `google` authentication flow.

This means that the client application simply receives a JWT generated
by this service based on the information provided by the `google` SSO.

Using this flow for the first time (the `googleId` is not found in our database) will create the user internally and generate for them a unique random username.

## Local Flow

This service is in charge of handling the `local` flow as well.
The local flow requires clients to provide a username (unique)
and a password.

If the passwords match and the username exists the user receives back
a cookie with the JWT.

To register the user also has to provide a password and username,
the system validates password strength and username length,
makes sure that the username does not exist already and
creates the user. The user also receives back the cookie with the JWT.

## Logout

To logout the client calls the appropriate logout route, which sets the
cookie to an empty values (effectively removing it).
This has to be done this way because the client does not have programatic access to the cookie and as such cannot delete it on its own.

## User profile

Users can update their own profile. Currently consisting only of a username.
