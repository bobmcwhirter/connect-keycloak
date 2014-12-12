
function Token(token) {
  this._secure = token;

  if ( ! token ) {
    this._valid = false;
  } else {
    var parts = token.split('.');
    this._header = JSON.parse( new Buffer( parts[0], 'base64' ).toString() );
    this._content = JSON.parse( new Buffer( parts[1], 'base64' ).toString() );
    this._signature = parts[2];
    this._valid = true;
  }

  //console.log( "realm_access", this._content.realm_access );
  //console.log( "resource_access", this._content.resource_access );
}

Token.prototype.isValid = function() {
  return this._valid;
}

Object.defineProperty( Token.prototype, 'givenName', {
  get: function() {
    return this._content.given_name;
  }
});

Object.defineProperty( Token.prototype, 'familyName', {
  get: function() {
    return this._content.family_name;
  }
});

Object.defineProperty( Token.prototype, 'username', {
  get: function() {
    return this._content.preferred_username;
  }
});

Object.defineProperty( Token.prototype, 'secure', {
  get: function() {
    return this._secure
  }
});


module.exports = Token
