var Token      = require('./token' );

var Middleware = require('./middleware');
var Logout     = require('./logout');
var Admin      = require('./admin');

var fs   = require('fs');
var path = require('path');
var url  = require('url');
var http = require('http');

function Keycloak() {

  this._middleware = new Middleware(this);

  this._admin      = new Admin(this);
  this._logout     = new Logout(this);
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
  console.log( "UUID", uuid );
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

Keycloak.prototype.getToken = function(options, callback) {
  if ( options.token ) {
    var token = new Token( options.token );
    return callback( null, token );
  }

  return this.getTokenFromCode( options.code, callback );
}

Keycloak.prototype.getTokenFromCode = function(code, callback) {
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
      return self.getToken( { token: data.access_token }, callback );
    })
  } );

  var sessionId = this.createUUID();

  var params = 'code=' + code + '&application_session_state=' + sessionId + '&application_session_host=localhost';
  authRequest.write( params );
  authRequest.end();
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

Keycloak.prototype.middleware = function() {
  return this._middleware.getFunction();
}

Keycloak.prototype.logout = function() {
  return this._logout.getFunction();
}

Keycloak.prototype.admin = function() {
  return this._admin.getFunction();
}


module.exports = Keycloak;
