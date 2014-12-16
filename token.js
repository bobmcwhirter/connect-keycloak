function Token(keycloak, token) {

  this._secure = token;

  this._valid = false;
  if ( token ) {
    try {
      var parts = token.split('.');
      this._header = JSON.parse( new Buffer( parts[0], 'base64' ).toString() );
      this._content = JSON.parse( new Buffer( parts[1], 'base64' ).toString() );
      this._signature = new Buffer( parts[2], 'base64' );

      this._valid = keycloak.validateToken( this );

      //console.log( this._content );

      this._realmRoles = this._content.realm_access.roles;
      this._applicationRoles = this._content.resource_access[ keycloak._resource ].roles;
    } catch (err) {
      // ignore, but invalid
      this._valid = false;
    }
  }
}

Token.prototype.isValid = function() {
  return this._valid;
}

Token.prototype.hasApplicationRole = function(role) {
  return this._applicationRoles.indexOf( role ) >= 0;
}

Token.prototype.hasRealmRole = function(role) {
  return this._realmRoles.indexOf( role ) >= 0;
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

Object.defineProperty( Token.prototype, 'issuedAt', {
  get: function() {
    return this._content.iat;
  }
})

Object.defineProperty( Token.prototype, 'expiresAt', {
  get: function() {
    return this._content.exp;
  }
})

Object.defineProperty( Token.prototype, 'signature', {
  get: function() {
    return this._signature;
  }
})

Object.defineProperty( Token.prototype, 'signatureAlgorithm', {
  get: function() {
    return this._header.alg;
  }
})

Object.defineProperty( Token.prototype, 'signedPart', {
  get: function() {
    var parts = this._secure.split('.');
    return parts[0] + '.' + parts[1];
  }
})


module.exports = Token
