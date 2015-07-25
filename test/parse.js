/*jshint -W068, -W030 */

/**
 * Copyright (c) 2013, 2014, 2015 Tim Kuijsten
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

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
