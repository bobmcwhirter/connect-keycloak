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
  if ( config && config.store == 'cookie' ) {
    this.stores.push( CookieStore );
  } else if ( config && config.store == 'session' ) {
    this.stores.push( SessionStore );
  }
}

/* Locate an existing grant related to this request */
Keycloak.prototype.getGrant = function(request) {
  var grantData;

  for ( var i = 0 ; i < this.stores.length ; ++i ) {
    grantData = this.stores[i].get( request );
    if ( grantData ) {
      console.log( "getGrant::GOT GRANT" );
      var grant = this.grantManager.createGrant( grantData );
      grant.interactive = this.stores[i].interactive;
      grant.store       = this.stores[i].store;
      grant.unstore     = this.stores[i].unstore;
      return grant;
    }
  }
};

Keycloak.prototype.storeGrant = function(grant, request, response) {
  console.log( "STORING GRANT", this.stores.length  );
  for ( var i = 0 ; i < this.stores.length ; ++i ) {
    console.log( "checking store", i, this.stores[i], this.stores[i].interactive );
    if ( this.stores[i].interactive ) {
      console.log( "storing", this.stores[i] );
      grant.interactive = this.stores[i].interactive;
      grant.store       = this.stores[i].store;
      grant.unstore     = this.stores[i].unstore;
      grant.store(request, response);
      return grant;
    }
  }
}

Keycloak.prototype.getGrantFromCode = function(code, request, response) {
  var self = this;
  return this.grantManager.obtainFromCode( code )
    .then( function(grant) {
      console.log( "GOT GRANT" );
      try {
      self.storeGrant(grant, request, response);
      } catch(err) {
        console.log( err );
      }
      console.log( "STORE COMPLETE" );
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

  var adminLogout = new AdminLogout(this, options.admin);

  middlewares.push( PostAuth(this) );
  middlewares.push( adminLogout.getFunction() );
  middlewares.push( GrantAttacher(this) );
  middlewares.push( Logout(this, options.logout) );

  return middlewares;
};

Keycloak.prototype.protect = function(spec) {
  //return new Protect(this, spec).getFunction();
  return Protect( this, spec );
};


module.exports = Keycloak;
