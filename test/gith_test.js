var githFactory = require('../lib/gith.js');
var http = require('http');
var _ = require('lodash');
var querystring = require('querystring');

/*
  ======== A Handy Little Nodeunit Reference ========
  https://github.com/caolan/nodeunit

  Test methods:
    test.expect(numAssertions)
    test.done()
  Test assertions:
    test.ok(value, [message])
    test.equal(actual, expected, [message])
    test.notEqual(actual, expected, [message])
    test.deepEqual(actual, expected, [message])
    test.notDeepEqual(actual, expected, [message])
    test.strictEqual(actual, expected, [message])
    test.notStrictEqual(actual, expected, [message])
    test.throws(block, [error], [message])
    test.doesNotThrow(block, [error], [message])
    test.ifError(value)
*/

exports['constructor'] = {
  setUp: function(done) {
    // setup here
    done();
  },
  'constructor (githFactory) has create method': function(test) {
    test.expect(1);
    test.ok( githFactory.create, "require('gith') has .create method");
    test.done();
  },
  'githFactory.create is a function and can set port': function( test ) {
    test.expect( 3 );
    test.strictEqual( typeof githFactory.create, 'function', 'githFactory.create is a function' );
    var gith = githFactory.create( 9001 );
    test.strictEqual( gith.port, 9001, 'githFactory.create assigned a port correctly' );
    var gith2 = githFactory.create();
    test.strictEqual( gith2.port, undefined, 'githFactory.create works fine with no port' );
    gith.close();
    test.done();
  },
  'Created giths are unique': function( test ) {
    test.expect( 1 );
    var g1 = githFactory.create(8000);
    var g2 = githFactory.create(8001);
    test.notEqual( g1, g2, 'Should be unique things, yo' );
    g1.close();
    g2.close();
    test.done();
  },
  'function based way to create if someone wants to': function( test ) {
    test.expect( 1 );
    var gith = githFactory();
    test.ok( gith.listen );
    test.done();
  }
};

exports['gith.listen'] = {
  setUp: function(done) {
    done();
  },
  'listen assigns port': function( test ) {
    test.expect( 2 );
    var gith = githFactory.create();
    gith.listen( 9001 );
    test.strictEqual( gith.port, 9001, 'gith.listen should assign the port' );
    var gith2 = githFactory.create( 9000 );
    gith2.listen( 9002 );
    test.strictEqual( gith2.port, 9002, 'gith.listen overrites port' );
    gith.close();
    gith2.close();
    test.done();
  }
};

exports['gith eventemitter'] = {
  setUp: function( done ) {
    done();
  },
  'gith() has .emit and .on': function( test ) {
    test.expect( 2 );
    var gith = githFactory.create();
    test.ok( gith().on, '.on present' );
    test.ok( gith().emit, '.emit present' );
    test.done();
  }
};

exports['gith server'] = {
  setUp: function( done ) {
    done();
  },
  'gith creates a server and listens to unescaped payloads on that port': function( test ) {
    test.expect(1);
    var gith = githFactory.create( 9001 );

    var payloadObject = require('./payloads/add-file-and-dir.json');
    var failSafe = false;
    gith().on( 'all', function( payload ) {
      failSafe = true;
      test.equal( payload.original.after, payloadObject.after, "payload data should equal sent payload data" );
      gith.close();
      test.done();
    });

    // just incase
    setTimeout( function() {
      if ( !failSafe ) {
        gith.close();
        test.ok( false, 'payload event never fired after 200ms, shutting down server' );
        test.done();
      }
    }, 200 );

    var request = http.request({
      port: 9001,
      host: 'localhost',
      method: 'POST'
    });
    request.write( 'payload=' + JSON.stringify( payloadObject ) );
    request.end();
  },
  'gith creates a server and listens to escaped payloads on that port': function( test ) {
    test.expect(1);
    var gith = githFactory.create( 9001 );

    var payloadObject = require('./payloads/add-file-and-dir.json');
    var failSafe = false;
    gith().on( 'all', function( payload ) {
      failSafe = true;
      test.equal( payload.original.after, payloadObject.after, "payload data should equal sent payload data" );
      gith.close();
      test.done();
    });

    // just incase
    setTimeout( function() {
      if ( !failSafe ) {
        gith.close();
        test.ok( false, 'payload event never fired after 200ms, shutting down server' );
        test.done();
      }
    }, 200 );

    var request = http.request({
      port: 9001,
      host: 'localhost',
      method: 'POST'
    });
    request.write( 'payload=' + querystring.escape( JSON.stringify( payloadObject ) ) );
    request.end();
  }
};

exports['gith filtering'] = {
  setUp: function( done ) {
    done();
  },
  'string matching': function( test ) {
    test.expect(3);
    var json = require( './payloads/create-branch-with-files.json' );
    var gith = githFactory.create();

    var test1 = gith({
      repo: 'danheberden/payloads'
    }).on( 'all', function( payload ) {
      test.ok( true, 'repo text matched' );
    });

    var test2 = gith({
      repo: 'danheberden/payloads',
      file: 'README.md',
      branch: 'merge-test'
    }).on( 'all', function( payload ) {
      test.ok( true, 'repo and file and branch text matched' );
    });

    var test3 = gith({
      branch: 'merge-test'
    }).on( 'all', function( payload ) {
       test.ok( true, 'just branch should match' );
    });

    var test4 = gith({
      repo: 'wrong/repo'
    }).on( 'all', function( payload ) {
      test.ok( false, 'wrong/repo should have never matched' );
   //   test.done();
    });

    var test5 = gith({
      repo: 'danheberden/payloads',
      branch: 'nup'
    }).on( 'all', function( payload ) {
      test.ok( false, 'repo should have matched, but not branch, so.....' );
    });

    var test6 = gith({
      repo: 'wrong/repo',
      branch: 'merge-test'
    }).on( 'all', function( payload ) {
      test.ok( false, 'branch should have matched, but not repo, so.....' );
    });

    // this needs to be improved
    setTimeout( function(){
      test.done();
    }, 500 );

    gith.payload( json );
  },
  'regex matching': function( test ) {
    test.expect(3);
    var json = require( './payloads/tag-v1.0.0.json' );
    var gith = githFactory.create();

    var test1 = gith({
      repo: /payloads/
    }).on( 'all', function( payload ) {
      test.ok( true, 'repo regexp should match' );
    });

    var test2 = gith({
      repo: 'danheberden/payloads',
      tag: /^v1\.(.*)/
    }).on( 'tag:add', function( payload ) {
      test.ok( true, 'tag regex should match' );
      test.equal( payload.matches.tag[1], '0.0', 'regex matches should be stored' );
    });

    var test3 = gith({
      tag: /yeahright/
    }).on( 'all', function( payload ) {
       test.ok( false, 'non-matching regex should fail' );
    });

    // this needs to be improved
    setTimeout( function(){
      test.done();
    }, 500 );

    gith.payload( json );
  }
};


exports['gith events'] = {
  setUp: function( done ) {
    done();
  },
  'add-file-and-dir.json': function( test ) {
    test.expect(1);
    var json = require( './payloads/add-file-and-dir.json' );
    var gith = githFactory.create();
    var g = gith();

    g.on( 'file:add', function( payload ) {
      test.deepEqual( ['delete-me.txt', 'payloads/add-file.json' ], payload.files.all,
                       'matched both files' );
      test.done();
    });
    gith.payload( json );
  },
  'delete-file.json': function( test ) {
    var json = require( './payloads/delete-file.json' );
    test.expect(1);
    var gith = githFactory.create();
    var g = gith();
    g.on( 'file:delete', function( payload ) {
      test.deepEqual( [ 'another2.txt' ], payload.files.deleted,
                      'delete branch event should have deleted branch' );
      test.done();
    });
    gith.payload( json );
  },
  'add-file.json': function( test ) {
    var json = require( './payloads/add-file.json' );
    test.expect(1);
    var gith = githFactory.create();
    var g = gith();
    g.on( 'file:add', function( payload ) {
      test.deepEqual( [ 'README.md' ], payload.files.all,
                      'matched both files' );
      test.done();
    });
    gith.payload( json );
  },
  'create-branch-with-files.json': function( test ) {
    var json = require( './payloads/create-branch-with-files.json' );
    test.expect(1);
    var gith = githFactory.create();
    var g = gith();
    g.on( 'branch:add', function( payload ) {
      test.equal( payload.branch, 'merge-test', 'branch add should match payload' );
      test.done();
    });
    gith.payload( json );
  },
  'tag-v1.0.0.json': function( test ) {
    var json = require( './payloads/tag-v1.0.0.json' );
    test.expect(1);
    var gith = githFactory.create();
    var g = gith();
    g.on( 'tag:add', function( payload ) {
      test.equal( payload.tag, 'v1.0.0', 'tag add event should fire the right tag, yo' );
      test.done();
    });
    gith.payload( json );
  },
  'delete-remote-tag.json': function( test ) {
    var json = require( './payloads/delete-remote-tag.json' );
    test.expect(1);
    var gith = githFactory.create();
    var g = gith();
    g.on( 'tag:delete', function( payload ) {
      test.equal( payload.tag, 'v1.0.0', 'tag delete event should fire the right tag' );
      test.done();
    });
    gith.payload( json );
  },
  'delete-remote-branch.json': function( test ) {
    var json = require( './payloads/delete-remote-branch.json' );
    test.expect(1);
    var gith = githFactory.create();
    var g = gith();
    g.on( 'branch:delete', function( payload ) {
      test.equal( payload.branch, 'merge-test', 'delete branch event should have deleted branch' );
      test.done();
    });
    gith.payload( json );
  },
  'tag-on-branch.json': function( test ) {
    var json = require( './payloads/tag-on-branch.json' );
    test.expect(2);
    var gith = githFactory.create();
    var g = gith();
    g.on( 'tag:add', function( payload ) {
      test.equal( payload.branch, 'itsabranch', 'tagging operation should still get the branch it fired on' );
      test.equal( payload.sha, '48722bc3552e5e04293a74fd3851c0c643f76657' , 'tagging operation should point to commit' );
      test.done();
    });
    gith.payload( json );
  }


};


exports['other hook types'] = {
  setUp: function( done ) {
    done();
  },
  'pull-request.json': function( test ) {
    test.expect(1);
    var json = require( './payloads/pull-request.json' );
    var gith = githFactory.create();
    var g = gith();

    g.on( 'all', function( payload ) {
      // No particular expectation except it must not crash and present original payload
      test.equal(payload.original, json);
      test.done();
    });
    gith.payload( json );
  }
};
