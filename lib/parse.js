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

/* parse a command string */
module.exports.cmd = function(cmd) {
  if (typeof cmd !== 'string') { throw new TypeError('cmd must be a string'); }

  var parsed = cmd.match(/^\s*\(c\.([^(]+)\.([^(]+)(\(.*);/m);
  if (!parsed) {
    // try without trailing ;
    parsed = cmd.match(/^\s*\(c\.([^(]+)\.([^(]+)(\(.*)/m);
  }

  if (!parsed) { return {}; }

  return {
    collection: parsed[1],
    method: parsed[2],
    extra: parsed[3]
  };
};
