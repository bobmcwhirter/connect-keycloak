var Token = require('./token' );

var url = require('url');

function simpleGuard(role,token) {
  if ( role.indexOf( "app:" ) == 0 ) {
    return token.hasApplicationRole( role.substring( 4 ) );
  }
  if ( role.indexOf( "realm:" ) == 0 ) {
    return token.hasRealmRole( role.substring( 6 ) );
  }

  return false;
}

function Protect(keycloak, spec) {
  this._keycloak = keycloak;

  if ( ! spec ) {
    this._guard = undefined;
  } else if ( typeof spec == 'string' ) {
    this._guard = simpleGuard.bind( undefined, spec );
  } else if ( typeof spec == 'function' ) {
    this._guard = spec
  }
}


Protect.prototype.getFunction = function() {
  return this._protect.bind(this);
}

Protect.prototype.forceLogin = function(request, response) {
  var host = request.hostname;
  var port = request.app.settings.port || 3000;

  var redirectURL = 'http://' + host + ( port == 80 ? '' : ':' + port ) + request.url;

  var uuid = this._keycloak.createUUID();
  var loginURL = this._keycloak.loginURL( {
    uuid: uuid,
    redirectURL: redirectURL
  } );
  response.redirect( loginURL );
}

Protect.prototype._protect = function(request, response, next) {

  if ( response.locals.token ) {
    if ( ! this._guard || this._guard( response.locals.token ) ) {
      return next();
    }

    response.status( 403 );
    response.end( "Access denied" );
    return;
  }

  this.forceLogin(request, response);

}

module.exports = Protect;
