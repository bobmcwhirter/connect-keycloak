var Q = require('q');

var crypto = require('crypto');


var BearerStore  = require('./stores/bearer-store');
var CookieStore  = require('./stores/cookie-store');
var SessionStore = require('./stores/session-store');

var Config        = require('keycloak-auth-utils').Config;
var GrantManager  = require('keycloak-auth-utils').GrantManager;

var fs   = require('fs');
var path = require('path');
var url  = require('url');
var http = require('http');

function Keycloak(config, keycloakConfig) {
  this.config = new Config(keycloakConfig);

  this.grantManager = new GrantManager( this.config );

  this.stores = [ BearerStore ];

  if ( config && config.store && config.cookies ) {
    throw new Error( "Either `store` or `cookies` may be set, but not both" );
  }

  if ( config && config.store ) {
    this.stores.push( new SessionStore( config.store ) );
  } else if ( config && config.cookies ) {
    this.stores.push( CookieStore );
  }

}

/* Locate an existing grant related to this request */
Keycloak.prototype.getGrant = function(request, response) {

  var deferred = Q.defer();

  var rawData;

  for ( var i = 0 ; i < this.stores.length ; ++i ) {
    rawData = this.stores[i].get( request );
    if ( rawData ) {
      //var grant = this.grantManager.createGrant( rawData );
      var grant = this.grantManager.createGrant( rawData );
      var self = this;

      this.grantManager.ensureFreshness(grant)
        .then( function(grant) {
          self.stores[i].wrap( grant );
          grant.store(request, response);
          deferred.resolve( grant );
        });

      return deferred.promise;
    }
  }

  deferred.reject();

  return deferred.promise;
};

Keycloak.prototype.storeGrant = function(grant, request, response) {
  if ( this.stores.length < 2 ) {
    // cannot store, bearer-only, this is weird
    return;
  }

  this.stores[1].wrap( grant );
  grant.store(request, response);
  return grant;
}

Keycloak.prototype.unstoreGrant = function(sessionId) {
  if ( this.stores.length < 2 ) {
    // cannot unstore, bearer-only, this is weird
    return;
  }

  this.stores[1].clear( sessionId );
}

Keycloak.prototype.getGrantFromCode = function(code, request, response) {
  if ( this.stores.length < 2 ) {
    // bearer-only, cannot do this;
    throw new Error( "Cannot exchange code for grant in bearer-only mode" );
  }

  var sessionId = this.stores[1].getId( request );

  var self = this;
  return this.grantManager.obtainFromCode( code, sessionId )
    .then( function(grant) {
      self.storeGrant(grant, request, response);
      return grant;
    })
};

Keycloak.prototype.loginUrl = function(uuid, redirectUrl ) {
  return this.config.realmUrl + '/tokens/login?client_id=' + encodeURIComponent( this.config.clientId ) +
    '&state=' + encodeURIComponent( uuid ) +
    '&redirect_uri=' + encodeURIComponent( redirectUrl );
};

Keycloak.prototype.logoutUrl = function(redirectUrl) {
  return this.config.realmUrl + '/tokens/logout?redirect_uri=' + encodeURIComponent( redirectUrl );
};



var AdminLogout   = require('./middleware/admin-logout');
var Logout        = require('./middleware/logout');
var PostAuth      = require('./middleware/post-auth' );
var GrantAttacher = require('./middleware/grant-attacher' );
var Protect       = require('./middleware/protect');

Keycloak.prototype.middleware = function(options) {

  options.logout = options.logout || '/logout';
  options.admin  = options.admin  || '/';

  var middlewares = [];

  middlewares.push( PostAuth(this) );
  middlewares.push( AdminLogout(this, options.admin) );
  middlewares.push( GrantAttacher(this) );
  middlewares.push( Logout(this, options.logout) );

  return middlewares;
};

Keycloak.prototype.protect = function(spec) {
  //return new Protect(this, spec).getFunction();
  return Protect( this, spec );
};


module.exports = Keycloak;
