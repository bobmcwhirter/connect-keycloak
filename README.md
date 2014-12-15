# Handlers and middleware for Keycloak

To use

~~~~
var Keycloak = require('keycloak');

var keycloak = new Keycloak();
keycloak.loadConfig( /* defaults to ./keycloak.json */ );

var app = ... 

// Wire up Keycloak generally for the application

app.use( keycloak.middleware({
  logout: '/logout', /* user-accessible logout link */
  admin: '/', /* root URL for keycloak admin callbacks */
}) );

// protect a sub-portion with specifically-applied middleware
app.get( '/admin/*', keycloak.protect(), myHandler );

~~~~

## Access to the token

Once a user has authenticated, the Keycloak middleware will
add a `token` to the response `locals`.

