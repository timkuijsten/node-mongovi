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