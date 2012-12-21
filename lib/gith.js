/*
 * gith
 * https://github.com/danheberden/gith
 *
 * Copyright (c) 2012 Dan Heberden
 * Licensed under the MIT license.
 */

var http = require("http");
var EventEmitter2 = require( "eventemitter2" ).EventEmitter2;
var util = require("util");
var _ = require("lodash");
var querystring = require("querystring");

var filterSettings = function( settings, payload ) {

  if ( !payload ) {
    return false;
  }

  settings = settings || {};

  // add the matches object for later
  payload.matches = {};

  // check all the things
  var checksPassed = true;

  [ 'repo', 'branch', 'file', 'tag' ].forEach( function( thing ) {
    var wat = settings[ thing ];

    // default to a passed state
    var passed = true;

    // was a filter specified? and is it not a wildcard?
    if ( wat && wat !== '*' ) {

      // checking, so default passed to false
      passed = false;

      // make an array of the thing or all the files
      var checks = [].concat( thing === 'file' ? payload.files.all : payload[ thing ] );

      // all the checks - did any of them pass?
      passed = checks.some( function( check ) {

         // direct match
        if ( wat === check ) {
          return true;
        }

        // if negated match (!string)
        if ( _.isString( wat ) && wat[0] === "!" &&
              wat.slice(1) !== check ) {
          return true;
        }

        // regex?
        if ( _.isRegExp( wat ) ) {
          var match = check.match( wat );

          // did it match? huh? did it?
          if ( match ) {
            // goddamn files being different
            if ( thing === 'file' ) {
              if ( !payload.matches.files ) {
                payload.matches.files = {};
              }
              payload.matches.files[ check ] = match;
            } else {
              payload.matches[ thing ] = match;
            }

            return true;
          }
        }
      });

      // usr function?
      if ( _.isFunction( wat ) ) {
        passed = wat( payload[ thing ], payload );
      }

      // assign the final result of this 'thing' to checksPassed
      checksPassed = passed && checksPassed;
    }
  });

  return checksPassed;
};

// Used by exports.module.create's returned function to create
// new gith objects that hold settings and emit events
var Gith = function( eventaur, settings ) {
  var gith = this;
  this.settings = settings || {};

  // make this bad boy an event emitter
  EventEmitter2.call( this, {
    delimiter: ':',
    maxListeners: 0
  });

  // handle bound payloads
  eventaur.on( 'payload', function( originalPayload ) {

    // make a simpler payload
    var payload = gith.simplifyPayload( originalPayload );

    // bother doing anything?
    if ( filterSettings( settings, payload ) ) {

      // all the things
      gith.emit( 'all', payload );

      // did we do any branch work?
      if ( originalPayload.created && originalPayload.forced && payload.branch ) {
        gith.emit( 'branch:add', payload );
      }
      if (  originalPayload.deleted && originalPayload.forced && payload.branch ) {
        gith.emit( 'branch:delete', payload );
      }

      // how about files?
      if ( payload.files.added.length > 0 ) {
        gith.emit( 'file:add', payload );
      }
      if ( payload.files.deleted.length > 0 ) {
        gith.emit( 'file:delete', payload );
      }
      if ( payload.files.modified.length > 0 ) {
        gith.emit( 'file:modify', payload );
      }
      if ( payload.files.all.length > 0 ) {
        gith.emit( 'file:all', payload );
      }

      // tagging?
      if ( payload.tag && originalPayload.created ) {
        gith.emit( 'tag:add', payload );
      }
      if ( payload.tag && originalPayload.deleted ) {
        gith.emit( 'tag:delete', payload );
      }
    }
  });
};

// inherit the EventEmitter2 stuff
util.inherits( Gith, EventEmitter2 );

// expose the simpliyPayload method on gith()
Gith.prototype.simplifyPayload = function( payload ) {
  payload = payload || {};

  var branch = '';
  var tag = '';
  var rRef = /refs\/(tags|heads)\/(.*)$/;

  // break out if it was a tag or branch and assign
  var refMatches = ( payload.ref || "" ).match( rRef );
  if ( refMatches ) {
    if ( refMatches[1] === "heads" ) {
      branch = refMatches[2];
    }
    if ( refMatches[1] === "tags" ) {
      tag = refMatches[2];
    }
  }

  // if branch wasn't found, use base_ref if available
  if ( !branch && payload.base_ref ) {
    branch = payload.base_ref.replace( rRef, '$2' );
  }

  var simpler = {
    original: payload,
    files: {
      all: [],
      added: [],
      deleted: [],
      modified: []
    },
    tag: tag,
    branch: branch,
    repo: payload.repository ? (payload.repository.owner.name + '/' + payload.repository.name) : null,
    sha: payload.after,
    time: payload.repository ? payload.repository.pushed_at : null,
    urls: {
      head: payload.head_commit ? payload.head_commit.url : '',
      branch: '',
      tag: '',
      repo: payload.repository ? payload.repository.url : null,
      compare: payload.compare
    },
    reset: !payload.created && payload.forced,
    pusher: payload.pusher ? payload.pusher.name : null,
    owner: (payload.repository && payload.repository.owner) ? payload.repository.owner.name : null
  };

  if ( branch ) {
    simpler.urls.branch = simpler.urls.branch + '/tree/' + branch;
  }
  if ( tag ) {
    simpler.urls.tag = simpler.urls.head;
  }

  // populate files for every commit
  (payload.commits || []).forEach( function( commit ) {
    // github label and simpler label ( make 'removed' deleted to be consistant )
    _.each( { added: 'added', modified: 'modified', removed: 'deleted' }, function( s, g ) {
      simpler.files[ s ] = simpler.files[ s ].concat( commit[ g ] );
      simpler.files.all = simpler.files.all.concat( commit[ g ] );
    });
  });

  return simpler;
  // todo: use github api to find what files were removed if the
  // head was reset? maybe?
};

// the listen method - this gets added/bound in
// module.exports.create, fyi
var listen = function( eventaur, port ) {
  // are we changing ports?
  if ( port ) {
    this.port = port;
  }
  if ( !this.port ) {
    throw new Error('.listen() requires a port to be set');
  }

  this.server = http.createServer( function( req, res ) {
    var data = "";
    if ( req.method === "POST" ) {
      req.on( "data", function( chunk ) {
        data += chunk;
      });
    }

    req.on( "end", function() {
      if ( /^payload=/.test( data ) ) {
        var payload = JSON.parse( querystring.unescape(data.slice(8)) );
        eventaur.emit( "payload", payload );
        res.writeHead( 200, {
          'Content-type': 'text/html'
        });
      }
      res.end();
    });

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
    delimter: ':',
    maxListeners: 0
  });

  // return a function that
  //   a) holds its own server/port/whatever
  //   b) exposes a listen method
  //   c) is a function that returns a new Gith object
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
