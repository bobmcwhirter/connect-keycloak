var Token = require('./token' );
var Middleware = require('./middleware' );

function Admin(keycloak) {
  this._keycloak = keycloak;
}

Admin.prototype.getFunction = function() {
  return this._admin.bind(this);
}

Admin.prototype._admin = function(request, response) {
  console.log( "ADMIN REQUEST", request.url )
  console.log( 'query', request.query );
  console.log( 'params', request.params );
  console.log( 'headers', request.headers );
  var data = '';

  request.on( 'data', function(d) {
    data += d.toString();
  })
  request.on( 'end', function() {
    var parts = data.split('.');
    var payload =  JSON.parse( new Buffer( parts[1], 'base64' ).toString() );
    if ( payload.action == 'LOGOUT' ) {
      console.log( "LOG EVERYONE OUT" );
      console.log( payload );
    }
    response.send( "ok" );
  })
}

module.exports = Admin;
