/*
 * gith
 * https://github.com/danheberden/gith
 *
 * Copyright (c) 2012 Dan Heberden
 * Licensed under the MIT license.
 */

var http = require("http");
var path = require("path");
var fs = require("fs");
var EventEmitter2 = require( "EventEmitter2" ).EventEmitter2;
var util = require("util");
var _ = require("lodash");

var Gith = function( eventaur, settings ) {
  this.settings = settings || {};

  // make this bad boy an event emitter
  EventEmitter2.call( this, {
    wildcard: true,
    delimiter: ':',
    maxListeners: 0
  });

  // handle bound payloads
  eventaur.on( 'payload', function( payload ) {
    console.log( 'filtering that shit!', payload );
  });

};

// inherit the EventEmitter2 stuff
util.inherits( Gith, EventEmitter2 );

// the listen method - this gets added/bound in 
// module.exports.create, fyi
var listen = function( eventaur, port ) {
  if ( port ) {
    this.port = port;
  }
  if ( !this.port ) {
    throw new Error('.listen() requires a port to be set');
  }

  this.server = http.createServer( function( req, res ) {
    var gith = this;
    var data = "";
    if ( req.method === "POST" ) {
      req.on( "data", function( chunk ) {
        data += chunk;
      });
    }

    req.on( "end", function() {
      if ( /^payload=/.test( data ) ) {
        var payload = JSON.parse( data.slice(8) );
        gith.emit( "payload", payload );
      }
      res.end();
    });

    res.writeHead( 200, {
      'Content-type': 'text/html'
    });
    res.end();
  }).listen( port );
};

// make require('gith')( 9001 ) work if someone really wants to
module.exports = function( port ) {
  return module.exports.create( port );
};

// make the preferred way of `require('gith').create( 9001 ) work
module.exports.create = function( port ) {

  // make an event emitter to use for the hardcore stuff
  var eventaur = new EventEmitter2({
    wildcard: true,
    delimter: ':',
    maxListeners: 0
  });

  // return a function that 
  //   a) holds its own server/port/whatever
  //   b) exposes a listen method
  //   c) is a function that returns a new Gith object
  //   d) emits global events for things like 'payload'
  var ret = function( map ) {
    // make a new Gith with a reference to this factory
    return new Gith( eventaur, map );
  };

  // add the listen method to the function - bind to ret 
  // and send eventaur to it
  ret.listen = listen.bind( ret, eventaur );

  // expose ability to close http server
  ret.close = function(){
    this.server.close();
  };

  ret.payload = function( payload ) {
   eventaur.emit( 'payload', payload );
  };

  // if create was sent port, call listen automatically
  if ( port ) {
    ret.listen( port );
  }

  // return the new function
  return ret;
};
