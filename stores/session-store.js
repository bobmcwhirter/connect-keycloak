
SessionStore = {};

SessionStore.TOKEN_KEY = 'keycloak-token';

SessionStore.get = function(request) {
  var value = request.session[ SessionStore.TOKEN_KEY ];
  console.log( "session token: " + value );
  if ( value ) {
    try {
      return JSON.parse( value );
    } catch (err) {
      // ignore
    }
  }
};

SessionStore.interactive = true;

SessionStore.wrap = function(grant) {
  grant.store   = store;
  grant.unstore = unstore;
};

SessionStore.store = function(request, response) {
  request.session[ SessionStore.TOKEN_KEY ] = JSON.stringify( this );
};

SessionStore.unstore = function(request, response) {
  console.log( "UNSTORE" );
  delete request.session[ SessionStore.TOKEN_KEY ];
};

module.exports = SessionStore;