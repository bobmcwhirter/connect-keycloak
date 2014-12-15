function Logout(keycloak, url) {
  this._keycloak = keycloak;
  this._url = url;
}

Logout.prototype.getFunction = function() {
  return this._logout.bind(this);
}

Logout.prototype._logout = function(request, response, next) {

  if ( request.url != this._url ) {
    return next();
  }

  this._keycloak._adapter.clearToken( request, response );

  var host = request.hostname;
  var port = request.app.settings.port || 3000;

  var redirectURL = 'http://' + host + ( port == 80 ? '' : ':' + port ) + '/';

  var logoutURL = this._keycloak.logoutURL( {
      redirectURL: redirectURL
  } );
  response.redirect( logoutURL );
}

module.exports = Logout;
