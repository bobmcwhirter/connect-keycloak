var URL = require('url');

module.exports = function(keycloak) {
  return function(request, response, next) {
    if ( ! request.query.auth_callback ) {
      return next();
    }

    if ( request.query.error ) {
      response.status( 403 );
      response.end( "Access denied" );
      return;
    }

    console.log( "getting grant from code", request.query.code );

    keycloak.getGrantFromCode( request.query.code, request, response )
      .then( function(grant) {
        console.log( "GOT GRANT" );
        var urlParts = {
          pathname: request.path,
          query: request.query,
        };

        delete urlParts.query.code;
        delete urlParts.query.auth_callback;
        delete urlParts.query.state;

        var cleanUrl = URL.format( urlParts );

        console.log( "redirect", cleanUrl );
        response.redirect( cleanUrl );
      });

  };
};