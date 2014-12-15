var url = require('url');

function PostAuth(keycloak, url) {
  this._keycloak = keycloak;
  this._url = url;
}

PostAuth.prototype.getFunction = function() {
  return this._postAuth.bind(this);
}

PostAuth.prototype._postAuth = function(request, response, next) {
  var self = this;

  if ( ! request.query.auth_callback ) {
    return next();
  }

  if ( request.query.error ) {
    response.status( 403 );
    response.end( "Access denied" );
    return;
  }

  this._keycloak.getToken( request, response, { code: request.query.code }, function(err,token) {
    if ( ! token ) {
      response.status( 403 );
      response.end( "Access denied" );
      return;
    }

    //self._keycloak._adapter.setToken( request, response, token.secure );

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
  } );

}

module.exports = PostAuth;
