
module.exports = function(keycloak) {
  return function(request, response, next) {
    response.locals.grant = keycloak.getGrant( request );
    next();
  };
};
