
function TokenAttacher(keycloak) {
  this._keycloak = keycloak;
}

TokenAttacher.prototype.getFunction = function() {
  return this._tokenAttacher.bind(this);
}

TokenAttacher.prototype._tokenAttacher = function(request, response, next) {
  var token = this._keycloak.getToken( request, response, {}, function(err,token) {
    response.locals.token = token;
    next();
  } );
}

module.exports = TokenAttacher;
