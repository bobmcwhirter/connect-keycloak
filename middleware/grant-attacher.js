
module.exports = function(keycloak) {
  return function(request, response, next) {
    response.locals.grant = keycloak.getGrant( request );
    console.log( "ATTACHED", response.locals.grant );
    next();
  };
};
