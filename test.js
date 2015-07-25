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

function handlerMaker(obj) {
  return {
   getOwnPropertyDescriptor: function(name) {
     var desc = Object.getOwnPropertyDescriptor(obj, name);
     // a trapping proxy's properties must always be configurable
     if (desc !== undefined) { desc.configurable = true; }
     return desc;
   },
   getPropertyDescriptor:  function(name) {
     var desc = Object.getPropertyDescriptor(obj, name); // not in ES5
     // a trapping proxy's properties must always be configurable
     if (desc !== undefined) { desc.configurable = true; }
     return desc;
   },
   getOwnPropertyNames: function() {
     return Object.getOwnPropertyNames(obj);
   },
   getPropertyNames: function() {
     return Object.getPropertyNames(obj);                // not in ES5
   },
   defineProperty: function(name, desc) {
     Object.defineProperty(obj, name, desc);
   },
   delete:       function(name) { return delete obj[name]; },   
   fix:          function() {
     if (Object.isFrozen(obj)) {
       var result = {};
       Object.getOwnPropertyNames(obj).forEach(function(name) {
         result[name] = Object.getOwnPropertyDescriptor(obj, name);
       });
       return result;
     }
     // As long as obj is not frozen, the proxy won't allow itself to be fixed
     return undefined; // will cause a TypeError to be thrown
   },
 
   has:          function(name) { return name in obj; },
   hasOwn:       function(name) { return ({}).hasOwnProperty.call(obj, name); },
   get:          function(receiver, name) {
                   var prop = obj[name];
                   return (typeof prop) === "function" ? prop.bind(obj) : prop;
                 },
   set:          function(receiver, name, val) { obj[name] = val; return true; }, // bad behavior when set fails in non-strict mode
   enumerate:    function() {
     var result = [];
     for (var name in obj) { result.push(name); };
     return result;
   },
   keys: function() { return Object.keys(obj); }
 
  };
};
var obj = {};
var mongodb = require('mongodb');
var p = Proxy.create(handlerMaker(obj));
console.log(p);


var simpleHandler = {
 get: function(receiver, name) {
        var prop = obj[name];
        console.log("JAAAAAAAAA", prop);
        return (typeof prop) === "function" ? prop.bind(obj) : prop;
      }
};
var dbProxy = Proxy.createFunction(
  simpleHandler,
  mongodb.Db, // call trap
  mongodb.Db
); // construct trap

new dbProxy('ja',2); // 2
