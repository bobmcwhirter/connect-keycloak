var Token = require('./token' );

var url = require('url');

function Protect(keycloak) {
  this._keycloak = keycloak;
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
    return next();
  }
  this.forceLogin(request, response);

}

module.exports = Protect;
