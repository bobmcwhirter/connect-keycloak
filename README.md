# Keycloak

[Keycloak](http://keycloak.jboss.org/) is a standalone authentication
server, akin to a standalone database.  It provides hooks for federated
authentication, including authenticating against various social networks
and OAuth providers (G+, Facebook, etc).

This module makes it simple to implement a Node.js Connect-friendly
application that uses Keycloak for its authentication and authorization needs.

## Instantiate a Keycloak

The `Keycloak` class provides a central point for configuration
and integration with your application.  The simplest creation
involves no arguments.

   var keycloak = new Keycloak()

By default, this will locate a file named `keycloak.json` alongside
the main executable of your application to initialize keycloak-specific
settings (public key, realm name, various URLs).  The `keycloak.json` file
is obtained from the Keycloak Admin Console.

Instantiation with this method results in all of the reasonable defaults
being used.  Normally, though, if you wish to use web sessions to manage
server-side state for authentication, you will need to initialize the
`KeyCloak(...)` with at least a `store` parameter, passing in the actual
session store that `express-session` is using.

    var session = require('express-session');
    var memoryStore = new session.MemoryStore();

    var keycloak = new Keycloak({ store: memoryStore });

## Install middleware

Once instantiated, install the middleware into your connect-capable app:

    var app = express();

    app.use( keycloak.middleware() );

## Protect resources

### Simple authentication

To enforce that a user must be authenticated before accessing a resource,
simply use a no-argument version of `keycloak.protect()`:

    app.get( '/complain', keycloak.protect(), complaintHandler );

### Role-based authorization

To secure a resource with an application role for the current app:

    app.get( '/special', keycloak.protect('special'), specialHandler );

To secure a resource with an application role for a *different* app:

    app.get( '/extra-special', keycloak.protect('other-app:special', extraSpecialHandler );

To secure a resource with a realm role:

    app.get( '/amin', keycloak.protect( 'realm:admin' ), adminHandler );

### Advanced authorization

To secure resources based on parts of the URL itself, assuming a role exists 
for each section:

    function protectBySection(token, request) {
      return token.hasRole( request.params.section );
    }

    app.get( '/:section/:page', keycloak.protect( protectBySection ), sectionHandler );

## Additional URLs

### Explicit user-triggered logout

By default, the middleware catches calls to `/logout` to send the user through a
Keycloak-centric logout workflow. This can be changed by specifying a `logout`
configuration parameter to the `middleware()` call:

    app.use( keycloak.middleware( { logout: '/logoff' } );

### Keycloak Admin Callbacks

Also, the middleware supports callbacks from the Keycloak console to logout a single
session or all sessions.  By default, these type of admin callbacks occur relative
to the root URL of `/` but can be changed by providing an `admin` parameter 
to the `middleware()` call:

    app.use( keycloak.middleware( { admin: '/callbacks' } );

Normally this does not need to be changed.

