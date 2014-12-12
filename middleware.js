var Token = require('./token' );

var url = require('url');

function Middleware(keycloak) {
  this._keycloak = keycloak;
}

Middleware.COOKIE_NAME = 'keycloak-auth';

Middleware.prototype.createUUID = function() {
  var s = [];
  var hexDigits = '0123456789abcdef';
  for (var i = 0; i < 36; i++) {
    s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
  }
  s[14] = '4';
  s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);
  s[8] = s[13] = s[18] = s[23] = '-';
  var uuid = s.join('');
  return uuid;
}

Middleware.prototype.getFunction = function() {
  return this._middleware.bind(this);
}

Middleware.prototype.forceLogin = function(request, response) {
  var host = request.hostname;
  var port = request.app.settings.port || 3000;

  var redirectURL = 'http://' + host + ( port == 80 ? '' : ':' + port ) + request.url;

  var uuid = this.createUUID();
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
    var token = new Token( cookieValue );
    if ( token.isValid() ) {
      response.locals.token = token;
      next();
      return;
    }
  }

  if ( request.query.auth_callback && request.query.code ) {
    this._keycloak.getToken( request.query.code, function(err,token) {
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

        //next();
      } else {
        middleware.forceLogin(request, response);
      }
    } )
    return;
  }

  middleware.forceLogin(request, response);

}

module.exports = Middleware;
