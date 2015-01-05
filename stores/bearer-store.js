
BearerStore = {};

BearerStore.get = function(request) {
  var header = request.headers.authorization;

  if ( header ) {
    if ( header.indexOf( 'bearer ') === 0 || header.indexOf( 'Bearer ' ) === 0 ) {
      var access_token = header.substring( 7 );
      return {
        access_token: access_token,
      };
    }
  }
};

BearerStore.interactive = false;

BearerStore.wrap = function(grant) {
  grant.store   = store;
  grant.unstore = unstore;
};

BearerStore.store = function(request, response) {
  // no-op
};

BearerStore.unstore = function(request, response) {
  // no-op
};

module.exports = BearerStore;