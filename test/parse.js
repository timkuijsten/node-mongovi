/*jshint -W068, -W030 */

var should = require('should');

var parse = require('../lib/parse');

describe('parse', function () {
  it('should require cmd to be a string not undefined', function() {
    var cmd;
    (function() { parse.cmd(cmd); }).should.throwError('cmd must be a string');
  });

  it('should require cmd to be a string not an object', function() {
    var cmd = {};
    (function() { parse.cmd(cmd); }).should.throwError('cmd must be a string');
  });

  it('should split standard collection function calls', function() {
    var cmd = '(c.csvs.find()\n)';
    var result = parse.cmd(cmd);
    should.equal(result.collection, 'csvs');
    should.equal(result.method, 'find');
    should.equal(result.extra, '()');
  });

  it('should split functions with arguments', function() {
    var cmd = '(c.csvs.findOne(function(err, item) { console.log(err, item); });\n)';
    var result = parse.cmd(cmd);
    should.equal(result.collection, 'csvs');
    should.equal(result.method, 'findOne');
    should.equal(result.extra, '(function(err, item) { console.log(err, item); })');
  });

  it('should split chained functions', function() {
    var cmd = '(c.csvs.find().toArray(function(err, items) { console.log(err, items.length); });\n)';
    var result = parse.cmd(cmd);
    should.equal(result.collection, 'csvs');
    should.equal(result.method, 'find');
    should.equal(result.extra, '().toArray(function(err, items) { console.log(err, items.length); })');
  });
});
