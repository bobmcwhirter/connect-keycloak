var Token = require('./token' );

var url = require('url');

function Middleware(keycloak) {
  this._keycloak = keycloak;
}

Middleware.COOKIE_NAME = 'KEYCLOAK_ADAPTER_STATE';


Middleware.prototype.getFunction = function() {
  return this._middleware.bind(this);
}

Middleware.prototype.forceLogin = function(request, response) {
  console.log( "FORCE LOGIN", request.url );
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

Middleware.prototype._middleware = function(request, response, next) {

  var middleware = this;

  var cookieValue;

  if ( request.cookies ) {
    if ( request.cookies[ Middleware.COOKIE_NAME ] ) {
      cookieValue = request.cookies[ Middleware.COOKIE_NAME ];
    }
  } else {
    var cookieHeader = request.headers.cookie;
    if ( cookieHeader ) {
      var loc = cookieHeader.indexOf( Middleware.COOKIE_NAME );
      if ( loc >= 0 ) {
        var endLoc = cookieHeader.indexOf( ';', loc );
        if ( endLoc < 0 ) {
          endLoc = cookieHeader.length;
        }
        cookieValue = cookieHeader.substring( loc + Middleware.COOKIE_NAME.length, endLoc );
      }
    }
  }

  if ( cookieValue ) {
    return this._keycloak.getToken( { token: cookieValue}, function(err, token) {
      if ( token.isValid() ) {
        response.locals.token = token;
        next();
        return;
      } else {
        middleware.forceLogin(request, response);
      }
    })
  }

  if ( request.query.auth_callback && request.query.code ) {
    return this._keycloak.getToken( { code: request.query.code }, function(err,token) {
      if ( token.isValid() ) {
        response.cookie( Middleware.COOKIE_NAME, token.secure );

        var urlParts = {
          pathname: request.path,
          query: request.query,
        }

        delete urlParts.query.code;
        delete urlParts.query.auth_callback;
        delete urlParts.query.state;

        var cleanURL = url.format( urlParts );

        response.redirect( cleanURL );
      } else {
        middleware.forceLogin(request, response);
      }
    } )
  }

  middleware.forceLogin(request, response);

}

module.exports = Middleware;
