
function SessionStore(store) {
  this.store = store;
}

SessionStore.TOKEN_KEY = 'keycloak-token';

SessionStore.prototype.getId = function(request) {
  return request.session.id;
}

SessionStore.prototype.get = function(request) {
  var value = request.session[ SessionStore.TOKEN_KEY ];
  if ( value ) {
    try {
      return JSON.parse( value );
    } catch (err) {
      // ignore
    }
  }
};

SessionStore.prototype.clear = function(sessionId) {
  var self = this;
  this.store.get( sessionId, function(err, session) {
    if ( session ) {
      delete session[ SessionStore.TOKEN_KEY ];
      self.store.set( sessionId, session );
    }
  });
}

var store = function(request, response) {
  request.session[ SessionStore.TOKEN_KEY ] = JSON.stringify( this );
};

var unstore = function(request, response) {
  delete request.session[ SessionStore.TOKEN_KEY ];
};

SessionStore.prototype.wrap = function(grant) {
  grant.store   = store;
  grant.unstore = unstore;
};

module.exports = SessionStore;