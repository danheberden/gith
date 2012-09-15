var githFactory = require('../lib/gith.js');
var http = require('http');

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
    var gith = githFactory(1984);
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

exports['gith events'] = {
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
  'gith creates a server and listens to payloads on that port': function( test ) {
    test.expect(1);
    var gith = githFactory.create( 9001 );
    var payloadObject = { test: 'valid' };
    gith().on( '*', function( data, payload ) {
      test.equal( payload.test, payloadObject.test, "raw payload data should equal sent payload data" );
      gith.close();
      test.done();
    });
    // create a server to send data 
    var requestServer = http.createClient( 9001, 'localhost' );
    var request = requestServer.request( 'POST', '/', { 'host': 'localhost' } );
    request.write( 'payload=' + JSON.stringify( payloadObject ) );
    request.end();
  }
};
  

