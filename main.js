#!/usr/bin/env node

var program = require('commander');
var parseCmd = require('./lib/parse').cmd;

var skipDatabaseCallbackMethods = {
  admin: true,
  db: true
};

var skipCollectionCallbackMethods = {
  find: true
};

program
  .version(require('./package.json').version)
  .usage('[options] [-d] dbname')
  .option('-d, --db <dbname>', 'database name, default admin')
  .option('-p, --port <number>', 'port, default 27017')
  .option('    --host <address>', 'hostname, default 127.0.0.1')
  .option('-u, --user <username>', 'username to authenticate')
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
        console.log(JSON.stringify(item));
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
  if (use && use[1]) {
    chdb(use[1], function(err, collections) {
      if (err) { cb(err); return; }
      cb(null, use[1] + ' ' + collections + ' collections');
    });
    return;
  }

  var showDbs = cmd.match(/^\s*show dbs/m);
  if (showDbs) {
    ctx.db.ls(cb);
    return;
  }

  var showCollections = cmd.match(/^\s*show collections/m);
  if (showCollections) {
    ctx.db._cl.ls(cb);
    return;
  }

  showCollections = cmd.match(/^\s*\(c\n\)/m);
  if (showCollections) {
    ctx.db._cl.ls(cb);
    return;
  }

  var parsed = parseCmd(cmd);

  if (parsed && parsed.collection) {
    // ensure new collections
    if (!ctx.c[parsed.collection]) {
      if (debug) { console.log('adding collection', parsed.collection); }
      ctx.c[parsed.collection] = new Collection(ctx.db, parsed.collection);
    }

    // rewrite find if it has no functions chained or as parameter
    if (parsed.method === 'find' && parsed.extra.match(/^\([^(]*\)$/)) { parsed.method = 'findWrapper'; }

    cmd = 'c["'+parsed.collection+'"].' + parsed.method + parsed.extra;
    if (debug) { console.log('intercepted collection', parsed.collection); }
    if (debug) { console.log('intercepted method', parsed.method); }
    if (debug) { console.log('intercepted extra', parsed.extra); }
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

CollectionList.prototype.ls = function(cb) {
  this._db.collectionNames(function(err, collections) {
    if (err) { return cb(err); }

    collections.forEach(function(collection) {
      // strip db name from collection name
      var collectionName = collection.name.split('.');
      collectionName.shift();
      collectionName = collectionName.join('.');
      console.log(collectionName);
    });
    cb();
  });
};

function Database(db) {
  if (typeof db !== 'object') { throw new TypeError('db must be an object'); }

  this._db = db;

  this._cl = new CollectionList(db);

  // proxy methods and properties to ensure there is a callback that calls the repl callback
  var that = this;
  Object.keys(mongodb.Db.prototype).forEach(function(key) {
    if (that[key]) {
      console.error('already defined', key);
      return;
    }

    // don't attach callback and proxy blacklisted functions
    if (skipDatabaseCallbackMethods[key]) {
      that[key] = that._db[key];
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

// sets the current list of collection on context.c
// calls back with error and or number of collections
Database.prototype.resetCollectionList = function(cb) {
  if (typeof cb !== 'function') { throw new TypeError('cb must be a function'); }

  r.context.c = {};
  var that = this;
  this._db.collectionNames(function(err, collectionNames) {
    if (err) { return cb(err); }
    collectionNames.forEach(function(collection) {
      // strip db name from collection name
      var collectionName = collection.name.split('.');
      collectionName.shift();
      collectionName = collectionName.join('.');
      r.context.c[collectionName] = new Collection(that, collectionName);
    });
    cb(null, collectionNames.length);
  });
};

Database.prototype.ls = function(cb) {
  this._db.admin().listDatabases(function(err, dbs) {
    if (err) { return cb(err); }

    dbs.databases.forEach(function(database) {
      console.log(database);
    });
    cb();
  });
};

/**
 * reset the contexts database object using the current database object
 */
function chdb(dbName, cb) {
  if (typeof dbName !== 'string') { throw new TypeError('dbName must be an string'); }
  if (typeof cb !== 'function') { throw new TypeError('cb must be a function'); }

  r.context.db = new Database(r.context.db._db.db(dbName));
  r.context.db.resetCollectionList(cb);
}

/**
 * Open up a database connection using the provided config.
 *
 * @param {Object} config  object holding database credentials and information
 * @param {Function} cb  first parameter will be an Error object or null, second
 *                       parameter will be the database connection if successful.
 */
function setupConnection(config, cb) {
  if (typeof config !== 'object') { throw new TypeError('config must be an object'); }
  if (typeof cb !== 'function') { throw new TypeError('cb must be a function'); }

  var cfg = {};
  cfg = config;
  cfg.db   = program.db || program.args[0] || config.db || 'admin';
  cfg.user = program.user || config.user || '';
  cfg.pass = config.pass || '';
  cfg.host = program.host || config.host || '127.0.0.1';
  cfg.port = program.port || config.port || 27017;

  var db = new mongodb.Db(cfg.db, new mongodb.Server(cfg.host, cfg.port), { w: 1 });

  db.open(function(err) {
    if (err) { return cb(err); }

    if (config.user || config.pass) {
      var authDb = db.db(config.authDb || config.db);
      authDb.authenticate(config.user, config.pass, function(err) {
        cb(err, db);
      });
    } else {
      cb(null, db);
    }
  });
}

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
        // don't attach callback and proxy blacklisted functions
        if (skipCollectionCallbackMethods[key]) {
          that[key] = that._collection[key];
          return;
        }

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

setupConnection(config, function(err, db) {
  if (err) { console.error(err); process.exit(1); }

  r.context.db = new Database(db);
  r.context.mongodb = mongodb;
  r.context.ObjectID = mongodb.ObjectID;
  r.context.Timestamp = mongodb.Timestamp;
  r.context.db.resetCollectionList(function(err, length) {
    if (err) { console.error(err); process.exit(1); }
    console.log(db.databaseName, length, 'collections');
    process.stdout.write(prompt);
  });
});

r.on('exit', function () {
  console.log();
  process.exit();
});
