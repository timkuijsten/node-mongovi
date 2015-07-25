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

/**
 * Create a nested structure based on key names of an object.
 *
 * @param {Object} obj  object with namespace as key and objects
 * @param {String, default: "."} chr  character to split keynames on
 */
function nestNamespaces(obj, chr) {
  chr = chr || '.';

  var result = {};
  Object.keys(obj).forEach(function(key) {
    var parts = key.split(chr);
    var firstNs = parts.shift();

    result[firstNs] = result[firstNs] || {};
    var firstObj = result[firstNs];
    var lastObj = firstObj;
    var prevObj = firstObj;

    var lastPart;
    parts.forEach(function(part) {
      lastObj[part] = lastObj[part] || {};
      prevObj = lastObj;
      lastObj = lastObj[part];
      lastPart = part;
    });
    if (parts.length) {
      prevObj[lastPart] = obj[key];
      result[firstNs] = firstObj;
    } else {
      result[firstNs] = obj[key];
    }
  });
  return result;
}

module.exports = nestNamespaces;
