var Token = require('./token');

function SessionAdapter() {
}

SessionAdapter.TOKEN_KEY = 'keycloak-token';

SessionAdapter.prototype.getToken = function(request) {
  return request.session[ SessionAdapter.TOKEN_KEY ];
}

SessionAdapter.prototype.setToken = function(request, response, token) {
  request.session[ SessionAdapter.TOKEN_KEY ] = token;
}

SessionAdapter.prototype.clearToken = function(request, response) {
  delete request.session[ SessionAdapter.TOKEN_KEY ];
}

SessionAdapter.prototype.getSessionID = function(request) {
  return request.session.id;
}

SessionAdapter.prototype.clearTokenForSession = function(request, id, cb) {
  var store = request.sessionStore;
  store.get( id, function( err, session ) {
    if ( session ) {
      delete session[ SessionAdapter.TOKEN_KEY ];
      store.set( id, session, function() {
        cb();
      } );
    } else {
      cb();
    }
  })
}

module.exports = SessionAdapter;