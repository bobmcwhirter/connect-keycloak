
var http = require('http');
var URL = require('url');

function Admin(keycloak, token) {
  this._keycloak = keycloak;
  this._token = token;
  this._realmAdminURL = this._keycloak._authServerURL + '/admin/realms/' + this._keycloak._realm;
  this._appAdminURL   = this._realmAdminURL + '/applications/' + this._keycloak._resource;
}

Admin.prototype.getApplicationRoles = function(callback) {

  var url = this._appAdminURL + '/roles';

  var options = URL.parse( url );

  options.method = 'GET';
  options.headers = {
    'Authorization': 'Bearer ' + this._token.secure,
    agent: false,
  }

  console.log( "making request", options );
  http.request( options, function(response) {
    console.log( "response", response.statusCode );
    var json = '';
    var data = {};

    response.on('data', function(d) {
      json += d.toString();
    });

    response.on('end', function() {
      console.log( "JSON", json );
      var data = JSON.parse( json );
      //console.log( "data", data );
      callback(data);
    });

  }).on('error', function(err) {
    console.log( "ERR", err );
  }).end();

}

module.exports = Admin;