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
