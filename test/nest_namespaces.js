/*jshint -W068, -W030 */

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
      'foo.bar': 'bar',
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
