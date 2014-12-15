var crypto = require('crypto');

var Token      = require('./token' );

var SessionAdapter = require('./session-adapter' );

var AdminLogout   = require('./admin-logout');
var Logout        = require('./logout');
var PostAuth      = require('./post-auth' );
var TokenAttacher = require('./token-attacher' );

var Protect    = require('./protect');

var fs   = require('fs');
var path = require('path');
var url  = require('url');
var http = require('http');

function Keycloak() {
  this._adapter = new SessionAdapter();
  this._notBefore = 0;
}

Keycloak.prototype.loadConfig = function(configPath) {
  if ( ! configPath ) {
    configPath = path.join( path.dirname( process.argv[1] ), 'keycloak.json' );
  }
  var json = fs.readFileSync( configPath );
  var config = JSON.parse( json.toString() );
  this.config( config )
}

Keycloak.prototype.config = function(config) {
  this._authServerURL  = config['auth-server-url'];
  this._realm          = config['realm'];
  this._realmPublicKey = config['realm-public-key'];
  this._resource       = config['resource'];
  this._credentials    = config['credentials'];

  this._realmURL  = this._authServerURL + '/realms/' + encodeURIComponent(this._realm);
  this._loginURL  = this._realmURL + '/tokens/login?client_id=' + encodeURIComponent( this._resource );
  this._logoutURL = this._realmURL + '/tokens/logout';
}


Keycloak.prototype.createUUID = function() {
  var s = [];
  var hexDigits = '0123456789abcdef';
  for (var i = 0; i < 36; i++) {
    s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
  }
  s[14] = '4';
  s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);
  s[8] = s[13] = s[18] = s[23] = '-';
  var uuid = s.join('');
  return uuid;
}

Keycloak.prototype.loginURL = function(options) {
  var uuid        = options.uuid;
  var redirectURL = options.redirectURL + '?auth_callback=1';
  return this._loginURL + '&state=' + encodeURIComponent( uuid ) + '&redirect_uri=' + encodeURIComponent( redirectURL );
}

Keycloak.prototype.logoutURL = function(options) {
  var redirectURL = options.redirectURL;
  return this._logoutURL + '?redirect_uri=' + encodeURIComponent( redirectURL );
}

Keycloak.prototype.getToken = function(request, response, options, callback) {
  if ( options.token ) {
    return this.constructToken( request, response, options.token, callback );
  } else if ( options.code ) {
    return this.getTokenFromCode( request, response, options.code, callback );
  } else {
    return this.getTokenFromRequest( request, response, callback );
  }
}

Keycloak.prototype.constructToken = function(request, response, tokenText, callback) {

  if ( ! tokenText ) {
    return callback();
  }

  var token = new Token( this, tokenText );
  if ( ! token.isValid() ) {
    return callback();
  }

  this._adapter.setToken( request, response, tokenText );

  callback(null, token );
}

Keycloak.prototype.getTokenFromRequest = function(request, response, callback) {
  this.constructToken( request, response, this._adapter.getToken( request ), callback )
}

Keycloak.prototype.getTokenFromCode = function(request, response, code, callback) {
  var self = this;
  var options = url.parse( this._realmURL + '/tokens/access/codes' );
  options.method = 'POST';
  options.headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Authorization': 'Basic ' + new Buffer( this._resource + ':' + this._credentials.secret ).toString('base64' ),
  };

  var authRequest = http.request( options, function(authResponse) {
    var json = '';
    authResponse.on('data', function(d) {
      json += d.toString();
    })
    authResponse.on( 'end', function() {
      var data = JSON.parse( json );
      //return self.getToken( { token: data.access_token, request: request }, callback );
      return self.constructToken( request, response, data.access_token, callback );
    })
  } );

  var sessionID = this._adapter.getSessionID( request );
  var params = 'code=' + code + '&application_session_state=' + sessionID + '&application_session_host=localhost';
  authRequest.write( params );
  authRequest.end();
}

Keycloak.prototype.getPublicKey = function() {
  var key = "-----BEGIN PUBLIC KEY-----\n";

  for ( i = 0 ; i < this._realmPublicKey.length ; i = i + 64 ) {
    key += this._realmPublicKey.substring( i, i + 64 );
    key += "\n";
  }

  key += "-----END PUBLIC KEY-----\n";

  return key;
}

Keycloak.prototype.validateToken = function(token) {
  if ( token.issuedAt < this._notBefore ) {
    return false;
  }

  var verify = crypto.createVerify('RSA-SHA256');

  var cert = this.getPublicKey();
  var signedPart = token.signedPart;
  verify.update( token.signedPart );

  var sig = token.signature;
  return verify.verify( cert, token.signature, 'base64' );
}

Keycloak.prototype.register = function() {

 var options = url.parse( this._realmURL + '/clients-managements/register-node' );
 options.method = 'POST';
 options.headers = {
   'Content-Type': 'application/x-www-form-urlencoded',
   'Authorization': 'Basic ' + new Buffer( this._resource + ':' + this._credentials.secret ).toString('base64' ),
 };

  var registerRequest = http.request( options, function(registerResponse) {
  })

  registerRequest.write( "application_cluster_host=localhost" );
  registerRequest.end();

  setTimeout( this.register.bind(this), 30000 );
}

Keycloak.prototype.protect = function() {
  return new Protect(this).getFunction();
}

Keycloak.prototype.middleware = function(options) {

  options.logout = options.logout || '/logout';
  options.admin  = options.admin  || '/';

  var middlewares = [];

  var logout = new Logout(this, options.logout);
  var adminLogout = new AdminLogout(this, options.admin);
  var postAuth = new PostAuth(this);
  var tokenAttacher = new TokenAttacher(this);

  middlewares.push( logout.getFunction() );
  middlewares.push( adminLogout.getFunction() );
  middlewares.push( postAuth.getFunction() );
  middlewares.push( tokenAttacher.getFunction() );

  return middlewares;
}


module.exports = Keycloak;
