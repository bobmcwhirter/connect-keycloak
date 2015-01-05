
CookieStore = {};

CookieStore.TOKEN_KEY = 'keycloak-token';

CookieStore.get = function(request) {
  var value = request.cookies[ CookieStore.TOKEN_KEY ];
  if ( value ) {
    try {
      return JSON.parse( value );
    } catch (err) {
      // ignore
    }
  }
};

CookieStore.interactive = true;

CookieStore.wrap = function(grant) {
  grant.store   = store;
  grant.unstore = unstore;
};

CookieStore.store = function(request, response) {
  response.cookie( CookieStore.TOKEN_KEY, JSON.stringify( this ) );
};

CookieStore.unstore = function(request, response) {
  response.clearCookie( CookieStore.TOKEN_KEY );
};

module.exports = CookieStore;