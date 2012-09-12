var Gith = require('../lib/gith.js');

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
  'constructor (Gith) has create method': function(test) {
    test.expect(1);
    test.ok( Gith.create, "require('gith') has .create method");
    test.done();
  },
  'Gith.create is a function and can set port': function( test ) {
    test.expect( 3 );
    test.strictEqual( typeof Gith.create, 'function', 'Gith.create is a function' );
    var gith = Gith.create( 9001 );
    test.strictEqual( gith.port, 9001, 'Gith.create assigned a port correctly' );
    var gith2 = Gith.create();
    test.strictEqual( gith2.port, undefined, 'Gith.create works fine with no port' );
    test.done();
  },
  'Created giths are unique': function( test ) {
    test.expect( 1 );
    var g1 = Gith.create(8000);
    var g2 = Gith.create(8000);
    test.notEqual( g1, g2, 'Should be unique things, yo' );
    test.done();
  }
};

exports['gith.listen'] = {
  setUp: function(done) {
    done();
  },
  'listen assigns port': function( test ) {
    test.expect( 2 );
    var gith = Gith.create();
    gith.listen( 9001 );
    test.strictEqual( gith.port, 9001, 'gith.listen should assign the port' );
    var gith2 = Gith.create( 9000 );
    gith2.listen( 9001 );
    test.strictEqual( gith2.port, 9001, 'gith.listen overrites port' );
    test.done();
  }
};

exports['gith events'] = {
  setUp: function( done ) {
    done();
  },
  'gith has .emit and .on': function( test ) {
    test.expect( 2 );
    var gith = Gith.create();
    test.ok( gith().on, '.on present' );
    test.ok( gith().emit, '.emit present' );
    test.done();
  }
};
