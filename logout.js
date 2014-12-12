var Token = require('./token' );
var Middleware = require('./middleware' );

function Logout(keycloak) {
  this._keycloak = keycloak;
}

Logout.prototype.getFunction = function() {
  return this._logout.bind(this);
}

Logout.prototype._logout = function(request, response) {
  response.clearCookie( Middleware.COOKIE_NAME );

  var host = request.hostname;
  var port = request.app.settings.port || 3000;

  var redirectURL = 'http://' + host + ( port == 80 ? '' : ':' + port ) + '/';

  var logoutURL = this._keycloak.logoutURL( {
      redirectURL: redirectURL
  } );
  response.redirect( logoutURL );
}

module.exports = Logout;
