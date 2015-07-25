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

var nestNamespaces = require('../lib/nest_namespaces');

describe('nestNamespaces', function () {
  it('should return empty object', function() {
    var result = nestNamespaces({});
    should.deepEqual(result, {});
  });

  it('should work with 1d namespaces', function() {
    var result = nestNamespaces({ foo: 'bar' });
    should.deepEqual(result, { foo: 'bar' });
  });

  it('should work with 2d namespaces', function() {
    var result = nestNamespaces({ 'foo.baz': 'bar' });
    should.deepEqual(result, { foo: { baz: 'bar' } });
  });

  it('should work with 3d namespaces', function() {
    var result = nestNamespaces({ 'foo.baz.qux': 'bar' });
    should.deepEqual(result, { foo: { baz: { qux: 'bar' } } });
  });

  it('should work with 1d, 2d and 3d namespaces', function() {
    var result = nestNamespaces({
      'foo': 'bar',
      'baz.baz.quux': 'baz',
      'bar.qux': 'bar'
    });
    should.deepEqual(result, {
      foo: 'bar',
      baz: { baz: { quux: 'baz' }},
      bar: { qux: 'bar' }
    });
  });

  it('should use last key on duplicate keys', function() {
    var result = nestNamespaces({
      'foo.bar.qux': 'bar',
      'foo.bar': 'baz'
    });
    should.deepEqual(result, {
      foo: { bar: 'baz' }
    });
  });

  it('should work with shared keys', function() {
    var result = nestNamespaces({
      'foo.bar': 'bar',
      'foo.baz': 'baz'
    });
    should.deepEqual(result, {
      foo: {
        bar: 'bar',
        baz: 'baz'
      }
    });
  });
});
