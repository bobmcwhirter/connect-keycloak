# Handlers and middleware for Keycloak

To use

~~~~
var Keycloak = require('keycloak');

var keycloak = new Keycloak();
keycloak.loadConfig( /* defaults to ./keycloak.json */ );

var app = ... 

// secure the whole app with Keycloak authn
app.use( keycloak.middleware() );

// secure a sub-portion with specifically-applied middleware
app.get( '/admin/*', keycloak.middleware(), myHandler );

// provide a place for POST-backs from Keycloak
app.all( '/keycloak-admin/*', keycloak.admin() )

// provide a link to perform a keycloak logout
app.get( '/logout', keycloak.logout() )
~~~~
