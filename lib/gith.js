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

var Gith = function( factory, settings ) {
  this.factory = factory;
  this.settings = settings || {};
  // make this bad boy an event emitter
  EventEmitter2.call( this, {
    wildcard: true,
    delimiter: ':',
    maxListeners: 0
  });
};
util.inherits( Gith, EventEmitter2 );

// make require('gith')( 9001 ) work if someone really wants to
module.exports = function( port ) {
  return module.exports.create( port );
};

// make the preferred way of `require('gith').create( 9001 ) work
module.exports.create = function( port ) {
  var ret = function( map ) {
    // take map, make a gith, return the gith
    return new Gith( ret, map );
  };
  ret.listen = function( port ) {
    if ( port ) {
      ret.port = port;
    }
  }
  if ( port ) {
    ret.listen( port );
  }
  return ret;
};
