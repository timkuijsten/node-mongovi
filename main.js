#!/usr/bin/env node

var program = require('commander');

program
  .version('0.1.1')
  .option('-d, --db <database>', 'select a database')
  .option('-v, --verbose', 'show debugging information')
  .parse(process.argv);

var debug = program.verbose;

var rlv = require('readline-vim')
  , repl = require('repl')
  , fs = require('fs')
  , vm = require('vm')
  , mongodb = require('mongodb');

var asyncRunning = false;

var prompt = '> ';

function showResult() {
  var args = Array.prototype.slice.call(arguments);
  var err = args.shift();
  if (err) { return console.error(err); }

  args.forEach(function(arg) {
    if (Array.isArray(arg)) {
      console.log();
      arg.forEach(function(item) {
        console.log(item);
      });
    } else {
      console.log(arg);
    }
  });
}

function ensureCallback(args) {
  if (!Array.isArray(args)) { args = Array.prototype.slice.call(args); }

  asyncRunning = true;

  if (typeof args[args.length-1] === 'function') {
    var origFn = args[args.length-1];
    console.log('wrap around existing callback');

    args[args.length-1] = function() {
      origFn.apply(this, arguments);
      asyncRunning = false;
      r.context.gcb();
    };
  } else {
    if (debug) { console.log('adding callback'); }
    args.push(function() {
      showResult.apply(this, arguments);
      asyncRunning = false;
      r.context.gcb();
    });
  }
  return args;
}

function writer(obj) {
  if (obj && typeof obj.toString === 'function') {
    return obj.toString();
  } else {
    return require('util').inspect.apply(null, arguments);
  }
}

/**
 * Returns `true` if "e" is a SyntaxError, `false` otherwise.
 * This function filters out false positives likes JSON.parse() errors and
 * RegExp syntax errors.
 */
function isSyntaxError(e) {
  // Convert error to string
  e = e && (e.stack || e.toString());
  return e && e.match(/^SyntaxError/) &&
      // RegExp syntax error
      !e.match(/^SyntaxError: Invalid regular expression/) &&
      !e.match(/^SyntaxError: Invalid flags supplied to RegExp constructor/) &&
      // "strict mode" syntax errors
      !e.match(/^SyntaxError: .*strict mode.*/i) &&
      // JSON.parse() error
      !e.match(/\n {4}at Object.parse \(native\)\n/);
}

function ev(cmd, ctx, file, cb) {
  var err, result;

  var showDbName = cmd.match(/^\s*\(db\n\)$/m);
  if (showDbName) { cmd = 'db.databaseName'; }

  var use = cmd.match(/^\s*use (.+)/m);
  if (use && use[1]) { cmd = 'db.db("'+use[1]+'")'; }

  var showDbs = cmd.match(/^\s*show dbs/m);
  if (showDbs) { return ctx.listDbs(); }

  var showCollections = cmd.match(/^\s*show collections/m);
  if (showCollections) { cmd = 'cl.ls()'; }

  showCollections = cmd.match(/^\s*\(c\n\)/m);
  if (showCollections) { cmd = 'cl.ls()'; }

  var newCollection = cmd.match(/^\s*\(c\.(.+)\.([^.]+)\((.*)\)/m);

  if (newCollection && newCollection[1]) {
    var collection = newCollection[1];
    var method = newCollection[2];
    var params = newCollection[3];

    // ensure new collections
    if (!ctx.c[collection]) {
      if (debug) { console.log('adding collection', collection); }
      ctx.c[collection] = new Collection(ctx.db._db, collection);
    }

    // rewrite find
    if (method === 'find') { method = 'findWrapper'; }

    cmd = 'c["'+collection+'"].'+method+'('+params+')';
    if (debug) { console.log('intercepted collection', collection); }
    if (debug) { console.log('intercepted method', method); }
    if (debug) { console.log('intercepted params', params); }
    if (debug) { console.log('new command', cmd); }
  }

  ctx.gcb = cb;

  try {
    result = vm.runInContext(cmd, ctx, file);
  } catch (e) {
    err = e;
  }

  if (err && process.domain && !isSyntaxError(err)) {
    process.domain.emit('error', err);
    process.domain.exit();
  } else if (err) {
    cb(err, result);
    return;
  }

  if (!asyncRunning) {
    if (debug) { console.log('no async running'); }
    cb(err, result);
  }
}

var r = repl.start({
  prompt: prompt,
  ignoreUndefined: true,
  writer: writer,
  eval: ev
});

// pass the readline component of the repl in order to add vim bindings to it
rlv(r.rli);

// get config path from environment
var config = {};
var configPath = process.env.HOME + '/.mongovi.json';
if (fs.existsSync(configPath)) {
  config = require(configPath);
}

function CollectionList(db) {
  if (typeof db !== 'object') { throw new TypeError('db must be an object'); }
  this._db = db;
}

CollectionList.prototype.ls = function() {
  this._db.collectionNames(function(err, collections) {
    if (err) { return console.error(err); }
    collections.forEach(function(collection) {
      // strip db name from collection name
      var collectionName = collection.name.split('.');
      collectionName.shift();
      collectionName = collectionName.join('.');
      console.log(collectionName);
    });
  });
};

/*
function CollectionList(collections) {
  var that = this;
  var nested = nestNamespaces(collections);
  Object.keys(collections).forEach(function(collectionName) {
    that[collectionName] = collections[collectionName];
  });

  // merge nested
  Object.keys(nested).forEach(function(collectionName) {
    if (that[collectionName]) {
      Object.keys(nested[collectionName]).forEach(function(key) {
        that[collectionName][key] = nested[collectionName][key];
      });
    } else {
      that[collectionName] = nested[collectionName];
    }
  });
}

CollectionList.prototype.add = function(name, db) {
  var obj = {};
  obj[name] =  new Collection(db._db.collection(name));
  this[name] = obj[name];

  var that = this;
  var nested = nestNamespaces(obj);
  // merge nested
  Object.keys(nested).forEach(function(collectionName) {
    if (that[collectionName]) {
      Object.keys(nested[collectionName]).forEach(function(key) {
        that[collectionName][key] = nested[collectionName][key];
      });
    } else {
      that[collectionName] = nested[collectionName];
    }
  });
};
  */

function Database(config) {
  this._config = config;
  this._config.db = program.db || 'admin';
  this._config.host = config.host || '127.0.0.1';
  this._config.port = config.port || 27017;

  this._db = new mongodb.Db(this._config.db, new mongodb.Server(this._config.host, this._config.port), { w: 1 });

  // proxy methods and properties to ensure there is a callback that calls the repl callback
  var that = this;
  Object.keys(mongodb.Db.prototype).forEach(function(key) {
    if (that[key]) {
      console.error('already defined', key);
      return;
    }

    if (typeof that._db[key] === 'function') {
      if (debug) { console.log('wrapping function', key); }
      that[key] = function() {
        var args = ensureCallback(arguments);
        that._db[key].apply(that._db, args);
      };
    }
  });

  Object.keys(that._db).forEach(function(key) {
    if (that[key]) {
      console.error('already defined', key);
      return;
    }

    if (typeof that._db[key] !== 'function') {
      if (debug) { console.log('wrapping property', key); }
      that[key] = that._db[key];
    }
  });
}

/**
 * Open up a database connection.
 */
Database.prototype.init = function init(cb) {
  var that = this;
  var config = this._config;
  this._db.open(function(err) {
    if (err) { throw err; }

    if (config.user || config.pass) {
      var authDb = that._db.db(config.authDb || config.db);
      authDb.authenticate(config.user, config.pass, function(err) {
        if (err) { throw err; }
        that._db.collectionNames(cb);
      });
    } else {
      that._db.collectionNames(cb);
    }
  });
};

function Collection(db, collectionName) {
  this._db = db;
  var that = this;
  if (debug) { console.log('new collection', collectionName); }
  db._db.collection(collectionName, function(err, collection) {
    that._collection = collection;

    // proxy methods and properties to ensure there is a callback that calls the repl callback
    Object.keys(mongodb.Collection.prototype).forEach(function(key) {
      if (that[key]) {
        console.error('already defined', key);
        return;
      }

      if (typeof that._collection[key] === 'function') {
        if (debug) { console.log('wrapping function', key); }
        that[key] = function() {
          var args = ensureCallback(arguments);
          that._collection[key].apply(that._collection, args);
        };
      }
    });

    Object.keys(that._collection).forEach(function(key) {
      if (that[key]) {
        console.error('already defined', key);
        return;
      }

      if (typeof that._collection[key] !== 'function') {
        if (debug) { console.log('wrapping property', key); }
        that[key] = that._collection[key];
      }
    });
  });
}

Collection.prototype.findWrapper = function() {
  var cursor = this._collection.find.apply(this._collection, arguments);
  cursor.toArray.apply(cursor, ensureCallback([]));
};

var db = new Database(config);

db.init(function(err, collectionNames) {
  if (err) { throw err; }

  r.context.db = db;
  r.context.mongdb = mongodb;
  r.context.ObjectID = mongodb.ObjectID;
  r.context.cl = new CollectionList(db);
  r.context.c = {};
  collectionNames.forEach(function(collection) {
    // strip db name from collection name
    var collectionName = collection.name.split('.');
    collectionName.shift();
    collectionName = collectionName.join('.');
    // use _db to prevent calling the wrapper callback
    r.context.c[collectionName] = new Collection(db, collectionName);
  });
});

r.on('exit', function () {
  console.log();
  process.exit();
});
