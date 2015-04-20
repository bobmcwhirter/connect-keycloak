
module.exports = function(keycloak) {
  return function(request, response, next) {
    keycloak.getGrant( request, response )
      .then( function(grant) {
        response.locals.grant = grant;
      })
      .then( function() {
        next();
      } )
      .catch( next );
  };
};
